"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const dotenv = __importStar(require("dotenv"));
// dotenv = nodeJS lib that allows the download of envv from a file named .env into your app 
dotenv.config(); // loads envv from .env into process.env 
const config = {
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
        hardhat: {},
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
exports.default = config;
