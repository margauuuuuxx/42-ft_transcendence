"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// lib to ineract with eth / EVM-compatible blockchains 
const hardhat_1 = require("hardhat");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function main() {
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Deploying with account: ", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance: ", hardhat_1.ethers.formatEther(balance));
    // loads the contract as a deployable class 
    const Score = await hardhat_1.ethers.getContractFactory("Score");
    const score = await Score.deploy(deployer.address);
    // waits for the deployment to be mined 
    await score.waitForDeployment();
    const contractAdress = await score.getAddress();
    console.log("Score deployed to: ", score.target);
    // Save the contract's address and ABI (Application Binary Interface)
    const deploymentInfo = {
        address: contractAdress,
        abi: Score.interface.formatJson()
    };
    // file path where the data will be written
    const deploymentPath = path_1.default.join(__dirname, '..', 'deployment-info.json');
    // saving the info into deployment-info.json
    fs_1.default.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
