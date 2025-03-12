// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPerpEngine {
    function updateCollateral(address user, uint256 amount, bool isDeposit) external;
}

contract HasMonCollateral is Ownable {
    IERC20 public hasMON;
    IPerpEngine public perpEngine;
    mapping(address => uint256) public collateralBalances;

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event PerpEngineSet(address perpEngine);
    event ERC20InsufficientAllowance(address indexed user, uint256 allowance, uint256 requiredAmount);

    constructor(address _hasMON) Ownable(msg.sender) {
        hasMON = IERC20(_hasMON);
    }

    function setPerpEngine(address _perpEngine) external onlyOwner {
        require(address(perpEngine) == address(0), "PerpEngine already set");
        perpEngine = IPerpEngine(_perpEngine);
        emit PerpEngineSet(_perpEngine);
    }

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than zero");

        uint256 allowance = hasMON.allowance(msg.sender, address(this));
        if (allowance < amount) {
            emit ERC20InsufficientAllowance(msg.sender, allowance, amount);
            return;
        }

        require(hasMON.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        collateralBalances[msg.sender] += amount;
        perpEngine.updateCollateral(msg.sender, amount, true);

        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(collateralBalances[msg.sender] >= amount, "Insufficient collateral");

        collateralBalances[msg.sender] -= amount;
        perpEngine.updateCollateral(msg.sender, amount, false);

        require(hasMON.transfer(msg.sender, amount), "Transfer failed");

        emit CollateralWithdrawn(msg.sender, amount);
    }
}
