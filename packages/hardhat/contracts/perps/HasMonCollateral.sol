// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HasMonCollateral
 * @dev Contract for managing hasMON as collateral for perpetual trading
 */
contract HasMonCollateral is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant MAX_ALLOCATION_PERCENTAGE = 9000; // 90% in basis points
    uint256 private constant BASIS_POINTS = 10000;

    bool public emergencyMode;
    mapping(address => bool) public whitelist;

    // State variables
    IERC20 public hasMON;
    address public perpEngine;
    address public orderBook;

    // Mapping of user balances
    mapping(address => uint256) public userCollateral;
    uint256 public totalCollateral;

    // Fee accumulation
    uint256 public accumulatedFees;
    address public feeRecipient;

    mapping(address => uint256) public allocatedCollateral; // Track allocated collateral
    mapping(address => uint256) public lastUpdateTime;

    // Events
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event CollateralAllocated(address indexed user, uint256 amount);
    event CollateralReleased(address indexed user, uint256 amount);
    event FeesWithdrawn(uint256 amount);
    event EmergencyModeEnabled(address indexed triggeredBy);
    event WhitelistUpdated(address indexed user, bool status);
    event PerpEngineUpdated(address indexed newPerpEngine);
    event OrderBookUpdated(address indexed newOrderBook);

    // Modifiers
    modifier onlyPerpEngine() {
        require(msg.sender == perpEngine, "Only PerpEngine can call");
        _;
    }

    modifier onlyOrderBook() {
        require(msg.sender == orderBook, "Only OrderBook can call");
        _;
    }

    constructor(address _hasMON, address _feeRecipient) Ownable(msg.sender) {
        hasMON = IERC20(_hasMON);
        feeRecipient = _feeRecipient;
    }

    // Admin functions

    function enableEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeEnabled(msg.sender);
    }

    function updateWhitelist(address user, bool status) external onlyOwner {
        whitelist[user] = status;
        emit WhitelistUpdated(user, status);
    }

    function setPerpEngine(address _perpEngine) external onlyOwner {
        require(_perpEngine != address(0), "Invalid PerpEngine address");
        require(_perpEngine != perpEngine, "Same address");
        perpEngine = _perpEngine;
        emit PerpEngineUpdated(_perpEngine);
    }

    function setOrderBook(address _orderBook) external onlyOwner {
        orderBook = _orderBook;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Allows users to deposit hasMON as collateral
     * @param amount The amount of hasMON to deposit
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(!emergencyMode, "System is in emergency mode");
        require(amount > 0, "Amount must be greater than 0");

        // Check allowance before transfer
        require(hasMON.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        // Update last action time
        lastUpdateTime[msg.sender] = block.timestamp;

        // Transfer hasMON from user to this contract
        hasMON.safeTransferFrom(msg.sender, address(this), amount);

        // Update user's collateral balance
        userCollateral[msg.sender] += amount;
        totalCollateral += amount;

        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @dev Allows users to withdraw available hasMON collateral
     * @param amount The amount of hasMON to withdraw
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(!emergencyMode || whitelist[msg.sender], "Withdrawals restricted");
        require(amount > 0, "Amount must be greater than 0");
        require(userCollateral[msg.sender] >= amount, "Insufficient collateral");

        // Check available collateral (not allocated)
        uint256 available = userCollateral[msg.sender] - allocatedCollateral[msg.sender];
        require(available >= amount, "Collateral is allocated");

        // Update balances
        userCollateral[msg.sender] -= amount;
        totalCollateral -= amount;
        lastUpdateTime[msg.sender] = block.timestamp;

        // Transfer hasMON to user
        hasMON.safeTransfer(msg.sender, amount);

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Allocates collateral for a trading position (called by OrderBook/PerpEngine)
     * @param user The user's address
     * @param amount The amount to allocate
     */
    function allocateCollateral(address user, uint256 amount) external nonReentrant onlyPerpEngine {
        require(userCollateral[user] >= amount, "Insufficient collateral");

        // Check allocation limits
        uint256 totalAllocated = allocatedCollateral[user] + amount;
        uint256 maxAllowedAllocation = (userCollateral[user] * MAX_ALLOCATION_PERCENTAGE) / BASIS_POINTS;
        require(totalAllocated <= maxAllowedAllocation, "Exceeds max allocation");

        // Update user's allocated collateral
        allocatedCollateral[user] += amount;
        userCollateral[user] -= amount;

        emit CollateralAllocated(user, amount);
    }

    /**
     * @dev Releases collateral back to user after position closure (called by PerpEngine)
     * @param user The user's address
     * @param amount The amount to release
     * @param pnl The profit/loss from the position (can be negative)
     */
    function releaseCollateral(address user, uint256 amount, int256 pnl) external nonReentrant onlyPerpEngine {
        uint256 releaseAmount = amount;

        // Handle profits (positive PnL)
        if (pnl > 0) {
            releaseAmount += uint256(pnl);
        }
        // Handle losses (negative PnL)
        else if (pnl < 0) {
            uint256 loss = uint256(-pnl);
            if (loss >= amount) {
                releaseAmount = 0;
            } else {
                releaseAmount -= loss;
            }
        }

        // Update user's collateral
        userCollateral[user] += releaseAmount;

        emit CollateralReleased(user, releaseAmount);
    }

    /**
     * @dev Processes trading fees (called by PerpEngine)
     * @param amount Fee amount to process
     */
    function processFee(uint256 amount) external nonReentrant onlyPerpEngine {
        require(amount > 0, "Fee must be greater than 0");

        // Accumulate fees
        accumulatedFees += amount;
    }

    /**
     * @dev Withdraws accumulated fees to fee recipient (called by owner)
     */
    function withdrawFees() external onlyOwner {
        require(accumulatedFees > 0, "No fees to withdraw");

        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        // Transfer fees to recipient
        hasMON.safeTransfer(feeRecipient, amount);

        emit FeesWithdrawn(amount);
    }

    /**
     * @dev Get user's available collateral
     * @param user The user's address
     * @return The amount of available collateral
     */
    function getAvailableCollateral(address user) external view returns (uint256) {
        return userCollateral[user];
    }

    function getCollateralStatus(
        address user
    ) external view returns (uint256 total, uint256 allocated, uint256 available, uint256 lastAction) {
        total = userCollateral[user];
        allocated = allocatedCollateral[user];
        available = total - allocated;
        lastAction = lastUpdateTime[user];
    }

    function getSystemInfo()
        external
        view
        returns (
            uint256 totalCollateralAmount,
            uint256 totalFeesAccumulated,
            bool isEmergencyMode,
            address engineAddress,
            address bookAddress
        )
    {
        return (totalCollateral, accumulatedFees, emergencyMode, perpEngine, orderBook);
    }

    function getMaxAllowedAllocation(address user) public view returns (uint256 maxAllowed, uint256 currentAllocated) {
        maxAllowed = (userCollateral[user] * MAX_ALLOCATION_PERCENTAGE) / BASIS_POINTS;
        currentAllocated = allocatedCollateral[user];
    }
}
