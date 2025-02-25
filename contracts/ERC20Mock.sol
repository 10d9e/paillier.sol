// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 * (10 ** uint256(decimals))); // Mint initial supply
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
