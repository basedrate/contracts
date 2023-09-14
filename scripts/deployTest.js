const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("./RouterABI.json");
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
  presaleDistributor; //contracts
let presaleContractBalance; //values

const Presale = "0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659";
const AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
const AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
const WETH = "0x4200000000000000000000000000000000000006";
const REF = "0x3B12aA296Fa88d6CBA494e900EEFe1B85fDA507A";
const WETH_USDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const WETH_USDbC_GAUGE = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const AERO_USDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const AERO_USDbC_GAUGE = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
const USDbC = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";

const WETH_USDbCContract = new ethers.Contract(WETH_USDbC, ERC20ABI, provider);
const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const AEROCContract = new ethers.Contract(AERO, ERC20ABI, provider);
const AddressDead = "0x000000000000000000000000000000000000dead";

const AerodromeRouterContract = new ethers.Contract(
  AerodromeRouter,
  RouterABI,
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
    startTime,
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
    6 * 3600,
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
  console.log("twap = ", twap );
  console.log("consult = ", consult );
  console.log("pegPrice = ", pegPrice );
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
    startTime,
    0,
    false,
    baseShareRewardPool.address
  );
  receipt = await tx.wait();
  console.log("\nBRATE_ETH_LP added");
  tx = await baseShareRewardPool.add(
    1000,
    BSHARE_ETH_LP,
    true,
    startTime,
    0,
    false,
    baseShareRewardPool.address
  );
  receipt = await tx.wait();
  console.log("\nBSHARE_ETH_LP added");

  tx = await baseShareRewardPool.add(
    1000,
    WETH_USDbC,
    true,
    startTime,
    400,
    true,
    WETH_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nWETH_USDbC added");

  tx = await baseShareRewardPool.add(
    1000,
    AERO_USDbC,
    true,
    startTime,
    400,
    true,
    AERO_USDbC_GAUGE
  );
  receipt = await tx.wait();
  console.log("\nAERO_USDbC added");

  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);

  tx = await baseRate.setLP(BRATE_ETH_LP, true);
  receipt = await tx.wait();
  console.log("BRATE_ETH_LP added as LP");
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
  console.log(
    "GLOBAL LP Balance for Pool ID 2 before: ",
    lpBalanceForPoolAfter
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

const buyBRATEBSHARE = async (amount) => {
  console.log("\n*** BUYING BRATE AND BSHARE ***");
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
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );

    const tx2 = await AerodromeRouterContract.connect(
      deployer
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseShareRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx2.wait();

    console.log(
      "BSHARE Balance after:",
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );

    console.log(
      "BRATE Balance before:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );

    const tx = await AerodromeRouterContract.connect(
      deployer
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseRateRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();

    console.log(
      "BRATE Balance after:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );
  } catch (error) {
    console.error("Error in sellBSHARE:", error);
  }
};

const buyBRATE = async (amount) => {
  console.log("\n*** BUYING BRATE AND BSHARE ***");
  const baseRateRoute = createRoute(
    WETH,
    baseRate.address,
    true,
    AerodromeFactory
  );

  try {
    console.log(
      "BRATE Balance before:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );

    const tx = await AerodromeRouterContract.connect(
      deployer
    ).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseRateRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();

    console.log(
      "BRATE Balance after:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );
  } catch (error) {
    console.error("Error in sellBSHARE:", error);
  }
};

sellBRATE = async (amount) => {
  console.log("\n*** SELLING BRATE ***");
  tx = await baseRate.approve(AerodromeRouter, ethers.constants.MaxUint256);
  receipt = await tx.wait();

  const baseRateRoute = createRoute(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );
  try {

    console.log(
      "BRATE Balance before:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );

    const tx = await AerodromeRouterContract.connect(
      deployer
    ).swapExactTokensForETHSupportingFeeOnTransferTokens(
      utils.parseEther(amount.toString()),
      0,
      [baseRateRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400
    );
    await tx.wait();
    console.log(
      "BRATE Balance after:",
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );
  } catch (error) {
    console.error("Error in sellBRATE:", error);
  }
};

sellBSHARE = async (amount) => {
  console.log("\n*** SELLING BSHARE ***");

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
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );

    const tx2 = await AerodromeRouterContract.connect(
      deployer
    ).swapExactTokensForETH(
      utils.parseEther(amount.toString()),
      0,
      [baseShareRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400
    );
    await tx2.wait();

    console.log(
      "BSHARE Balance after:",
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );


  } catch (error) {
    console.error("Error in buyBRATEBSHARE:", error);
  }
};

const buyBonds = async (signer) => {
  console.log('\n*** BUYING BONDS ***');
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  const Price = await treasury.getBaseRatePrice();
  tx = await baseRate
    .connect(signer)
    .approve(treasury.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await treasury
    .connect(signer)
    .buyBonds(utils.parseEther('1'), Price);
  receipt = await tx.wait();
  
  console.log(
    'PBOND Balance After:',
    utils.formatEther(await baseBond.balanceOf(signer.address))
  );
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
};

const redeemBonds = async (signer) => {
  console.log('\n*** Redeeming BONDS ***');
  console.log(
    "BRATE Balance before:",
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'PBOND Balance Before:',
    utils.formatEther(await baseBond.balanceOf(signer.address))
  );
  const bonds = await baseBond.balanceOf(signer.address);
  const Price = await treasury.getBaseRatePrice();
  tx = await baseBond
    .connect(signer)
    .approve(treasury.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  tx = await treasury
    .connect(signer)
    .redeemBonds(bonds, Price);
  receipt = await tx.wait();
  
  console.log(
    'PBOND Balance After:',
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

tx = await baseRate.mint(deployer.address,supplyBRATEForPresale);
receipt = await tx.wait();

tx = await baseRate.transferOperator(treasury.address);
receipt = await tx.wait();
}

const testBonds = async (signer) => {
  console.log('\n*** TESTING BONDS***');

  const numOfIterationsSell = 48;

  for (let i = 0; i < numOfIterationsSell; i++) {
    await time.increase(1800);
    await sellBRATE(0.3);
    await viewOracle();
  }
  const numOfIterationsAll = (numOfIterationsSell * 1800) / 21600;
  for (let i = 0; i < numOfIterationsAll; i++) {
    await allocateSeigniorage();
  }

  await buyBonds(deployer);

  const numOfIterationsSell_ = 60;

  for (let i = 0; i < numOfIterationsSell_; i++) {
    await time.increase(1800);
    await buyBRATE(0.6);
    await viewOracle();
  }
  const numOfIterationsAll_ = (numOfIterationsSell * 1800) / 21600;
  for (let i = 0; i < numOfIterationsAll_; i++) {
    await allocateSeigniorage();
  }
  await redeemBonds(deployer);
  
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
  // await sendBRATEAndBSHAREToPresaleDistributor();
  await setRewardPoolAndInitialize();
  await stakeBSHAREINBoardroom();

  // test logic

  await mintBrate();

  await disableTax();
  // await sellBRATE(0.1);
  // await time.increase(1800);
  // await sellBRATE(0.1);
  // await time.increase(1800);
  // await sellBRATE(0.1);
  // await enableTax();
  // await time.increase(1800);
  // await sellBRATE(0.1);
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  await time.increase(6 * 3600);
  await allocateSeigniorage();
  // await buyAERO_USDbC(1);
  // await disableTax();
  //  await viewOracle();
  //  await testBonds();
  //  await viewOracle();
  //  await enableTax();
  //  await sellBRATE(0.1);
  // await AddLiquidityEthUSDC();
  // await stakeInSharePool();
  // await time.increase(6 * 3600);
  // await collectExternalReward();
  // await unStakeInSharePool();
  //  await viewOracle();
  // await time.increase(6 * 3600);
  // await allocateSeigniorage();
  await testBonds();


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
