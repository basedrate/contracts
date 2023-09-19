const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const PresaleABI = [
  "function WithdrawETHcall(uint256 amount) external",
  "function checkContractBalance() external view returns(uint256)",
  "function userCount() external view returns(uint256)",
];
const utils = ethers.utils;
const provider = ethers.provider;
require('dotenv').config();


let tx, receipt; //transactions
let deployer, oldDevWallet;


const Presale = "0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659";
const amount = utils.parseEther("4.995598");


const PresaleContract = new ethers.Contract(Presale, PresaleABI, provider);
// const WETHContract = new ethers.Contract(WETH, ERC20ABI, provider);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  // [deployer, oldDevWallet] = await ethers.getSigners();
  deployer = await ethers.getImpersonatedSigner(
    "0xadf9152100c536e854e0ed7a3e0e60275cef7e7d"
  );
  oldDevWallet = await ethers.getImpersonatedSigner(
    "0xc92879d115fa23d6d7da27946f0dab96ea2db706"
  );
  
  console.log(`Deployer: ${deployer.address}`);
  console.log(`oldDevWallet: ${oldDevWallet.address}`);

};

const withdrawFromPresale = async () => {
  console.log("\n*** WITHDRAWING FROM PRESALE ***");

  const initialBalance = await ethers.provider.getBalance(oldDevWallet.address);
  console.log(
    "Initial balance of oldDevWallet:",
    utils.formatEther(initialBalance)
  );

  const presaleContractBalance = await PresaleContract.checkContractBalance();
  console.log("presaleContractBalance", presaleContractBalance);
  
  const tx = await PresaleContract.connect(oldDevWallet).WithdrawETHcall(
    amount
  );
  const receipt = await tx.wait();
  console.log(
    "Withdrew from presale:",
    utils.formatEther(presaleContractBalance)
  );

  const finalBalance = await ethers.provider.getBalance(oldDevWallet.address);
  console.log(
    "Final balance of oldDevWallet:",
    utils.formatEther(finalBalance)
  );

  const finalBalancePresale = await ethers.provider.getBalance(Presale);
  console.log(
    "Final balance of presale:",
    utils.formatEther(finalBalancePresale)
  );
};

const main = async () => {
  await setAddresses();
  await withdrawFromPresale();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const showGasUsed = async (tx) => {
  const gasUsed = utils.formatEther(tx.gasUsed) * tx.effectiveGasPrice;
  console.log({ gasUsed });
};
