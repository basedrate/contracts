// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BaseShareRewardPool is ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // governance
    address public operator;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 token; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. BaseShare to distribute per block.
        uint256 lastRewardTime; // Last time that baseShare distribution occurs.
        uint16 depositFeeBP; //depositfee
        uint256 accTokensPerShare; // Accumulated baseShare per share, times 1e18. See below.
        bool isStarted; // if lastRewardTime has passed
    }

    struct PoolView {
        uint256 pid;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 rewardsPerSecond;
        uint256 accTokensPerShare;
        bool isStarted;
        uint256 totalAmount;
        address token;
        uint16 depositFeeBP;
    }

    struct UserView {
        uint256 pid;
        uint256 stakedAmount;
        uint256 unclaimedRewards;
        uint256 lpBalance;
    }

    IERC20 public baseShare;
    bool public started;

    // Info of each pool.
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    // The time when baseShare mining starts.
    uint256 public poolStartTime;

    // The time when baseShare mining ends.
    uint256 public poolEndTime;

    address public feeAddress;

    uint256 public sharesPerSecond = 0.00009384384 ether; // 3000 baseShare / (370 days * 24h * 60min * 60s)
    uint256 public runningTime = 370 days; // 370 days
    uint256 public constant TOTAL_REWARDS = 3150 ether; // 3000 baseShare farm + referral reward 150 baseShare
    uint256 public constant TOTAL_REFERRAL = 150 ether;
    uint256 public referralRate = 500;
    mapping(address => address) public referral; // referral => referrer
    mapping(address => uint256) public referralEarned; // for stats

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event RewardPaid(address indexed user, uint256 amount);

    constructor(
        address _baseShare,
        uint256 _poolStartTime,
        address _feeAddress
    ) {
        require(block.timestamp < _poolStartTime, "late");
        require(_feeAddress != address(0), "zero address not allowed");
        feeAddress = _feeAddress;
        if (_baseShare != address(0)) baseShare = IERC20(_baseShare);
        poolStartTime = _poolStartTime;
        poolEndTime = poolStartTime + runningTime;
        operator = msg.sender;
    }

    function initializer() public onlyOperator {
        require(!started, "contract initialized");
        uint256 shareBalance = baseShare.balanceOf(address(this));
        uint256 rewardCalculated = (runningTime * sharesPerSecond) +
            TOTAL_REFERRAL;
        require(
            shareBalance >= TOTAL_REWARDS && rewardCalculated <= shareBalance,
            "rewards missing"
        );
        started = true;
    }

    modifier onlyOperator() {
        require(
            operator == msg.sender,
            "BaseShareRewardPool: caller is not the operator"
        );
        _;
    }

    function checkPoolDuplicate(IERC20 _token) internal view {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            require(
                poolInfo[pid].token != _token,
                "BaseShareRewardPool: existing pool?"
            );
        }
    }

    // Add a new lp to the pool
    function add(
        uint256 _allocPoint,
        IERC20 _token,
        bool _withUpdate,
        uint256 _lastRewardTime,
        uint16 _depositFeeBP
    ) public onlyOperator {
        require(_depositFeeBP <= 400, "add: invalid deposit fee basis points");
        checkPoolDuplicate(_token);
        if (_withUpdate) {
            massUpdatePools();
        }
        if (block.timestamp < poolStartTime) {
            // chef is sleeping
            if (_lastRewardTime == 0) {
                _lastRewardTime = poolStartTime;
            } else {
                if (_lastRewardTime < poolStartTime) {
                    _lastRewardTime = poolStartTime;
                }
            }
        } else {
            // chef is cooking
            if (_lastRewardTime == 0 || _lastRewardTime < block.timestamp) {
                _lastRewardTime = block.timestamp;
            }
        }
        bool _isStarted = (_lastRewardTime <= poolStartTime) ||
            (_lastRewardTime <= block.timestamp);
        poolInfo.push(
            PoolInfo({
                token: _token,
                allocPoint: _allocPoint,
                lastRewardTime: _lastRewardTime,
                accTokensPerShare: 0,
                isStarted: _isStarted,
                depositFeeBP: _depositFeeBP
            })
        );
        if (_isStarted) {
            totalAllocPoint = totalAllocPoint.add(_allocPoint);
        }
    }

    // Update the given pool's baseShare allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        uint16 _depositFeeBP
    ) public onlyOperator {
        require(_depositFeeBP <= 400, "add: invalid deposit fee basis points");
        massUpdatePools();
        PoolInfo storage pool = poolInfo[_pid];
        if (pool.isStarted) {
            totalAllocPoint = totalAllocPoint.sub(pool.allocPoint).add(
                _allocPoint
            );
        }
        pool.allocPoint = _allocPoint;
        poolInfo[_pid].depositFeeBP = _depositFeeBP;
    }

    // Return accumulate rewards over the given _from to _to block.
    function getGeneratedReward(
        uint256 _fromTime,
        uint256 _toTime
    ) public view returns (uint256) {
        if (_fromTime >= _toTime) return 0;
        if (_toTime >= poolEndTime) {
            if (_fromTime >= poolEndTime) return 0;
            if (_fromTime <= poolStartTime)
                return poolEndTime.sub(poolStartTime).mul(sharesPerSecond);
            return poolEndTime.sub(_fromTime).mul(sharesPerSecond);
        } else {
            if (_toTime <= poolStartTime) return 0;
            if (_fromTime <= poolStartTime)
                return _toTime.sub(poolStartTime).mul(sharesPerSecond);
            return _toTime.sub(_fromTime).mul(sharesPerSecond);
        }
    }

    // View function to see pending BaseShare on frontend.
    function pendingShare(
        uint256 _pid,
        address _user
    ) public view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accTokensPerShare = pool.accTokensPerShare;
        uint256 tokenSupply = pool.token.balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTime && tokenSupply != 0) {
            uint256 _generatedReward = getGeneratedReward(
                pool.lastRewardTime,
                block.timestamp
            );
            uint256 _baseShareReward = _generatedReward
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            accTokensPerShare = accTokensPerShare.add(
                _baseShareReward.mul(1e18).div(tokenSupply)
            );
        }
        return
            user.amount.mul(accTokensPerShare).div(1e18).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        uint256 tokenSupply = pool.token.balanceOf(address(this));
        if (tokenSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        if (!pool.isStarted) {
            pool.isStarted = true;
            totalAllocPoint = totalAllocPoint.add(pool.allocPoint);
        }
        if (totalAllocPoint > 0) {
            uint256 _generatedReward = getGeneratedReward(
                pool.lastRewardTime,
                block.timestamp
            );
            uint256 _baseShareReward = _generatedReward
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            pool.accTokensPerShare = pool.accTokensPerShare.add(
                _baseShareReward.mul(1e18).div(tokenSupply)
            );
        }
        pool.lastRewardTime = block.timestamp;
    }

    // Deposit LP tokens.
    function deposit(uint256 _pid, uint256 _amount, address referrer) public nonReentrant {
        require(started, "contract not initialized");
        address _sender = msg.sender;
        require(
            referrer != address(0) &&
                referrer != _sender &&
                referrer != address(this),
            "invalid referrer"
        );

        if (referral[_sender] == address(0)) {
            referral[_sender] = referrer;
        } else {
            referrer = referral[_sender];
        }

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 _pending = user
                .amount
                .mul(pool.accTokensPerShare)
                .div(1e18)
                .sub(user.rewardDebt);
            if (_pending > 0) {
                uint256 referralAmount = ((_pending) * referralRate) / 10000;
                referralEarned[referrer] =
                    referralEarned[referrer] +
                    referralAmount;
                safeBaseShareTransfer(referrer, referralAmount);

                safeBaseShareTransfer(_sender, _pending);
                emit RewardPaid(_sender, _pending);
            }
        }
        if (_amount > 0) {
            pool.token.safeTransferFrom(_sender, address(this), _amount);
        }
        if (pool.depositFeeBP > 0) {
            uint256 depositFee = _amount.mul(pool.depositFeeBP).div(10000);
            pool.token.safeTransfer(feeAddress, depositFee);
            user.amount = user.amount.add(_amount).sub(depositFee);
        } else {
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accTokensPerShare).div(1e18);
        emit Deposit(_sender, _pid, _amount);
    }

    // Withdraw LP tokens.
    function withdraw(uint256 _pid, uint256 _amount) public nonReentrant {
        address _sender = msg.sender;
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        address referrer = referral[_sender];
        uint256 _pending = user
            .amount
            .mul(pool.accTokensPerShare)
            .div(1e18)
            .sub(user.rewardDebt);

        if (_pending > 0) {
            uint256 referralAmount = ((_pending) * referralRate) / 10000;
            referralEarned[referrer] =
                referralEarned[referrer] +
                referralAmount;
            safeBaseShareTransfer(referrer, referralAmount);

            safeBaseShareTransfer(_sender, _pending);
            emit RewardPaid(_sender, _pending);
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.token.safeTransfer(_sender, _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accTokensPerShare).div(1e18);
        emit Withdraw(_sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 _amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.token.safeTransfer(msg.sender, _amount);
        emit EmergencyWithdraw(msg.sender, _pid, _amount);
    }

    // Safe baseShare transfer function, just in case if rounding error causes pool to not have enough baseShare.
    function safeBaseShareTransfer(address _to, uint256 _amount) internal {
        uint256 _baseShareBal = baseShare.balanceOf(address(this));
        if (_baseShareBal > 0) {
            if (_amount > _baseShareBal) {
                baseShare.safeTransfer(_to, _baseShareBal);
            } else {
                baseShare.safeTransfer(_to, _amount);
            }
        }
    }

    function setOperator(address _operator) external onlyOperator {
        operator = _operator;
    }

    function setFeeAddress(address _feeAddress) external onlyOperator {
        require(_feeAddress != address(0), "zero address not allowed");
        feeAddress = _feeAddress;
    }

    function governanceRecoverUnsupported(
        IERC20 _token,
        uint256 amount,
        address to
    ) external onlyOperator {
        if (block.timestamp < poolEndTime + 90 days) {
            // do not allow to drain core token (baseShare or lps) if less than 90 days after pool ends
            require(_token != baseShare, "baseShare");
            uint256 length = poolInfo.length;
            for (uint256 pid = 0; pid < length; ++pid) {
                PoolInfo storage pool = poolInfo[pid];
                require(_token != pool.token, "pool.token");
            }
        }
        _token.safeTransfer(to, amount);
    }

    function getPoolView(uint256 pid) public view returns (PoolView memory) {
        require(pid < poolInfo.length, "Staking: pid out of range");
        PoolInfo memory pool = poolInfo[pid];
        uint256 rewardsPerSecond = pool.allocPoint.mul(sharesPerSecond).div(
            totalAllocPoint
        );
        return
            PoolView({
                pid: pid,
                allocPoint: pool.allocPoint,
                lastRewardTime: pool.lastRewardTime,
                rewardsPerSecond: rewardsPerSecond,
                accTokensPerShare: pool.accTokensPerShare,
                isStarted: pool.isStarted,
                totalAmount: pool.token.balanceOf(address(this)),
                token: address(pool.token),
                depositFeeBP: pool.depositFeeBP
            });
    }

    function getAllPoolViews() external view returns (PoolView[] memory) {
        PoolView[] memory views = new PoolView[](poolInfo.length);
        for (uint256 i = 0; i < poolInfo.length; i++) {
            views[i] = getPoolView(i);
        }
        return views;
    }

    function getUserView(
        uint256 pid,
        address account
    ) public view returns (UserView memory) {
        PoolInfo memory pool = poolInfo[pid];
        UserInfo memory user = userInfo[pid][account];
        uint256 unclaimedRewards = pendingShare(pid, account);
        uint256 lpBalance = pool.token.balanceOf(account);
        return
            UserView({
                pid: pid,
                stakedAmount: user.amount,
                unclaimedRewards: unclaimedRewards,
                lpBalance: lpBalance
            });
    }

    function getUserViews(
        address account
    ) external view returns (UserView[] memory) {
        UserView[] memory views = new UserView[](poolInfo.length);
        for (uint256 i = 0; i < poolInfo.length; i++) {
            views[i] = getUserView(i, account);
        }
        return views;
    }
}
