const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

const { utils, provider } = ethers;

const ARB_CONTRACT = "0x9153488633BA179F9b11474F41e835c3C41f935E";
const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";

let deployer;
let brate, bshare;

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
  const Brate = await ethers.getContractFactory("BaseRate", deployer);
  brate = Brate.attach(BRATE); 
  console.log(`BaseRate attached to ${brate.address}`);
  const Bshare = await ethers.getContractFactory("BaseShare", deployer);
  bshare = Bshare.attach(BSHARE); 
  console.log(`BaseShare attached to ${bshare.address}`);
};


const whiteList = async (contract) => {
  console.log("\n*** WHITELISTING ***");
  tx = await bshare.excludeAddress(contract);
  receipt = await tx.wait();
  console.log("bshare excludeAddress ", contract);
  tx = await brate.excludeAddress(contract);
  receipt = await tx.wait();
  console.log("brate excludeAddress ", contract);
};

const main = async () => {
  await setAddresses();
  await attachContracts();
  await whiteList(ARB_CONTRACT);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
