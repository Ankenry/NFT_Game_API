require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
import "@nomiclabs/hardhat-waffle";

require('dotenv').config();

const { PRIVATE_KEY, POLYGON_SCAN_API_KEY } = process.env;
module.exports = {
  defaultNetwork: "PolygonMumbai",
  networks: {
    hardhat: {
    },
    PolygonMumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY]
    },
    OasyTestnet: {
      url: "https://rpc.testnet.verse.gesoten.com",
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: POLYGON_SCAN_API_KEY
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
}