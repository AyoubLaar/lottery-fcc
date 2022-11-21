require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const GOERLI_URL = process.env.GOERLI_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COIN_MARKET_API_KEY = process.env.COIN_MARKET_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_URL,
      accounts: [
        PRIVATE_KEY,
        "1e2690341098898a0c95e00ec65858722231100306ecc497de8e197c7db6ed80",
      ],
      blockConfirmations: 6,
      chainId: 5,
      gasPrice: 6000000,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY, //apikey is written with camelCase K
  },
  solidity: "0.8.7",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COIN_MARKET_API_KEY,
    token: "ETH",
  },
};
