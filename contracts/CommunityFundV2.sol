// SPDX-License-Identifier: Unlicensed

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "./aerodrome/interfaces/IPool.sol";

contract CommunityFundV2 is AccessControl, Multicall {
    using Address for address payable;
    using SafeERC20 for IERC20;

    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint value,
        string signature,
        bytes data
    );

    bytes32 public constant CALLER_ROLE = keccak256("CALLER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(CALLER_ROLE, _msgSender());
    }

    function recoverETH(address payable to) external onlyRole(CALLER_ROLE) {
        to.sendValue(address(this).balance);
    }

    function getExternalSwapFees(
        address lpToken
    ) external onlyRole(CALLER_ROLE) {
        IPool pool_lp = IPool(lpToken);
        pool_lp.claimFees();
    }

    function recoverTokens(
        address tokenAddress,
        address to
    ) external onlyRole(CALLER_ROLE) {
        IERC20 token = IERC20(tokenAddress);
        token.safeTransfer(to, token.balanceOf(address(this)));
    }

    // to interact with other contracts
    function sendCustomTransaction(
        address target,
        uint value,
        string memory signature,
        bytes memory data
    ) public payable onlyRole(CALLER_ROLE) returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data));
        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(
                bytes4(keccak256(bytes(signature))),
                data
            );
        }
        (bool success, bytes memory returnData) = target.call{value: value}(
            callData
        );
        require(success, "Transaction execution reverted.");

        emit ExecuteTransaction(txHash, target, value, signature, data);

        return returnData;
    }

    receive() external payable {}
}
