const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

const { getContractFactory, Contract } = ethers;

const { AddressZero, MaxUint256 } = ethers.constants;
const { formatEther, formatUnits, parseEther, parseUnits } = ethers.utils;
const provider = ethers.provider;

let tx, receipt; //transactions
let deployer, devWallet;
let aero,
  pool,
  poolFactory,
  votingRewardsFactory,
  gaugeFactory,
  managedRewardsFactory,
  factoryRegistry,
  forwarder,
  balanceLogicLibrary,
  delegationLogicLibrary,
  escrow,
  voter,
  router; //contracts
let presaleContractBalance; //values

const WETH = "0x4200000000000000000000000000000000000006";

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  [deployer] = await ethers.getSigners();
  await setBalance(deployer.address, parseEther("10000"));
  console.log(`Deployer: ${deployer.address}`);
};

const deployContracts = async () => {
  console.log("\n*** DEPLOYING CONTRACTS ***");
  const AERO = await getContractFactory("Aero", deployer);
  aero = await AERO.deploy();
  await aero.deployed();
  console.log("Aero address:", aero.address);
  const Pool = await getContractFactory("Pool", deployer);
  pool = await Pool.deploy();
  await pool.deployed();
  console.log("Pool address:", pool.address);
  const PoolFactory = await getContractFactory("PoolFactory", deployer);
  poolFactory = await PoolFactory.deploy(pool.address);
  await poolFactory.deployed();
  console.log("PoolFactory address:", poolFactory.address);
  const VotingRewardsFactory = await getContractFactory(
    "VotingRewardsFactory",
    deployer
  );
  votingRewardsFactory = await VotingRewardsFactory.deploy();
  await votingRewardsFactory.deployed();
  console.log("VotingRewardsFactory address:", votingRewardsFactory.address);
  const GaugeFactory = await getContractFactory("GaugeFactory", deployer);
  gaugeFactory = await GaugeFactory.deploy();
  await gaugeFactory.deployed();
  console.log("GaugeFactory address:", gaugeFactory.address);
  const ManagedRewardsFactory = await getContractFactory(
    "ManagedRewardsFactory",
    deployer
  );
  managedRewardsFactory = await ManagedRewardsFactory.deploy();
  await managedRewardsFactory.deployed();
  console.log("ManagedRewardsFactory address:", managedRewardsFactory.address);
  const FactoryRegistry = await getContractFactory("FactoryRegistry", deployer);
  factoryRegistry = await FactoryRegistry.deploy(
    poolFactory.address,
    votingRewardsFactory.address,
    gaugeFactory.address,
    managedRewardsFactory.address
  );
  await factoryRegistry.deployed();
  console.log("FactoryRegistry address:", factoryRegistry.address);
  const Forwarder = await getContractFactory("Forwarder", deployer);
  forwarder = await Forwarder.deploy();
  await forwarder.deployed();
  console.log("Forwarder address:", forwarder.address);
  const BalanceLogicLibrary = await getContractFactory(
    "BalanceLogicLibrary",
    deployer
  );
  balanceLogicLibrary = await BalanceLogicLibrary.deploy();
  await balanceLogicLibrary.deployed();
  console.log("BalanceLogicLibrary address:", balanceLogicLibrary.address);
  const DelegationLogicLibrary = await getContractFactory(
    "DelegationLogicLibrary",
    deployer
  );
  delegationLogicLibrary = await DelegationLogicLibrary.deploy();
  console.log(
    "DelegationLogicLibrary address:",
    delegationLogicLibrary.address
  );
  const libraries = {
    BalanceLogicLibrary: balanceLogicLibrary.address,
    DelegationLogicLibrary: delegationLogicLibrary.address,
  };
  const Escrow = await getContractFactory("VotingEscrow", {
    libraries,
    signer: deployer,
  });
  escrow = await Escrow.deploy(
    forwarder.address,
    aero.address,
    factoryRegistry.address
  );
  await escrow.deployed();

  console.log("VotingEscrow address:", escrow.address);
  const Voter = await getContractFactory("Voter", deployer);
  voter = await Voter.deploy(
    forwarder.address,
    escrow.address,
    factoryRegistry.address
  );
  await voter.deployed();
  console.log("Voter address:", voter.address);
  const Router = await getContractFactory("Router", deployer);
  router = await Router.deploy(
    forwarder.address,
    factoryRegistry.address,
    poolFactory.address,
    voter.address,
    WETH
  );
  console.log("Router address:", router.address);

  return { router: router, poolFactory: poolFactory };
};

const attachContracts = async () => {
  console.log("\n*** ATTACHING CONTRACTS ***");
};

const mintAERO = async () => {
  console.log("\n*** MINTING AERO***");
  tx = await aero.mint(deployer.address, parseEther("1000"));
  receipt = await tx.wait();
  console.log(
    "AERO Balance:",
    formatEther(await aero.balanceOf(deployer.address))
  );
};

const addLiquidity = async () => {
  console.log("\n*** ADDING LIQUIDITY ***");
  tx = await aero.approve(router.target, MaxUint256);
  receipt = await tx.wait();

  const AEROBalance = await aero.balanceOf(deployer.address);
  tx = await router.addLiquidityETH(
    aero.address,
    true,
    AEROBalance,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000) + 86400,
    { value: parseEther("1000") }
  );
  receipt = await tx.wait();
};

const buyAERO = async () => {
  console.log("\n*** BUYING AERO ***");
  tx = await router.swapExactETHForTokens(
    0,
    [
      {
        from: WETH,
        to: aero.target,
        stable: true,
        factory: ZeroAddress,
      },
    ],
    deployer.address,
    Math.floor(Date.now() / 1000) + 86400,
    {
      value: parseEther("1"),
    }
  );
  receipt = await tx.wait();
  console.log(
    "AERO Balance:",
    formatEther(await aero.balanceOf(deployer.address))
  );
};

const main = async () => {
  await setAddresses();
  const { router, poolFactory } = await deployContracts();
  //   await mintAERO();
  //   await addLiquidity();
  //   await buyAERO();
  return { router: router.address, poolFactory: poolFactory.address };
};

// main();

exports.deployAERO = main;

const showGasUsed = async (tx) => {
  const gasUsed = utils.formatEther(tx.gasUsed) * tx.effectiveGasPrice;
  console.log({ gasUsed });
};
