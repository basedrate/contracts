/**

// SPDX-License-Identifier: MIT
*/
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// import "hardhat/console.sol";

interface IStaking {
    function injectRewardsWithTime(uint256 amount, uint256 rewardsSeconds) external;
}

contract StakingVault is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private callers;
    using Address for address;
    using SafeERC20 for IERC20;

    uint256 public stakingRoundDuration = 1 weeks;
    uint256 public lastStakingRound;
    uint256 public distributionPercentage = 2000; //20% per week
    IStaking public staking;

    uint256 public currentRewards;
    uint256 public totalRewards;

    IERC20 public constant LP =
        IERC20(0xd260115030b9fB6849da169a01ed80b6496d1e99);

    modifier onlyCaller() {
        require(isCaller(_msgSender()), "STAKING VAULT: Wrong caller");
        _;
    }

    constructor(IStaking _staking) {
        lastStakingRound = block.timestamp;
        staking = _staking;
        addCaller(_msgSender());
        addCaller(address(this));
    }

    function checkRound() external whenNotPaused {
        if (block.timestamp > lastStakingRound + stakingRoundDuration) {
            _startStakingRound();
        }
    }

    function startStakingRoundWithoutChecking()
        public
        onlyCaller
        whenNotPaused
    {
        _startStakingRound();
    }

    function _startStakingRound() internal {
        uint256 roundRewards = (LP.balanceOf(address(this)) *
            distributionPercentage) / 10_000;
        currentRewards = roundRewards;
        totalRewards += roundRewards;
        lastStakingRound = block.timestamp;

        LP.safeApprove(address(staking), roundRewards);

        staking.injectRewardsWithTime(roundRewards,
            stakingRoundDuration
        );
    }

    function getNextRoundRewards()
        external
        view
        returns (uint256 nextRoundRewards)
    {
        nextRoundRewards =
            (address(this).balance * distributionPercentage) /
            10_000;
    }

    function setStakingRoundDuration(
        uint256 _stakingRoundDuration
    ) external onlyOwner {
        stakingRoundDuration = _stakingRoundDuration;
    }

    function setDistributionPercentage(
        uint256 _distributionPercentage
    ) external onlyOwner {
        distributionPercentage = _distributionPercentage;
    }

    function isCaller(address account) public view returns (bool) {
        return callers.contains(account);
    }

    function addCaller(address caller) public onlyOwner returns (bool) {
        require(
            caller != address(0),
            "STAKING VAULT: caller is the zero address"
        );
        return callers.add(caller);
    }

    function delCaller(address caller) external onlyOwner returns (bool) {
        require(
            caller != address(0),
            "STAKING VAULT: caller is the zero address"
        );
        return callers.remove(caller);
    }

    function getCallersLength() external view returns (uint256) {
        return callers.length();
    }

    function getCaller(uint256 index) external view returns (address) {
        require(
            index <= callers.length() - 1,
            "STAKING VAULT: index out of bounds"
        );
        return callers.at(index);
    }

    function rescueLP() external onlyCaller {
       // payable(_msgSender()).sendValue(address(this).balance);
        LP.safeTransfer(_msgSender(), LP.balanceOf(address(this)));
    }

    function pause() external onlyCaller {
        _pause();
    }

    function unpause() external onlyCaller {
        _unpause();
    }

    receive() external payable {}
}
