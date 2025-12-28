// lib to ineract with eth / EVM-compatible blockchains 
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying with account: ", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance: ", ethers.formatEther(balance));

    // loads the contract as a deployable class 
    const Score = await ethers.getContractFactory("Score");
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
    const deploymentPath = path.join(__dirname, '..', 'deployment-info.json');

    // saving the info into deployment-info.json
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});