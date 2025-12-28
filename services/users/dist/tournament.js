import { openDb } from "./db.js";
export async function initTournamentDb() {
    const db = await openDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
    await db.exec(`CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      player_left_alias TEXT NOT NULL,
      player_right_alias TEXT NOT NULL,
      winner_alias TEXT NOT NULL,
      score_left INTEGER NOT NULL,
      score_right INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE);`);
    await db.close();
}
export function registerTournamentRoutes(server) {
    server.post("/tournaments", async (req, reply) => {
        const { name } = req.body;
        if (!name || typeof name !== "string" || name.trim() === "") {
            return reply.code(400).send({ error: "Tournament name is required" });
        }
        try {
            const tournament = await createTournament(name.trim());
            return reply.code(201).send({
                id: tournament.id,
                name: tournament.name,
                created_at: tournament.created_at,
            });
        }
        catch (err) {
            console.error("POST /tournaments error:", err);
            return reply.code(500).send({ error: "Internal error while creating tournament" });
        }
    });
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
            return reply.code(500).send({ error: "Internal error while reading tournament" });
        }
    });
    server.post("/tournaments/matches", async (req, reply) => {
        const body = req.body;
        if (body.tournament_id == null || !body.player_left_alias ||
            !body.player_right_alias || typeof body.score_left !== "number" ||
            typeof body.score_right !== "number" ||
            (body.winner !== "left" && body.winner !== "right")) {
            return reply.code(400).send({ error: "Invalid match payload" });
        }
        const winnerAlias = (body.winner === "left" ? body.player_left_alias : body.player_right_alias);
        try {
            await addTournamentMatch({ tournament_id: body.tournament_id,
                player_left_alias: body.player_left_alias,
                player_right_alias: body.player_right_alias,
                winner_alias: winnerAlias,
                score_left: body.score_left,
                score_right: body.score_right, });
            return reply.code(201).send({ message: "Match recorded" });
        }
        catch (err) {
            return reply.code(500).send({ error: "Internal error for the matches" });
        }
    });
    server.get("/tournaments/:id/leaderboard", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId))
            return reply.code(400).send({ error: "Invalid tournament id" });
        try {
            const leaderboard = await getTournamentLeaderboard(tournamentId);
            return reply.code(200).send({ leaderboard });
        }
        catch (err) {
            return reply.code(500).send({ error: "Internal error while reading leaderboard" });
        }
    });
    server.get("/tournaments/:id/matches", async (req, reply) => {
        const { id } = req.params;
        const tournamentId = Number(id);
        if (Number.isNaN(tournamentId))
            return reply.code(400).send({ error: "Invalid tournament id" });
        try {
            const matches = await getTournamentMatches(tournamentId);
            return reply.code(200).send({ matches });
        }
        catch (err) {
            return reply.code(500).send({ error: "Internal error while reading matches" });
        }
    });
}
export async function createTournament(name) {
    const db = await openDb();
    const result = await db.run(`INSERT INTO tournaments (name) VALUES (?)`, [name]);
    const row = await db.get(`SELECT id, name, created_at FROM tournaments WHERE id = ?`, [result.lastID]);
    await db.close();
    if (!row)
        throw new Error("Failed to create tournament");
    return row;
}
export async function getTournamentById(id) {
    const db = await openDb();
    const row = await db.get(`SELECT id, name, created_at FROM tournaments WHERE id = ?`, [id]);
    await db.close();
    return row ?? null;
}
export async function addTournamentMatch(params) {
    const { tournament_id, player_left_alias, player_right_alias, winner_alias, score_left, score_right } = params;
    const db = await openDb();
    await db.run(` INSERT INTO tournament_matches (
		tournament_id,
		player_left_alias,
		player_right_alias,
		winner_alias,
		score_left,
		score_right
	) VALUES (?, ?, ?, ?, ?, ?)`, [tournament_id, player_left_alias, player_right_alias, winner_alias, score_left, score_right]);
    await db.close();
}
export async function getTournamentMatches(tournamentId) {
    const db = await openDb();
    const rows = await db.all(`SELECT
      id,
      tournament_id,
      player_left_alias,
      player_right_alias,
      winner_alias,
      score_left,
      score_right,
      created_at
    FROM tournament_matches
    WHERE tournament_id = ?
    ORDER BY created_at ASC, id ASC`, [tournamentId]);
    await db.close();
    return rows;
}
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
