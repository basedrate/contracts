const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const PoolABI =
  require("../artifacts/contracts/aerodrome/Pool.sol/Pool.json").abi;
const GaugeABI =
  require("../artifacts/contracts/aerodrome/gauges/Gauge.sol/Gauge.json").abi;
const ERC20ABI =
  require("@openzeppelin/contracts/build/contracts/ERC20.json").abi;
const { utils, provider } = ethers;

const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";
const AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
const wUSDR = "0x9483ab65847a447e36d21af1cab8c87e9712ff93";
const USDbC = "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca";
const WETH = "0x4200000000000000000000000000000000000006";
const REWARDPOOL = "0xbCE487e8BAe42370536544ed533Bada46bCCF6Ef";
const vAMMWETHUSDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const vAMMWETHBSHARE = "0xF909B746Ce48dede23c09B05B3fA27754E768Bd2";
const vAMMAEROUSDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const vAMMWUSDRUSDbC = "0x3Fc28BFac25fC8e93B5b2fc15EfBBD5a8aA44eFe";
const sAMMWETHBRATE = "0x8071175D8fe0055048B0654B10c88CAD5D2D1F19";
const vAMMBRATEUSDbC = "0x1A3b6d3389e0e0E7EE3f5C43867d6961fc98341b";
const vAMMBSHAREUSDbC = "0xa491f60Dcbd14121CAE9d7eBA3d73Ee8D4ab4A6c";
const vAMMBRATEBSHARE = "0xFca502Cde28699C38ff0540a2206Fed5023e8B6A";
const vAMMOVNUSDPLUS = "0x61366A4e6b1DB1b85DD701f2f4BFa275EF271197";

const vAMMWETHUSDbC_Gauge = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const vAMMAEROUSDbC_Gauge = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const vAMMWUSDRUSDbC_Gauge = "0xF64957C35409055776C7122AC655347ef88eaF9B";

let deployer;
let rewardPool;

const BRATEContract = new ethers.Contract(BRATE, ERC20ABI, provider);
const BSHAREContract = new ethers.Contract(BSHARE, ERC20ABI, provider);
const WETHContract = new ethers.Contract(WETH, ERC20ABI, provider);
const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const AEROContract = new ethers.Contract(AERO, ERC20ABI, provider);
const WUSDRContract = new ethers.Contract(wUSDR, ERC20ABI, provider);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xADF9152100c536e854e0ed7A3E0E60275CeF7E7d"
    );
  } else {
    [deployer] = await ethers.getSigners();
  }
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log("Deployer Balance:", utils.formatEther(balance));
};

const attachContracts = async () => {
  const BaseShareRewardPool = await ethers.getContractFactory(
    "BaseShareRewardPool",
    deployer
  );
  rewardPool = BaseShareRewardPool.attach(REWARDPOOL);
  console.log(`BaseShareRewardPool attached to ${rewardPool.address}`);
};

const getSwapFees = async (pools) => {
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const poolContract = new ethers.Contract(pool, PoolABI, provider);
    console.log(`\n CLAIMING ${await poolContract.symbol()}`);
    const [claimableRewardPool0, claimableRewardPool1] = await poolContract
      .connect(REWARDPOOL)
      .callStatic.claimFees();
    const [token0, token1] = await poolContract.tokens();
    const token0Contract = new ethers.Contract(token0, ERC20ABI, provider);
    const token1Contract = new ethers.Contract(token1, ERC20ABI, provider);
    const decimals0 = await token0Contract.decimals();
    const decimals1 = await token1Contract.decimals();
    const symbol0 = await token0Contract.symbol();
    const symbol1 = await token1Contract.symbol();
    console.log(utils.formatUnits(claimableRewardPool0, decimals0), symbol0);
    console.log(utils.formatUnits(claimableRewardPool1, decimals1), symbol1);
  }
};

const main = async () => {
  await setAddresses();
  await attachContracts();

  await getSwapFees([
    sAMMWETHBRATE,
    vAMMWETHBSHARE,
    vAMMAEROUSDbC,
    vAMMWUSDRUSDbC,
    vAMMWETHUSDbC,
    vAMMBRATEUSDbC,
    vAMMBSHAREUSDbC,
    vAMMBRATEBSHARE,
    vAMMOVNUSDPLUS,
  ]);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
