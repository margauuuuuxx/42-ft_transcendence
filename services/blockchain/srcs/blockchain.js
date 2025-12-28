"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addScore = addScore;
exports.getAllScores = getAllScores;
exports.getScoresForTournament = getScoresForTournament;
// SERVICE LAYER --> FCTS TO INTERACT WITH SMART CONTRACTS 
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
// Pah to the file where contract infos are stored
const deploymentInfoPath = path_1.default.join(__dirname, '..', 'deployment-info.json');
// getting the contract instance 
// async to use fcts that handles time operations without blocking the rest of the program
async function getContract() {
    if (!fs_1.default.existsSync(deploymentInfoPath)) {
        throw new Error("Deployment info file not found ...");
    }
    const DeploymentInfo = JSON.parse(fs_1.default.readFileSync(deploymentInfoPath, 'utf8'));
    const contractAdress = DeploymentInfo.address;
    const contractABI = DeploymentInfo.abi;
    // read-only access to the Eth blockchain 
    const provider = new ethers_1.ethers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    // create a signer = something that can write operations
    const signer = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers_1.ethers.Contract(contractAdress, contractABI, signer);
    return (contract);
}
// Adding the score to the blockchain
// export --> used to make var/fcts/classses/.. available outside the current file
async function addScore(scoreData) {
    const contract = await getContract();
    const tx = await contract.addScore(scoreData); // tx = short for transaction ; calling the smart contract method 
    await tx.wait(); // wait for the transaction to be mined and confirmed by the blockchain
    return (tx);
}
// Getting all scores from the blockchain
async function getAllScores() {
    const contract = await getContract();
    return (await contract.getAllScores());
}
// Getting the score from a specific tournament 
async function getScoresForTournament(tournamentID) {
    const contract = await getContract();
    return (await contract.getScoresForTournament(tournamentID));
}
