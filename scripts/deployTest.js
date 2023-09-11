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
  BSHARE_ETH_LP,
  BRATE_BSHARE_LP,
  ETH_USDbC_LP,
  BRATE_USDbC_LP,
  BSHARE_USDbC_LP; //addresses
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

// const startTime = 1687219200; //2023-06-20 at 00:00 UTC TO CHECK
const startTime = Math.floor(Date.now() / 1000); //Now + 20 seconds

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


const main = async () => {
  await setAddresses();
  await deployContracts();
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
