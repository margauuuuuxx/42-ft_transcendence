// SERVICE LAYER --> FCTS TO INTERACT WITH SMART CONTRACTS 
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import "dotenv/config";

// Pah to the file where contract infos are stored
const deploymentInfoPath = path.join(__dirname, '..', 'deployment-info.json');

interface DeploymentInfo {
    address: string;
    abi: any; // any == disable type checking but field needs to be there 
}

interface TournamentScore {
    tournamentID: number;
    player1: string;
    player2: string;
    scorePlayer1: number;
    scorePlayer2: number;
    timestamp: number
}

// getting the contract instance 
// async to use fcts that handles time operations without blocking the rest of the program
async function getContract() {
    if (!fs.existsSync(deploymentInfoPath)) {
        throw new Error("Deployment info file not found ...");
    }
    const DeploymentInfo: DeploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    const contractAdress = DeploymentInfo.address;
    const contractABI = DeploymentInfo.abi;
    // read-only access to the Eth blockchain 
    const provider = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    // create a signer = something that can write operations
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(contractAdress, contractABI, signer);

    return (contract);
}

// Adding the score to the blockchain
// export --> used to make var/fcts/classses/.. available outside the current file
export async function addScore(scoreData: TournamentScore) {
    const contract = await getContract();
    const tx = await contract.addScore(scoreData); // tx = short for transaction ; calling the smart contract method 
    await tx.wait(); // wait for the transaction to be mined and confirmed by the blockchain
    
    return (tx);
}

// Getting all scores from the blockchain
export async function getAllScores() {
    const contract = await getContract();
    
    return (await contract.getAllScores());
}

// Getting the score from a specific tournament 
export async function getScoresForTournament(tournamentID: number) {
    const contract = await getContract();
    
    return (await contract.getScoresForTournament(tournamentID));    
}