import { openDb } from "./db.js";
import { BlockchainClient } from "./blockchainClient.js";
// ============== TOURNAMENT CRUD ==============
export async function createTournament(name, maxPlayers = 8) {
    const db = await openDb();
    const result = await db.run(`INSERT INTO tournaments (name, max_players) VALUES (?, ?)`, [name, maxPlayers]);
    const row = await db.get(`SELECT * FROM tournaments WHERE id = ?`, [result.lastID]);
    await db.close();
    if (!row)
        throw new Error("Failed to create tournament");
    return row;
}
export async function getTournamentById(id) {
    const db = await openDb();
    const row = await db.get(`SELECT * FROM tournaments WHERE id = ?`, [id]);
    await db.close();
    return row ?? null;
}
export async function getAllTournaments() {
    const db = await openDb();
    const rows = await db.all(`SELECT * FROM tournaments ORDER BY created_at DESC`);
    await db.close();
    return rows;
}
// ============== REGISTRATION ==============
export async function registerPlayerForTournament(tournamentId, playerAlias) {
    const db = await openDb();
    // Check tournament status and capacity
    const tournament = await db.get(`SELECT t.*, COUNT(r.id) as current_players 
     FROM tournaments t 
     LEFT JOIN tournament_registrations r ON t.id = r.tournament_id 
     WHERE t.id = ? 
     GROUP BY t.id`, [tournamentId]);
    if (!tournament) {
        await db.close();
        throw new Error("Tournament not found");
    }
    if (tournament.status !== 'registration') {
        await db.close();
        throw new Error("Tournament is not accepting registrations");
    }
    if (tournament.current_players >= tournament.max_players) {
        await db.close();
        throw new Error("Tournament full");
    }
    await db.run(`INSERT INTO tournament_registrations (tournament_id, player_alias) VALUES (?, ?)`, [tournamentId, playerAlias]);
    await db.close();
}
export async function getTournamentRegistrations(tournamentId) {
    const db = await openDb();
    const rows = await db.all(`SELECT * FROM tournament_registrations WHERE tournament_id = ? ORDER BY registered_at ASC`, [tournamentId]);
    await db.close();
    return rows;
}
export async function unregisterPlayer(tournamentId, playerAlias) {
    const db = await openDb();
    const tournament = await db.get(`SELECT * FROM tournaments WHERE id = ?`, [tournamentId]);
    if (!tournament) {
        await db.close();
        throw new Error("Tournament not found");
    }
    if (tournament.status !== 'registration') {
        await db.close();
        throw new Error("Cannot unregister after tournament started");
    }
    await db.run(`DELETE FROM tournament_registrations WHERE tournament_id = ? AND player_alias = ?`, [tournamentId, playerAlias]);
    await db.close();
}
// ============== BRACKET GENERATION ==============
export async function startTournament(tournamentId) {
    const db = await openDb();
    const registrations = await db.all(`SELECT * FROM tournament_registrations WHERE tournament_id = ? ORDER BY registered_at ASC`, [tournamentId]);
    if (registrations.length < 2) {
        await db.close();
        throw new Error("Need at least 2 players to start tournament");
    }
    // Update tournament status
    await db.run(`UPDATE tournaments SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = ?`, [tournamentId]);
    // Generate single elimination bracket
    const players = registrations.map(r => r.player_alias);
    // Create first round matches (only for real matchups - no byes shown)
    let position = 0;
    for (let i = 0; i < players.length; i += 2) {
        const player1 = players[i];
        const player2 = players[i + 1];
        if (player2) {
            // Both players exist - create a real match
            await db.run(`INSERT INTO tournament_brackets (tournament_id, round, position, player1_alias, player2_alias, winner_alias) 
         VALUES (?, 1, ?, ?, ?, ?)`, [tournamentId, position, player1, player2, null]);
            position++;
        }
        // If no player2, player1 gets a bye - don't create any bracket entry
        // They'll advance when we generate next round
    }
    await db.close();
}
export async function getTournamentBrackets(tournamentId) {
    const db = await openDb();
    const brackets = await db.all(`SELECT * FROM tournament_brackets WHERE tournament_id = ? ORDER BY round ASC, position ASC`, [tournamentId]);
    await db.close();
    return brackets;
}
// ============== MATCH MANAGEMENT ==============
export async function addTournamentMatch(params) {
    const { tournament_id, player_left_alias, player_right_alias, winner_alias, score_left, score_right } = params;
    const db = await openDb();
    const result = await db.run(`
    INSERT INTO tournament_matches (
      tournament_id,
      player_left_alias,
      player_right_alias,
      winner_alias,
      score_left,
      score_right
    ) VALUES (?, ?, ?, ?, ?, ?)`, [tournament_id, player_left_alias, player_right_alias, winner_alias, score_left, score_right]);
    const matchId = result.lastID;
    await db.close();
    return matchId;
}
export async function updateBracketWithMatchResult(tournamentId, matchId, winnerAlias) {
    const db = await openDb();
    // Find and update the bracket entry
    const bracket = await db.get(`SELECT * FROM tournament_brackets 
     WHERE tournament_id = ? 
     AND (player1_alias = ? OR player2_alias = ?)
     AND winner_alias IS NULL
     ORDER BY round ASC, position ASC
     LIMIT 1`, [tournamentId, winnerAlias, winnerAlias]);
    if (bracket) {
        await db.run(`UPDATE tournament_brackets 
       SET winner_alias = ?, match_id = ? 
       WHERE id = ?`, [winnerAlias, matchId, bracket.id]);
        // Advance winner to next round
        await advanceWinnerToNextRound(db, tournamentId, bracket.round, bracket.position, winnerAlias);
    }
    // Check if tournament is complete
    const remainingMatches = await db.get(`SELECT COUNT(*) as count FROM tournament_brackets 
     WHERE tournament_id = ? 
     AND winner_alias IS NULL 
     AND player2_alias IS NOT NULL`, [tournamentId]);
    if (remainingMatches?.count === 0) {
        // Find the final winner (highest round winner)
        const finalWinner = await db.get(`SELECT winner_alias FROM tournament_brackets 
       WHERE tournament_id = ? 
       AND winner_alias IS NOT NULL
       ORDER BY round DESC, position ASC
       LIMIT 1`, [tournamentId]);
        await db.run(`UPDATE tournaments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [tournamentId]);
        console.log(`🏆 Tournament ${tournamentId} completed! Winner: ${finalWinner?.winner_alias}`);
    }
    await db.close();
}
async function advanceWinnerToNextRound(db, tournamentId, currentRound, currentPosition, winnerAlias) {
    const nextRound = currentRound + 1;
    const nextPosition = Math.floor(currentPosition / 2);
    // Check if next round bracket exists
    let nextBracket = await db.get(`SELECT * FROM tournament_brackets 
     WHERE tournament_id = ? AND round = ? AND position = ?`, [tournamentId, nextRound, nextPosition]);
    if (!nextBracket) {
        // Create next round bracket
        await db.run(`INSERT INTO tournament_brackets (tournament_id, round, position, player1_alias, player2_alias) 
       VALUES (?, ?, ?, ?, NULL)`, [tournamentId, nextRound, nextPosition, winnerAlias]);
    }
    else {
        // Update existing bracket with second player
        if (!nextBracket.player1_alias) {
            await db.run(`UPDATE tournament_brackets SET player1_alias = ? WHERE id = ?`, [winnerAlias, nextBracket.id]);
        }
        else if (!nextBracket.player2_alias) {
            await db.run(`UPDATE tournament_brackets SET player2_alias = ? WHERE id = ?`, [winnerAlias, nextBracket.id]);
        }
    }
}
export async function getTournamentMatches(tournamentId) {
    const db = await openDb();
    const rows = await db.all(`SELECT * FROM tournament_matches 
     WHERE tournament_id = ? 
     ORDER BY created_at ASC`, [tournamentId]);
    await db.close();
    return rows;
}
export async function updateMatchBlockchainInfo(matchId, txHash) {
    const db = await openDb();
    await db.run(`UPDATE tournament_matches 
     SET blockchain_tx_hash = ?, blockchain_verified = 1 
     WHERE id = ?`, [txHash, matchId]);
    await db.close();
}
// ============== LEADERBOARD ==============
export async function getTournamentLeaderboard(tournamentId) {
    const db = await openDb();
    const rows = await db.all(`WITH all_players AS (
      SELECT
        player_left_alias AS player_alias,
        winner_alias
      FROM tournament_matches
      WHERE tournament_id = ?
      UNION ALL
      SELECT
        player_right_alias AS player_alias,
        winner_alias
      FROM tournament_matches
      WHERE tournament_id = ?
    )
    SELECT
      player_alias AS alias,
      SUM(CASE WHEN player_alias = winner_alias THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN player_alias <> winner_alias THEN 1 ELSE 0 END) AS losses,
      COUNT(*) AS games_played
    FROM all_players
    GROUP BY player_alias
    ORDER BY wins DESC, games_played DESC, alias ASC`, [tournamentId, tournamentId]);
    await db.close();
    return rows;
}
// ============== ROUTES ==============
export function registerTournamentRoutes(server) {
    // Create tournament
    server.post("/tournaments", async (req, reply) => {
        const { name, max_players } = req.body;
        if (!name || typeof name !== "string" || name.trim() === "") {
            return reply.code(400).send({ error: "Tournament name is required" });
        }
        try {
            const tournament = await createTournament(name.trim(), max_players || 8);
            return reply.code(201).send(tournament);
        }
        catch (err) {
            console.error("POST /tournaments error:", err);
            return reply.code(500).send({ error: "Internal error while creating tournament" });
        }
    });
    // Get all tournaments
    server.get("/tournaments", async (req, reply) => {
        try {
            const tournaments = await getAllTournaments();
            return reply.code(200).send({ tournaments });
        }
        catch (err) {
            console.error("GET /tournaments error:", err);
            return reply.code(500).send({ error: "Internal error" });
        }
    });
    // Get tournament by ID
    server.get("/tournaments/:id", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            const tournament = await getTournamentById(tournamentId);
            if (!tournament) {
                return reply.code(404).send({ error: "Tournament not found" });
            }
            return reply.code(200).send(tournament);
        }
        catch (err) {
            console.error("GET /tournaments/:id error:", err);
            return reply.code(500).send({ error: "Internal error" });
        }
    });
    // Register player for tournament
    server.post("/tournaments/:id/register", async (req, reply) => {
        const { id } = req.params;
        const { player_alias } = req.body;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId) || !player_alias) {
            return reply.code(400).send({ error: "Invalid input" });
        }
        try {
            await registerPlayerForTournament(tournamentId, player_alias);
            return reply.code(201).send({ message: "Player registered successfully" });
        }
        catch (err) {
            if (err.message.includes('UNIQUE constraint')) {
                return reply.code(409).send({ error: "Player already registered" });
            }
            if (err.message.includes('Tournament full')) {
                return reply.code(400).send({ error: err.message });
            }
            console.error("Registration error:", err);
            return reply.code(500).send({ error: "Failed to register player" });
        }
    });
    // Unregister player
    server.delete("/tournaments/:id/register/:player", async (req, reply) => {
        const { id, player } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId) || !player) {
            return reply.code(400).send({ error: "Invalid input" });
        }
        try {
            await unregisterPlayer(tournamentId, player);
            return reply.code(200).send({ message: "Player unregistered successfully" });
        }
        catch (err) {
            console.error("Unregister error:", err);
            return reply.code(400).send({ error: err.message });
        }
    });
    // Get tournament registrations
    server.get("/tournaments/:id/registrations", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            const registrations = await getTournamentRegistrations(tournamentId);
            return reply.code(200).send({ registrations });
        }
        catch (err) {
            console.error("Get registrations error:", err);
            return reply.code(500).send({ error: "Failed to get registrations" });
        }
    });
    // Start tournament (generates brackets)
    server.post("/tournaments/:id/start", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            await startTournament(tournamentId);
            return reply.code(200).send({ message: "Tournament started, brackets generated" });
        }
        catch (err) {
            console.error("Start tournament error:", err);
            return reply.code(400).send({ error: err.message });
        }
    });
    // Get tournament brackets
    server.get("/tournaments/:id/brackets", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            const brackets = await getTournamentBrackets(tournamentId);
            return reply.code(200).send({ brackets });
        }
        catch (err) {
            console.error("Get brackets error:", err);
            return reply.code(500).send({ error: "Failed to get brackets" });
        }
    });
    // Record match result (with blockchain integration)
    server.post("/tournaments/matches", async (req, reply) => {
        const body = req.body;
        // Validation
        if (body.tournament_id == null ||
            !body.player_left_alias ||
            !body.player_right_alias ||
            typeof body.score_left !== "number" ||
            typeof body.score_right !== "number" ||
            (body.winner !== "left" && body.winner !== "right")) {
            return reply.code(400).send({ error: "Invalid match payload" });
        }
        const winnerAlias = body.winner === "left" ? body.player_left_alias : body.player_right_alias;
        try {
            // 1. Save match to local database
            const matchId = await addTournamentMatch({
                tournament_id: body.tournament_id,
                player_left_alias: body.player_left_alias,
                player_right_alias: body.player_right_alias,
                winner_alias: winnerAlias,
                score_left: body.score_left,
                score_right: body.score_right,
            });
            // 2. Update tournament bracket
            await updateBracketWithMatchResult(body.tournament_id, matchId, winnerAlias);
            // 3. Store on blockchain (async - don't block response)
            const blockchainClient = new BlockchainClient();
            blockchainClient.storeMatchScore({
                tournamentID: body.tournament_id,
                player1: blockchainClient.generatePlayerAddress(body.player_left_alias),
                player2: blockchainClient.generatePlayerAddress(body.player_right_alias),
                scorePlayer1: body.score_left,
                scorePlayer2: body.score_right
            })
                .then(async (txHash) => {
                await updateMatchBlockchainInfo(matchId, txHash);
                console.log(`✅ Match ${matchId} verified on blockchain: ${txHash}`);
            })
                .catch(err => {
                console.error('❌ Blockchain storage failed (non-critical):', err);
            });
            return reply.code(201).send({
                message: "Match recorded",
                matchId,
                blockchainPending: true
            });
        }
        catch (err) {
            console.error("Match recording error:", err);
            return reply.code(500).send({ error: "Internal error for the matches" });
        }
    });
    // Get tournament matches
    server.get("/tournaments/:id/matches", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            const matches = await getTournamentMatches(tournamentId);
            return reply.code(200).send({ matches });
        }
        catch (err) {
            console.error("Get matches error:", err);
            return reply.code(500).send({ error: "Failed to get matches" });
        }
    });
    // Get tournament leaderboard
    server.get("/tournaments/:id/leaderboard", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId)) {
            return reply.code(400).send({ error: "Invalid tournament id" });
        }
        try {
            const leaderboard = await getTournamentLeaderboard(tournamentId);
            return reply.code(200).send({ leaderboard });
        }
        catch (err) {
            console.error("Get leaderboard error:", err);
            return reply.code(500).send({ error: "Failed to get leaderboard" });
        }
    });
}
//# sourceMappingURL=tournament.js.map