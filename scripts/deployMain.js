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
require("dotenv").config();

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
const sharePerSecond = 0.00011574074 * 1e18;
const Presale = "0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659";
let AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
let AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
const WETH = "0x4200000000000000000000000000000000000006";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const EXTRA = "0x5d166646411D0D0a0a4AC01C4596f8DF2d5C781a";
const EXTRA_SHARE = '500000000000000000';
const EXTRA_RATE = '625000000000000000'; 

const team1 = process.env.team1;
const team2 = process.env.team2;
const team3 = process.env.team3;
const team4 = process.env.team4;
const zero = "0x0000000000000000000000000000000000000000";

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

const startTime = 1695837600; // treasury
const startTimeSharePool = 1695837600; // sharePool and presale
const supplyBRATEForPresale = utils.parseEther("34.45");
const supplyBSHAREForPresale = utils.parseEther("27.997799");
const supplyBRATEETH = utils.parseEther("25");
const supplyBSHAREETH = utils.parseEther("20");
const ETHforBRATELiquidity = utils.parseEther("25");
const ETHforBSHARELiquidity = utils.parseEther("25");


const PresaleContract = new ethers.Contract(Presale, PresaleABI, provider);

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
  console.log(`oldDeployer: ${oldDevWallet.address}`);

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
  tx = await AerodromeFactoryContract.connect(deployer).createPool(
    baseRate.address,
    WETH,
    true
  );
  receipt = await tx.wait();
  tx = await AerodromeFactoryContract.connect(deployer).createPool(
    baseShare.address,
    WETH,
    false
  );
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


const AddLiquidity = async () => {
  console.log("\n*** MINTING INITIAL SUPPLY ***");
  tx = await baseRate.connect(deployer).transfer(
    oldDevWallet.address,
    supplyBRATEETH
  );
  receipt = await tx.wait();

  tx = await baseShare.connect(deployer).transfer(
    oldDevWallet.address,
    supplyBSHAREETH
  );
  receipt = await tx.wait();

  console.log(
    "BRATE Balance:",
    utils.formatEther(await baseRate.balanceOf(oldDevWallet.address))
  );
  console.log(
    "BSHARE Balance:",
    utils.formatEther(await baseShare.balanceOf(oldDevWallet.address))
  );

  // tx = await AerodromeFactoryContract.connect(oldDevWallet).createPool(
  //   baseRate.address,
  //   WETH,
  //   true
  // );
  // receipt = await tx.wait();

  // tx = await AerodromeFactoryContract.connect(oldDevWallet).createPool(
  //   baseShare.address,
  //   WETH,
  //   false
  // );
  // receipt = await tx.wait();

  // console.log("pools created");

  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  brate_eth_lp = new ethers.Contract(BRATE_ETH_LP, PoolABI, provider);

  const BSHARE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseShare.address,
    WETH,
    false,
    AerodromeFactory
  );

  bshare_eth_lp = new ethers.Contract(BSHARE_ETH_LP, PoolABI, provider);

  console.log(" BSHARE_ETH_LP = ", BSHARE_ETH_LP);
  console.log(" BRATE_ETH_LP = ", BRATE_ETH_LP);

  console.log("\n*** ADDING LIQUIDITY ***");
  tx = await baseRate.connect(oldDevWallet).approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await baseShare.connect(oldDevWallet).approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(oldDevWallet).addLiquidityETH(
    baseShare.address,
    false,
    supplyBSHAREETH,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETHforBSHARELiquidity }
  );

  tx = await AerodromeRouterContract.connect(oldDevWallet).addLiquidityETH(
    baseRate.address,
    true,
    supplyBRATEETH,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETHforBRATELiquidity }
  );

  tx = await baseRate.connect(deployer).setLP(BRATE_ETH_LP, true);
  receipt = await tx.wait();
  tx = await baseShare.connect(deployer).setLP(BSHARE_ETH_LP, true);
  console.log();
  receipt = await tx.wait();
  console.log("BRATE_ETH_LP and BSHARE_ETH_LP added as LP");
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
  console.log("\n*** EXCLUDING FROM FEE ***");
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

  tx = await presaleDistributor.updateUsers(0,25);
  receipt = await tx.wait();
  const values0 = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values0);

  tx = await presaleDistributor.updateUsers(25,50);
  receipt = await tx.wait();
  const values1 = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values1);


  tx = await presaleDistributor.updateUsers(50,75);
  receipt = await tx.wait();
  const values2 = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values2);

  tx = await presaleDistributor.updateUsers(75,100);
  receipt = await tx.wait();
  const values3 = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values3);

  tx = await presaleDistributor.updateUsers(100,122);
  receipt = await tx.wait();
  const values4 = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values4);
  
};

const addExtraToPresaleDistributor = async () => {
  console.log("\n*** ADDING EXTRA TO PRESALE DISTRIBUTOR ***");


  tx = await presaleDistributor.updateSingleUserMan(EXTRA,EXTRA_RATE,EXTRA_SHARE);
  receipt = await tx.wait();

  const extraValues = await presaleDistributor.users(EXTRA);
  console.log("extra presale values", extraValues);

  const values = await presaleDistributor.getTotalValues();
  console.log("summed presale values", values);

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
    presaleContractBalance
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
};



const setTeamAddresses = async () => {
  console.log("\n*** SETTING TEAM ADDRESSES ***");
  await teamDistributor.setCaller(deployer.address);
  await teamDistributor.setTeam([team1, team2, team3, team4]);
  console.log("Team addresses have been set!");
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const allocateSeigniorage = async () => {
  console.log("\n*** ALLOCATING SEIGNORAGE ***");
  console.log(
    "BRATE Balance TeamDistributor Before:",
    utils.formatEther(await baseRate.balanceOf(teamDistributor.address))
  );
  console.log(
    "BRATE Balance Community Fund Before:",
    utils.formatEther(await baseRate.balanceOf(communityFund.address))
  );
  console.log(
    "BRATE Balance Boardroom Before:",
    utils.formatEther(await baseRate.balanceOf(boardroom.address))
  );
  tx = await treasury.allocateSeigniorage();
  receipt = await tx.wait();
  console.log(
    "BRATE Balance TeamDistributor After:",
    utils.formatEther(await baseRate.balanceOf(teamDistributor.address))
  );
  console.log(
    "BRATE Balance Community Fund After:",
    utils.formatEther(await baseRate.balanceOf(communityFund.address))
  );
  console.log(
    "BRATE Balance Boardroom After:",
    utils.formatEther(await baseRate.balanceOf(boardroom.address))
  );
};


const main = async () => {
  await setAddresses();
  await deployContracts();
  await setTeamAddresses();
  await initializeBoardroom();
  await initializeTreasury();
  await setParameters();
  
  await withdrawFromPresale();
  await AddLiquidity();

  await setOperators();
  await setRewardPool();
  await stakeBSHAREINBoardroom();
  await sendBRATEAndBSHAREToPresaleDistributor();
  await addExtraToPresaleDistributor();
  await time.increase(32 * 3600);
  // await delay(5 * 60 * 1000);
  await allocateSeigniorage();


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
