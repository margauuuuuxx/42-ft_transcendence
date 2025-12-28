export interface BlockchainScoreData {
    tournamentID: number;
    player1: string;
    player2: string;
    scorePlayer1: number;
    scorePlayer2: number;
}
export declare class BlockchainClient {
    private baseUrl;
    constructor();
    storeMatchScore(data: BlockchainScoreData): Promise<string>;
    getTournamentScores(tournamentId: number): Promise<any>;
    generatePlayerAddress(playerAlias: string): string;
}
//# sourceMappingURL=blockchainClient.d.ts.map