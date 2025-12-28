export interface BlockchainScoreData {
  tournamentID: number;
  player1: string;
  player2: string;
  scorePlayer1: number;
  scorePlayer2: number;
}

export class BlockchainClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain:3000';
  }

  async storeMatchScore(data: BlockchainScoreData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Blockchain error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Score stored on blockchain: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('❌ Failed to store score on blockchain:', error);
      throw error;
    }
  }

  async getTournamentScores(tournamentId: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/blockchain/scores/${tournamentId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scores: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch blockchain scores:', error);
      throw error;
    }
  }

  // Generate deterministic Ethereum address from player alias
  generatePlayerAddress(playerAlias: string): string {
    let hash = 0;
    for (let i = 0; i < playerAlias.length; i++) {
      hash = ((hash << 5) - hash) + playerAlias.charCodeAt(i);
      hash = hash & hash;
    }
    const paddedHash = Math.abs(hash).toString(16).padStart(40, '0');
    return `0x${paddedHash}`;
  }
}
