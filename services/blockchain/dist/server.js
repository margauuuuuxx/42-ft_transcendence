"use strict";
// API LAYER 
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// express = web framework to define routes and HTTP handlers 
const express_1 = __importDefault(require("express"));
const blockchain_1 = require("./blockchain");
require("dotenv/config");
// creates a new Express app instance that acts as the HTTP server 
const app = (0, express_1.default)();
// adds a middleware to parse incoming JSON payloads from HTTP requests 
app.use(express_1.default.json());
// define the API endpoint to add a score
app.post('/api/blockchain/scores', async (req, res) => {
    // extract data from the request body
    try {
        const { tournamentID, player1, player2, scorePlayer1, scorePlayer2 } = req.body;
        // Add timestamp
        const scoreData = {
            tournamentID,
            player1,
            player2,
            scorePlayer1,
            scorePlayer2,
            timestamp: Math.floor(Date.now() / 1000) // Unix timestamp in seconds
        };
        console.log('Storing score on blockchain:', scoreData);
        const tx = await (0, blockchain_1.addScore)(scoreData);
        console.log('Transaction hash:', tx.hash);
        res.status(201).json({ message: 'Score added successfully', transactionHash: tx.hash }); // 201 --> code for a successfully created resource
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add score ...' }); // 500 --> generic internal server error 
    }
});
// Endpoint to get all scores 
app.get('/api/blockchain/scores', async (req, res) => {
    try {
        const scores = await (0, blockchain_1.getAllScores)();
        res.status(200).json(scores); // 200 --> generic OK response
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get scores ...' });
    }
});
// Endpoint to get scores for a specific tournament 
app.get('/api/blockchain/scores/:tournamentId', async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.tournamentId);
        const scores = await (0, blockchain_1.getScoresForTournament)(tournamentId);
        res.status(200).json(scores);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get tournament scores ...' });
    }
});
// Starting the server and listening for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
