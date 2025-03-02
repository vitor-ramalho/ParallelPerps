// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title PerpEngine
 * @dev Core contract for perpetual trading with hasMON as collateral
 */
contract PerpEngine is Ownable, ReentrancyGuard {
    // Constants
    uint256 private constant PRECISION = 1e18;
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MAX_LEVERAGE = 100; // 100x max leverage
    uint256 private constant MIN_LIQUIDATION_THRESHOLD = 50; // 50%
    uint256 private constant LIQUIDATION_FEE = 500; // 5% in basis points
    uint256 private constant PRICE_PRECISION = 1e10; // For Chainlink price conversion

    // State
    bool public emergencyMode;
    uint256 public insuranceFundBalance;

    // Structs with improvements
    struct Position {
        bool isOpen;
        uint256 size; // Position size in USD (x10^18)
        uint256 margin; // Initial margin in hasMON tokens
        uint256 entryPrice; // Entry price in USD (x10^18)
        int256 lastCumulativeFunding; // Funding state at entry
        bool isLong; // Long or short position
        uint32 leverage; // Leverage as an integer
        uint32 marketIndex; // Index of the market
        uint256 lastUpdateTime; // Last time position was updated
    }

    struct Market {
        string symbol; // Market symbol (e.g., "BTC-USD")
        address oracle; // Chainlink oracle address
        uint256 maxLeverage; // Maximum allowed leverage
        uint256 liquidationThreshold; // % of margin to trigger liquidation
        uint256 fee; // Trading fee in bps
        uint256 openInterestLong; // Total long positions USD
        uint256 openInterestShort; // Total short positions USD
        int256 cumulativeFunding; // Accumulated funding
        uint256 lastFundingTime; // Last funding update
        uint256 fundingInterval; // Funding rate interval
        int256 maxFundingRate; // Max funding rate per interval
        uint256 maxPositionSize; // Max position size per user
        uint256 maxOpenInterest; // Max total open interest
        uint256 minInitialMargin; // Minimum initial margin
        bool isActive; // Market active status
    }

    struct FeeStructure {
        uint256 makerFee; // Fee for makers (limit orders)
        uint256 takerFee; // Fee for takers (market orders)
        uint256 liquidationFee; // Fee for liquidators
        uint256 protocolShare; // Protocol's share of fees
    }

    // State Variables
    address public hasMonCollateral;
    address public orderBook;
    IERC20 public hasMON;
    uint256 public minMargin;
    uint256 public protocolFeeShare;
    address public feeRecipient;

    // Mappings
    mapping(address => mapping(uint32 => Position)) public positions;
    mapping(uint32 => Market) public markets;
    mapping(uint32 => FeeStructure) public marketFees;
    mapping(uint32 => bool) public marketPaused;
    uint32 public marketCount;
    // Events with improved details
    event PositionOpened(
        address indexed trader,
        uint32 indexed marketIndex,
        uint256 size,
        uint256 margin,
        bool isLong,
        uint32 leverage,
        uint256 entryPrice,
        uint256 timestamp
    );
    event PositionClosed(
        address indexed trader,
        uint32 indexed marketIndex,
        uint256 size,
        int256 pnl,
        uint256 exitPrice,
        uint256 timestamp
    );
    event PositionLiquidated(
        address indexed trader,
        uint32 indexed marketIndex,
        uint256 size,
        address liquidator,
        int256 pnl,
        uint256 liquidationPrice
    );
    event MarketAdded(
        uint32 indexed marketIndex,
        string symbol,
        address oracle,
        uint256 maxLeverage,
        uint256 maxPositionSize
    );
    event FundingUpdated(
        uint32 indexed marketIndex,
        int256 fundingRate,
        uint256 openInterestLong,
        uint256 openInterestShort
    );
    event EmergencyModeEnabled(address indexed triggeredBy, uint256 timestamp);
    event MarketPaused(uint32 indexed marketIndex, bool isPaused);
    event InsuranceFundUpdated(uint256 oldBalance, uint256 newBalance);
    event OrderBookUpdated(address indexed newOrderBook);

    // Enhanced modifiers
    modifier notInEmergencyMode() {
        require(!emergencyMode, "System is in emergency mode");
        _;
    }

    modifier marketActive(uint32 marketIndex) {
        require(markets[marketIndex].isActive, "Market not active");
        require(!marketPaused[marketIndex], "Market is paused");
        _;
    }

    modifier validPrice(uint256 price) {
        require(price > 0, "Invalid price");
        _;
    }

    modifier onlyOrderBook() {
        require(msg.sender == orderBook, "Only orderbook can call");
        _;
    }

    modifier marketExists(uint32 marketIndex) {
        require(marketIndex < marketCount, "Market does not exist");
        require(markets[marketIndex].oracle != address(0), "Market not initialized");
        _;
    }

    modifier positionExists(address trader, uint32 marketIndex) {
        require(positions[trader][marketIndex].isOpen, "Position does not exist");
        _;
    }

    constructor(
        address _hasMonCollateral,
        address _hasMon,
        address _feeRecipient,
        uint256 _minMargin,
        uint256 _protocolFeeShare
    ) Ownable(msg.sender) {
        require(_hasMonCollateral != address(0), "Invalid hasMonCollateral address");
        require(_hasMon != address(0), "Invalid hasMon address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        require(_minMargin > 0, "Invalid min margin");
        require(_protocolFeeShare <= BASIS_POINTS, "Invalid protocol fee share");

        hasMonCollateral = _hasMonCollateral;
        hasMON = IERC20(_hasMon);
        feeRecipient = _feeRecipient;
        minMargin = _minMargin;
        protocolFeeShare = _protocolFeeShare;

        emergencyMode = false;
        marketCount = 0;
    }

    function setOrderBook(address _orderBook) external onlyOwner {
        require(_orderBook != address(0), "Invalid orderbook address");
        orderBook = _orderBook;
        emit OrderBookUpdated(orderBook);
    }

    function _isValidPrice(uint256 price, uint256 currentPrice, uint256 maxSlippage) internal pure returns (bool) {
        if (price == 0 || currentPrice == 0) return false;

        uint256 priceDiff = price > currentPrice ? price - currentPrice : currentPrice - price;

        uint256 slippage = (priceDiff * BASIS_POINTS) / currentPrice;
        return slippage <= maxSlippage;
    }

    function _updateFunding(uint32 marketIndex) internal {
        Market storage market = markets[marketIndex];

        if (block.timestamp < market.lastFundingTime + market.fundingInterval) {
            return;
        }

        // Calculate multiple funding payments if needed
        uint256 periods = (block.timestamp - market.lastFundingTime) / market.fundingInterval;
        if (periods == 0) return;

        // Calculate imbalance between longs and shorts
        int256 longShortRatio;
        if (market.openInterestShort > 0) {
            longShortRatio =
                int256((market.openInterestLong * BASIS_POINTS) / market.openInterestShort) -
                int256(BASIS_POINTS);
        } else if (market.openInterestLong > 0) {
            longShortRatio = int256(BASIS_POINTS); // Max imbalance if no shorts
        } else {
            longShortRatio = 0; // No positions open
        }

        // Calculate and cap funding rate
        int256 fundingRate = (longShortRatio * market.maxFundingRate) / int256(BASIS_POINTS);
        fundingRate = fundingRate > market.maxFundingRate
            ? market.maxFundingRate
            : (fundingRate < -market.maxFundingRate ? -market.maxFundingRate : fundingRate);

        // Update cumulative funding
        market.cumulativeFunding += fundingRate * int256(periods);
        market.lastFundingTime += periods * market.fundingInterval;

        emit FundingUpdated(marketIndex, fundingRate, market.openInterestLong, market.openInterestShort);
    }

    // Core trading functions
    function openPosition(
        address trader,
        uint32 marketIndex,
        uint256 margin,
        uint32 leverage,
        bool isLong,
        uint256 price,
        uint256 maxSlippage
    )
        external
        onlyOrderBook
        nonReentrant
        marketExists(marketIndex)
        marketActive(marketIndex)
        notInEmergencyMode
        returns (uint256)
    {
        Market storage market = markets[marketIndex];
        uint256 currentPrice = _getOraclePrice(marketIndex);

        // Validate inputs
        require(!positions[trader][marketIndex].isOpen, "Position already exists");
        require(margin >= market.minInitialMargin, "Margin too small");
        require(margin >= minMargin, "Below global minimum margin");
        require(leverage <= market.maxLeverage, "Leverage too high");
        require(_isValidPrice(price, currentPrice, maxSlippage), "Price exceeds slippage");

        // Calculate position details
        uint256 size = margin * uint256(leverage);
        require(size <= market.maxPositionSize, "Position size too large");

        // Check market capacity
        uint256 newOpenInterest = isLong ? market.openInterestLong + size : market.openInterestShort + size;
        require(newOpenInterest <= market.maxOpenInterest, "Market capacity exceeded");

        // Calculate and collect fees
        FeeStructure storage fees = marketFees[marketIndex];
        uint256 tradingFee = (size * fees.takerFee) / BASIS_POINTS;
        uint256 protocolFee = (tradingFee * fees.protocolShare) / BASIS_POINTS;

        // Transfer fees and margin
        require(hasMON.transferFrom(hasMonCollateral, address(this), margin + tradingFee), "Fee transfer failed");

        // Update funding before position creation
        _updateFunding(marketIndex);

        // Create position
        positions[trader][marketIndex] = Position({
            isOpen: true,
            size: size,
            margin: margin,
            entryPrice: price,
            lastCumulativeFunding: market.cumulativeFunding,
            isLong: isLong,
            leverage: leverage,
            marketIndex: marketIndex,
            lastUpdateTime: block.timestamp
        });

        // Update market state
        if (isLong) {
            market.openInterestLong += size;
        } else {
            market.openInterestShort += size;
        }

        emit PositionOpened(trader, marketIndex, size, margin, isLong, leverage, price, block.timestamp);

        return size;
    }

    function closePosition(
        address trader,
        uint32 marketIndex,
        uint256 price,
        uint256 maxSlippage
    )
        external
        onlyOrderBook
        nonReentrant
        marketActive(marketIndex)
        positionExists(trader, marketIndex)
        returns (int256)
    {
        Position memory pos = positions[trader][marketIndex]; // Use memory instead of storage
        Market storage market = markets[marketIndex];

        // Validate price
        uint256 currentPrice = _getOraclePrice(marketIndex);
        require(_isValidPrice(price, currentPrice, maxSlippage), "Price exceeds slippage");

        // Update funding
        _updateFunding(marketIndex);

        // Calculate returns using a separate internal function
        (uint256 returnAmount, int256 totalPnl) = _calculateClosingAmounts(trader, marketIndex, price, pos);

        // Update market state
        if (pos.isLong) {
            market.openInterestLong -= pos.size;
        } else {
            market.openInterestShort -= pos.size;
        }

        // Handle transfers
        _handleClosingTransfers(returnAmount, trader);

        // Close position
        delete positions[trader][marketIndex];

        emit PositionClosed(trader, marketIndex, pos.size, totalPnl, price, block.timestamp);

        return totalPnl;
    }

    function _calculateClosingAmounts(
        address trader,
        uint32 marketIndex,
        uint256 price,
        Position memory position
    ) internal view returns (uint256 returnAmount, int256 totalPnl) {
        int256 unrealizedPnl = _calculatePnL(trader, marketIndex, price);
        int256 fundingPayment = _calculateFundingPayment(trader, marketIndex);
        totalPnl = unrealizedPnl + fundingPayment;

        FeeStructure storage fees = marketFees[marketIndex];
        uint256 closingFee = (position.size * fees.takerFee) / BASIS_POINTS;

        if (totalPnl >= 0) {
            returnAmount = position.margin + uint256(totalPnl) - closingFee;
        } else {
            uint256 loss = uint256(-totalPnl);
            returnAmount = loss < position.margin ? position.margin - loss - closingFee : 0;
        }
    }

    function _handleClosingTransfers(uint256 amount, address trader) internal {
        if (amount > 0) {
            // Transfer remaining funds back to hasMonCollateral contract
            require(hasMON.transfer(hasMonCollateral, amount), "Transfer to collateral failed");
        }
    }

    function liquidatePosition(
        address trader,
        uint32 marketIndex
    ) external nonReentrant marketActive(marketIndex) positionExists(trader, marketIndex) returns (uint256) {
        Position storage position = positions[trader][marketIndex];
        Market storage market = markets[marketIndex];
        FeeStructure storage fees = marketFees[marketIndex];

        uint256 currentPrice = _getOraclePrice(marketIndex);

        // Update funding and calculate total PnL
        _updateFunding(marketIndex);
        int256 unrealizedPnl = _calculatePnL(trader, marketIndex, currentPrice);
        int256 fundingPayment = _calculateFundingPayment(trader, marketIndex);
        int256 totalPnl = unrealizedPnl + fundingPayment;

        // Calculate remaining margin
        uint256 remainingMargin;
        if (totalPnl >= 0) {
            remainingMargin = position.margin + uint256(totalPnl);
        } else {
            if (uint256(-totalPnl) < position.margin) {
                remainingMargin = position.margin - uint256(-totalPnl);
            } else {
                remainingMargin = 0;
            }
        }

        // Check liquidation threshold
        uint256 maintenanceMargin = (position.margin * market.liquidationThreshold) / BASIS_POINTS;
        require(remainingMargin <= maintenanceMargin, "Position not liquidatable");

        // Calculate liquidation rewards
        uint256 liquidationFee = (remainingMargin * fees.liquidationFee) / BASIS_POINTS;
        uint256 protocolShare = (liquidationFee * fees.protocolShare) / BASIS_POINTS;
        uint256 liquidatorShare = liquidationFee - protocolShare;

        // Update market state
        if (position.isLong) {
            market.openInterestLong -= position.size;
        } else {
            market.openInterestShort -= position.size;
        }

        // Transfer fees
        if (protocolShare > 0) {
            require(hasMON.transfer(feeRecipient, protocolShare), "Protocol fee transfer failed");
        }
        if (liquidatorShare > 0) {
            require(hasMON.transfer(msg.sender, liquidatorShare), "Liquidator fee transfer failed");
        }

        // Return remaining funds to trader
        uint256 returnAmount = remainingMargin - liquidationFee;
        if (returnAmount > 0) {
            require(hasMON.transfer(hasMonCollateral, returnAmount), "Return transfer failed");
        }

        // Close position
        delete positions[trader][marketIndex];

        emit PositionLiquidated(trader, marketIndex, position.size, msg.sender, totalPnl, currentPrice);

        return liquidatorShare;
    }

    // Internal calculation functions
    function _calculatePremium(uint256 marketPrice, Market storage market) internal view returns (int256) {
        if (market.openInterestShort == 0) return 0;

        // Calculate skew ratio between longs and shorts
        uint256 ratio = (market.openInterestLong * PRECISION) / market.openInterestShort;
        int256 skew = int256(ratio) - int256(PRECISION);

        return skew;
    }

    function _calculatePnL(address trader, uint32 marketIndex, uint256 currentPrice) internal view returns (int256) {
        Position storage position = positions[trader][marketIndex];

        uint256 priceDelta;
        if (position.isLong) {
            if (currentPrice > position.entryPrice) {
                priceDelta = currentPrice - position.entryPrice;
                return int256((priceDelta * position.size) / position.entryPrice);
            } else {
                priceDelta = position.entryPrice - currentPrice;
                return -int256((priceDelta * position.size) / position.entryPrice);
            }
        } else {
            if (currentPrice > position.entryPrice) {
                priceDelta = currentPrice - position.entryPrice;
                return -int256((priceDelta * position.size) / position.entryPrice);
            } else {
                priceDelta = position.entryPrice - currentPrice;
                return int256((priceDelta * position.size) / position.entryPrice);
            }
        }
    }

    function _calculateFundingPayment(address trader, uint32 marketIndex) internal view returns (int256) {
        Position storage position = positions[trader][marketIndex];
        Market storage market = markets[marketIndex];

        int256 fundingDelta = market.cumulativeFunding - position.lastCumulativeFunding;

        // Cast position.size to int256 and PRECISION to int256 for consistent arithmetic
        if (position.isLong) {
            return (-int256(position.size) * fundingDelta) / int256(PRECISION);
        } else {
            return (int256(position.size) * fundingDelta) / int256(PRECISION);
        }
    }

    function _getOraclePrice(uint32 marketIndex) internal view returns (uint256) {
        Market storage market = markets[marketIndex];
        AggregatorV3Interface oracle = AggregatorV3Interface(market.oracle);

        // Get latest round data
        (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) = oracle
            .latestRoundData();

        // Price validation
        require(price > 0, "Invalid oracle price");
        require(updatedAt > 0, "Round not complete");
        require(answeredInRound >= roundId, "Stale price");
        require(block.timestamp - updatedAt <= 3600, "Oracle price too old");

        // Convert to 18 decimals (assuming Chainlink uses 8 decimals)
        return uint256(price) * PRICE_PRECISION;
    }

    // View functions for external integrations
    function getPositionValue(
        address trader,
        uint32 marketIndex
    ) external view returns (uint256 value, bool hasProfit, int256 fundingFee) {
        Position storage position = positions[trader][marketIndex];
        require(position.isOpen, "Position not found");

        uint256 currentPrice = _getOraclePrice(marketIndex);
        int256 pnl = _calculatePnL(trader, marketIndex, currentPrice);
        fundingFee = _calculateFundingPayment(trader, marketIndex);

        if (pnl >= 0) {
            value = uint256(pnl);
            hasProfit = true;
        } else {
            value = uint256(-pnl);
            hasProfit = false;
        }
    }

    function getMarketUtilization(uint32 marketIndex) external view returns (uint256 longUtil, uint256 shortUtil) {
        Market storage market = markets[marketIndex];

        longUtil = market.openInterestLong == 0 ? 0 : (market.openInterestLong * PRECISION) / market.maxOpenInterest;

        shortUtil = market.openInterestShort == 0 ? 0 : (market.openInterestShort * PRECISION) / market.maxOpenInterest;
    }

    function getHealthFactor(address trader, uint32 marketIndex) external view returns (uint256) {
        Position storage position = positions[trader][marketIndex];
        require(position.isOpen, "Position not found");

        uint256 currentPrice = _getOraclePrice(marketIndex);
        int256 pnl = _calculatePnL(trader, marketIndex, currentPrice);
        int256 fundingFee = _calculateFundingPayment(trader, marketIndex);
        int256 totalPnl = pnl + fundingFee;

        uint256 remainingMargin;
        if (totalPnl >= 0) {
            remainingMargin = position.margin + uint256(totalPnl);
        } else {
            if (uint256(-totalPnl) < position.margin) {
                remainingMargin = position.margin - uint256(-totalPnl);
            } else {
                return 0;
            }
        }

        return (remainingMargin * BASIS_POINTS) / position.margin;
    }

    // Emergency functions
    function enableEmergencyMode() external onlyOwner {
        require(!emergencyMode, "Emergency mode already enabled");
        emergencyMode = true;
        emit EmergencyModeEnabled(msg.sender, block.timestamp);
    }

    function pauseMarket(uint32 marketIndex) external onlyOwner marketExists(marketIndex) {
        require(!marketPaused[marketIndex], "Market already paused");
        marketPaused[marketIndex] = true;
        emit MarketPaused(marketIndex, true);
    }

    function unpauseMarket(uint32 marketIndex) external onlyOwner marketExists(marketIndex) {
        require(marketPaused[marketIndex], "Market not paused");
        marketPaused[marketIndex] = false;
        emit MarketPaused(marketIndex, false);
    }

    // Insurance fund management
    function addToInsuranceFund() external payable {
        uint256 oldBalance = insuranceFundBalance;
        insuranceFundBalance += msg.value;
        emit InsuranceFundUpdated(oldBalance, insuranceFundBalance);
    }

    function withdrawFromInsuranceFund(uint256 amount) external onlyOwner {
        require(amount <= insuranceFundBalance, "Insufficient insurance fund balance");
        uint256 oldBalance = insuranceFundBalance;
        insuranceFundBalance -= amount;
        (bool success, ) = payable(owner()).call{ value: amount }("");
        require(success, "Transfer failed");
        emit InsuranceFundUpdated(oldBalance, insuranceFundBalance);
    }

    // Enhanced view functions for market analysis
    function getMarketStats(
        uint32 marketIndex
    )
        external
        view
        returns (
            uint256 longOpenInterest,
            uint256 shortOpenInterest,
            uint256 utilizationRate,
            int256 skewness,
            uint256 lastFundingTime,
            int256 currentFundingRate
        )
    {
        Market storage market = markets[marketIndex];

        longOpenInterest = market.openInterestLong;
        shortOpenInterest = market.openInterestShort;

        utilizationRate = market.maxOpenInterest > 0
            ? ((market.openInterestLong + market.openInterestShort) * PRECISION) / market.maxOpenInterest
            : 0;

        skewness = _calculatePremium(_getOraclePrice(marketIndex), market);
        lastFundingTime = market.lastFundingTime;

        // Calculate current funding rate
        if (block.timestamp >= market.lastFundingTime + market.fundingInterval) {
            currentFundingRate = (skewness * market.maxFundingRate) / int256(BASIS_POINTS);
            if (currentFundingRate > market.maxFundingRate) {
                currentFundingRate = market.maxFundingRate;
            } else if (currentFundingRate < -market.maxFundingRate) {
                currentFundingRate = -market.maxFundingRate;
            }
        }
    }

    function getPositionRisk(
        address trader,
        uint32 marketIndex
    )
        external
        view
        returns (
            uint256 marginRatio,
            uint256 liquidationPrice,
            bool isLiquidatable,
            int256 unrealizedPnl,
            int256 fundingPayment
        )
    {
        Position storage position = positions[trader][marketIndex];
        Market storage market = markets[marketIndex];
        require(position.isOpen, "Position not found");

        uint256 currentPrice = _getOraclePrice(marketIndex);
        unrealizedPnl = _calculatePnL(trader, marketIndex, currentPrice);
        fundingPayment = _calculateFundingPayment(trader, marketIndex);

        int256 totalValue = int256(position.margin) + unrealizedPnl + fundingPayment;
        marginRatio = totalValue <= 0 ? 0 : (uint256(totalValue) * BASIS_POINTS) / position.size;

        // Calculate liquidation price
        uint256 liquidationThreshold = (position.margin * market.liquidationThreshold) / BASIS_POINTS;
        if (position.isLong) {
            liquidationPrice =
                position.entryPrice -
                ((position.entryPrice * (position.margin - liquidationThreshold)) / position.margin);
        } else {
            liquidationPrice =
                position.entryPrice +
                ((position.entryPrice * (position.margin - liquidationThreshold)) / position.margin);
        }

        isLiquidatable = marginRatio <= market.liquidationThreshold;
    }

    // Receive function for native token deposits
    receive() external payable {
        // Only accept payments for insurance fund
        insuranceFundBalance += msg.value;
        emit InsuranceFundUpdated(insuranceFundBalance - msg.value, insuranceFundBalance);
    }
}
