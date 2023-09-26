require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 1000,
      },
      forking: {
        url: "https://base.getblock.io/cd6d7a8e-a470-4085-9d7c-85cd2884ef34/mainnet/", //mainnet
      },
    },
    baseMain: {
      url: `https://base.getblock.io/cd6d7a8e-a470-4085-9d7c-85cd2884ef34/mainnet/`,
      accounts: [process.env.privateKey, process.env.privateKeyRef],
    },
  },
  etherscan: {
    apiKey: {
      baseMain: process.env.apiKey,
    },
    customChains: [
      {
        network: "baseMain",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
