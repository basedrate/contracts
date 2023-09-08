// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./libraries/ERC20Burnable.sol";
import "./libraries/Operator.sol";
import "./libraries/SafeMath.sol";

contract BaseShare is ERC20Burnable, Operator {
    using SafeMath for uint256;

    // TOTAL MAX SUPPLY ≈ 4,100 BSHARE
    uint256 public constant FARMING_POOL_REWARD_ALLOCATION = 3150 ether;
    uint256 public constant PRESALE_ALLOCATION = 27.497799 ether;
    uint256 public constant LIQUIDITY_ALLOCATION = 20 ether;
    uint256 public constant COMMUNITY_FUND_POOL_ALLOCATION = 200 ether;
    uint256 public constant DEV_FUND_POOL_ALLOCATION = 400 ether;
    uint256 public constant VESTING_DURATION = 300 days;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public communityFundRewardRate;
    uint256 public devFundRewardRate;
    uint256 public communityFundLastClaimed;
    uint256 public devFundLastClaimed;
    bool public rewardPoolDistributed = false;
    address public communityFund;
    address public devFund;

    event treasuryFundTransferred(
        address indexed previousTreasuryFund,
        address indexed newTreasuryFund
    );
    event devFundTransferred(
        address indexed previousDevFund,
        address indexed newDevFund
    );

    constructor(
        uint256 _startTime,
        address _devFund
    ) public ERC20("BasedRate.io", "BSHARE") {
        startTime = _startTime;
        endTime = startTime + VESTING_DURATION;

        communityFundLastClaimed = startTime;
        devFundLastClaimed = startTime;

        communityFundRewardRate = COMMUNITY_FUND_POOL_ALLOCATION.div(
            VESTING_DURATION
        );
        devFundRewardRate = DEV_FUND_POOL_ALLOCATION.div(VESTING_DURATION);

        require(_devFund != address(0), "Address cannot be 0");
        devFund = _devFund;
    }

    function setTreasuryFund(address _communityFund) external {
        require(msg.sender == devFund, "!dev");
        address previousCommunityFund = communityFund;
        communityFund = _communityFund;
        emit treasuryFundTransferred(previousCommunityFund, _communityFund);
    }

    function setDevFund(address _devFund) external {
        require(msg.sender == devFund, "!dev");
        require(_devFund != address(0), "zero");
        address previousDevFund = devFund;
        devFund = _devFund;
        emit devFundTransferred(previousDevFund, _devFund);
    }

    function unclaimedTreasuryFund() public view returns (uint256 _pending) {
        uint256 _now = block.timestamp;
        if (_now > endTime) _now = endTime;
        if (communityFundLastClaimed >= _now) return 0;
        _pending = _now.sub(communityFundLastClaimed).mul(
            communityFundRewardRate
        );
    }

    function unclaimedDevFund() public view returns (uint256 _pending) {
        uint256 _now = block.timestamp;
        if (_now > endTime) _now = endTime;
        if (devFundLastClaimed >= _now) return 0;
        _pending = _now.sub(devFundLastClaimed).mul(devFundRewardRate);
    }

    /**
     * @dev Claim pending rewards to community and dev fund
     */
    function claimRewards() external {
        uint256 _pending = unclaimedTreasuryFund();
        if (_pending > 0 && communityFund != address(0)) {
            _mint(communityFund, _pending);
            communityFundLastClaimed = block.timestamp;
        }
        _pending = unclaimedDevFund();
        if (_pending > 0 && devFund != address(0)) {
            _mint(devFund, _pending);
            devFundLastClaimed = block.timestamp;
        }
    }

    /**
     * @notice distribute to reward pool (only once)
     */
    function distributeReward(
        address _farmingIncentiveFund
    ) external onlyOperator {
        require(!rewardPoolDistributed, "only can distribute once");
        require(_farmingIncentiveFund != address(0), "!_farmingIncentiveFund");
        rewardPoolDistributed = true;
        _mint(_farmingIncentiveFund, FARMING_POOL_REWARD_ALLOCATION);
        _mint(msg.sender, PRESALE_ALLOCATION);
        _mint(msg.sender, LIQUIDITY_ALLOCATION);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
    }

    function governanceRecoverUnsupported(
        IERC20 _token,
        uint256 _amount,
        address _to
    ) external onlyOperator {
        _token.transfer(_to, _amount);
    }
}
