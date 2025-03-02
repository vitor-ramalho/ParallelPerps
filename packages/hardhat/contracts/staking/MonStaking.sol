// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HasMon.sol";

/// @title Monad Staking Contract
/// @notice Users stake MON (native currency) and receive hasMON as a staking derivative
contract MonStaking is ReentrancyGuard, Pausable, Ownable {
    HasMon public immutable hasMonToken;

    mapping(address => uint256) public stakedBalances;
    uint256 public totalStaked;

    uint256 public constant MIN_STAKE_AMOUNT = 1e15; // 0.001 MON
    uint256 public constant MAX_STAKE_AMOUNT = 1000000e18; // 1M MON

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardAdded(uint256 amount);
    event EmergencyUnstake(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {
        hasMonToken = new HasMon("Hashed Monad", "hasMON", address(this));
    }

    function getHasMonBalance(address _user) public view returns (uint256) {
        return hasMonToken.balanceOf(_user);
    }

    function getContractAddressBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Stake MON (native currency)
    function stake() external payable nonReentrant whenNotPaused {
        require(msg.value >= MIN_STAKE_AMOUNT, "Stake amount too low");
        require(msg.value <= MAX_STAKE_AMOUNT, "Stake amount too high");
        require(totalStaked + msg.value <= MAX_STAKE_AMOUNT, "Total stake limit reached");

        hasMonToken.mint(msg.sender, msg.value);
        stakedBalances[msg.sender] += msg.value;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    /// @notice Unstake MON and burn hasMON
    function unstake(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "Cannot unstake 0");
        require(_amount <= stakedBalances[msg.sender], "Insufficient balance");
        require(_amount <= address(this).balance, "Insufficient contract balance");

        // Update state before external interactions
        stakedBalances[msg.sender] -= _amount;
        totalStaked -= _amount;

        // Burn hasMON tokens before transfer
        hasMonToken.burn(msg.sender, _amount);

        // Transfer MON back to the user
        (bool success, ) = payable(msg.sender).call{ value: _amount }("");
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, _amount);
    }

    // @notice Emergency unstake all MON and
    // burn hasMON tokens
    function emergencyUnstake() external nonReentrant {
        uint256 amount = stakedBalances[msg.sender];
        require(amount > 0, "No stake to withdraw");

        stakedBalances[msg.sender] = 0;
        totalStaked -= amount;
        hasMonToken.burn(msg.sender, amount);

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Transfer failed");

        emit EmergencyUnstake(msg.sender, amount);
    }

    // @notice Pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    // @notice Unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Allow contract to receive MON
    receive() external payable {}
}
