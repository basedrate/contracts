
//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor()  {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}


interface IToken {
  function remainingMintableSupply() external view returns (uint256);
  function calculateTransferTaxes(address _from, uint256 _value) external view returns (uint256 adjustedValue, uint256 taxAmount);
  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external returns (bool);
  function deposit() external payable;
  function transfer(address to, uint256 value) external returns (bool);
  function balanceOf(address who) external view returns (uint256);
  function mintedSupply() external returns (uint256);
  function allowance(address owner, address spender)
  external
  view
  returns (uint256);
  function approve(address spender, uint256 value) external returns (bool);
    function whitelist(address addrs) external returns(bool);
    function addAddressesToWhitelist(address[] memory addrs)  external returns(bool success) ;
}

abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

contract BasedRateSale is Ownable, ReentrancyGuard {

    mapping(uint256 => address) public userIndex;
    mapping(address => UserData) public users;

    struct UserData {
        uint256 ethContributed;
        uint256 brateBought;
        uint256 bshareBought;
        bool whitelist;
        bool once;
        uint256 walletLimit;
    }

    uint256 public constant BRATEforSale = 27.5e18 * 1000;
    uint256 public constant BSHAREforSale = 27.5e18;
    uint256 public constant HARDCAP = 55e18;
    uint256 public walletLimitFCFS = 1e18;
    uint256 public walletMin = 1e16;
    uint256 public totalContribution;
    uint256 public index;
    
    uint256 public presaleStartTime = 1694019600;
    uint256 public FCFSstartTime = 14400 + presaleStartTime;
    uint256 public BRATEprice = (BRATEforSale * 1e18) / (HARDCAP);
    uint256 public BSHAREprice = (BSHAREforSale * 1e18) / (HARDCAP);

    bool public paused;
    bool public end;

    event buy(address buyer, uint256 value, uint256 brate, uint256 bshare);
    event Pause();
    event Unpause();
    event WhitelistedAddressAdded(address addr, uint256 limit);

    function setWalletParameters(uint256 _walletMin) public onlyOwner {
        walletMin = _walletMin;
    }

    function pause() onlyOwner public {
        paused = true;
        emit Pause();
    }

    function unpause() onlyOwner public {
        paused = false;
        emit Unpause();
    }

    function setEnd(bool _end) onlyOwner public {
        end = _end;
    }

    function addAddressToWhitelist(address addr, uint256 limit) onlyOwner public returns(bool success) {
        UserData storage user = users[addr];
            user.whitelist = true;
            user.walletLimit = limit;
            emit WhitelistedAddressAdded(addr, limit);
            return true;
    }

    function _addAddressToWhitelist(address addr, uint256 limit) private returns(bool added) {
        UserData storage user = users[addr];
            user.whitelist = true;
            user.walletLimit = limit;
            emit WhitelistedAddressAdded(addr, limit);
            return true;
    }

    function addAddressesToWhitelist(address[] memory addrs, uint256[] memory limits) onlyOwner public returns(bool success) {
        require(addrs.length == limits.length, "Mismatched arrays");
        for (uint256 i = 0; i < addrs.length; i++) {
            if (_addAddressToWhitelist(addrs[i], limits[i])) {
                success = true;
            }
        }
    }

    function setTime(uint256 _FCFSstartTime, uint256 _presaleStartTime) public onlyOwner {
        FCFSstartTime = _FCFSstartTime;
        presaleStartTime = _presaleStartTime;
    }

    function Buy() public payable nonReentrant {
        require(end == false, "presale is ended");
        require(block.timestamp > FCFSstartTime || users[msg.sender].whitelist, "You are not Whitelist!");
        require(users[msg.sender].once == false, "only once");
        require(block.timestamp > presaleStartTime, "Not started yet!");
        require(paused == false, "Contract is paused");
        uint256 amount = msg.value;

        if (!users[msg.sender].whitelist) {
        require(amount <= walletLimitFCFS, "max buy exceeded");
        }
        else {
        require(amount <= users[msg.sender].walletLimit, "max buy exceeded");    
        }
        require(amount >= walletMin, "min buy not reached");
        totalContribution += amount;
        require(totalContribution <= HARDCAP, "HARDCAP reached");
        if (!users[msg.sender].whitelist) {
            users[msg.sender].once = true;
        } else {
            users[msg.sender].whitelist = false;
        }
        if (users[msg.sender].ethContributed == 0) {
        userIndex[index] = msg.sender;
        index = index + 1;
        }
        users[msg.sender].ethContributed += amount;
        users[msg.sender].brateBought += (BRATEprice * amount) / 1e18;
        users[msg.sender].bshareBought += (BSHAREprice * amount) / 1e18;
        
        emit buy(msg.sender, amount, (BRATEprice * amount) / 1e18, (BSHAREprice * amount) / 1e18);
    }

    function WithdrawETH(uint256 amount) public onlyOwner {
        payable(msg.sender).transfer(amount);
    }

    function WithdrawETHcall(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Not enough balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function renounceOwnership() public virtual override onlyOwner {
    revert("Ownership renunciation is disabled");
    }

    function checkContractBalance() public view returns(uint256) {
        return address(this).balance;
    }

    function getUserData(address _user) public view returns(UserData memory) {
    return users[_user];
}

   function getTotalSum() public view returns (uint256 totalEthContributed, uint256 totalBrateBought, uint256 totalBshareBought) {
        for(uint256 i = 0; i < index; i++) {
            address currentUser = userIndex[i];
            totalEthContributed += users[currentUser].ethContributed;
            totalBrateBought += users[currentUser].brateBought;
            totalBshareBought += users[currentUser].bshareBought;
        }
    }

    receive() external payable {}
}
