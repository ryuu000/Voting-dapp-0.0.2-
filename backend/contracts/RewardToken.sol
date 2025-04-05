// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RewardToken
/// @notice ERC20 token used for wellness professional rewards
/// @dev Implements standard ERC20 functionality with minting restricted to owner
contract RewardToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens

    constructor() ERC20("Wellness Reward Token", "WRT") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Mint new tokens (only owner)
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens (only owner)
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
} 