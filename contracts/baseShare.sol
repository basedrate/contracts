// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./aerodrome/interfaces/IRouter.sol";
import "./libraries/Operator.sol";
import "./interfaces/IOracle.sol";
import "./libraries/SafeMath8.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBasisAsset {
    function burn(uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

contract BaseShare is ERC20Burnable, Operator {
    using SafeMath8 for uint8;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant PRESALE_ALLOCATION = 27.5 ether;
    uint256 public constant LIQUIDITY_ALLOCATION = 21 ether; // plus one
    uint256 public constant DEV_FUND_POOL_ALLOCATION = 400 ether;
    uint256 public constant COMMUNITY_FUND_POOL_ALLOCATION = 200 ether;
    uint256 public constant VESTING_DURATION = 300 days;
    bool public rewardPoolDistributed = false;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public communityFundRewardRate;
    uint256 public devFundRewardRate;
    uint256 public communityFundLastClaimed;
    uint256 public devFundLastClaimed;
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

    IRouter public constant ROUTER = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43);
    address public constant FACTORY = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    address public BRATE;
    bool public swap;
    address public taxManager;
    address public oracle;
    bool public autoCalculateTax;
    mapping(address => bool) public isLP;
    uint256 public taxRate;
    uint256[] public taxTiersTwaps = [
        0,
        5e17,
        6e17,
        7e17,
        8e17,
        9e17,
        9.7e17,
        1e18,
        1.05e18,
        1.10e18
    ];
    uint256[] public taxTiersRates = [
        600,
        500,
        400,
        300,
        200,
        100,
        0,
        0,
        0,
        0
    ];

    // Sender addresses excluded from Tax
    mapping(address => bool) public excludedAddresses;

    modifier onlyTaxManager() {
        require(taxManager == _msgSender(), "Caller is not the tax office");
        _;
    }

    constructor(uint256 _startTime,address _devFund, address _BRATE) ERC20("BasedRate.io SHARE", "BSHARE") {
         BRATE = _BRATE;
         excludedAddresses[address(this)] = true;
        _mint(_msgSender(), PRESALE_ALLOCATION);
        _mint(_msgSender(), LIQUIDITY_ALLOCATION);
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

    function _burnBRATE(uint256 taxAmount) internal  {
            IRouter.Route[] memory routes = new IRouter.Route[](2);
            routes[0] = IRouter.Route({
                from: address(this),
                to: WETH,
                stable: false,
                factory: FACTORY
            });
            routes[1] = IRouter.Route({
                from: WETH,
                to: BRATE,
                stable: true,
                factory: FACTORY
            });
            IERC20(address(this)).approve(address(ROUTER), taxAmount);
            ROUTER.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                taxAmount,
                0,
                routes,
                address(this),
                block.timestamp.add(60)
            );
            uint256 amountToBurn = IERC20(BRATE).balanceOf(address(this));
            IERC20(BRATE).approve(address(this), amountToBurn);
            IBasisAsset(BRATE).burnFrom(address(this), amountToBurn);
    }

    function mint(address account, uint256 amount) external onlyOperator {
        _mint(account, amount);
    }

    function mintForBribes(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    /* ============= Taxation ============= */

    function getTaxTiersTwapsCount() public view returns (uint256 count) {
        return taxTiersTwaps.length;
    }

    function getTaxTiersRatesCount() public view returns (uint256 count) {
        return taxTiersRates.length;
    }

    function isAddressExcluded(address _address) public view returns (bool) {
        return excludedAddresses[_address];
    }

    function setTaxTiersTwap(
        uint8 _index,
        uint256 _value
    ) public onlyTaxManager returns (bool) {
        require(_index >= 0, "Index has to be higher than 0");
        require(
            _index < getTaxTiersTwapsCount(),
            "Index has to lower than count of tax tiers"
        );
        if (_index > 0) {
            require(_value > taxTiersTwaps[_index - 1]);
        }
        if (_index < getTaxTiersTwapsCount().sub(1)) {
            require(_value < taxTiersTwaps[_index + 1]);
        }
        taxTiersTwaps[_index] = _value;
        return true;
    }

    function setTaxTiersRate(
        uint8 _index,
        uint256 _value
    ) public onlyTaxManager returns (bool) {
        require(_index >= 0, "Index has to be higher than 0");
        require(
            _index < getTaxTiersRatesCount(),
            "Index has to lower than count of tax tiers"
        );
        taxTiersRates[_index] = _value;
        return true;
    }

    function _getBratePrice() internal view returns (uint256 _bratePrice) {
        try IOracle(oracle).twap(address(this), 1e18) returns (uint144 _price) {
            return uint256(_price);
        } catch {
            revert("Brate: failed to fetch BRATE price from Oracle");
        }
    }

    function _updateTaxRate(uint256 _bratePrice) internal returns (uint256) {
        for (
            uint8 tierId = uint8(getTaxTiersTwapsCount()).sub(1);
            tierId >= 0;
            --tierId
        ) {
            if (_bratePrice >= taxTiersTwaps[tierId]) {
                require(
                    taxTiersRates[tierId] < 10000,
                    "tax equal or bigger to 100%"
                );
                taxRate = taxTiersRates[tierId];
                return taxTiersRates[tierId];
            }
        }
        return 0;
    }

    function setLP(address _LP, bool _isLP) public onlyTaxManager {
        isLP[_LP] = _isLP;
    }

    function setSwap(bool _swap) public onlyTaxManager {
        swap = _swap;
    }

    function enableAutoCalculateTax() public onlyTaxManager {
        autoCalculateTax = true;
    }

    function disableAutoCalculateTax() public onlyTaxManager {
        autoCalculateTax = false;
    }

    function setOracle(address _oracle) public onlyTaxManager {
        require(_oracle != address(0), "oracle address cannot be 0 address");
        oracle = _oracle;
    }

    function setTaxRate(uint256 _taxRate) public onlyTaxManager {
        require(!autoCalculateTax, "auto calculate tax cannot be enabled");
        require(_taxRate <= 2000, "tax equal or bigger to 20%");
        taxRate = _taxRate;
    }

    function excludeAddress(
        address _address
    ) public onlyTaxManager returns (bool) {
        require(!excludedAddresses[_address], "address can't be excluded");
        excludedAddresses[_address] = true;
        return true;
    }

    function includeAddress(
        address _address
    ) public onlyTaxManager returns (bool) {
        require(excludedAddresses[_address], "address can't be included");
        excludedAddresses[_address] = false;
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        _transferBSHARE(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            allowance(sender, _msgSender()).sub(
                amount,
                "ERC20: transfer amount exceeds allowance"
            )
        );

        return true;
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        address sender = _msgSender();
        _transferBSHARE(sender, recipient, amount);
        return true;
    }

    function _transferWithTax(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        uint256 taxAmount = amount.mul(taxRate).div(10000);
        uint256 amountAfterTax = amount.sub(taxAmount);
        if(!swap) {
         _burn(sender, taxAmount);    
        }
        if(swap) {
         _transfer(sender,address(this), taxAmount);   
         _burnBRATE(taxAmount);
        }
        _transfer(sender, recipient, amountAfterTax);
    }

    function _transferBSHARE(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        uint256 currentTaxRate = 0;
        if (autoCalculateTax) {
            uint256 currentBratePrice = _getBratePrice();
            currentTaxRate = _updateTaxRate(currentBratePrice);
        }
        if (!autoCalculateTax) {
            currentTaxRate = taxRate;
        }
        if (
            (isLP[recipient]) &&
            currentTaxRate != 0 &&
            !excludedAddresses[sender] &&
            !excludedAddresses[recipient]
        ) {
            _transferWithTax(sender, recipient, amount);
        } else {
            _transfer(sender, recipient, amount);
        }
    }

}
