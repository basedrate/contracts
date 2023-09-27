const { ethers, network } = require("hardhat");

let tx, receipt; //transactions
let refferral; //wallet
let teamDistributor, treasury;

const TEAM_DISTRIBUTOR = "0xD8363377cb54E82d40D0EC44D01d366E4b15eA0b";
const TREASURY = "0xdfa73618683587E1B72019546E0DD866B2Ed6Fb4";

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    refferral = await ethers.getImpersonatedSigner(
      "0x52a7b845930260ad8c682a531fb947766e56e324"
    );
  } else {
    [, refferral] = await ethers.getSigners();
  }
  console.log(`Refferal Wallet: ${refferral.address}`);
};

const attachContracts = async () => {
  const TeamDistributor = await ethers.getContractFactory(
    "TeamDistributor",
    refferral
  );
  teamDistributor = TeamDistributor.attach(TEAM_DISTRIBUTOR);
  console.log(`TeamDistributor deployed to ${teamDistributor.address}`);


  const Treasury = await ethers.getContractFactory("Treasury", refferral);
  treasury = Treasury.attach(TREASURY);
  console.log(`Treasury deployed to ${treasury.address}`);
};


const waitUntilNextEpochPoint = async () => {
  const nextEpochPoint = await treasury.nextEpochPoint();
  const currentTime = Math.floor(Date.now() / 1000);
  const waitTime = nextEpochPoint.toNumber() + 10 - currentTime; 
  console.log(`Waiting for ${waitTime} seconds until next Epoch Point + 5 minutes...`);
  await new Promise((resolve) => setTimeout(resolve, waitTime * 1000)); 
};

const allocate = async () => {
  console.log("\n*** ALLOCATING SEIGNIORAGE ***");
  const gasEstimate = await treasury.estimateGas.allocateSeigniorage();
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await refferral.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await treasury.allocateSeigniorage({ gasLimit, gasPrice });
  receipt = await tx.wait();
};

const automatedDistribution = async () => {
  console.log("\n*** AUTOMATING DISTRIBUTION ***");
  const gasEstimate = await teamDistributor.estimateGas.automatedDistribution();
  const gasLimit = gasEstimate.mul(2);
  const currentGasPrice = await refferral.getGasPrice();
  const gasPrice = currentGasPrice.mul(2);
  tx = await teamDistributor.automatedDistribution({ gasLimit, gasPrice });
  receipt = await tx.wait();
};

const main = async () => {
  await setAddresses();
  await attachContracts();
  while (true) {
    
    await allocate();
    await automatedDistribution();
    await waitUntilNextEpochPoint();
    
  }
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
