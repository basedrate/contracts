const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("./RouterABI.json");
const FactoryABI = require("./factoryABI.json");
const ERC20ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
const PoolABI =
  require("../artifacts/contracts/aerodrome/Pool.sol/Pool.json").abi;
const utils = ethers.utils;
const provider = ethers.provider;
require("dotenv").config();

let tx, receipt; //transactions
let deployer, oldDevWallet;

let xBrate; //contracts
let baseRate, brate_eth_lp; //values

const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BRATE_ETH_LP = "0x8071175D8fe0055048B0654B10c88CAD5D2D1F19";

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xADF9152100c536e854e0ed7A3E0E60275CeF7E7d"
    );
  } else {
    [deployer] = await ethers.getSigners();
  }
  console.log(`Deployer: ${deployer.address}`);
};

const deployContracts = async () => {
  console.log("\n*** DEPLOYING CONTRACTS ***");
  const XBRATE = await ethers.getContractFactory("XBRATE", deployer);
  xBrate = await XBRATE.deploy();
  await xBrate.deployed();
  console.log(`XBRATE deployed to ${xBrate.address}`);
};

const deposit = async () => {
  console.log("\n*** DEPOSITING BRATE FOR XBRATE ***");
  await xBrate.deposit(utils.parseEther("1"), 1729789010, false);
};

const main = async () => {
  await setAddresses();
  await deployContracts();
  await deposit();
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
