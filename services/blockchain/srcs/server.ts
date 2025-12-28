// API LAYER 

// express = web framework to define routes and HTTP handlers 
import express, { Request, Response } from 'express';
import { addScore, getAllScores, getScoresForTournament } from './blockchain'
import 'dotenv/config'

// creates a new Express app instance that acts as the HTTP server 
const app = express();

// adds a middleware to parse incoming JSON payloads from HTTP requests 
app.use(express.json());

// define the API endpoint to add a score
app.post('/api/blockchain/scores', async (req: Request, res: Response) => {
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
        const tx = await addScore(scoreData);
        console.log('Transaction hash:', tx.hash);
        
        res.status(201).json({ message: 'Score added successfully', transactionHash: tx.hash }); // 201 --> code for a successfully created resource
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add score ...' }); // 500 --> generic internal server error 
    }
})

// Endpoint to get all scores 
app.get('/api/blockchain/scores', async(req: Request, res: Response) => {
    try {
        const scores = await getAllScores();
        res.status(200).json(scores); // 200 --> generic OK response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get scores ...'});
    }
})

// Endpoint to get scores for a specific tournament 
app.get('/api/blockchain/scores/:tournamentId', async(req: Request, res: Response) => {
    try {
        const tournamentId = parseInt(req.params.tournamentId);
        const scores = await getScoresForTournament(tournamentId);
        res.status(200).json(scores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get tournament scores ...' });
    }
});

// Starting the server and listening for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});