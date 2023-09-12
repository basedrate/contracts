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
  oldDevWallet
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
const REF = '0x3B12aA296Fa88d6CBA494e900EEFe1B85fDA507A';
const WETH_USDbC = '0xB4885Bc63399BF5518b994c1d0C153334Ee579D0';
const WETH_USDbC_GAUGE = '0xeca7Ff920E7162334634c721133F3183B83B0323';
const AERO_USDbC = '0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75'; 
const AERO_USDbC_GAUGE = '0x9a202c932453fB3d04003979B121E80e5A14eE7b'; 
const AERO = '0x940181a94A35A4569E4529A3CDfB74e38FD98631'; 
const USDbC = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'; 

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
const supplyBSHAREETH = utils.parseEther('20');
const ETH_TEST = utils.parseEther('1');
const ETHforBRATELiquidity = utils.parseEther('25');
const ETHforBSHARELiquidity = utils.parseEther('25');
const supplyBRATEforBRATEBSHARE = utils.parseEther("20");
const supplyBSHAREforBRATEBSHARE = utils.parseEther('20');
const supplyBRATEForPresale = utils.parseEther("37.125");
const supplyBSHAREForPresale = utils.parseEther('27.497799');

// const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const PresaleContract = new ethers.Contract(Presale, PresaleABI, provider);
// const WETHContract = new ethers.Contract(WETH, ERC20ABI, provider);

const setAddresses = async () => {
  console.log('\n*** SETTING ADDRESSES ***');
  // [deployer, oldDevWallet] = await ethers.getSigners();
  deployer = await ethers.getImpersonatedSigner(
    '0xF53B5822De2dd55b651712e58ABB8a72367eF92a'
  );
  oldDevWallet = await ethers.getImpersonatedSigner(
    '0xc92879d115fa23d6d7da27946f0dab96ea2db706'
  );
  console.log(`Deployer: ${deployer.address}`);
  console.log(`oldDevWallet: ${oldDevWallet.address}`);
  await setBalance(deployer.address, utils.parseEther('1000000000'));
  await setBalance(oldDevWallet.address, utils.parseEther('1000000000'));
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

  const initialBalance = await ethers.provider.getBalance(oldDevWallet.address);
  console.log('Initial balance of oldDevWallet:', utils.formatEther(initialBalance));

  const presaleContractBalance = await PresaleContract.checkContractBalance();
  console.log("presaleContractBalance", presaleContractBalance);

  const tx = await PresaleContract.connect(oldDevWallet).WithdrawETHcall(
    presaleContractBalance
  );
  const receipt = await tx.wait();
  console.log(
    'Withdrew from presale:',
    utils.formatEther(presaleContractBalance)
  );

  const finalBalance = await ethers.provider.getBalance(oldDevWallet.address);
  console.log('Final balance of oldDevWallet:', utils.formatEther(finalBalance));
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
  tx = await baseRate.enableAutoCalculateTax()
  receipt = await tx.wait();
  console.log('\n*** TAX ENABLED ***');
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
  console.log('\nAERO_USDbC added');


  console.log("BRATE_ETH_LP:", BRATE_ETH_LP);
  console.log("BSHARE_ETH_LP:", BSHARE_ETH_LP);

  tx = await baseRate.setLP(BRATE_ETH_LP,true)
  receipt = await tx.wait();
  console.log("BRATE_ETH_LP added as LP")

};

const stakeInSharePool = async () => {
  console.log('\n*** STAKING IN SHAREPOOL ***');
  let LPbalance = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(' WETH_USDbC LP balance before ', LPbalance);
  tx = await WETH_USDbCContract.connect(deployer).approve(baseShareRewardPool.address, ethers.constants.MaxUint256);

  tx = await baseShareRewardPool.deposit(2,LPbalance,REF);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(' WETH_USDbC LP ', LPbalanceAfter);

};


const unStakeInSharePool = async () => {
  console.log('\n*** UNSTAKING IN SHAREPOOL ***');
  let LPbalance = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(' WETH_USDbC LP balance before ', LPbalance);

  let lpBalanceForPool = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log('GLOBAL LP Balance for Pool ID 2 before: ', lpBalanceForPool);

  let userInfoForDeployer = await baseShareRewardPool.userInfo(2, deployer.address);
  let amount = userInfoForDeployer.amount;
  console.log('user Staked before', amount);

  tx = await baseShareRewardPool.withdraw(2,amount);
  receipt = await tx.wait();

  let LPbalanceAfter = await WETH_USDbCContract.balanceOf(deployer.address);
  console.log(' WETH_USDbC LP ', LPbalanceAfter);

  let userInfoForDeployerAfter = await baseShareRewardPool.userInfo(2, deployer.address);
  let amountAfter = userInfoForDeployerAfter.amount;
  console.log('user Staked after', amountAfter);

  let lpBalanceForPoolAfter = (await baseShareRewardPool.poolInfo(2)).lpBalance;
  console.log('GLOBAL LP Balance for Pool ID 2 before: ', lpBalanceForPoolAfter);

};

const collectExternalReward = async () => {
  console.log('\n*** GETTING AERO FROM SHAREPOOL ***');
  let Aerobalance = await AEROCContract.balanceOf(communityFund.address);
  console.log(' AERO balance in communityFun before ', Aerobalance);


  tx = await baseShareRewardPool.getExternalReward(2);
  receipt = await tx.wait();

  let AerobalanceAfter = await AEROCContract.balanceOf(communityFund.address);
  console.log(' AERO balance in communityFund after ', AerobalanceAfter);

};



const stakeBSHAREINBoardroom = async () => {
  console.log('\n*** STAKING BSHARE IN BOARDROOM ***');
  tx = await baseShare
    .connect(deployer)
    .approve(boardroom.address, ethers.constants.MaxUint256);
  receipt = await tx.wait();
  const stakeAmount = ethers.utils.parseEther("1");
  tx = await boardroom.connect(deployer).stake(stakeAmount);
  receipt = await tx.wait();
};

const allocateSeigniorage = async () => {
  console.log('\n*** ALLOCATING SEIGNORAGE ***');
  console.log(
    'BRATE Balance TeamDistributor Before:',
    utils.formatEther(await baseRate.balanceOf(teamDistributor.address))
  );
  console.log(
    'BRATE Balance Community Fund Before:',
    utils.formatEther(await baseRate.balanceOf(communityFund.address))
  );
  console.log(
    'BRATE Balance Boardroom Before:',
    utils.formatEther(await baseRate.balanceOf(boardroom.address))
  );
  tx = await treasury.allocateSeigniorage();
  receipt = await tx.wait();
  console.log(
    'BRATE Balance TeamDistributor After:',
    utils.formatEther(await baseRate.balanceOf(teamDistributor.address))
  );
  console.log(
    'BRATE Balance Community Fund After:',
    utils.formatEther(await baseRate.balanceOf(communityFund.address))
  );
  console.log(
    'BRATE Balance Boardroom After:',
    utils.formatEther(await baseRate.balanceOf(boardroom.address))
  );
};

const testTransferFee = async () => {
  console.log('\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS ***');
  console.log(
    'BRATE Balance Deployer Before:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead Before:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx0 = await baseRate.connect(deployer).approve(deployer.address,utils.parseEther("1"))
  await tx0.wait();
  console.log(
    'BRATE allowance Before:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );
  const tx1 = await baseRate.connect(deployer).transferFrom(deployer.address,AddressDead, utils.parseEther("1"))
  await tx1.wait();
  console.log(
    'BRATE Balance Deployer after:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead after:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  console.log(
    'BRATE allowance After:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );
  console.log('\n*** TRANSFER_FROM WITHOUT FEE 1 ETH TO DEAD ADDRESS ***');
  tx = await baseRate.disableAutoCalculateTax()
  receipt = await tx.wait();
  tx = await baseRate.setTaxRate(0)
  receipt = await tx.wait();
  console.log(
    'BRATE Balance Deployer Before:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead Before:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx2 = await baseRate.connect(deployer).approve(deployer.address,utils.parseEther("1"))
  await tx2.wait();
  console.log(
    'BRATE allowance Before:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );
  const tx3 = await baseRate.connect(deployer).transferFrom(deployer.address,AddressDead, utils.parseEther("1"))
  await tx3.wait();
  console.log(
    'BRATE Balance Deployer after:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead after:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  console.log(
    'BRATE allowance After:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );
  tx = await baseRate.setTaxRate(1500)
  receipt = await tx.wait();
  tx = await baseRate.enableAutoCalculateTax()
  receipt = await tx.wait();
  tx = await baseRate.excludeAddress(AddressDead)
  receipt = await tx.wait();
  console.log('\n*** TRANSFER_FROM WITH FEE 1 ETH TO DEAD ADDRESS EXCLUDED ***');
  console.log(
    'BRATE Balance Deployer Before:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead Before:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  const tx4 = await baseRate.connect(deployer).approve(deployer.address,utils.parseEther("1"))
  await tx4.wait();
  console.log(
    'BRATE allowance Before:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );
  const tx5 = await baseRate.connect(deployer).transferFrom(deployer.address,AddressDead, utils.parseEther("1"))
  await tx5.wait();
  console.log(
    'BRATE Balance Deployer after:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead after:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );
  console.log(
    'BRATE allowance After:',
    utils.formatEther(await baseRate.allowance(deployer.address,deployer.address))
  );

  console.log('\n*** TRANSFER WITH FEE 1 ETH TO DEAD ADDRESS ***');
  const BRATE_ETH_LP = await AerodromeRouterContract.poolFor(
    baseRate.address,
    WETH,
    true,
    AerodromeFactory
  );

  console.log(
    'BRATE Balance Deployer Before:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead Before:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );


  const tx6 = await baseRate.connect(deployer).transfer(AddressDead, utils.parseEther("1"))
  await tx6.wait();

  console.log(
    'BRATE Balance Deployer AFTER:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );
  console.log(
    'BRATE Balance AddressDead AFTER:',
    utils.formatEther(await baseRate.balanceOf(AddressDead))
  );

  console.log('\n*** TRANSFER WITH FEE 1 ETH TO BRATE_ETH_LP ADDRESS ***');
  console.log(
    'BRATE Balance Deployer Before:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

  console.log(
    'BRATE Balance Before BRATE_ETH_LP:',
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  const tx7 = await baseRate.connect(deployer).transfer(BRATE_ETH_LP, utils.parseEther("1"))
  await tx7.wait();

  console.log(
    'BRATE Balance AFTER BRATE_ETH_LP:',
    utils.formatEther(await baseRate.balanceOf(BRATE_ETH_LP))
  );

  console.log(
    'BRATE Balance Deployer AFTER:',
    utils.formatEther(await baseRate.balanceOf(deployer.address))
  );

}

  const createRoute = (from, to, factory) => {
    return {
      from: from,
      to: to,
      factory: factory,
      feeOnTransfer: true
    };
  };

const buyAERO_USDbC = async (amount) => {
  console.log('\n*** BUYING AERO AND USDbC ***');
  const AERORoute = createRoute(WETH, AERO, AerodromeFactory); 
  const USDbCRoute = createRoute(WETH, USDbC, AerodromeFactory);

  try {
    const tx0 = await AerodromeRouterContract.connect(deployer).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [AERORoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx0.wait();
    const tx1 = await AerodromeRouterContract.connect(deployer).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [USDbCRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx1.wait();
    console.log(
      'AERO Balance Deployer after:',
      utils.formatEther(await AEROCContract.balanceOf(deployer.address))
    );
    console.log(
      'USDbC Balance Deployer after:',
      utils.formatEther(await USDbCContract.balanceOf(deployer.address))
    );

  } catch (error) {
    console.error("Error in buy Tokens:", error);
  }
};

const disableTax = async () => {
  console.log('\n*** TAX DISABLED ***');
  console.log("Tax before ",await baseRate.taxRate())

  tx = await baseRate.disableAutoCalculateTax()
  receipt = await tx.wait();
  tx = await baseRate.setTaxRate(0)
  receipt = await tx.wait();

  console.log("Tax after ",await baseRate.taxRate())

}


const AddLiquidityEthUSDC = async () => {
  console.log('\n*** ADDING LIQUIDITY ETH USDC ***');
  let balanceUSDC = await USDbCContract.balanceOf(deployer.address);
  console.log("balanceUSDC ", balanceUSDC)
  tx = await USDbCContract.connect(deployer).approve(AerodromeRouter, ethers.constants.MaxUint256);
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

console.log(' WETH_USDbC LP ', LPbalance);

};


const buyBRATEBSHARE = async (amount) => {
  console.log('\n*** BUYING BRATE AND BSHARE ***');
  const baseRateRoute = createRoute(WETH, baseRate.address, AerodromeFactory); 
  const baseShareRoute = createRoute(WETH, baseShare.address, AerodromeFactory);
  try {

    console.log(
      'BSHARE Balance before:',
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );

    const tx2 = await AerodromeRouterContract.connect(deployer).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseShareRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx2.wait();
  
    console.log(
      'BSHARE Balance after:',
      utils.formatEther(await baseShare.balanceOf(deployer.address))
    );

    console.log(
      'BRATE Balance before:',
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );

    const tx = await AerodromeRouterContract.connect(deployer).swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [baseRateRoute],
      deployer.address,
      Math.floor(Date.now() / 1000) + 24 * 86400,
      { value: utils.parseEther(amount.toString()) }
    );
    await tx.wait();

    console.log(
      'BRATE Balance after:',
      utils.formatEther(await baseRate.balanceOf(deployer.address))
    );
    
  } catch (error) {
    console.error("Error in buyBRATEBSHARE:", error);
  }
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
  await setRewardPoolAndInitialize();
  await updateOracle();
  await stakeBSHAREINBoardroom();

  // test logic
  await time.increase(360 + 6 * 3600);
  await allocateSeigniorage();
  await time.increase(360 + 6 * 3600);
  await allocateSeigniorage();
  await time.increase(360 + 6 * 3600);
  await allocateSeigniorage();
  await buyAERO_USDbC(1);
  await testTransferFee();
  // await disableTax()
  await AddLiquidityEthUSDC();
  await stakeInSharePool();
  await time.increase(360 + 6 * 3600);
  await collectExternalReward();
  await unStakeInSharePool();

  // await buyBRATEBSHARE(0.1);
 
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
