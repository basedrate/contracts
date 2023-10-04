const { ethers, network } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const RouterABI = require("./RouterABI.json");
const LPABI = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json").abi;
const ERC20ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
const WETHABI = require("@uniswap/v2-periphery/build/IWETH.json").abi;

const { utils, provider } = ethers;

let tx, receipt; //transactions
let deployer, user; //wallet
let oldCommunityFund, newCommunityFund;

const vAMMWETHUSDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const vAMMWETHBSHARE = "0xF909B746Ce48dede23c09B05B3fA27754E768Bd2";
const vAMMAEROUSDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const vAMMWUSDRUSDbC = "0x3Fc28BFac25fC8e93B5b2fc15EfBBD5a8aA44eFe";
const sAMMWETHBRATE = "0x8071175D8fe0055048B0654B10c88CAD5D2D1F19";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";
const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const OLD_COMMUNITY_FUND = "0x514cE5da2Dc5883e40625b6e182dB437D87941A7";
const NEW_COMMUNITY_FUND = "0x3A462BC5525eEC6fF01e934486BFd874CDbF01cA";

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
  const CommunityFund = await ethers.getContractFactory(
    "CommunityFund",
    deployer
  );
  oldCommunityFund = CommunityFund.attach(OLD_COMMUNITY_FUND);
  console.log(`OldCommunityFund attached to ${oldCommunityFund.address}`);
  const CommunityFundV2 = await ethers.getContractFactory(
    "CommunityFundV2",
    deployer
  );
  newCommunityFund = CommunityFundV2.attach(NEW_COMMUNITY_FUND);
  console.log(`NewCommunityFund attached to ${newCommunityFund.address}`);
};

const recoverTokens = async (token, fromContract, to) => {
  console.log("*** RECOVERING TOKENS ***");
  const tokenContract = new ethers.Contract(token, ERC20ABI, provider);
  const balanceStart = await tokenContract.balanceOf(to);
  tx = await fromContract.recoverTokens(token, to);
  receipt = await tx.wait();
  const balanceFinish = await tokenContract.balanceOf(to);
  const decimals = await tokenContract.decimals();
  const balanceWithdrew = balanceFinish.sub(balanceStart);
  console.log("Withdrew:", utils.formatUnits(balanceWithdrew, decimals));
  console.log(
    "BalanceOf new owner:",
    utils.formatUnits(await tokenContract.balanceOf(to), decimals)
  );
};

const main = async () => {
  await setAddresses();
  await attachContracts();

  // console.log("\nwithdrawing BSHARE to ", NEW_COMMUNITY_FUND);
  // await recoverTokens(BSHARE, oldCommunityFund, NEW_COMMUNITY_FUND);
  console.log("\nwithdrawing BRATE to ", NEW_COMMUNITY_FUND);
  await recoverTokens(BRATE, oldCommunityFund, NEW_COMMUNITY_FUND);

  console.log("\nwithdrawing vAMMWETHUSDbC to ", NEW_COMMUNITY_FUND);
  await recoverTokens(vAMMWETHUSDbC, oldCommunityFund, NEW_COMMUNITY_FUND);
  console.log("\nwithdrawing vAMMWETHBSHARE to ", NEW_COMMUNITY_FUND);
  await recoverTokens(vAMMWETHBSHARE, oldCommunityFund, NEW_COMMUNITY_FUND);
  console.log("\nwithdrawing vAMMAEROUSDbC to ", NEW_COMMUNITY_FUND);
  await recoverTokens(vAMMAEROUSDbC, oldCommunityFund, NEW_COMMUNITY_FUND);
  console.log("\nwithdrawing vAMMAEROUSDbC to ", NEW_COMMUNITY_FUND);
  await recoverTokens(vAMMWUSDRUSDbC, oldCommunityFund, NEW_COMMUNITY_FUND);
  console.log("\nwithdrawing sAMMWETHBRATE to ", NEW_COMMUNITY_FUND);
  await recoverTokens(sAMMWETHBRATE, oldCommunityFund, NEW_COMMUNITY_FUND);

  // console.log("\nTESTING GET BACK TOKENS FROM NEW COMMUNITY FUND");
  // await recoverTokens(BSHARE, newCommunityFund, deployer.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
