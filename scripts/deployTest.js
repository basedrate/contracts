const { ethers } = require('hardhat');
const {
  setBalance,
  time,
} = require('@nomicfoundation/hardhat-network-helpers');
const RouterABI = require('./RouterABI.json');
const ERC20ABI = require('@uniswap/v2-core/build/IERC20.json').abi;

const PresaleABI = [
  'function WithdrawETHcall(uint256 amount) external',
  'function checkContractBalance() external view returns(uint256)',
];

const utils = ethers.utils;
const provider = ethers.provider;

let tx, receipt; //transactions
let deployer,
  devWallet,
  BRATE_ETH_LP,
  BSHARE_ETH_LP; //addresses
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

const Presale = '0xf47567B9d6Ee249FcD60e8Ab9635B32F8ac87659';
const AerodromeRouter = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const AerodromeFactory = '0x420dd381b31aef6683db6b902084cb0ffece40da';
const WETH = '0x4200000000000000000000000000000000000006';
const WETH_USDbC = '0xB4885Bc63399BF5518b994c1d0C153334Ee579D0';
const WETH_USDbC_GAUGE = '0xeca7Ff920E7162334634c721133F3183B83B0323';
const AERO_USDbC = '0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75'; 
const AERO_USDbC_GAUGE = '0x9a202c932453fB3d04003979B121E80e5A14eE7b'; 

const AerodromeRouterContract = new ethers.Contract(
  AerodromeRouter,
  RouterABI,
  provider
);

// const startTime = 1687219200; //2023-06-20 at 00:00 UTC TO CHECK
const startTime = Math.floor(Date.now() / 1000); //Now + 20 seconds

const supplyBRATEETH = utils.parseEther("25");
const supplyBSHAREETH = utils.parseEther('20');
const ETHforBRATELiquidity = utils.parseEther('25');
const ETHforBSHARELiquidity = utils.parseEther('25');
const supplyBRATEforBRATEBSHARE = utils.parseEther("20");
const supplyBSHAREforBRATEBSHARE = utils.parseEther('20');
const supplyBRATEForPresale = utils.parseEther("27.497799");
const supplyBSHAREForPresale = utils.parseEther('27.497799');

// const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const PresaleContract = new ethers.Contract(Presale, PresaleABI, provider);
// const WETHContract = new ethers.Contract(WETH, ERC20ABI, provider);

const setAddresses = async () => {
  console.log('\n*** SETTING ADDRESSES ***');
  // [deployer] = await ethers.getSigners();
  deployer = await ethers.getImpersonatedSigner(
    '0xc92879d115fa23d6d7da27946f0dab96ea2db706'
  );
  devWallet = await ethers.getImpersonatedSigner(
    '0xF53B5822De2dd55b651712e58ABB8a72367eF92a'
  );
  console.log(`Deployer: ${deployer.address}`);
  await setBalance(deployer.address, utils.parseEther('1000000000'));
  await setBalance(devWallet.address, utils.parseEther('1000000000'));
};

const deployContracts = async () => {
  console.log('\n*** DEPLOYING CONTRACTS ***');
  const TeamDistributor = await ethers.getContractFactory(
    'TeamDistributor',
    deployer
  );
  teamDistributor = await TeamDistributor.deploy();
  await teamDistributor.deployed();
  console.log(`TeamDistributor deployed to ${teamDistributor.address}`);
  const BaseRate = await ethers.getContractFactory('BaseRate', deployer);
  baseRate = await BaseRate.deploy();
  await baseRate.deployed();
  console.log(`BaseRate deployed to ${baseRate.address}`);
  const BaseShare = await ethers.getContractFactory('BaseShare', deployer);
  baseShare = await BaseShare.deploy(startTime, teamDistributor.address);
  await baseShare.deployed();
  console.log(`BaseShare deployed to ${baseShare.address}`);
  const BaseBond = await ethers.getContractFactory('BaseBond', deployer);
  baseBond = await BaseBond.deploy();
  await baseBond.deployed();
  console.log(`BaseBond deployed to ${baseBond.address}`);
  const CommunityFund = await ethers.getContractFactory(
    'CommunityFund',
    deployer
  );
  communityFund = await CommunityFund.deploy();
  await communityFund.deployed();
  console.log(`CommunityFund deployed to ${communityFund.address}`);
  const BaseShareRewardPool = await ethers.getContractFactory(
    'BaseShareRewardPool',
    deployer
  );
  baseShareRewardPool = await BaseShareRewardPool.deploy(
    baseShare.address,
    startTime,
    communityFund.address
  );
  await baseShareRewardPool.deployed();
  console.log(
    `BaseShareRewardPool deployed to ${baseShareRewardPool.address}`
  );
  const Boardroom = await ethers.getContractFactory('Boardroom', deployer);
  boardroom = await Boardroom.deploy();
  await boardroom.deployed();
  console.log(`Boardroom deployed to ${boardroom.address}`);
  const Treasury = await ethers.getContractFactory('Treasury', deployer);
  treasury = await Treasury.deploy();
  await treasury.deployed();
  console.log(`Treasury deployed to ${treasury.address}`);
  const PresaleDistributorFactory = await ethers.getContractFactory(
    'presaleDistributor',
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
  console.log('\n*** DEPLOYING ORACLE ***');

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

  console.log("BRATE_ETH_LP ", BRATE_ETH_LP)
  console.log("BSHARE_ETH_LP ", BSHARE_ETH_LP)
  
  const Oracle = await ethers.getContractFactory('Oracle', deployer);
  oracle = await Oracle.deploy(BRATE_ETH_LP, 6 * 60 * 60, startTime);
  await oracle.deployed();
  console.log(`Oracle deployed to ${oracle.address}`);
};

const updateOracle = async () => {
  console.log('\n*** UPDATING ORACLE ***');
  tx = await oracle.update();
  receipt = await tx.wait();
};

const withdrawFromPresale = async () => {
  console.log('\n*** WITHDRAWING FROM PRESALE ***');
  presaleContractBalance = await PresaleContract.checkContractBalance();
  console.log("presaleContractBalance", presaleContractBalance)
  tx = await PresaleContract.connect(deployer).WithdrawETHcall(
    presaleContractBalance
  );
  receipt = await tx.wait();
  console.log(
    'Withdrew from presale:',
    utils.formatEther(presaleContractBalance)
  );
};


const mintInitialSupplyAndAddLiquidity = async () => {
  console.log('\n*** MINTING INITIAL SUPPLY ***');
  tx = await baseRate.distributeReward(deployer.address);
  receipt = await tx.wait();
  console.log(
    'BRATE Balance:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  tx = await baseShare.distributeReward(baseShareRewardPool.address);
  receipt = await tx.wait();
  console.log(
    'BSHARE Balance:',
    utils.formatEther(await baseShare.balanceOf(deployer.address))
  );
  console.log('\n*** ADDING LIQUIDITY ***');
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
  console.log('\n*** INITIALIZING BOARDROOM ***');
  tx = await boardroom.initialize(
    baseRate.address,
    baseShare.address,
    treasury.address
  );
  receipt = await tx.wait();
};
const initializeTreasury = async () => {
  console.log('\n*** INITIALIZING TREASURY ***');
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
  console.log('\n*** SETTING COMMUNITY FUND IN BASEDSHARE CONTRACT ***');
  tx = await teamDistributor.sendCustomTransaction(
    baseShare.address,
    0,
    'setTreasuryFund(address)',
    utils.defaultAbiCoder.encode(['address'], [communityFund.address])
  );
  receipt = await tx.wait();
  console.log('Community Fund:', await baseShare.communityFund());
  console.log('\n*** SETTING TOKENS IN TEAM DISTRIBUTOR ***');
  tx = await teamDistributor.setTokens(baseShare.address, baseRate.address);
  receipt = await tx.wait();
  console.log('\n*** SETTING EXTRA FUNDS IN TREASURY ***');
  tx = await treasury.setExtraFunds(
    communityFund.address,
    2500,
    teamDistributor.address,
    500
  );
  receipt = await tx.wait();
  console.log('\n*** SETTING ORACLE in BASERATE ***');
  tx = await baseRate.setOracle(oracle.address);
  console.log('\n*** EXCLUDING treasury, boardroom, communityFund, teamDistributor  ***');  
  tx = await baseRate.excludeAddress(treasury.address)
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(boardroom.address)
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(communityFund.address)
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(teamDistributor.address)
  receipt = await tx.wait();
};

const setOperators = async () => {
  console.log(
    '\n*** SETTING OPERATOR IN BRATE, PBOND, BSHARE AND BOARDROOM ***'
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
  console.log('\n*** INITIALIZING REWARD POOL CONTRACT ***');
  tx = await baseShareRewardPool.initializer();
  receipt = await tx.wait();

  console.log('\n*** SETTING REWARD POOL ***');

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

  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);

  tx = await baseShareRewardPool.add(1000, BRATE_ETH_LP, true, startTime, 0, false,baseShareRewardPool.address);
  receipt = await tx.wait();
  console.log('\nBRATE_ETH_LP added');
  tx = await baseShareRewardPool.add(1000, BSHARE_ETH_LP, true, startTime, 0, false, baseShareRewardPool.address);
  receipt = await tx.wait();
  console.log('\nBSHARE_ETH_LP added');

  tx = await baseShareRewardPool.add(1000, WETH_USDbC, true, startTime, 0, true, WETH_USDbC_GAUGE);
  receipt = await tx.wait();
  console.log('\nWETH_USDbC added');

  tx = await baseShareRewardPool.add(1000, AERO_USDbC, true, startTime, 0, true, AERO_USDbC_GAUGE);
  receipt = await tx.wait();
  console.log('\AERO_USDbC added');

};

const main = async () => {

  await setAddresses();
  await deployContracts();
  await withdrawFromPresale();
  await mintInitialSupplyAndAddLiquidity();
  await deployOracle();
  await initializeBoardroom();
  await initializeTreasury();
  await setParameters();
  await setOperators();
  await setRewardPoolAndInitialize();
  await updateOracle();
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
