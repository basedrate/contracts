const { ethers } = require("hardhat");
const {
  setBalance,
  time,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("../scripts/RouterABI.json");
const FactoryABI = require("../scripts/factoryABI.json");
const ERC20ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
const PoolABI =
  require("../artifacts/contracts/aerodrome/Pool.sol/Pool.json").abi;
const VoterABI =
  require("../artifacts/contracts/aerodrome/Voter.sol/Voter.json").abi;
const GaugeABI =
  require("../artifacts/contracts/aerodrome/gauges/Gauge.sol/Gauge.json").abi;
const utils = ethers.utils;
const provider = ethers.provider;
require("dotenv").config();

let tx, receipt; //transactions
let deployer, oldDevWallet; //wallets
let baseRate,
  baseShare,
  baseBond,
  teamDistributor,
  communityFund,
  baseShareRewardPool; //contracts

let AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
let AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
let AerodromeVoter = "0x16613524e02ad97edfef371bc883f2f5d6c480a5";
const WETH = "0x4200000000000000000000000000000000000006";
const REF = "0x3B12aA296Fa88d6CBA494e900EEFe1B85fDA507A";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
const USDbC = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";

const AERO_USDbCContract = new ethers.Contract(AERO_USDbC, PoolABI, provider);
const WETH_USDbCContract = new ethers.Contract(WETH_USDbC, PoolABI, provider);
const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const AEROContract = new ethers.Contract(AERO, ERC20ABI, provider);
const AddressDead = "0x000000000000000000000000000000000000dead";

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
let AerodromeVoterContract = new ethers.Contract(
  AerodromeVoter,
  VoterABI,
  provider
);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  [deployer, oldDevWallet] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`oldDevWallet: ${oldDevWallet.address}`);
  await setBalance(deployer.address, utils.parseEther("1000000000"));
  await setBalance(oldDevWallet.address, utils.parseEther("1000000000"));
};

const deployContracts = async () => {
  console.log("\n*** DEPLOYING CONTRACTS ***");
  const BaseRate = await ethers.getContractFactory("BaseRate", deployer);
  baseRate = await BaseRate.deploy();
  await baseRate.deployed();
  console.log(`BaseRate deployed to ${baseRate.address}`);
  const BaseShare = await ethers.getContractFactory("BaseShare", deployer);
  baseShare = await BaseShare.deploy(baseRate.address);
  await baseShare.deployed();
  console.log(`BaseShare deployed to ${baseShare.address}`);

  const CommunityFund = await ethers.getContractFactory(
    "CommunityFund",
    deployer
  );
  communityFund = await CommunityFund.deploy();
  await communityFund.deployed();
  console.log(`CommunityFund deployed to ${communityFund.address}`);
  const TeamDistributor = await ethers.getContractFactory(
    "TeamDistributor",
    deployer
  );
  teamDistributor = await TeamDistributor.deploy();
  await teamDistributor.deployed();
  console.log(`TeamDistributor deployed to ${teamDistributor.address}`);
  const BaseShareRewardPool = await ethers.getContractFactory(
    "BaseShareRewardPool",
    deployer
  );
  const now = (await provider.getBlock()).timestamp;
  baseShareRewardPool = await BaseShareRewardPool.deploy(
    baseShare.address,
    communityFund.address,
    teamDistributor.address,
    1000,
    1000,
    utils.parseEther("0.00011574074"),
    now + 10
  );
  await baseShareRewardPool.deployed();
  console.log(`BaseShareRewardPool deployed to ${baseShareRewardPool.address}`);

  console.log("\n*** SETTING MASTERCHEF AS BSHARE OPERATOR ***");
  tx = await baseShare.setOperator(baseShareRewardPool.address);
  receipt = await tx.wait();
};

const addPool = async () => {
  console.log("\n*** ADDING POOL ***");
  const AERO_USDbC_LP = await AerodromeRouterContract.poolFor(
    AERO,
    USDbC,
    false,
    AerodromeFactory
  );
  const AERO_USDbCGauge = await AerodromeVoterContract.gauges(AERO_USDbC_LP);
  const now = (await provider.getBlock()).timestamp;
  tx = await baseShareRewardPool.add(
    1000,
    AERO_USDbC_LP,
    true,
    now,
    200,
    200,
    ethers.constants.AddressZero
    // AERO_USDbCGauge
  );
  receipt = await tx.wait();
};

const stakeInSharePool = async (signer) => {
  console.log("\n*** STAKING IN SHAREPOOL ***");
  let LPbalance = await AERO_USDbCContract.balanceOf(signer.address);
  console.log("AERO_USDbC LP balance before ", LPbalance);
  tx = await AERO_USDbCContract.connect(signer).approve(
    baseShareRewardPool.address,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await baseShareRewardPool.deposit(0, LPbalance, REF);
  receipt = await tx.wait();

  let LPbalanceAfter = await AERO_USDbCContract.balanceOf(signer.address);
  console.log("AERO_USDbC LP balance after", LPbalanceAfter);
};

const claimSharePool = async (signer) => {
  console.log("\n*** CLAIMING SHAREPOOL ***");
  tx = await baseShareRewardPool.connect(signer).deposit(0, 0, REF);
  // tx = await baseShareRewardPool.withdraw(0,0);
  receipt = await tx.wait();
};

const stakeInGauge = async (signer) => {
  console.log("\n*** STAKING IN GAUGE ***");
  let LPbalance = await AERO_USDbCContract.balanceOf(signer.address);
  console.log("AERO_USDbC LP balance before ", LPbalance);
  const AERO_USDbC_LP = await AerodromeRouterContract.poolFor(
    AERO,
    USDbC,
    false,
    AerodromeFactory
  );
  const AERO_USDbCGauge = await AerodromeVoterContract.gauges(AERO_USDbC_LP);
  const AERO_USDbCGaugeContract = new ethers.Contract(
    AERO_USDbCGauge,
    GaugeABI,
    provider
  );
  tx = await AERO_USDbCContract.connect(signer).approve(
    AERO_USDbCGauge,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AERO_USDbCGaugeContract.connect(signer)["deposit(uint256)"](
    LPbalance
  );
  receipt = await tx.wait();

  let LPbalanceAfter = await AERO_USDbCContract.balanceOf(signer.address);
  console.log("AERO_USDbC LP ", LPbalanceAfter);

  return AERO_USDbCGauge;
};

const unstakeFromGauge = async (signer) => {
  console.log("\n*** UNSTAKING FROM GAUGE ***");
  const AERO_USDbC_LP = await AerodromeRouterContract.poolFor(
    AERO,
    USDbC,
    false,
    AerodromeFactory
  );
  const AERO_USDbCGauge = await AerodromeVoterContract.gauges(AERO_USDbC_LP);
  const AERO_USDbCGaugeContract = new ethers.Contract(
    AERO_USDbCGauge,
    GaugeABI,
    provider
  );
  let LPbalanceInGauge = await AERO_USDbCGaugeContract.balanceOf(
    signer.address
  );
  console.log("AERO_USDbC LP balance in gauge ", LPbalanceInGauge);

  tx = await AERO_USDbCGaugeContract.connect(signer).withdraw(LPbalanceInGauge);
  receipt = await tx.wait();

  let LPbalanceAfter = await AERO_USDbCContract.balanceOf(signer.address);
  console.log("AERO_USDbC LP balance after", LPbalanceAfter);
};

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
  console.log("GLOBAL LP Balance for Pool ID 2 after: ", lpBalanceForPoolAfter);

  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  const BRATE_ETH_LP_Contract = new ethers.Contract(
    BRATE_ETH_LP,
    ERC20ABI,
    provider
  );

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

  let lpBalanceForPoolAfter1 = (await baseShareRewardPool.poolInfo(0))
    .lpBalance;
  console.log(
    "GLOBAL LP Balance for Pool ID 0 before: ",
    lpBalanceForPoolAfter1
  );
};

const collectExternalReward = async () => {
  console.log("\n*** GETTING AERO FROM SHAREPOOL ***");
  let Aerobalance = await AEROContract.balanceOf(communityFund.address);
  console.log(" AERO balance in communityFun before ", Aerobalance);

  tx = await baseShareRewardPool.getExternalReward(2);
  receipt = await tx.wait();

  let AerobalanceAfter = await AEROContract.balanceOf(communityFund.address);
  console.log(" AERO balance in communityFund after ", AerobalanceAfter);
};

const createRoute = (from, to, stable, factory) => {
  return {
    from,
    to,
    stable,
    factory,
  };
};

const buyAERO_USDbC = async (amount, signer) => {
  console.log("\n*** BUYING AERO AND USDbC ***");
  const AERORoute = createRoute(WETH, AERO, false, AerodromeFactory);
  const USDbCRoute = createRoute(WETH, USDbC, false, AerodromeFactory);

  try {
    tx = await AerodromeRouterContract.connect(signer).swapExactETHForTokens(
      0,
      [AERORoute],
      signer.address,
      Math.floor(Date.now() / 1000) + 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();
    tx = await AerodromeRouterContract.connect(signer).swapExactETHForTokens(
      0,
      [USDbCRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();
    console.log(
      "AERO Balance Deployer after:",
      utils.formatEther(await AEROContract.balanceOf(deployer.address))
    );
    console.log(
      "USDbC Balance Deployer after:",
      utils.formatUnits(await USDbCContract.balanceOf(deployer.address), 6)
    );
  } catch (error) {
    console.error("Error in buy Tokens:", error);
  }
};

const AddLiquidityAERO_USDbC = async (signer) => {
  console.log("\n*** ADDING LIQUIDITY AERO-USDbC ***");
  let balanceUSDC = await USDbCContract.balanceOf(signer.address);
  console.log("balanceUSDC ", balanceUSDC);
  tx = await USDbCContract.connect(signer).approve(
    AerodromeRouter,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  let balanceAERO = await AEROContract.balanceOf(signer.address);
  console.log("balanceAERO", balanceAERO);
  tx = await AEROContract.connect(signer).approve(
    AerodromeRouter,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(signer).addLiquidity(
    AERO,
    USDbC,
    false,
    balanceAERO,
    balanceUSDC,
    0,
    0,
    signer.address,
    Math.floor(Date.now() / 1000) + 86400
  );
  receipt = await tx.wait();
  let LPbalance = await AERO_USDbCContract.balanceOf(signer.address);

  console.log("AERO_USDbC LP ", LPbalance);
};

const buyAEROWithETH = async (amount, signer) => {
  // console.log("\n*** BUYING AERO with ETH ***");
  const WETHToAERORoute = createRoute(WETH, AERO, false, AerodromeFactory);
  tx = await AerodromeRouterContract.connect(
    signer
  ).swapExactETHForTokensSupportingFeeOnTransferTokens(
    0,
    [WETHToAERORoute],
    signer.address,
    Math.floor(Date.now() / 1000) + 86400,
    { value: utils.parseEther(amount.toString()) }
  );
  await tx.wait();
};

const buyAndSellAERO = async (signer) => {
  const AEROToUSDbCRoute = createRoute(AERO, USDbC, false, AerodromeFactory);
  const USDbCToAERORoute = createRoute(USDbC, AERO, false, AerodromeFactory);
  const balanceAERO = await AEROContract.balanceOf(signer.address);
  // console.log({ balanceAERO });
  tx = await AEROContract.connect(signer).approve(
    AerodromeRouterContract.address,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(signer).swapExactTokensForTokens(
    balanceAERO,
    0,
    [AEROToUSDbCRoute],
    signer.address,
    Math.floor(Date.now() / 1000) + 86400
  );
  receipt = await tx.wait();
  const balanceUSDbC = await USDbCContract.balanceOf(signer.address);
  // console.log({ balanceUSDbC });
  tx = await USDbCContract.connect(signer).approve(
    AerodromeRouterContract.address,
    ethers.constants.MaxUint256
  );
  receipt = await tx.wait();
  tx = await AerodromeRouterContract.connect(signer).swapExactTokensForTokens(
    balanceUSDbC,
    0,
    [USDbCToAERORoute],
    signer.address,
    Math.floor(Date.now() / 1000) + 86400
  );
  receipt = await tx.wait();
};

const fakeVolumeAERO_USDbC = async (signer) => {
  console.log("\n*** FAKING VOLUME ***");
  await buyAEROWithETH(10, deployer);
  await buyAndSellAERO(signer);
  await buyAndSellAERO(signer);
  await buyAndSellAERO(signer);
  await buyAndSellAERO(signer);
  await buyAndSellAERO(signer);
};

const transferLP = async (from, to) => {
  console.log("TRANSFERING LP");
  const balanceLP = AERO_USDbCContract.balanceOf(from.address);
  tx = await AERO_USDbCContract.connect(from).transfer(to.address, balanceLP);
  receipt = await tx.wait();
};

const claimRewards = async (pid) => {
  console.log("\n*** CLAIMING SWAP FEES and AERO ***");
  const { token, gauge } = await baseShareRewardPool.poolInfo(pid);
  const PoolContract = new ethers.Contract(token, PoolABI, provider);
  const [claimableRewardPool0, claimableRewardPool1] =
    await PoolContract.connect(
      baseShareRewardPool.address
    ).callStatic.claimFees();
  if (
    utils.formatEther(claimableRewardPool0) * 1 > 0 ||
    utils.formatEther(claimableRewardPool1) * 1 > 0
  ) {
    console.log("GETTING EXTERNAL SWAP FEES");
    tx = await baseShareRewardPool.getExternalSwapFees(0, true);
    receipt = await tx.wait();
  }
  const GaugeContract = new ethers.Contract(gauge, GaugeABI, provider);
  let earnedInGauge = 0;
  if (gauge !== ethers.constants.AddressZero) {
    earnedInGauge = await GaugeContract.earned(baseShareRewardPool.address);
  }
  if (utils.formatEther(earnedInGauge) * 1 > 0) {
    console.log("GETTING EXTERNAL REWARDS");
    tx = await baseShareRewardPool.getExternalReward(0);
    receipt = await tx.wait();
  }
  console.log({
    claimableRewardPool0,
    claimableRewardPool1,
    earnedInGauge,
  });
};

const showStatsGauge = async (signer, AERO_USDbCGaugeContract) => {
  console.log("\n*** SHOWING STATS ***");
  // const claimable0 = await AERO_USDbCContract.claimable0(signer.address);
  // const claimable1 = await AERO_USDbCContract.claimable1(signer.address);
  const [claimed0, claimed1] = await AERO_USDbCContract.connect(
    signer
  ).callStatic.claimFees();
  let earnedInGauge;
  if (AERO_USDbCGaugeContract) {
    earnedInGauge = await AERO_USDbCGaugeContract.earned(signer.address);
  }
  console.log({ claimed0, claimed1, earnedInGauge });
};
const showStatsRewardPool = async (signer, pid) => {
  console.log("\n*** SHOWING STATS ***");
  const { token, gauge } = await baseShareRewardPool.poolInfo(pid);
  const PoolContract = new ethers.Contract(token, PoolABI, provider);
  const [claimedRewardPool0, claimedRewardPool1] = await PoolContract.connect(
    baseShareRewardPool.address
  ).callStatic.claimFees();
  const GaugeContract = new ethers.Contract(gauge, GaugeABI, provider);
  let earnedInGauge = 0;
  if (gauge !== ethers.constants.AddressZero) {
    earnedInGauge = await GaugeContract.earned(baseShareRewardPool.address);
  }
  const pendingBSHARE = await baseShareRewardPool.pendingShare(
    0,
    signer.address
  );
  console.log({
    claimedRewardPool0,
    claimedRewardPool1,
    earnedInGauge,
    pendingBSHARE,
  });
};

const main = async () => {
  await setAddresses();
  await deployContracts();
  await addPool();
  await buyAERO_USDbC(1, deployer);
  await AddLiquidityAERO_USDbC(deployer);
  await fakeVolumeAERO_USDbC(deployer);
  await stakeInSharePool(deployer);
  await showStatsRewardPool(deployer, 0);
  await fakeVolumeAERO_USDbC(deployer);
  await showStatsRewardPool(deployer, 0);
  await time.increase(3600);
  await showStatsRewardPool(deployer, 0);
  await claimRewards(0);
  await showStatsRewardPool(deployer, 0);
  await claimSharePool(deployer);
  await showStatsRewardPool(deployer, 0);
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
