//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IBasedRateSale.sol";

contract presaleDistributor is Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;

    IBasedRateSale public basedRateSale;
    IERC20 public brate;
    IERC20 public bshare;
    
    uint256 public startTime;
    uint256 public endTime;
    uint256 public runtime; 

    mapping(address => UserData) public users;

    struct UserData {
        uint256 brateBought;
        uint256 bshareBought;
        uint256 brateClaimed;
        uint256 bshareClaimed;
        uint256 lastClaimTime;
    }

    constructor(
        address _basedRateSaleAddress, 
        uint256 _startTime, 
        uint256 _endTime, 
        address _brate, 
        address _bshare
    ) {
        require(_endTime > _startTime, "endtime has to be greater than start time");
        basedRateSale = IBasedRateSale(_basedRateSaleAddress);
        startTime = _startTime;
        endTime = _endTime;
        runtime = _endTime - _startTime;
        brate = IERC20(_brate);
        bshare = IERC20(_bshare);
    }

    function Claim() public nonReentrant {
        
        address user = msg.sender;
        uint256 pendingShareAmount = pendingShare(user);
        uint256 pendingRateAmount = pendingRate(user);
        uint256 brateClaimed = users[user].brateClaimed;
        uint256 brateBought = users[user].brateBought;
        uint256 bshareClaimed = users[user].bshareClaimed;
        uint256 bshareBought = users[user].bshareBought;
        require((brateBought + bshareBought) > 0, "you have no tokens to claim!");

        if (brateClaimed == brateBought) {
        pendingRateAmount = 0;    
        }
        if ((pendingRateAmount + brateClaimed) > brateBought ) {
        pendingRateAmount = brateBought - brateClaimed;
        }
        
        if (bshareClaimed == bshareBought) {
        pendingShareAmount = 0;    
        }
        if ((pendingShareAmount + bshareClaimed) > bshareBought ) {
        pendingShareAmount = bshareBought - bshareClaimed;
        }
        
        require((pendingRateAmount + pendingShareAmount) > 0, "No more left to claim!");
        
        brate.safeTransfer(user, pendingRateAmount);
        bshare.safeTransfer(user, pendingShareAmount);

        users[user].brateClaimed += pendingRateAmount;
        users[user].bshareClaimed += pendingShareAmount;
        users[user].lastClaimTime = block.timestamp;
    }


    function rewardsPerSecondRate(address _user) public view returns (uint256) {
        uint256 totalBrate = users[_user].brateBought;
        return totalBrate / runtime;
    }

    function rewardsPerSecondShare(address _user) public view returns (uint256) {
        uint256 totalBshare= users[_user].bshareBought;
        return totalBshare / runtime;
    }

    function pendingShare(address _user) public view returns (uint256) {
        uint256 lastRewardTime = users[_user].lastClaimTime;
        uint256 rewardsPerSecond = rewardsPerSecondShare(_user);
        if (block.timestamp > lastRewardTime) {
            uint256 multiplier = getMultiplier(lastRewardTime, block.timestamp);
            uint256 tokenReward = multiplier * rewardsPerSecond;
            return tokenReward;
        } else {
            return 0;
        }
    }
    
    function pendingRate(address _user) public view returns (uint256) {
        uint256 lastRewardTime = users[_user].lastClaimTime;
        uint256 rewardsPerSecond = rewardsPerSecondRate(_user);
        if (block.timestamp > lastRewardTime) {
            uint256 multiplier = getMultiplier(lastRewardTime, block.timestamp);
            uint256 tokenReward = multiplier * rewardsPerSecond;
            return tokenReward;
        } else {
            return 0;
        }
    }

    function getMultiplier(
        uint256 _from,
        uint256 _to
    ) public view returns (uint256) {
        if (_to <= endTime) {
            return (_to - _from);
        } else if (_from >= endTime) {
            return 0;
        } else {
            return (endTime - _from);
        }
    }

    function fetchUserData(address _user) external view returns (IBasedRateSale.UserData memory) {
        return basedRateSale.users(_user);
    }

    function fetchUserIndex(uint256 index) external view returns (address) {
        return basedRateSale.userIndex(index);
    }

    function fetchUserCount() external view returns (uint256) {
        return basedRateSale.userCount();
    }


}
