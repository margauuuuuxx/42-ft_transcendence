import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// dotenv = nodeJS lib that allows the download of envv from a file named .env into your app 
dotenv.config(); // loads envv from .env into process.env 

const config: HardhatUserConfig = {
  // solidity compiler 
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        // how many times the optimizer should run  
        runs: 200,
      },
    },
  },
  
    // aka blockchain network 
  networks: {
    hardhat: {
    },
    // aka Avalanche public testnet
    fuji: {
      url: process.env.AVALANCHE_FUJI_URL || "",
      // which wallets to use to pay for gas & sign transactions on this network 
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      // unique identifier for Fuji network
      chainId: 43113,
    },
  },

  // etherscan: {
  //   apiKey: {
  //     avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || ""
  //   }
  // }
};

export default config;
