// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "hardhat/console.sol";

contract XBRATE is ERC20Burnable, AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;
    using Address for address payable;

    uint256 public constant MAX_STAKE_TIME = 4 * 52 weeks; //4 years
    uint256 public constant MIN_STAKE_TIME = 2 weeks;
    uint256 public constant XBRATE_PER_SECOND = ((1 ether * 1e36) /
        MAX_STAKE_TIME);
    IERC20 public constant BRATE =
        IERC20(0xd260115030b9fB6849da169a01ed80b6496d1e99);

    bytes32 public constant CALLER_ROLE = keccak256("CALLER_ROLE");

    struct StakeData {
        address owner;
        uint256 brateAmount;
        uint256 xbrateAmount;
        uint256 stakeStartTime;
        uint256 stakeEndTime;
    }

    struct UserData {
        uint256 totalBrateAmount;
        uint256 totalxBrateAmount;
        EnumerableSet.UintSet activeStakes;
        EnumerableSet.UintSet endedStakes;
    }

    constructor() ERC20("BasedRate.io xRATE", "xBRATE") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(CALLER_ROLE, _msgSender());
        console.log("MAX_STAKE_TIME", MAX_STAKE_TIME);
        console.log("MIN_STAKE_TIME", MIN_STAKE_TIME);
        console.log("XBRATE_PER_SECOND", XBRATE_PER_SECOND);
        console.log(
            "1 BRATE FOR 4 YEARS",
            ((MAX_STAKE_TIME * XBRATE_PER_SECOND) / 1e36)
        );
        console.log(
            "1 BRATE FOR 1 YEARS",
            ((52 weeks * XBRATE_PER_SECOND) / 1e36)
        );
    }

    function deposit(
        uint256 brateAmount,
        uint256 endTime,
        bool max
    ) external nonReentrant {
        // BRATE.safeTransferFrom(_msgSender(), address(this), brateAmount);
        uint256 xbrateAmount;
        if (max) {
            xbrateAmount =
                ((endTime - block.timestamp) *
                    XBRATE_PER_SECOND *
                    brateAmount) /
                (1e36 * 1e18);
        } else {
            endTime = block.timestamp + MAX_STAKE_TIME;
            xbrateAmount =
                (MAX_STAKE_TIME * XBRATE_PER_SECOND * brateAmount) /
                (1e36 * 1e18);
        }

        console.log("xbrateAmount", xbrateAmount);
    }
}
