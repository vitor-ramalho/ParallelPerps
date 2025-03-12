// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IHasMonCollateral {
    function collateralBalances(address user) external view returns (uint256);
}

contract PerpEngine is Ownable {
    struct Position {
        uint256 size;
        uint256 entryPrice;
        bool isLong;
    }

    IHasMonCollateral public hasMonCollateral;

    mapping(address => Position) public positions;
    mapping(address => uint256) public fundingRates;

    event PositionOpened(address indexed user, uint256 size, uint256 entryPrice, bool isLong);
    event PositionClosed(address indexed user, uint256 exitPrice, int256 pnl);
    event Liquidated(address indexed user);
    event FundingRateUpdated(address indexed user, uint256 newFundingRate);

    constructor(address _hasMonCollateral) Ownable(msg.sender) {

        hasMonCollateral = IHasMonCollateral(_hasMonCollateral);
    }

    function openPosition(uint256 size, uint256 entryPrice, bool isLong) external {
        require(hasMonCollateral.collateralBalances(msg.sender) >= size, "Insufficient collateral");
        positions[msg.sender] = Position(size, entryPrice, isLong);
        emit PositionOpened(msg.sender, size, entryPrice, isLong);
    }

    function closePosition(uint256 exitPrice) external {
        Position memory position = positions[msg.sender];
        require(position.size > 0, "No open position");

        int256 pnl = calculatePnL(position, exitPrice);
        delete positions[msg.sender];

        emit PositionClosed(msg.sender, exitPrice, pnl);
    }

    function liquidate(address user, uint256 liquidationPrice) external onlyOwner {
        Position memory position = positions[user];
        require(position.size > 0, "No open position to liquidate");

        delete positions[user];
        emit Liquidated(user);
    }

    function updateFundingRate(address user, uint256 newFundingRate) external onlyOwner {
        fundingRates[user] = newFundingRate;
        emit FundingRateUpdated(user, newFundingRate);
    }

    function calculatePnL(Position memory position, uint256 exitPrice) internal pure returns (int256) {
        if (position.isLong) {
            return int256(position.size * (exitPrice - position.entryPrice));
        } else {
            return int256(position.size * (position.entryPrice - exitPrice));
        }
    }
}
