const { ethers, network } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("./RouterABI.json");
const FactoryABI = require("./factoryABI.json");
const LPABI = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json").abi;
const ERC20ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
const WETHABI = require("@uniswap/v2-periphery/build/IWETH.json").abi;

const { utils, provider, BigNumber } = ethers;

let tx, receipt; //transactions
let deployer, user; //wallet
let brate, bshare, pbond, baseShareRewardPool;

const AerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
const AerodromeFactory = "0x420dd381b31aef6683db6b902084cb0ffece40da";
const WETH = "0x4200000000000000000000000000000000000006";
const BASEHAREREWARDPOOL = "0xbCE487e8BAe42370536544ed533Bada46bCCF6Ef";
const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";
const USDR = "0x9483ab65847a447e36d21af1cab8c87e9712ff93";
const USDbC = "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca";
const gauge_USDR_USDbC = "0xF64957C35409055776C7122AC655347ef88eaF9B";

const zero = "0x0000000000000000000000000000000000000000";


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

const WETHContract = new ethers.Contract(WETH, WETHABI, provider);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xADF9152100c536e854e0ed7A3E0E60275CeF7E7d"
    );
  } else {
    [deployer] = await ethers.getSigners();
  }
  console.log(`Deployer: ${deployer.address}`);
};

const attachContracts = async () => {
  const BaseShareRewardPool = await ethers.getContractFactory(
    "BaseShareRewardPool",
    deployer
  );
  baseShareRewardPool = BaseShareRewardPool.attach(BASEHAREREWARDPOOL);
  console.log(
    `BaseShareRewardPool deployed to ${baseShareRewardPool.address}`
  );
};

const addPool = async (token0, token1, stable,gauge, startTime, alloc, feeIn,feeOut) => {
  
  const pair = await AerodromeRouterContract.poolFor(
    token0,
    token1,
    stable,
    AerodromeFactory
  );

  console.log({ pair });

  tx = await baseShareRewardPool.add(alloc, pair, true, startTime, feeIn, feeOut, gauge);
  receipt = await tx.wait();
  console.log("PAIR ADDED");
};

const main = async () => {
  await setAddresses();
  await attachContracts();
  const startTime = 1696269600;

  // token0, token1, stable,gauge, startTime, alloc, feeIn,feeOut

  console.log("\n*** BRATE-BSHARE ***");
  await addPool(BRATE, BSHARE,false,zero, startTime, 300, 0, 0);

  console.log("\n*** USDR-USDbC ***");
  await addPool(USDR, USDbC,false,gauge_USDR_USDbC, startTime, 300, 400, 0);

};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
