const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("./RouterABI.json");
const FactoryABI = require("./factoryABI.json");
const ERC20ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
const PresaleABI = [
  "function WithdrawETHcall(uint256 amount) external",
  "function checkContractBalance() external view returns(uint256)",
  "function userCount() external view returns(uint256)",
];
const utils = ethers.utils;
const provider = ethers.provider;

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
  presaleDistributor;

const Presale = "0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659";
const AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
const AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
const WETH = "0x4200000000000000000000000000000000000006";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const supplyBRATEForPresale = utils.parseEther("33.825");
const supplyBSHAREForPresale = utils.parseEther("27.497799");

const AerodromeRouterContract = new ethers.Contract(
  AerodromeRouter,
  RouterABI,
  provider
);

const AerodromeFactoryContract = new ethers.Contract(
  AerodromeFactory,
  FactoryABI,
  provider
);

const startTime = Math.floor(Date.now() / 1000); //Now + 20 seconds
const startTimeSharepool = startTime + 3600; // one hour later

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
  await setBalance(deployer.address, utils.parseEther("1000000000"));
  await setBalance(oldDevWallet.address, utils.parseEther("1000000000"));
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
  baseShare = await BaseShare.deploy(startTime, teamDistributor.address);
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
    startTimeSharepool,
    communityFund.address
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
    startTimeSharepool,
    baseRate.address,
    baseShare.address
  );
  await presaleDistributor.deployed();
  console.log(`presaleDistributor deployed to ${presaleDistributor.address}`);
};

const deployOracle = async () => {
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

const mintInitialSupplyAndCreatePools = async () => {
  console.log("\n*** MINTING INITIAL SUPPLY ***");
  tx = await baseRate.distributeReward(deployer.address);
  receipt = await tx.wait();
  console.log(
    "BRATE Balance:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  tx = await baseShare.distributeReward(baseShareRewardPool.address);
  receipt = await tx.wait();
  console.log(
    "BSHARE Balance:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  tx = await AerodromeFactoryContract.connect(deployer).createPool(baseRate.address, WETH, true)
  receipt = await tx.wait();

  tx = await AerodromeFactoryContract.connect(deployer).createPool(baseShare.address, WETH, false)
  receipt = await tx.wait();

  console.log("pools created")


  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  const BSHARE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseShare.address,
    WETH,
    true,
    AerodromeFactory
  );

  console.log(" BSHARE_ETH_LP = ", BSHARE_ETH_LP);
  console.log(" BRATE_ETH_LP = ", BRATE_ETH_LP);
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
    baseShare.address,
    oracle.address,
    boardroom.address,
    startTime
  );
  receipt = await tx.wait();
};

const setParameters = async () => {
  console.log("\n*** SETTING COMMUNITY FUND IN BASEDSHARE CONTRACT ***");
  tx = await teamDistributor.sendCustomTransaction(
    baseShare.address,
    0,
    "setTreasuryFund(address)",
    utils.defaultAbiCoder.encode(["address"], [communityFund.address])
  );
  receipt = await tx.wait();
  console.log("Community Fund:", await baseShare.communityFund());
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
  console.log("\n*** SETTING ORACLE in BASERATE ***");
  tx = await baseRate.setOracle(oracle.address);
  console.log(
    "\n*** EXCLUDING treasury, boardroom, communityFund, teamDistributor, presaleDistributor  ***"
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
};

const setOperators = async () => {
  console.log(
    "\n*** SETTING OPERATOR IN BRATE, PBOND, BSHARE AND BOARDROOM ***"
  );
  tx = await baseRate.transferOperator(treasury.address);
  receipt = await tx.wait();
  tx = await baseBond.transferOperator(treasury.address);
  receipt = await tx.wait();
  tx = await baseShare.transferOperator(treasury.address);
  receipt = await tx.wait();
  tx = await boardroom.setOperator(treasury.address);
  receipt = await tx.wait();
};

const setRewardPoolAndInitialize = async () => {
  console.log("\n*** INITIALIZING REWARD POOL CONTRACT ***");
  tx = await baseShareRewardPool.initializer();
  receipt = await tx.wait();

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
    true,
    AerodromeFactory
  );

  tx = await baseShareRewardPool.add(
    1000,
    BRATE_ETH_LP,
    true,
    startTimeSharepool,
    0,
    false,
    baseShareRewardPool.address
  );
  receipt = await tx.wait();
  console.log("\nBRATE_ETH_LP pool added pid 0 LP address = ", BRATE_ETH_LP, "\ngauge", false);
  tx = await baseShareRewardPool.add(
    1000,
    BSHARE_ETH_LP,
    true,
    startTimeSharepool,
    0,
    false,
    baseShareRewardPool.address
  );
  receipt = await tx.wait();

  console.log("\nBSHARE_ETH_LP pool added pid 1 LP address = ", BSHARE_ETH_LP, "\ngauge", false);

  tx = await baseShareRewardPool.add(
    1000,
    WETH_USDbC,
    true,
    startTimeSharepool,
    400,
    true,
    WETH_USDbC_GAUGE
  );
  receipt = await tx.wait();

  console.log("\nWETH_USDbC pool added pid 2 LP address = ", WETH_USDbC, "\ngauge", true, " gauge address = ", WETH_USDbC_GAUGE);
  tx = await baseShareRewardPool.add(
    1000,
    AERO_USDbC,
    true,
    startTimeSharepool,
    400,
    true,
    AERO_USDbC_GAUGE
  );
  receipt = await tx.wait();

  console.log("\nAERO_USDbC pool added pid 3 LP address = ", AERO_USDbC, "\ngauge", true, " gauge address = ", AERO_USDbC_GAUGE);

  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);

  tx = await baseRate.setLP(BRATE_ETH_LP, true);
  receipt = await tx.wait();
  console.log("BRATE_ETH_LP added as LP");
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

  tx = await presaleDistributor.updateAllUsers();
  const values = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values);
  receipt = await tx.wait();

  console.log(
    "BRATE Balance:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log(
    "BSHARE Balance:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
};


const main = async () => {
  await setAddresses();
  await deployContracts();
  await mintInitialSupplyAndCreatePools();
  await deployOracle();
  await initializeBoardroom();
  await initializeTreasury();
  await setParameters();
  await setOperators();
  await setRewardPoolAndInitialize();
  await stakeBSHAREINBoardroom();
  // await sendBRATEAndBSHAREToPresaleDistributor();

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
