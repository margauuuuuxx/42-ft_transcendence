// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Score is Ownable {
    struct TournamentScore {
        uint256 tournamentID;
        address player1;
        address player2;
        uint8   scorePlayer1;
        uint8   scorePlayer2;
        uint256 timestamp;
    }

    // array to store all scores 
    // public so that solidity automatically creates a getter & setter using scores indexes 
    TournamentScore[] public scores;

    // maps an ID (dictionnary) to an array of scores 
    mapping(uint256 => TournamentScore[]) public scoresByTournament;
    
    // event allows for external apps to listen for activity 
    // log event that gets emitted when a score is added 
    // indexed allows for efficient scores filtering in the frontend 
    event ScoreAdded (
        uint256 indexed tournamentID,
        address indexed player1,
        address indexed player2,
        uint8           scorePlayer1,
        uint8           scorePlayer2,
        uint256         timestamp
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    // external means that the fct can be called from outside the contract 
    // calldata to define the location of a var, used for receiving inputs in external/public fcts and only read them 
    function addScore (TournamentScore calldata s) external onlyOwner {
        require(s.player1 != s.player2, "Players must be different");
        TournamentScore memory newScore = TournamentScore ({
            tournamentID: s.tournamentID,
            player1: s.player1,
            player2: s.player2,
            scorePlayer1: s.scorePlayer1,
            scorePlayer2: s.scorePlayer2,
            timestamp: block.timestamp
        });
        scores.push(newScore);
        scoresByTournament[s.tournamentID].push(newScore);
        
        emit ScoreAdded(
            s.tournamentID,
            s.player1,
            s.player2,
            s.scorePlayer1,
            s.scorePlayer2,
            block.timestamp
        );
    }

    // view means that the fct doesnt change the blockchain --> free to call 
    // require prevents out-of bound errors 
    function getScore(uint256 index) external view returns (TournamentScore memory) {
        require(index < scores.length, "Invalid index");
        return (scores[index]);
    }

    // memory: to return a copy of the inital array that is stored temporarily in memory not on-chain 
    function getAllScores() external view returns (TournamentScore[] memory) {
        return (scores);
    }

    function getScoreCount() external view returns (uint256) {
        return (scores.length);
    }


    function getScoresForTournament(uint256 tournamentID) external view returns (TournamentScore[] memory) {
        return (scoresByTournament[tournamentID]);
    }
}
