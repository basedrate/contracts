const { ethers, network } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
let tx, receipt; //transactions
let deployer; //wallet
let teamDistributor, treasury, baseRate;
const utils = ethers.utils;

const TREASURY = "0xdfa73618683587E1B72019546E0DD866B2Ed6Fb4";
const TEAM_DISTRIBUTOR = "0xD8363377cb54E82d40D0EC44D01d366E4b15eA0b";
const COMMUNITY = "0x514cE5da2Dc5883e40625b6e182dB437D87941A7";
const BOARDROOM = "0x60268690851a4881d1e1660fA2b565a316c9bD2b";
const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xADF9152100c536e854e0ed7A3E0E60275CeF7E7d"
    );
  } else {
   // [deployer] = await ethers.getSigners();
  }
  // console.log("Refferal:", deployer);
  console.log(`Refferal Wallet: ${deployer.address}`);
};

const attachContracts = async () => {
  const Treasury = await ethers.getContractFactory("Treasury", deployer);
  treasury = Treasury.attach(TREASURY);
  console.log(`Treasury deployed to ${treasury.address}`);

  const BaseRate = await ethers.getContractFactory("BaseRate", deployer);
  baseRate = BaseRate.attach(BRATE);
  console.log(`BaseRate deployed to ${baseRate.address}`);
};

const changeDiscount = async (amount) => {
  console.log("\n*** SETTING discount rate ***");

  const getDiscountRateBefore = await treasury.getBondDiscountRate();
  console.log("discount before is ", getDiscountRateBefore)

  const discountPercentBefore = await treasury.discountPercent();
  console.log("discountPercent before is ", discountPercentBefore)

  tx = await treasury.setDiscountPercent(amount);
  receipt = await tx.wait();

  const getDiscountRate = await treasury.getBondDiscountRate();
  console.log("discount after is ", getDiscountRate)

  const discountPercent = await treasury.discountPercent();
  console.log("discountPercent after is ", discountPercent)

};

const changePremium = async (amount) => {
  console.log("\n*** SETTING PREMIUM ***");

  const premiumPercentBefore = await treasury.premiumPercent();
  console.log("premiumPercent before is ", premiumPercentBefore)

  tx = await treasury.setPremiumPercent(amount);
  receipt = await tx.wait();


  const premiumPercent = await treasury.premiumPercent();
  console.log("premiumPercent after is ", premiumPercent)

};

const changePremiumThreshold = async (amount) => {
  console.log("\n*** SETTING PREMIUMTHRESHOLD ***");

  const premiumThresholdBefore = await treasury.premiumThreshold();
  console.log("premiumThreshold before is ", premiumThresholdBefore)

  tx = await treasury.setPremiumThreshold(amount);
  receipt = await tx.wait();


  const premiumThreshold = await treasury.premiumThreshold();
  console.log("premiumThreshold after is ", premiumThreshold)

};




const allocateSeigniorage = async () => {
  console.log("\n*** ALLOCATING SEIGNORAGE ***");
  const currentPrice = await treasury.getBaseRatePrice();
  console.log("price now is ", currentPrice)
  console.log(
    "BRATE Balance TeamDistributor Before:",
    utils.formatEther(await baseRate.balanceOf(TEAM_DISTRIBUTOR))
  );
  console.log(
    "BRATE Balance Community Fund Before:",
    utils.formatEther(await baseRate.balanceOf(COMMUNITY))
  );
  console.log(
    "BRATE Balance Boardroom Before:",
    utils.formatEther(await baseRate.balanceOf(BOARDROOM))
  );
  tx = await treasury.allocateSeigniorage();
  receipt = await tx.wait();
  console.log(
    "BRATE Balance TeamDistributor After:",
    utils.formatEther(await baseRate.balanceOf(TEAM_DISTRIBUTOR))
  );
  console.log(
    "BRATE Balance Community Fund After:",
    utils.formatEther(await baseRate.balanceOf(COMMUNITY))
  );
  console.log(
    "BRATE Balance Boardroom After:",
    utils.formatEther(await baseRate.balanceOf(BOARDROOM))
  );
};


const main = async () => {
  await setAddresses();
  await attachContracts();

  await changeDiscount(3000);
  await changePremium(5000);

  // await time.increase(6 * 3600);
  // await allocateSeigniorage();
  // await time.increase(6 * 3600);
  // await allocateSeigniorage();
  // await time.increase(6 * 3600);
  // await allocateSeigniorage();

  // await time.increase(6 * 3600);
  // await allocateSeigniorage();

};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
