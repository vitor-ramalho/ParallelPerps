// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Hashed Monad Token (hasMON)
/// @notice A derivative token representing staked MONAD
contract HasMon is ERC20, Ownable {
    address public immutable stakingContract;

    event StakingContractSet(address indexed stakingContract);

    constructor(
        string memory name,
        string memory symbol,
        address _stakingContract
    ) ERC20(name, symbol) Ownable(msg.sender) {
        stakingContract = _stakingContract;
        emit StakingContractSet(_stakingContract);
    }

    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "HasMon: caller is not staking contract");
        _;
    }

    function mint(address _to, uint256 _amount) external onlyStakingContract {
        require(_to != address(0), "HasMon: mint to the zero address");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyStakingContract {
        require(_from != address(0), "HasMon: burn from the zero address");
        require(balanceOf(_from) >= _amount, "HasMon: burn amount exceeds balance");
        _burn(_from, _amount);
    }
}
