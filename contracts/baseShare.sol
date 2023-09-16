// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./libraries/Operator.sol";

contract BaseShare is ERC20Burnable, Operator {
    uint256 public constant PRESALE_ALLOCATION = 27.5 ether;
    uint256 public constant LIQUIDITY_ALLOCATION = 21 ether; // plus one

    constructor() ERC20("BasedRate.io SHARE", "BSHARE") {
        _mint(_msgSender(), PRESALE_ALLOCATION);
        _mint(_msgSender(), LIQUIDITY_ALLOCATION);
    }

    function mint(address account, uint256 amount) external onlyOperator {
        _mint(account, amount);
    }

    function mintForBribes(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}
