import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  return open({
    filename: "./tournament.db",
    driver: sqlite3.Database
  });
}

export async function initTournamentDb(): Promise<void> {
  const db = await openDb();

  // Main tournaments table with status tracking
  await db.exec(`CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'registration' CHECK(status IN ('registration', 'in_progress', 'completed')),
    max_players INTEGER DEFAULT 8,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tournament registrations - tracks who signed up
  await db.exec(`CREATE TABLE IF NOT EXISTS tournament_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_alias TEXT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, player_alias),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  )`);

  // Tournament brackets - tracks matchup structure
  await db.exec(`CREATE TABLE IF NOT EXISTS tournament_brackets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    position INTEGER NOT NULL,
    player1_alias TEXT,
    player2_alias TEXT,
    winner_alias TEXT,
    match_id INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES tournament_matches(id)
  )`);

  // Tournament matches - stores actual match results
  await db.exec(`CREATE TABLE IF NOT EXISTS tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_left_alias TEXT NOT NULL,
    player_right_alias TEXT NOT NULL,
    winner_alias TEXT NOT NULL,
    score_left INTEGER NOT NULL,
    score_right INTEGER NOT NULL,
    blockchain_tx_hash TEXT,
    blockchain_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  )`);

  await db.close();
  console.log("✅ Tournament database initialized!");
}
