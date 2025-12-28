import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  return open({
    filename: "./auth.db",
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS auth_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    two_fa_code TEXT,
    two_fa_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);
  console.log("✅ Auth data table ready!");
}

export async function saveTwoFACode(
  email: string,
  code: string,
  expiresAt: Date
): Promise<void> {
  const db = await openDb();

  await db.run(
    `
    INSERT INTO auth_data (email, two_fa_code, two_fa_expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      two_fa_code = excluded.two_fa_code,
      two_fa_expires_at = excluded.two_fa_expires_at,
      updated_at = CURRENT_TIMESTAMP
    `,
    [email, code, expiresAt.toISOString()]
  );
  console.log(`🔐 2FA code saved for email: ${email}`);
}


export async function getTwoFAData(email: string) {
  const db = await openDb();
  return db.get(
    "SELECT * FROM auth_data WHERE email = ?",
    [email]
  );
}


export async function clearTwoFACode(email: string) {
  const db = await openDb();
  return db.run(
    `
    UPDATE auth_data
    SET two_fa_code = NULL,
        two_fa_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
    `,
    [email]
  );
}
