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
const PresaleABI = [
  "function WithdrawETHcall(uint256 amount) external",
  "function checkContractBalance() external view returns(uint256)",
  "function userCount() external view returns(uint256)",
];
const utils = ethers.utils;
const provider = ethers.provider;
require('dotenv').config();

const { deployAERO } = require("./deployAERO");

let tx, receipt; //transactions
let deployer, oldDevWallet;
let baseRate,
  baseShare,
  baseBond,
  teamDistributor,
  communityFund,
  baseShareRewardPool,
  boardroom,
  treasury,
  oracle,
  presaleDistributor,
  brate_eth_lp,
  bshare_eth_lp; //contracts
let presaleContractBalance; //values
const sharePerSecond = 93843840000000;
const Presale = "0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659";
let AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
let AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
const WETH = "0x4200000000000000000000000000000000000006";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const team1 = process.env.team1;
const team2 = process.env.team2;
const team3 = process.env.team3;
const team4 = process.env.team4;
const zero =  "0x0000000000000000000000000000000000000000";

let AerodromeRouterContract = new ethers.Contract(
  AerodromeRouter,
  RouterABI,
  provider
);

let AerodromeFactoryContract = new ethers.Contract(
  AerodromeFactory,
  FactoryABI,
  provider
);

const startTime = 1695859200; // treasury
const startTimeSharePool = 1695837600; // sharePool and presale
const supplyBRATEForPresale = utils.parseEther("33.825");
const supplyBSHAREForPresale = utils.parseEther("27.497799");
const PresaleContract = new ethers.Contract(Presale, PresaleABI, provider);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  // [deployer, oldDevWallet] = await ethers.getSigners();
  deployer = await ethers.getImpersonatedSigner(
    "0xadf9152100c536e854e0ed7a3e0e60275cef7e7d"
  );
  console.log(`Deployer: ${deployer.address}`);
  await setBalance(deployer.address, utils.parseEther("1000000000"));
};

const deployContracts = async () => {
  console.log("\n*** DEPLOYING CONTRACTS ***");
  const TeamDistributor = await ethers.getContractFactory(
    "TeamDistributor",
    deployer
  );
  teamDistributor = await TeamDistributor.deploy();
  await teamDistributor.deployed();
  console.log(`TeamDistributor deployed to ${teamDistributor.address}`);
  const BaseRate = await ethers.getContractFactory("BaseRate", deployer);
  baseRate = await BaseRate.deploy();
  await baseRate.deployed();
  console.log(`BaseRate deployed to ${baseRate.address}`);
  const BaseShare = await ethers.getContractFactory("BaseShare", deployer);
  baseShare = await BaseShare.deploy(baseRate.address);
  await baseShare.deployed();
  console.log(`BaseShare deployed to ${baseShare.address}`);
  const BaseBond = await ethers.getContractFactory("BaseBond", deployer);
  baseBond = await BaseBond.deploy();
  await baseBond.deployed();
  console.log(`BaseBond deployed to ${baseBond.address}`);
  const CommunityFund = await ethers.getContractFactory(
    "CommunityFund",
    deployer
  );
  communityFund = await CommunityFund.deploy();
  await communityFund.deployed();
  console.log(`CommunityFund deployed to ${communityFund.address}`);
  const BaseShareRewardPool = await ethers.getContractFactory(
    "BaseShareRewardPool",
    deployer
  );

  baseShareRewardPool = await BaseShareRewardPool.deploy(
    baseShare.address,
    communityFund.address,
    teamDistributor.address,
    1000,
    1000,
    sharePerSecond,
    startTimeSharePool
  );
  await baseShareRewardPool.deployed();
  console.log(`BaseShareRewardPool deployed to ${baseShareRewardPool.address}`);
  const Boardroom = await ethers.getContractFactory("Boardroom", deployer);
  boardroom = await Boardroom.deploy();
  await boardroom.deployed();
  console.log(`Boardroom deployed to ${boardroom.address}`);
  const Treasury = await ethers.getContractFactory("Treasury", deployer);
  treasury = await Treasury.deploy();
  await treasury.deployed();
  console.log(`Treasury deployed to ${treasury.address}`);
  const PresaleDistributorFactory = await ethers.getContractFactory(
    "presaleDistributor",
    deployer
  );
  presaleDistributor = await PresaleDistributorFactory.deploy(
    startTimeSharePool,
    baseRate.address,
    baseShare.address
  );
  await presaleDistributor.deployed();
  console.log(`presaleDistributor deployed to ${presaleDistributor.address}`);
  console.log("\n*** CREATING PAIRS WITH NO LIQUIDITY ***");
  tx = await AerodromeFactoryContract.connect(deployer).createPool(baseRate.address, WETH, true)
  receipt = await tx.wait();
  tx = await AerodromeFactoryContract.connect(deployer).createPool(baseShare.address, WETH, false)
  receipt = await tx.wait();
  console.log("\n*** DEPLOYING ORACLE ***");

  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  const Oracle = await ethers.getContractFactory("Oracle", deployer);
  oracle = await Oracle.deploy(BRATE_ETH_LP);
  await oracle.deployed();
  console.log(`Oracle deployed to ${oracle.address}`);
};

const initializeBoardroom = async () => {
  console.log("\n*** INITIALIZING BOARDROOM ***");
  tx = await boardroom.initialize(
    baseRate.address,
    baseShare.address,
    treasury.address
  );
  receipt = await tx.wait();
};
const initializeTreasury = async () => {
  console.log("\n*** INITIALIZING TREASURY ***");
  tx = await treasury.initialize(
    baseRate.address,
    baseBond.address,
    oracle.address,
    boardroom.address,
    startTime
  );
  receipt = await tx.wait();
};

const setParameters = async () => {
  console.log("\n*** SETTING COMMUNITY FUND IN BASEDSHARE CONTRACT ***");
  console.log("\n*** SETTING TOKENS IN TEAM DISTRIBUTOR ***");
  tx = await teamDistributor.setTokens(baseShare.address, baseRate.address);
  receipt = await tx.wait();
  console.log("\n*** SETTING EXTRA FUNDS IN TREASURY ***");
  tx = await treasury.setExtraFunds(
    communityFund.address,
    2500,
    teamDistributor.address,
    500
  );
  receipt = await tx.wait();
  console.log("\n*** SETTING ORACLE in TOKENS ***");
  tx = await baseRate.setOracle(oracle.address);
  tx = await baseShare.setOracle(oracle.address);
  console.log(
    "\n*** EXCLUDING FROM FEE ***"
  );
  tx = await baseRate.excludeAddress(treasury.address);
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(boardroom.address);
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(communityFund.address);
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(teamDistributor.address);
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(presaleDistributor.address);
  receipt = await tx.wait();
  tx = await baseRate.enableAutoCalculateTax();
  receipt = await tx.wait();
  console.log("\n*** TAX ENABLED ***");
  tx = await baseShare.excludeAddress(treasury.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(boardroom.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(communityFund.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(teamDistributor.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(presaleDistributor.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(baseShare.address);
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(baseShareRewardPool.address);
  receipt = await tx.wait();
  tx = await baseShare.enableAutoCalculateTax();
  receipt = await tx.wait();
  console.log("\n*** TAX ENABLED ***");
};

const setOperators = async () => {
  console.log(
    "\n*** SETTING OPERATOR IN BRATE, PBOND, BSHARE AND BOARDROOM ***"
  );
  tx = await baseRate.transferOperator(treasury.address);
  receipt = await tx.wait();
  tx = await baseBond.transferOperator(treasury.address);
  receipt = await tx.wait();
  tx = await baseShare.setOperator(baseShareRewardPool.address);
  receipt = await tx.wait();
  tx = await boardroom.setOperator(treasury.address);
  receipt = await tx.wait();
};

const setRewardPool = async () => {
  console.log("\n*** SETTING REWARD POOL ***");
  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );
  const BSHARE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseShare.address,
    WETH,
    false,
    AerodromeFactory
  );
  tx = await baseShareRewardPool.add(
    1000,
    BRATE_ETH_LP,
    true,
    startTimeSharePool,
    0,
    0,
    zero
  );
  receipt = await tx.wait();
  console.log("\nBRATE_ETH_LP added");
  tx = await baseShareRewardPool.add(
    1000,
    BSHARE_ETH_LP,
    true,
    startTimeSharePool,
    0,
    0,
    zero
  );
  receipt = await tx.wait();
  console.log("\nBSHARE_ETH_LP added");
  tx = await baseShareRewardPool.add(
    300,
    WETH_USDbC,
    true,
    startTimeSharePool,
    400,
    0,
    WETH_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nWETH_USDbC added");
  tx = await baseShareRewardPool.add(
    700,
    AERO_USDbC,
    true,
    startTimeSharePool,
    400,
    0,
    AERO_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nAERO_USDbC added");

  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);
};

const stakeBSHAREINBoardroom = async () => {
  console.log("\n*** STAKING BSHARE IN BOARDROOM ***");
  tx = await baseShare
    .connect(deployer)
    .approve(boardroom.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  const stakeAmount = ethers.utils.parseEther("1");
  tx = await boardroom.connect(deployer).stake(stakeAmount);
  receipt = await tx.wait();
};

const sendBRATEAndBSHAREToPresaleDistributor = async () => {
  console.log("\n*** SENDING PRATE AND PSHARE TO PRESALE DISTRIBUTOR ***");
  tx = await baseRate.transfer(
    presaleDistributor.address,
    supplyBRATEForPresale
  );
  receipt = await tx.wait();
  tx = await baseShare.transfer(
    presaleDistributor.address,
    supplyBSHAREForPresale
  );
  receipt = await tx.wait();
  console.log(
    "BRATE Balance:",
    utils.formatEther(await baseRate.balanceOf(presaleDistributor.address))
  );
  console.log(
    "BSHARE Balance:",
    utils.formatEther(await baseShare.balanceOf(presaleDistributor.address))
  );

  const presaleContractuserCount = await PresaleContract.userCount();
  const userCountAsInt = parseInt(presaleContractuserCount.toString(), 10);
  console.log("presaleContractuserCount", userCountAsInt);
  tx = await presaleDistributor.updateAllUsers();
  const values = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values);
  receipt = await tx.wait();
};

const setTeamAddresses = async () => {
  console.log("\n*** SETTING TEAM ADDRESSES ***");
  await teamDistributor.setCaller(deployer.address);
  await teamDistributor.setTeam([team1, team2, team3, team4]);
  console.log("Team addresses have been set!");
};

const main = async () => {
  await setAddresses();
  await deployContracts();
  await setTeamAddresses();
  await initializeBoardroom();
  await initializeTreasury();
  await setParameters();
  await setOperators();
  await setRewardPool();
  await stakeBSHAREINBoardroom();
    // await sendBRATEAndBSHAREToPresaleDistributor();
    // TODO ZAP

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
