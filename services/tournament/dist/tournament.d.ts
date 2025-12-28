import { FastifyInstance } from "fastify";
export interface Tournament {
    id: number;
    name: string;
    status: 'registration' | 'in_progress' | 'completed';
    max_players: number;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}
export interface TournamentRegistration {
    id?: number;
    tournament_id: number;
    player_alias: string;
    registered_at?: string;
}
export interface TournamentBracket {
    id?: number;
    tournament_id: number;
    round: number;
    position: number;
    player1_alias: string | null;
    player2_alias: string | null;
    winner_alias: string | null;
    match_id: number | null;
}
export interface TournamentMatch {
    id?: number;
    tournament_id: number;
    player_left_alias: string;
    player_right_alias: string;
    winner_alias: string;
    score_left: number;
    score_right: number;
    blockchain_tx_hash?: string;
    blockchain_verified?: boolean;
    created_at?: string;
}
export interface LeaderboardRow {
    alias: string;
    wins: number;
    losses: number;
    games_played: number;
}
export declare function createTournament(name: string, maxPlayers?: number): Promise<Tournament>;
export declare function getTournamentById(id: number): Promise<Tournament | null>;
export declare function getAllTournaments(): Promise<Tournament[]>;
export declare function registerPlayerForTournament(tournamentId: number, playerAlias: string): Promise<void>;
export declare function getTournamentRegistrations(tournamentId: number): Promise<TournamentRegistration[]>;
export declare function unregisterPlayer(tournamentId: number, playerAlias: string): Promise<void>;
export declare function startTournament(tournamentId: number): Promise<void>;
export declare function getTournamentBrackets(tournamentId: number): Promise<TournamentBracket[]>;
export declare function addTournamentMatch(params: {
    tournament_id: number;
    player_left_alias: string;
    player_right_alias: string;
    winner_alias: string;
    score_left: number;
    score_right: number;
}): Promise<number>;
export declare function updateBracketWithMatchResult(tournamentId: number, matchId: number, winnerAlias: string): Promise<void>;
export declare function getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]>;
export declare function updateMatchBlockchainInfo(matchId: number, txHash: string): Promise<void>;
export declare function getTournamentLeaderboard(tournamentId: number): Promise<LeaderboardRow[]>;
export declare function registerTournamentRoutes(server: FastifyInstance): void;
//# sourceMappingURL=tournament.d.ts.map