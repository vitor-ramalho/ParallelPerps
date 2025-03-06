// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ISwitchboard } from "@switchboard-xyz/on-demand-solidity/ISwitchboard.sol";
import { Structs } from "@switchboard-xyz/on-demand-solidity/Structs.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SwitchboardOracle
 * @dev Contract that integrates with Switchboard's data feeds for price oracle functionality
 */
contract SwitchboardOracle is Ownable {
    // Mapping from market ID to Switchboard feed address
    mapping(bytes32 => address) public priceFeeds;

    // Mapping to store the decimals for each price feed
    mapping(bytes32 => uint8) public feedDecimals;

    // Heartbeat threshold in seconds (time before price is considered stale)
    uint256 public stalePriceThreshold = 300; // 5 minutes

    // Events
    event PriceFeedSet(bytes32 indexed marketId, address indexed feedAddress, uint8 decimals);
    event StalePriceThresholdUpdated(uint256 newThreshold);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets a Switchboard price feed for a specific market
     * @param marketId The ID of the market
     * @param feedAddress The address of the Switchboard feed
     * @param decimals The number of decimals used in the feed
     */
    function setPriceFeed(bytes32 marketId, address feedAddress, uint8 decimals) external onlyOwner {
        require(feedAddress != address(0), "Invalid feed address");
        priceFeeds[marketId] = feedAddress;
        feedDecimals[marketId] = decimals;

        emit PriceFeedSet(marketId, feedAddress, decimals);
    }

    /**
     * @dev Updates the stale price threshold
     * @param newThreshold New threshold in seconds
     */
    function setStalePriceThreshold(uint256 newThreshold) external onlyOwner {
        stalePriceThreshold = newThreshold;

        emit StalePriceThresholdUpdated(newThreshold);
    }

    /**
     * @dev Gets the latest price from Switchboard for a specific market
     * @param marketId The ID of the market
     * @return price The latest price (normalized to 8 decimals)
     * @return timestamp The timestamp of the latest update
     */
    function getPrice(bytes32 marketId) external view returns (uint256 price, uint256 timestamp) {
        address feedAddress = priceFeeds[marketId];
        require(feedAddress != address(0), "Feed not found");

        // Get the latest result from Switchboard feed
        int256 latestValue;
        uint256 latestTimestamp;

        try ISwitchboardFeed(feedAddress).latestResult() returns (int256 value, uint256 updatedAt) {
            latestValue = value;
            latestTimestamp = updatedAt;
        } catch {
            revert("Failed to fetch price from Switchboard");
        }

        require(latestTimestamp > 0, "Price not available");
        require(block.timestamp - latestTimestamp <= stalePriceThreshold, "Price is stale");

        // Switchboard prices are stored as a scaled int256 depending on the feed's decimals
        // We normalize to 8 decimals which is standard for price feeds in DeFi
        if (latestValue >= 0) {
            // Handle decimals conversion - standardize to 8 decimals
            if (feedDecimals[marketId] > 8) {
                price = uint256(latestValue) / (10 ** (feedDecimals[marketId] - 8));
            } else if (feedDecimals[marketId] < 8) {
                price = uint256(latestValue) * (10 ** (8 - feedDecimals[marketId]));
            } else {
                price = uint256(latestValue);
            }

            return (price, latestTimestamp);
        } else {
            revert("Negative price returned");
        }
    }
}

/**
 * @title ISwitchboardFeed
 * @dev Interface for interacting with a Switchboard feed
 */
interface ISwitchboardFeed {
    function latestResult() external view returns (int256 value, uint256 updatedAt);

    function latestResultWithValidity() external view returns (int256 value, uint256 updatedAt, bool validity);
}
