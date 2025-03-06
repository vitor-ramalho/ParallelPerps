// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PerpetualTrading is Ownable, ReentrancyGuard {
    // Market structure
    struct Market {
        bytes32 marketId;
        address baseToken;
        uint256 maxLeverage;
        uint256 maintenanceMargin;
        uint256 liquidationFee;
        uint256 fundingRateMultiplier;
        uint256 lastFundingTime;
        int256 cumulativeFundingRate;
        uint256 openInterestLong;
        uint256 openInterestShort;
        bool isActive;
    }

    // Position structure
    struct Position {
        uint256 size;
        uint256 margin;
        uint256 entryPrice;
        int256 entryFundingRate;
        bool isLong;
        uint256 lastUpdateTime;
    }

    // Mappings
    mapping(bytes32 => Market) public markets;
    mapping(address => mapping(bytes32 => Position)) public positions;
    mapping(address => uint256) public collateralBalances;

    uint256 public price;

    // Insurance fund
    uint256 public insuranceFund;
    bytes32[] public marketIds;

    // Events
    event MarketCreated(bytes32 indexed marketId, address baseToken);
    event PositionOpened(address indexed trader, bytes32 indexed marketId, uint256 size, uint256 margin, bool isLong);
    event PositionClosed(address indexed trader, bytes32 indexed marketId, uint256 pnl);
    event PositionLiquidated(address indexed trader, bytes32 indexed marketId, uint256 deficit);
    event FundingRateUpdated(bytes32 indexed marketId, int256 fundingRate);

    constructor() Ownable(msg.sender) {}

    function createMarket(
        bytes32 _marketId,
        address _baseToken,
        uint256 _maxLeverage,
        uint256 _maintenanceMargin,
        uint256 _liquidationFee,
        uint256 _fundingRateMultiplier
    ) external onlyOwner {
        require(!markets[_marketId].isActive, "Market already exists");

        markets[_marketId] = Market({
            marketId: _marketId,
            baseToken: _baseToken,
            maxLeverage: _maxLeverage,
            maintenanceMargin: _maintenanceMargin,
            liquidationFee: _liquidationFee,
            fundingRateMultiplier: _fundingRateMultiplier,
            lastFundingTime: block.timestamp,
            cumulativeFundingRate: 0,
            openInterestLong: 0,
            openInterestShort: 0,
            isActive: true
        });

        emit MarketCreated(_marketId, _baseToken);
    }

    function getAllMarkets() external view returns (Market[] memory) {
        uint256 marketCount = 0;
        for (uint256 i = 0; i < marketIds.length; i++) {
            if (markets[marketIds[i]].isActive) {
                marketCount++;
            }
        }

        Market[] memory activeMarkets = new Market[](marketCount);
        uint256 index = 0;
        for (uint256 i = 0; i < marketIds.length; i++) {
            if (markets[marketIds[i]].isActive) {
                activeMarkets[index] = markets[marketIds[i]];
                index++;
            }
        }

        return activeMarkets;
    }

    function depositCollateral(uint256 _amount) external nonReentrant {
        IERC20(markets[bytes32(0)].baseToken).transferFrom(msg.sender, address(this), _amount);
        collateralBalances[msg.sender] += _amount;
    }

    function withdrawCollateral(uint256 _amount) external nonReentrant {
        require(collateralBalances[msg.sender] >= _amount, "Insufficient balance");

        // Check if withdrawal doesn't cause positions to be under-collateralized
        // Implementation needed

        collateralBalances[msg.sender] -= _amount;
        IERC20(markets[bytes32(0)].baseToken).transfer(msg.sender, _amount);
    }

    function openPosition(
        bytes32 _marketId,
        uint256 _margin,
        uint256 _leverage,
        bool _isLong,
        uint256 _price
    ) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.isActive, "Market not active");
        require(_leverage <= market.maxLeverage, "Leverage too high");
        require(collateralBalances[msg.sender] >= _margin, "Insufficient collateral");

        // Update funding rate
        _updateFundingRate(_marketId);

        // Calculate position size
        uint256 size = _margin * _leverage;

        // Update position
        Position storage position = positions[msg.sender][_marketId];

        // If position exists, close it first
        if (position.size > 0) {
            // Close existing position
            // Implementation needed
        }

        // Create new position
        position.size = size;
        position.margin = _margin;
        position.entryPrice = _price;
        position.entryFundingRate = market.cumulativeFundingRate;
        position.isLong = _isLong;
        position.lastUpdateTime = block.timestamp;

        // Update market open interest
        if (_isLong) {
            market.openInterestLong += size;
        } else {
            market.openInterestShort += size;
        }

        // Reduce collateral balance
        collateralBalances[msg.sender] -= _margin;

        emit PositionOpened(msg.sender, _marketId, size, _margin, _isLong);
    }

    function closePosition(bytes32 _marketId, uint256 _price) external nonReentrant {
        Market storage market = markets[_marketId];
        Position storage position = positions[msg.sender][_marketId];

        require(position.size > 0, "No position to close");

        // Update funding rate
        _updateFundingRate(_marketId);

        // Calculate PnL
        int256 pnl = _calculatePnL(position, _price, market.cumulativeFundingRate);
        uint256 marginToReturn = position.margin;

        // Add PnL to margin (if positive) or deduct from margin (if negative)
        if (pnl > 0) {
            marginToReturn += uint256(pnl);
        } else if (pnl < 0 && uint256(-pnl) < marginToReturn) {
            marginToReturn -= uint256(-pnl);
        } else {
            marginToReturn = 0;
        }

        // Update market open interest
        if (position.isLong) {
            market.openInterestLong -= position.size;
        } else {
            market.openInterestShort -= position.size;
        }

        // Return remaining margin to collateral balance
        collateralBalances[msg.sender] += marginToReturn;

        // Reset position
        delete positions[msg.sender][_marketId];

        emit PositionClosed(msg.sender, _marketId, marginToReturn);
    }

    function liquidatePosition(address _trader, bytes32 _marketId, uint256 _price) external nonReentrant {
        Market storage market = markets[_marketId];
        Position storage position = positions[_trader][_marketId];

        require(position.size > 0, "No position to liquidate");

        // Update funding rate
        _updateFundingRate(_marketId);

        // Calculate PnL
        int256 pnl = _calculatePnL(position, _price, market.cumulativeFundingRate);

        // Check if position is liquidatable
        uint256 currentMargin = pnl > 0
            ? position.margin + uint256(pnl)
            : (uint256(-pnl) >= position.margin ? 0 : position.margin - uint256(-pnl));

        uint256 maintenanceAmount = (position.size * market.maintenanceMargin) / 10000; // Basis points

        require(currentMargin < maintenanceAmount, "Position not liquidatable");

        // Calculate liquidation fee
        uint256 liquidationFee = (position.size * market.liquidationFee) / 10000; // Basis points

        // Calculate deficit
        uint256 deficit = 0;
        if (currentMargin < liquidationFee) {
            deficit = liquidationFee - currentMargin;
            // Use insurance fund to cover deficit
            if (insuranceFund >= deficit) {
                insuranceFund -= deficit;
            } else {
                // Socialize losses if insurance fund is insufficient
                // Implementation needed
            }
            currentMargin = 0;
        } else {
            currentMargin -= liquidationFee;
        }

        // Pay liquidation fee to liquidator
        collateralBalances[msg.sender] += liquidationFee;

        // Return remaining margin to trader
        if (currentMargin > 0) {
            collateralBalances[_trader] += currentMargin;
        }

        // Update market open interest
        if (position.isLong) {
            market.openInterestLong -= position.size;
        } else {
            market.openInterestShort -= position.size;
        }

        // Reset position
        delete positions[_trader][_marketId];

        emit PositionLiquidated(_trader, _marketId, deficit);
    }

    function _updateFundingRate(bytes32 _marketId) internal {
        Market storage market = markets[_marketId];

        // Skip if last update was too recent
        if (block.timestamp - market.lastFundingTime < 1 hours) {
            return;
        }

        // Calculate hours since last update
        uint256 hoursElapsed = (block.timestamp - market.lastFundingTime) / 1 hours;

        // Calculate premium index based on open interest imbalance
        int256 premiumIndex = 0;
        if (market.openInterestLong > 0 || market.openInterestShort > 0) {
            premiumIndex = int256(
                ((int256(market.openInterestLong) - int256(market.openInterestShort)) *
                    int256(market.fundingRateMultiplier)) / int256(market.openInterestLong + market.openInterestShort)
            );
        }

        // Update cumulative funding rate
        market.cumulativeFundingRate += premiumIndex * int256(hoursElapsed);

        // Update last funding time
        market.lastFundingTime = block.timestamp;

        emit FundingRateUpdated(_marketId, premiumIndex);
    }

    function _calculatePnL(
        Position memory _position,
        uint256 _currentPrice,
        int256 _currentCumulativeFunding
    ) internal pure returns (int256) {
        // Calculate PnL from price movement
        int256 pricePnL;
        if (_position.isLong) {
            pricePnL = int256(((_currentPrice * _position.size) / _position.entryPrice) - _position.size);
        } else {
            pricePnL = int256(_position.size - ((_currentPrice * _position.size) / _position.entryPrice));
        }

        // Calculate funding payment
        int256 fundingPayment = (int256(_position.size) * (_currentCumulativeFunding - _position.entryFundingRate)) /
            1e18;

        // Longs pay funding when positive, shorts pay when negative
        if (_position.isLong) {
            return pricePnL - fundingPayment;
        } else {
            return pricePnL + fundingPayment;
        }
    }
}
