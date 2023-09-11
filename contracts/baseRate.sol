// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./interfaces/IOracle.sol";
import "./libraries/SafeMath8.sol";
import "./libraries/SafeMath.sol";
import "./libraries/ERC20Burnable.sol";
import "./libraries/Operator.sol";

contract BaseRate is ERC20Burnable, Operator {
    using SafeMath8 for uint8;
    using SafeMath for uint256;

    address public taxManager;
    address public oracle;

    // Initial presale distribution
    uint256 public constant INITIAL_PRESALE_DISTRIBUTION = 15e6 ether;
    uint256 public constant INITIAL_LIQUIDITY_DISTRIBUTION = 25e6 ether;

    // Should the taxes be calculated using the tax tiers
    bool public autoCalculateTax;
    mapping(address => bool) public isLP;

    // Current tax rate
    uint256 public taxRate;

    // Tax Tiers
    uint256[] public taxTiersTwaps = [0, 5e17, 6e17, 7e17, 8e17, 9e17, 9.5e17, 1e18, 1.05e18, 1.10e18, 1.20e18, 1.30e18, 1.40e18, 1.50e18];
    uint256[] public taxTiersRates = [2000, 1900, 1800, 1700, 1600, 1500, 1500, 1500, 1500, 1400, 900, 400, 200, 100];

    // Sender addresses excluded from Tax
    mapping(address => bool) public excludedAddresses;

    modifier onlyTaxManager() {
        require(taxManager == msg.sender, "Caller is not the tax office");
        _;
    }

    bool public rewardPoolDistributed = false;

    constructor() public ERC20("BasedRate.io", "BRATE") {
        taxManager = msg.sender;
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

    function setTaxTiersTwap(uint8 _index, uint256 _value) public onlyTaxManager returns (bool) {
        require(_index >= 0, "Index has to be higher than 0");
        require(_index < getTaxTiersTwapsCount(), "Index has to lower than count of tax tiers");
        if (_index > 0) {
            require(_value > taxTiersTwaps[_index - 1]);
        }
        if (_index < getTaxTiersTwapsCount().sub(1)) {
            require(_value < taxTiersTwaps[_index + 1]);
        }
        taxTiersTwaps[_index] = _value;
        return true;
    }

    function setTaxTiersRate(uint8 _index, uint256 _value) public onlyTaxManager returns (bool) {
        require(_index >= 0, "Index has to be higher than 0");
        require(_index < getTaxTiersRatesCount(), "Index has to lower than count of tax tiers");
        taxTiersRates[_index] = _value;
        return true;
    }


    function _getBratePrice() internal view returns (uint256 _bratePrice) {
        try IOracle(oracle).consult(address(this), 1e18) returns (uint144 _price) {
            return uint256(_price);
        } catch {
            revert("Brate: failed to fetch BRATE price from Oracle");
        }
    }

    function _updateTaxRate(uint256 _bratePrice) internal returns (uint256){
        if (autoCalculateTax) {
            for (uint8 tierId = uint8(getTaxTiersTwapsCount()).sub(1); tierId >= 0; --tierId) {
                if (_bratePrice >= taxTiersTwaps[tierId]) {
                    require(taxTiersRates[tierId] < 10000, "tax equal or bigger to 100%");
                    taxRate = taxTiersRates[tierId];
                    return taxTiersRates[tierId];
                }
            }
        }
    }

    function setLP(address _LP, bool _isLP) public onlyTaxManager {
        isLP[_LP] = _isLP;
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

    function excludeAddress(address _address) public onlyTaxManager returns (bool) {
        require(!excludedAddresses[_address], "address can't be excluded");
        excludedAddresses[_address] = true;
        return true;
    }

    function includeAddress(address _address) public onlyTaxManager returns (bool) {
        require(excludedAddresses[_address], "address can't be included");
        excludedAddresses[_address] = false;
        return true;
    }

    function mint(
        address recipient_,
        uint256 amount_
    ) public onlyOperator returns (bool) {
        _mint(recipient_, amount_);
        return true;
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
    }

    function burnFrom(
        address account,
        uint256 amount
    ) public override onlyOperator {
        super.burnFrom(account, amount);
    }

    function distributeReward(address _initializer) external onlyOperator {
        require(!rewardPoolDistributed, "only can distribute once");
        require(_initializer != address(0), "!_initializer");
        rewardPoolDistributed = true;
        _mint(_initializer, INITIAL_PRESALE_DISTRIBUTION);
        _mint(_initializer, INITIAL_LIQUIDITY_DISTRIBUTION);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        uint256 currentTaxRate = 0;
        if (autoCalculateTax) {
            uint256 currentBratePrice = _getBratePrice();
            currentTaxRate = _updateTaxRate(currentBratePrice);
        }
        if (!autoCalculateTax) {
            currentTaxRate = taxRate;
        }
        if (currentTaxRate == 0 || excludedAddresses[sender] || excludedAddresses[recipient]) {
            _transfer(sender, recipient, amount);
        } else {
            _transferFromWithTax(sender, recipient, amount);
        }
        _approve(sender, _msgSender(), allowance(sender, _msgSender()).sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function _transferFromWithTax(
        address sender,
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        uint256 taxAmount = amount.mul(taxRate).div(10000);
        uint256 amountAfterTax = amount.sub(taxAmount);
        super.burnFrom(sender, taxAmount);
        _transfer(sender, recipient, amountAfterTax);
        return true;
    }

    function _transferWithTax(
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        uint256 taxAmount = amount.mul(taxRate).div(10000);
        uint256 amountAfterTax = amount.sub(taxAmount);
        _transfer(msg.sender, address(this), taxAmount);
        super.burn(taxAmount);
        _transfer(msg.sender, recipient, amountAfterTax);
        return true;
    }

     // LP pairs is taxed to prevent circumvention. Direct transfers between wallets and contracts remain tax-exempt.
     function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 currentTaxRate = 0;
        address sender = msg.sender;
        if (autoCalculateTax) {
            uint256 currentBratePrice = _getBratePrice();
            currentTaxRate = _updateTaxRate(currentBratePrice);
        }
        if (!autoCalculateTax) {
            currentTaxRate = taxRate;
        }
        if (currentTaxRate == 0) {
            _transfer(sender, recipient, amount);
        }
        if (isLP[recipient] || isLP[sender]) {
        _transferWithTax(recipient, amount);
        
        } else {
        _transfer(sender, recipient, amount);
        }
        return true;
    }

    function governanceRecoverUnsupported(
        IERC20 _token,
        uint256 _amount,
        address _to
    ) external onlyOperator {
        _token.transfer(_to, _amount);
    }
}
