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
        url: "https://base.meowrpc.com", //mainnet
      },
    },
    baseMain: {
      url: `https://base.meowrpc.com`,
      accounts: [
        process.env.privateKey,
        process.env.privateKeyRef,
      ],
    },
  },
  etherscan: {
    apiKey: {
      pulseMain: "0",
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
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
};
