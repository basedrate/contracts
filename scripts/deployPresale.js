const { ethers, network } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { addressesBatch1, limitsBatch1, addressesBatch2, limitsBatch2, addressesBatch3, limitsBatch3, addressesBatch4, limitsBatch4} = require('./wallets.js');

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

const addWalletsWhitelistBatch1 = async () => {
  console.log("\n*** ADDING WALLETS TO WHITELIST***");
  const gasEstimate = await presale.estimateGas.addAddressesToWhitelist(addressesBatch1, limitsBatch1);
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await deployer.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await presale.connect(deployer).addAddressesToWhitelist(addressesBatch1, limitsBatch1, { gasLimit, gasPrice });
  receipt = await tx.wait();

  const ETHlimits = limitsBatch1.map(limit => parseFloat(ethers.utils.formatEther(limit)));
  for (let i = 0; i < addressesBatch1.length; i++) {
    console.log(`${addressesBatch1[i]}, ${ETHlimits[i]}`);
  }

  console.log("Batch 1 wallets added to whitelist");
};

const addWalletsWhitelistBatch2 = async () => {
  console.log("\n*** ADDING WALLETS TO WHITELIST***");
  const gasEstimate = await presale.estimateGas.addAddressesToWhitelist(addressesBatch2, limitsBatch2);
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await deployer.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await presale.connect(deployer).addAddressesToWhitelist(addressesBatch2, limitsBatch2, { gasLimit, gasPrice });
  receipt = await tx.wait();

  const ETHlimits = limitsBatch2.map(limit => parseFloat(ethers.utils.formatEther(limit)));
  for (let i = 0; i < addressesBatch2.length; i++) {
    console.log(`${addressesBatch2[i]}, ${ETHlimits[i]}`);
  }

  console.log("Batch 2 wallets added to whitelist");
};

const addWalletsWhitelistBatch3 = async () => {
  console.log("\n*** ADDING WALLETS TO WHITELIST***");
  const gasEstimate = await presale.estimateGas.addAddressesToWhitelist(addressesBatch3, limitsBatch3);
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await deployer.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await presale.connect(deployer).addAddressesToWhitelist(addressesBatch3, limitsBatch3, { gasLimit, gasPrice });
  receipt = await tx.wait();

  const ETHlimits = limitsBatch3.map(limit => parseFloat(ethers.utils.formatEther(limit)));
  for (let i = 0; i < addressesBatch3.length; i++) {
    console.log(`${addressesBatch3[i]}, ${ETHlimits[i]}`);
  }

  console.log("Batch 3 wallets added to whitelist");
};

const addWalletsWhitelistBatch4 = async () => {
  console.log("\n*** ADDING WALLETS TO WHITELIST***");
  const gasEstimate = await presale.estimateGas.addAddressesToWhitelist(addressesBatch4, limitsBatch4);
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await deployer.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await presale.connect(deployer).addAddressesToWhitelist(addressesBatch4, limitsBatch4, { gasLimit, gasPrice });
  receipt = await tx.wait();

  const ETHlimits = limitsBatch4.map(limit => parseFloat(ethers.utils.formatEther(limit)));
  for (let i = 0; i < addressesBatch4.length; i++) {
    console.log(`${addressesBatch4[i]}, ${ETHlimits[i]}`);
  }

  console.log("Batch 4 wallets added to whitelist");
};

const main = async () => {
  await setAddresses();
  await deployContracts();
  await addWalletsWhitelistBatch1();
  await addWalletsWhitelistBatch2();
  await addWalletsWhitelistBatch3();
  await addWalletsWhitelistBatch4();
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
