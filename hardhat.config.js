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
        url: "https://rpc.pulsechain.com", //mainnet
      },
    },
    pulseMain: {
      url: `https://pulsechain.publicnode.com`,
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
        network: "pulseMain",
        chainId: 369,
        urls: {
          apiURL: "https://scan.pulsechain.com/api",
          browserURL: "https://scan.pulsechain.com/",
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
