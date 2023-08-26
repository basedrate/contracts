const { ethers, network } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

const addresses = [
  "0x2f104d180884061B11a54764C49De40Dce0EAfD2",
  "0x41bF8b1c8A6fe0e70f9e81A5F200395EAb0134Df"
];

const limits = [
  ethers.utils.parseEther("1"),
  ethers.utils.parseEther("2")
];

const utils = ethers.utils;
const provider = ethers.provider;

let tx, receipt; //transactions
let deployer; //addresses
let presale; //contracts

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xc92879d115fa23d6d7da27946f0dab96ea2db706"
    );
    await setBalance(deployer.address, utils.parseEther("1000000000000"));
  } else {
    [deployer] = await ethers.getSigners();
  }
  console.log(`Deployer: ${deployer.address}`);
};

const deployContracts = async () => {
  console.log("\n*** DEPLOYING CONTRACTS ***");
  const Presale = await ethers.getContractFactory(
    "BasedRateSale",
    deployer
  );
  presale = await Presale.deploy();
  await presale.deployed();
  console.log(`Presale deployed to ${presale.address}`);
  const BasedRateSale = await ethers.getContractFactory(
    "BasedRateSale",
    deployer
  );
};

const addWalletsWhitelist = async () => {
  console.log("\n*** ADDING WALLET TO WHITELIST***");
  tx = await presale.connect(deployer).addAddressesToWhitelist(addresses, limits);
  receipt = await tx.wait();

  console.log("Wallets added to whitelist");
};

const main = async () => {
  await setAddresses();
  await deployContracts();
  await addWalletsWhitelist();
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
