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
const REF = "0x3B12aA296Fa88d6CBA494e900EEFe1B85fDA507A";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
const USDbC = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";
const team1 = process.env.team1;
const team2 = process.env.team2;
const team3 = process.env.team3;
const team4 = process.env.team4;


const WETH_USDbCContract = new ethers.Contract(WETH_USDbC, ERC20ABI, provider);
const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const AEROCContract = new ethers.Contract(AERO, ERC20ABI, provider);
const AddressDead = "0x000000000000000000000000000000000000dead";
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

// const startTime = 1687219200; //2023-06-20 at 00:00 UTC TO CHECK
const startTime = Math.floor(Date.now() / 1000); //Now + 20 seconds

const supplyBRATEETH = utils.parseEther("25");
const supplyBSHAREETH = utils.parseEther("20");
const ETH_TEST = utils.parseEther("1");
const ETHforBRATELiquidity = utils.parseEther("25");
const ETHforBSHARELiquidity = utils.parseEther("25");
const supplyBRATEForPresale = utils.parseEther("33.825");
const supplyBSHAREForPresale = utils.parseEther("27.497799");

// const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
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
    buyer1 = await ethers.getImpersonatedSigner(
      "0xf6e9b43969f52021bC920c635df3933bC01aB52c"
    );
    buyer2 = await ethers.getImpersonatedSigner(
      "0x53d6A63aB7E69b71a63bA418B8aa749945fba02F"
    );
    buyer3 = await ethers.getImpersonatedSigner(
      "0xdEA5a01D11594823FA0C71F200364e2bc124992f"
    );

  console.log(`Deployer: ${deployer.address}`);
  console.log(`oldDevWallet: ${oldDevWallet.address}`);
  await setBalance(deployer.address, utils.parseEther("1000000000"));
  await setBalance(oldDevWallet.address, utils.parseEther("1000000000"));
  await setBalance(buyer1.address, utils.parseEther("1000000000"));
  await setBalance(buyer2.address, utils.parseEther("1000000000"));
  await setBalance(buyer3.address, utils.parseEther("1000000000"));
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
    startTime
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
    startTime,
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

const viewOracle = async () => {
  console.log("\n*** VIEWING ORACLE ***");
  const pegPrice = await treasury.baseRatePriceOne();
  const twap = await treasury.getBaseRateUpdatedPrice();
  const consult = await treasury.getBaseRatePrice();
  console.log("twap = ", twap);
  console.log("consult = ", consult);
  console.log("pegPrice = ", pegPrice);
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

const mintInitialSupplyAndAddLiquidity = async () => {
  console.log("\n*** MINTING INITIAL SUPPLY ***");
  console.log(
    "BRATE Balance:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

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

  console.log("pools created");

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
  tx = await baseRate.approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await baseShare.approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(deployer).addLiquidityETH(
    baseShare.address,
    false,
    supplyBSHAREETH,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETHforBSHARELiquidity }
  );

  tx = await AerodromeRouterContract.connect(deployer).addLiquidityETH(
    baseRate.address,
    true,
    supplyBRATEETH,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETHforBRATELiquidity }
  );

  tx = await baseRate.setLP(BRATE_ETH_LP, true);
  receipt = await tx.wait();
  tx = await baseShare.setLP(BSHARE_ETH_LP, true);
  receipt = await tx.wait();
  console.log("is LP ", await baseShare.isLP(BSHARE_ETH_LP));

  tx = await baseShare.setLP(BSHARE_ETH_LP, true);
  receipt = await tx.wait();

  console.log("is LP ", await baseShare.isLP(BSHARE_ETH_LP));
  
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
  // tx = await teamDistributor.sendCustomTransaction(
  //   baseShare.address,
  //   0,
  //   "setTreasuryFund(address)",
  //   utils.defaultAbiCoder.encode(["address"], [communityFund.address])
  // );
  // receipt = await tx.wait();
  // console.log("Community Fund:", await baseShare.communityFund());

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
    startTime,
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
    startTime,
    0,
    0,
    zero
  );
  receipt = await tx.wait();
  console.log("\nBSHARE_ETH_LP added");

  tx = await baseShareRewardPool.add(
    500,
    WETH_USDbC,
    true,
    startTime,
    300,
    300,
    WETH_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nWETH_USDbC added");

  tx = await baseShareRewardPool.add(
    500,
    AERO_USDbC,
    true,
    startTime,
    200,
    200,
    AERO_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nAERO_USDbC added");

  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);
};


const stakeInSharePoolOldDev = async () => {
  console.log("\n*** STAKING IN SHAREPOOL OLD DEV ***");
  let LPbalance = await WETH_USDbCContract.balanceOf(oldDevWallet.address);
  console.log(" WETH_USDbC LP balance before ", LPbalance);
  tx = await WETH_USDbCContract.connect(oldDevWallet).approve(
    baseShareRewardPool.address,
    ethers.constants.MaxUint256
  );
  tx = await baseShareRewardPool.connect(oldDevWallet).deposit(2, LPbalance, REF);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(oldDevWallet.address);
  console.log(" WETH_USDbC LP ", LPbalanceAfter);
};

const stakeInSharePool = async () => {
  console.log("\n*** STAKING IN SHAREPOOL ***");
  let LPbalance = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(" WETH_USDbC LP balance before ", LPbalance);
  tx = await WETH_USDbCContract.connect(deployer).approve(
    baseShareRewardPool.address,
    ethers.constants.MaxUint256
  );
  
  tx = await baseShareRewardPool.deposit(2, LPbalance, REF);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(" WETH_USDbC LP ", LPbalanceAfter);

  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  const BRATE_ETH_LP_Contract = new ethers.Contract(BRATE_ETH_LP, ERC20ABI, provider);



  let LPbalance1 = await BRATE_ETH_LP_Contract.balanceOf(deployer.address);
  console.log(" BRATE_ETHLP balance before ", LPbalance1);
  tx = await BRATE_ETH_LP_Contract.connect(deployer).approve(
    baseShareRewardPool.address,
    ethers.constants.MaxUint256
  );
  
  tx = await baseShareRewardPool.deposit(0, LPbalance1, REF);
  receipt = await tx.wait();

  let LPbalanceAfter1 = await BRATE_ETH_LP_Contract.balanceOf(deployer.address);
  console.log(" BRATE_ETH LP ", LPbalanceAfter1);
};


const unStakeInSharePoolOldDev = async () => {
  console.log("\n*** UNSTAKING IN SHAREPOOL ***");
  let LPbalance = await WETH_USDbCContract.balanceOf(oldDevWallet.address);
  console.log(" WETH_USDbC LP balance before ", LPbalance);

  let lpBalanceForPool = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log("GLOBAL LP Balance for Pool ID 2 before: ", lpBalanceForPool);

  let userInfoForDeployer = await baseShareRewardPool.userInfo(
    2,
    oldDevWallet.address
  );
  let amount = userInfoForDeployer.amount;
  console.log("user Staked before", amount);

  tx = await baseShareRewardPool.connect(oldDevWallet).withdraw(2, amount);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(oldDevWallet.address);
  console.log(" WETH_USDbC LP ", LPbalanceAfter);

  let userInfoForDeployerAfter = await baseShareRewardPool.userInfo(
    2,
    oldDevWallet.address
  );
  let amountAfter = userInfoForDeployerAfter.amount;
  console.log("user Staked after", amountAfter);

  let lpBalanceForPoolAfter = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log(
    "GLOBAL LP Balance for Pool ID 2 after: ",
    lpBalanceForPoolAfter
  );
}

const unStakeInSharePool = async () => {
  console.log("\n*** UNSTAKING IN SHAREPOOL ***");
  let LPbalance = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(" WETH_USDbC LP balance before ", LPbalance);

  let lpBalanceForPool = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log("GLOBAL LP Balance for Pool ID 2 before: ", lpBalanceForPool);

  let userInfoForDeployer = await baseShareRewardPool.userInfo(
    2,
    deployer.address
  );
  let amount = userInfoForDeployer.amount;
  console.log("user Staked before", amount);

  tx = await baseShareRewardPool.withdraw(2, amount);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(" WETH_USDbC LP ", LPbalanceAfter);

  let userInfoForDeployerAfter = await baseShareRewardPool.userInfo(
    2,
    deployer.address
  );
  let amountAfter = userInfoForDeployerAfter.amount;
  console.log("user Staked after", amountAfter);

  let lpBalanceForPoolAfter = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log(
    "GLOBAL LP Balance for Pool ID 2 after: ",
    lpBalanceForPoolAfter
  );


  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  const BRATE_ETH_LP_Contract = new ethers.Contract(BRATE_ETH_LP, ERC20ABI, provider);



  let LPbalance1 = await BRATE_ETH_LP_Contract.balanceOf(deployer.address);
  console.log(" BRATE_ETH LP balance before ", LPbalance1);

  let lpBalanceForPool1 = (await baseShareRewardPool.poolInfo(0)).lpBalance;
  console.log("GLOBAL LP Balance for Pool ID 0 before: ", lpBalanceForPool1);

  let userInfoForDeployer1 = await baseShareRewardPool.userInfo(
    0,
    deployer.address
  );
  let amount1 = userInfoForDeployer1.amount;
  console.log("user Staked before", amount1);

  tx = await baseShareRewardPool.withdraw(0, amount1);
  receipt = await tx.wait();

  let LPbalanceAfter1 = await BRATE_ETH_LP_Contract.balanceOf(deployer.address);
  console.log(" WETH_USDbC LP ", LPbalanceAfter1);

  let userInfoForDeployerAfter1 = await baseShareRewardPool.userInfo(
    2,
    deployer.address
  );
  let amountAfter1 = userInfoForDeployerAfter1.amount;
  console.log("user Staked after", amountAfter1);

  let lpBalanceForPoolAfter1 = (await baseShareRewardPool.poolInfo(0)).lpBalance;
  console.log(
    "GLOBAL LP Balance for Pool ID 0 before: ",
    lpBalanceForPoolAfter1
  );

};

const collectExternalReward = async () => {
  console.log("\n*** GETTING AERO FROM SHAREPOOL ***");
  let Aerobalance = await AEROCContract.balanceOf(communityFund.address);
  console.log(" AERO balance in communityFun before ", Aerobalance);

  tx = await baseShareRewardPool.getExternalReward(2);
  receipt = await tx.wait();

  let AerobalanceAfter = await AEROCContract.balanceOf(communityFund.address);
  console.log(" AERO balance in communityFund after ", AerobalanceAfter);
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

const createRoute = (from, to, stable, factory) => {
  return {
    from,
    to,
    stable,
    factory,
  };
};


const buyAERO_USDbColdDev = async (amount) => {
  console.log("\n*** BUYING OLD DEV AERO AND USDbC ***");
  const AERORoute = createRoute(WETH, AERO, false, AerodromeFactory);
  const USDbCRoute = createRoute(WETH, USDbC, false, AerodromeFactory);

  try {
    const tx0 = await AerodromeRouterContract.connect(
      oldDevWallet
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [AERORoute],
      oldDevWallet.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx0.wait();
    const tx1 = await AerodromeRouterContract.connect(
      oldDevWallet
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [USDbCRoute],
      oldDevWallet.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx1.wait();
    console.log(
      "AERO Balance Deployer after:",
      utils.formatEther(await AEROCContract.balanceOf(oldDevWallet.address))
    );
    console.log(
      "USDbC Balance Deployer after:",
      utils.formatEther(await USDbCContract.balanceOf(oldDevWallet.address))
    );
  } catch (error) {
    console.error("Error in buy Tokens:", error);
  }
};


const buyAERO_USDbC = async (amount) => {
  console.log("\n*** BUYING AERO AND USDbC ***");
  const AERORoute = createRoute(WETH, AERO, false, AerodromeFactory);
  const USDbCRoute = createRoute(WETH, USDbC, false, AerodromeFactory);

  try {
    const tx0 = await AerodromeRouterContract.connect(
      deployer
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [AERORoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx0.wait();
    const tx1 = await AerodromeRouterContract.connect(
      deployer
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [USDbCRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx1.wait();
    console.log(
      "AERO Balance Deployer after:",
      utils.formatEther(await AEROCContract.balanceOf(deployer.address))
    );
    console.log(
      "USDbC Balance Deployer after:",
      utils.formatEther(await USDbCContract.balanceOf(deployer.address))
    );
  } catch (error) {
    console.error("Error in buy Tokens:", error);
  }
};

const disableTax = async () => {
  console.log("\n*** TAX DISABLED ***");
  console.log("Tax before ", await baseRate.taxRate());

  tx = await baseRate.disableAutoCalculateTax();
  receipt = await tx.wait();
  tx = await baseRate.setTaxRate(0);
  receipt = await tx.wait();

  console.log("Tax after ", await baseRate.taxRate());
};

const enableTax = async () => {
  console.log("\n*** TAX ENABLED ***");
  console.log("Tax before ", await baseRate.taxRate());
  tx = await baseRate.setTaxRate(250);
  receipt = await tx.wait();
  tx = await baseRate.enableAutoCalculateTax();
  receipt = await tx.wait();
  console.log("Tax after ", await baseRate.taxRate());
};

const AddLiquidityEthUSDC = async () => {
  console.log("\n*** ADDING LIQUIDITY ETH USDC ***");
  let balanceUSDC = await USDbCContract.balanceOf(deployer.address);
  console.log("balanceUSDC ", balanceUSDC);
  tx = await USDbCContract.connect(deployer).approve(
    AerodromeRouter,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(deployer).addLiquidityETH(
    USDbC,
    false,
    balanceUSDC,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETH_TEST }
  );
  let LPbalance = await WETH_USDbCContract.balanceOf(deployer.address);

  console.log(" WETH_USDbC LP ", LPbalance);
};



const AddLiquidityEthUSDColdDeployer = async () => {
  console.log("\n*** ADDING LIQUIDITY OLD DEV ETH USDC ***");
  let balanceUSDC = await USDbCContract.balanceOf(oldDevWallet.address);
  console.log("balanceUSDC ", balanceUSDC);
  tx = await USDbCContract.connect(oldDevWallet).approve(
    AerodromeRouter,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(oldDevWallet).addLiquidityETH(
    USDbC,
    false,
    balanceUSDC,
    0,
    0,
    oldDevWallet.address,
    Math.floor(Date.now() / 1000 + 86400),
    { value: ETH_TEST }
  );
  let LPbalance = await WETH_USDbCContract.balanceOf(oldDevWallet.address);

  console.log(" WETH_USDbC LP ", LPbalance);
  console.log(" ETH_TEST ", ETH_TEST);
  let balanceUSDC1 = await USDbCContract.balanceOf(oldDevWallet.address);
  console.log("balanceUSDC ", balanceUSDC1);
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




const claimPresaleDistributor = async (signer, buyer) => {
  try {
  console.log("\n*** CLAIMING PRATE AND PSHARE FROM PRESALE DISTRIBUTOR ***");
  const valueUser = await presaleDistributor.users(signer.address);
  console.log("user presale values",buyer," ", valueUser);

  console.log(
    "BRATE Balance signer:", buyer,
    utils.formatEther(await baseRate.balanceOf(signer.address))
  );
  console.log(
    "BSHARE Balance signer:", buyer,
    utils.formatEther(await baseShare.balanceOf(signer.address))
  );

  tx = await presaleDistributor.connect(signer).Claim();
  await tx.wait();

  receipt = await tx.wait();

  console.log(
    "BRATE Balance presaleDistributor:",
    utils.formatEther(await baseRate.balanceOf(presaleDistributor.address))
  );
  console.log(
    "BSHARE Balance presaleDistributor:",
    utils.formatEther(await baseShare.balanceOf(presaleDistributor.address))
  );

  console.log(
    "BRATE Balance signer:", buyer,
    utils.formatEther(await baseRate.balanceOf(signer.address))
  );
  console.log(
    "BSHARE Balance signer:", buyer,
    utils.formatEther(await baseShare.balanceOf(signer.address))
  );

  // const values = await presaleDistributor.getTotalValues();
  // console.log("summed presale values", values);
  receipt = await tx.wait();

  } catch (error) {
    console.error("Error in claim :", error);
  }
  };

  const claimTest = async (Iterations) => {
    try {
    

      const numOfIterationsClaim = Iterations;

      for (let i = 0; i < numOfIterationsClaim; i++) {
        await time.increase(21600);
        await claimPresaleDistributor(buyer1,"buyer 1");
        await claimPresaleDistributor(buyer2,"buyer 2");
        await claimPresaleDistributor(buyer3,"buyer 3");
      }
    
  
    } catch (error) {
      console.error("Error in claim :", error);
    }
    };




const buyBSHARE = async (amount, caller) => {
  console.log("\n*** BUYING BSHARE ***");
  console.log("Tax ", await baseShare.taxRate());

  const baseRateRoute = createRoute(
    WETH,
    baseRate.address,
    true,
    AerodromeFactory
  );
  const baseShareRoute = createRoute(
    WETH,
    baseShare.address,
    false,
    AerodromeFactory
  );
  try {
    console.log(
      "BSHARE Balance before:",
      utils.formatEther(await baseShare.balanceOf(caller.address))
    );

    const tx2 = await AerodromeRouterContract.connect(
      caller
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseShareRoute],
      caller.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx2.wait();

    console.log(
      "BSHARE Balance after:",
      utils.formatEther(await baseShare.balanceOf(caller.address))
    );

  } catch (error) {
    console.error("Error in sellBSHARE:", error);
  }
};

const buyBRATE = async (amount) => {
  console.log("\n*** BUYING BRATE ***");
  console.log("Tax ", await baseRate.taxRate());

  const baseRateRoute = createRoute(
    WETH,
    baseRate.address,
    true,
    AerodromeFactory
  );

  try {
    const BalanceBefore = utils.formatEther(
      await baseRate.balanceOf(oldDevWallet.address)
    );

    const totalSupplyBefore = utils.formatEther(
      await baseRate.totalSupply()
    );
    console.log("BRATE totalSupply before:", totalSupplyBefore);

    console.log("BRATE Balance before:", BalanceBefore);
    const tx = await AerodromeRouterContract.connect(
      oldDevWallet
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseRateRoute],
      oldDevWallet.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();

    const BalanceAfter = utils.formatEther(
      await baseRate.balanceOf(oldDevWallet.address)
    );
    const totalSupplyAfter = utils.formatEther(
      await baseRate.totalSupply()
    );
    console.log("BRATE totalSupply after:", totalSupplyAfter);
    console.log("BRATE Balance after:", BalanceAfter);
    console.log("BRATE Balance bought:", BalanceAfter - BalanceBefore);
  } catch (error) {
    console.error("Error in sellBSHARE:", error);
  }
};

const sellBRATE = async (amount, caller) => {
  console.log("\n*** SELLING BRATE ***");

  console.log("Tax ", await baseRate.taxRate());

  tx = await baseRate
    .connect(caller)
    .approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();

  const baseRateRoute = createRoute(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );
  try {
    const BalanceBefore = utils.formatEther(
      await baseRate.balanceOf(caller.address)
    );
    const totalSupplyBefore = utils.formatEther(
      await baseRate.totalSupply()
    );
    console.log("BRATE totalSupply before:", totalSupplyBefore);
    console.log("BRATE Balance before:", BalanceBefore);
    const tx = await AerodromeRouterContract.connect(
      caller
    ).swapExactTokensForETHSupportingFeeOnTransferTokens(
      utils.parseEther(amount.toString()),
      0,
      [baseRateRoute],
      caller.address,
      Math.floor(Date.now() / 1000) + 24 * 86400
    );
    await tx.wait();
    const BalanceAfter = utils.formatEther(
      await baseRate.balanceOf(caller.address)
    );
    const totalSupplyAfter = utils.formatEther(
      await baseRate.totalSupply()
    );
    console.log("BRATE totalSupply after:", totalSupplyAfter);
    console.log("BRATE Balance after:", BalanceAfter);
    console.log("BRATE Balance sold:", BalanceBefore - BalanceAfter);
  } catch (error) {
    console.error("Error in sellBRATE:", error);
  }
};

const sellBSHARE = async (amount, caller) => {
  console.log("\n*** SELLING BSHARE ***");

  console.log("Tax ", await baseShare.taxRate());

  tx = await baseShare.approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();

  const baseShareRoute = createRoute(
    baseShare.address,
    WETH,
    false,
    AerodromeFactory
  );
  try {
    console.log(
      "BSHARE Balance before:",
      utils.formatEther(await baseShare.balanceOf(caller.address))
    );

    const tx2 = await AerodromeRouterContract.connect(
      caller
    ).swapExactTokensForETHSupportingFeeOnTransferTokens(
      utils.parseEther(amount.toString()),
      0,
      [baseShareRoute],
      caller.address,
      Math.floor(Date.now() / 1000) + 24 * 86400
    );
    await tx2.wait();

    console.log(
      "BSHARE Balance after:",
      utils.formatEther(await baseShare.balanceOf(caller.address))
    );
  } catch (error) {
    console.error("Error in buyBRATEBSHARE:", error);
  }
};

const buyBonds = async (signer) => {
  console.log("\n*** BUYING BONDS ***");
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  const Price = await treasury.getBaseRatePrice();
  tx = await baseRate
    .connect(signer)
    .approve(treasury.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await treasury.connect(signer).buyBonds(utils.parseEther("0.1"), Price);
  receipt = await tx.wait();

  console.log(
    "PBOND Balance After:",
    utils.formatEther(await baseBond.balanceOf(signer.address))
  );
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
};

const redeemBonds = async (signer) => {
  console.log("\n*** Redeeming BONDS ***");
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "PBOND Balance Before:",
    utils.formatEther(await baseBond.balanceOf(signer.address))
  );
  const bonds = await baseBond.balanceOf(signer.address);
  const Price = await treasury.getBaseRatePrice();
  tx = await baseBond
    .connect(signer)
    .approve(treasury.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await treasury.connect(signer).redeemBonds(bonds, Price);
  receipt = await tx.wait();

  console.log(
    "PBOND Balance After:",
    utils.formatEther(await baseBond.balanceOf(signer.address))
  );
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
};

const mintBrate = async (signer) => {
  console.log("Minting for test");
  tx = await baseRate.transferOperator(deployer.address);
  receipt = await tx.wait();

  tx = await baseRate.mint(deployer.address, supplyBRATEForPresale);
  receipt = await tx.wait();

  tx = await baseRate.transferOperator(treasury.address);
  receipt = await tx.wait();
};

const mintShare = async (signer) => {
  console.log("Minting for test");
  tx = await baseShare.setOperator(deployer.address);
  receipt = await tx.wait();

  tx = await baseShare.mint(deployer.address, supplyBRATEForPresale);
  receipt = await tx.wait();
};

const testBonds = async (caller) => {
  console.log("\n*** TESTING BONDS***");

  const numOfIterationsSell = 48;

  for (let i = 0; i < numOfIterationsSell; i++) {
    await time.increase(21600);
    await sellBRATE(0.3,caller);
    await allocateSeigniorage();
    await viewOracle();
  }

  await buyBonds(deployer);

  const numOfIterationsSell_ = 48;

  for (let i = 0; i < numOfIterationsSell_; i++) {
    await time.increase(21600);
    await buyBRATE(0.45,caller);
    await allocateSeigniorage();
    await viewOracle();
  }
  const numOfIterationsAll_ = (numOfIterationsSell * 1800) / 21600;
  for (let i = 0; i < numOfIterationsAll_; i++) {
  }
  await redeemBonds(deployer);
};



const testAllocate = async (caller) => {
  console.log("\n*** TESTING BONDS***");

  // const numOfIterationsSell = 2;

  // for (let i = 0; i < numOfIterationsSell; i++) {
  //   await time.increase(21600);
  //   await sellBRATE(0.3,caller);
  //   await allocateSeigniorage();
  //   await viewOracle();
  // }

  const numOfIterationsSell_ = 20;

  for (let i = 0; i < numOfIterationsSell_; i++) {
    await time.increase(21600);
    await buyBRATE(1,caller);
    await allocateSeigniorage();
    await viewOracle();
  }
  const numOfIterationsAll_ = (numOfIterationsSell * 1800) / 21600;
  for (let i = 0; i < numOfIterationsAll_; i++) {
  }
};

const setTeamAddresses = async () => {
  console.log("\n*** SETTING TEAM ADDRESSES ***");
  await teamDistributor.setCaller(deployer.address);
  await teamDistributor.setTeam([team1, team2, team3, team4]);
  console.log("Team addresses have been set!");
};

const getTotalSupply = async () => {
  console.log("\n*** TOTAL SUPPLY ***");
  const totalSupplyRate = utils.formatEther(
    await baseRate.totalSupply()
  );
  console.log("BRATE totalSupply:", totalSupplyRate);


  const totalSupplyShare = utils.formatEther(
    await baseShare.totalSupply()
  );
  console.log("BSHARE totalSupply:", totalSupplyShare);
  
};


const getBalance = async () => {
  console.log("\n*** Balance of ***");
  const balanceRate = utils.formatEther(
    await baseRate.balanceOf(deployer.address)
  );
  console.log("BRATE balanceOf:", balanceRate);


  const balanceShare = utils.formatEther(
    await baseShare.balanceOf(deployer.address)
  );
  console.log("BSHARE balanceOf:", balanceShare);
  
};




const distibrute = async () => {
  console.log("\n*** DISTRIBUTING ***");
  await teamDistributor.automatedDistribution();

  console.log(
    "BRATE Balance team1:",
    utils.formatEther(await baseRate.balanceOf(team1))
  );
  console.log(
    'PSHARE Balance team1:',
    utils.formatEther(await baseShare.balanceOf(team1))
  );

  console.log(
    "BRATE Balance team2:",
    utils.formatEther(await baseRate.balanceOf(team2))
  );
  console.log(
    'PSHARE Balance team2:',
    utils.formatEther(await baseShare.balanceOf(team2))
  );

  console.log(
    "BRATE Balance team3:",
    utils.formatEther(await baseRate.balanceOf(team3))
  );
  console.log(
    'PSHARE Balance team3:',
    utils.formatEther(await baseShare.balanceOf(team3))
  );

  console.log(
    "BRATE Balance team4:",
    utils.formatEther(await baseRate.balanceOf(team4))
  );
  console.log(
    'PSHARE Balance team4:',
    utils.formatEther(await baseShare.balanceOf(team4))
  );

};

const main = async () => {
  await setAddresses();
  await withdrawFromPresale();
  await deployContracts();
  await mintInitialSupplyAndAddLiquidity();
  await deployOracle();
  await initializeBoardroom();
  await initializeTreasury();
  await setParameters();
  await setOperators();

  await setRewardPool();
  await stakeBSHAREINBoardroom();
  await mintBrate();
  await mintShare();
  await testTransferFee();
  await testTransferFeeShare();

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




const testTransferFeeShare = async () => {
  console.log("\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS ***");

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance AddressDead Before:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );
  const tx0 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx0.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx1 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx1.wait();
  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance AddressDead after:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );


  console.log("\n*** TRANSFER_FROM WITHOUT FEE 1 ETH TO DEAD ADDRESS ***");
  tx = await baseShare.disableAutoCalculateTax();
  receipt = await tx.wait();
  tx = await baseShare.setTaxRate(0);
  receipt = await tx.wait();
  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance AddressDead Before:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );
  const tx2 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx2.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx3 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx3.wait();
  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance AddressDead after:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  tx = await baseShare.setTaxRate(1500);
  receipt = await tx.wait();
  tx = await baseShare.enableAutoCalculateTax();
  receipt = await tx.wait();
  tx = await baseShare.excludeAddress(AddressDead);
  receipt = await tx.wait();
  console.log(
    "\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS EXCLUDED ***"
  );
  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance AddressDead Before:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );
  const tx4 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx4.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx5 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx5.wait();

  console.log(
    "BSHARE Balance AddressDead after:",
    utils.formatEther(await baseShare.balanceOf(AddressDead))
  );

  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );

  console.log("\n*** TRANSFER WITH FEE 1 ETH TO BSHARE_ETH_LP ***");
  const BSHARE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseShare.address,
    WETH,
    false,
    AerodromeFactory
  );

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP Before:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  const tx6 = await baseShare
    .connect(deployer)
    .transfer(BSHARE_ETH_LP, utils.parseEther("1"));
  await tx6.wait();
  console.log(
    "BSHARE Balance BSHARE_ETH_LP AFTER:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  console.log(
    "BSHARE Balance Deployer AFTER:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  console.log("\n*** TRANSFER WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseShare.taxRate());

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  console.log(
    "BSHARE Balance Before BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  const tx7 = await baseShare
    .connect(deployer)
    .transfer(BSHARE_ETH_LP, utils.parseEther("1"));
  await tx7.wait();

  console.log(
    "BSHARE Balance AFTER BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  console.log(
    "BSHARE Balance Deployer AFTER:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );



  console.log("\n*** TRANSFER_FROM WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");
  console.log("Tax is ", await baseShare.taxRate());
  console.log("is LP ", await baseShare.isLP(BSHARE_ETH_LP));
  

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP Before:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  const tx8 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx8.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx9 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, BSHARE_ETH_LP, utils.parseEther("1"));
  await tx9.wait();
  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP after:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );



  tx = await baseShare.excludeAddress(deployer.address);
  receipt = await tx.wait();


  console.log(
    "is deployer excluded ?:",
    await baseShare.excludedAddresses(deployer.address)
  );

  console.log(
    "is BSHARE_ETH_LP excluded ?:",
    await baseShare.excludedAddresses(BSHARE_ETH_LP)
  );



  console.log("\n*** EXCLUDED FROM TRANSFER WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseShare.taxRate());

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  console.log(
    "BSHARE Balance Before BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  const tx10 = await baseShare
    .connect(deployer)
    .transfer(BSHARE_ETH_LP, utils.parseEther("1"));
  await tx10.wait();

  console.log(
    "BSHARE Balance AFTER BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  console.log(
    "BSHARE Balance Deployer AFTER:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );




  console.log("\n*** EXCLUDED FROM TRANSFER_FROM WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP Before:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  const tx11 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx11.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx12 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, BSHARE_ETH_LP, utils.parseEther("1"));
  await tx12.wait();
  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP after:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );




  tx = await baseShare.includeAddress(deployer.address);
  receipt = await tx.wait();


  console.log(
    "is deployer excluded ?:",
    await baseShare.excludedAddresses(deployer.address)
  );

  tx = await baseShare.excludeAddress(BSHARE_ETH_LP);
  receipt = await tx.wait();

  console.log(
    "is BSHARE_ETH_LP excluded ?:",
    await baseShare.excludedAddresses(BSHARE_ETH_LP)
  );



  console.log("\n*** EXCLUDED TO TRANSFER WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseShare.taxRate());

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  console.log(
    "BSHARE Balance Before BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  const tx13 = await baseShare
    .connect(deployer)
    .transfer(BSHARE_ETH_LP, utils.parseEther("1"));
  await tx13.wait();

  console.log(
    "BSHARE Balance AFTER BSHARE_ETH_LP:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );

  console.log(
    "BSHARE Balance Deployer AFTER:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );

  console.log("\n*** EXCLUDED TO TRANSFER_FROM WITH FEE 1 ETH TO BSHARE_ETH_LP ADDRESS ***");

  console.log(
    "BSHARE Balance Deployer Before:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP Before:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  const tx14 = await baseShare
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx14.wait();
  console.log(
    "BSHARE allowance Before:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
  const tx15 = await baseShare
    .connect(deployer)
    .transferFrom(deployer.address, BSHARE_ETH_LP, utils.parseEther("1"));
  await tx15.wait();
  console.log(
    "BSHARE Balance Deployer after:",
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log(
    "BSHARE Balance BSHARE_ETH_LP after:",
    utils.formatEther(await baseShare.balanceOf(BSHARE_ETH_LP))
  );
  console.log(
    "BSHARE allowance After:",
    utils.formatEther(
      await baseShare.allowance(deployer.address, deployer.address)
    )
  );
};





const testTransferFee = async () => {
  console.log("\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS ***");

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance AddressDead Before:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx0 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx0.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx1 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx1.wait();
  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance AddressDead after:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );


  console.log("\n*** TRANSFER_FROM WITHOUT FEE 1 ETH TO DEAD ADDRESS ***");
  tx = await baseRate.disableAutoCalculateTax();
  receipt = await tx.wait();
  tx = await baseRate.setTaxRate(0);
  receipt = await tx.wait();
  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance AddressDead Before:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx2 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx2.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx3 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx3.wait();
  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance AddressDead after:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  tx = await baseRate.setTaxRate(1500);
  receipt = await tx.wait();
  tx = await baseRate.enableAutoCalculateTax();
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(AddressDead);
  receipt = await tx.wait();
  console.log(
    "\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS EXCLUDED ***"
  );
  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance AddressDead Before:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx4 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx4.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx5 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, AddressDead, utils.parseEther("1"));
  await tx5.wait();

  console.log(
    "BRATE Balance AddressDead after:",
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );

  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );

  console.log("\n*** TRANSFER WITH FEE 1 ETH TO BRATE_ETH_LP ***");
  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP Before:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  const tx6 = await baseRate
    .connect(deployer)
    .transfer(BRATE_ETH_LP, utils.parseEther("1"));
  await tx6.wait();
  console.log(
    "BRATE Balance BRATE_ETH_LP AFTER:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  console.log(
    "BRATE Balance Deployer AFTER:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log("\n*** TRANSFER WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseRate.taxRate());

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log(
    "BRATE Balance Before BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  const tx7 = await baseRate
    .connect(deployer)
    .transfer(BRATE_ETH_LP, utils.parseEther("1"));
  await tx7.wait();

  console.log(
    "BRATE Balance AFTER BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  console.log(
    "BRATE Balance Deployer AFTER:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );



  console.log("\n*** TRANSFER_FROM WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP Before:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  const tx8 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx8.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx9 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, BRATE_ETH_LP, utils.parseEther("1"));
  await tx9.wait();
  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP after:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );



  tx = await baseRate.excludeAddress(deployer.address);
  receipt = await tx.wait();


  console.log(
    "is deployer excluded ?:",
    await baseRate.excludedAddresses(deployer.address)
  );

  console.log(
    "is BRATE_ETH_LP excluded ?:",
    await baseRate.excludedAddresses(BRATE_ETH_LP)
  );



  console.log("\n*** EXCLUDED FROM TRANSFER WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseRate.taxRate());

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log(
    "BRATE Balance Before BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  const tx10 = await baseRate
    .connect(deployer)
    .transfer(BRATE_ETH_LP, utils.parseEther("1"));
  await tx10.wait();

  console.log(
    "BRATE Balance AFTER BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  console.log(
    "BRATE Balance Deployer AFTER:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );




  console.log("\n*** EXCLUDED FROM TRANSFER_FROM WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP Before:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  const tx11 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx11.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx12 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, BRATE_ETH_LP, utils.parseEther("1"));
  await tx12.wait();
  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP after:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );




  tx = await baseRate.includeAddress(deployer.address);
  receipt = await tx.wait();


  console.log(
    "is deployer excluded ?:",
    await baseRate.excludedAddresses(deployer.address)
  );

  tx = await baseRate.excludeAddress(BRATE_ETH_LP);
  receipt = await tx.wait();

  console.log(
    "is BRATE_ETH_LP excluded ?:",
    await baseRate.excludedAddresses(BRATE_ETH_LP)
  );



  console.log("\n*** EXCLUDED TO TRANSFER WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log("Tax is ", await baseRate.taxRate());

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log(
    "BRATE Balance Before BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  const tx13 = await baseRate
    .connect(deployer)
    .transfer(BRATE_ETH_LP, utils.parseEther("1"));
  await tx13.wait();

  console.log(
    "BRATE Balance AFTER BRATE_ETH_LP:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  console.log(
    "BRATE Balance Deployer AFTER:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log("\n*** EXCLUDED TO TRANSFER_FROM WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***");

  console.log(
    "BRATE Balance Deployer Before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP Before:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  const tx14 = await baseRate
    .connect(deployer)
    .approve(deployer.address, utils.parseEther("1"));
  await tx14.wait();
  console.log(
    "BRATE allowance Before:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
  const tx15 = await baseRate
    .connect(deployer)
    .transferFrom(deployer.address, BRATE_ETH_LP, utils.parseEther("1"));
  await tx15.wait();
  console.log(
    "BRATE Balance Deployer after:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    "BRATE Balance BRATE_ETH_LP after:",
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );
  console.log(
    "BRATE allowance After:",
    utils.formatEther(
      await baseRate.allowance(deployer.address, deployer.address)
    )
  );
};