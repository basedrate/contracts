const { ethers } = require("hardhat");

// BATCH 1 ----------------------------------------------------------------------------
const addressesBatch1 = [
  "0x2f104d180884061B11a54764C49De40Dce0EAfD2",
  "0xc92879d115Fa23D6D7DA27946F0DaB96Ea2DB706"
];

const limitsBatch1 = [
  ethers.utils.parseEther("1"),
  ethers.utils.parseEther("1.1")
];

// BATCH 2 ----------------------------------------------------------------------------
const addressesBatch2 = [
  "0x41b8f3BeF1DdA72dC0A8d315403c7B54fD667C96",
  "0xBf36450dcA0f29c59d3F8C5E6BB9E68051F4F2b8"
];

const limitsBatch2 = [
  ethers.utils.parseEther("2"),
  ethers.utils.parseEther("2.1")
];

// BATCH 3 ----------------------------------------------------------------------------
const addressesBatch3 = [
  "0x3f2688Dfc798425d08Ccce7d76B0DB8e1f23f805",
  "0xAF968931e917d2aeDAf18a6799cB8CE9489dE6C3"
];

const limitsBatch3 = [
  ethers.utils.parseEther("3"),
  ethers.utils.parseEther("3.1")
];

// BATCH 4 ----------------------------------------------------------------------------
const addressesBatch4 = [
  "0x13dfFA5E7cB0EFDAc266E9370A4deb64Da5734cD",
  "0x136c5ea5AeF3F0A0395e4415E8B7c182191eA9DA"
];

const limitsBatch4 = [
  ethers.utils.parseEther("4"),
  ethers.utils.parseEther("4.1")
];

module.exports = {
  addressesBatch1,
  limitsBatch1,
  addressesBatch2,
  limitsBatch2,
  addressesBatch3,
  limitsBatch3,
  addressesBatch4,
  limitsBatch4
};
