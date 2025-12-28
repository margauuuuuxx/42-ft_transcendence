import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  return open({
    filename: "./users.db",   // database file
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await openDb();

  await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    token_version INTEGER DEFAULT 1,
    twoFa INTEGER DEFAULT 0,
    last_active_at DATETIME DEFAULT (datetime(CURRENT_TIMESTAMP, '+1 hour')),
    created_at DATETIME DEFAULT (datetime(CURRENT_TIMESTAMP, '+1 hour')),
    updated_at DATETIME DEFAULT (datetime(CURRENT_TIMESTAMP, '+1 hour'))
  )
`);


  console.log("✅ Users table ready!!!");
}

export async function addAvatarUrl(url: string, id: number) {
  const db = await openDb();
    const result = await db.run(
      "UPDATE users SET avatar_url = ?  WHERE id = ?", [url, id]
    );
    console.log(`user id ${id} new url => ${url}`);
    await db.close()
}

export async function addUser(name: string, email: string, password: string) {
  const db = await openDb();
    const result = await db.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [name, email, password]
    );
    console.log(`✅ User "${name}" added`);
}

//for rest api
export async function getUserById(id: number){
  const db = await openDb();
  const data = await db.get("SELECT * FROM users WHERE id = ?", [id])
  await db.close();
  return data;
}
export async function getUserByEmail(email: string){
  const db = await openDb();
  const data = await db.get("SELECT * FROM users WHERE email = ?", [email])
  await db.close();
  return data;
}
/////////////////////////////////////
export async function getUserHashPassword(email: string | undefined) {
  const db = await openDb();
  const result = await db.get("SELECT password_hash FROM users WHERE email = ?", email);
  await db.close();
  return result?.password_hash;
}
export async function getUserTokenVersion(id: number){
  const db = await openDb();
  const result = await db.get("SELECT  token_version FROM users WHERE id = ?", id);

  await db.close();
  return result ? result.token_version : undefined;
}
export async function getUserTwoFa(id: number){
  const db = await openDb();
  const result = await db.get("SELECT  twoFa FROM users WHERE id = ?", id);

  await db.close();
  return result ? result.twoFa : undefined;
}
export async function getUserIdAndToken(email: string):Promise<[number, number]|undefined>{
  const db = await openDb();
  const result = await db.get("SELECT id, token_version FROM users WHERE email = ?", email);

  await db.close();
  return result ? [result.id, result.token_version] : undefined;
  
}

export async function ModifyUserTokenVersion(id: number){
  const db = await openDb();
   await db.run(
        "UPDATE users SET token_version = token_version + 1 WHERE id = ?",
        id
    );
    console.log("token version modified")
  await db.close();
}

export async function updateUserLastActivity(userId: number) {
  const db = await openDb();
  
  try {
    const result = await db.run(
      "UPDATE users SET last_active_at = datetime(CURRENT_TIMESTAMP, '+1 hour') WHERE id = ?",
      [userId]
    );
    
    await db.close();
    
    if (result.changes === 0) {
      console.log(`⚠️  No user found with id ${userId} for activity update`);
      return false;
    }
    
    console.log(`✅ Updated last_active_at for user ${userId}`);
    return true;
    
  } catch (err) {
    await db.close();
    console.error('Error updating user activity:', err);
    throw err;
  }
}

export async function updateUser(
  userId: number,
  updates: { username?: string; email?: string, twoFA?: boolean }
) {
  const db = await openDb();

  // Build dynamic SQL depending on fields provided
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.username) {
    fields.push("username = ?");
    values.push(updates.username);
  }
  if (updates.email) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (updates.twoFA !== undefined) {
    console.log("le twoFA est modifié!");
    fields.push("twoFa = ?");
    values.push(updates.twoFA ? 1 : 0);
  }

  if (fields.length === 0) {
    await db.close();
    throw new Error("No fields to update");
  }

  // Add the WHERE id = ?
  values.push(userId);

  const sql = `
    UPDATE users
    SET ${fields.join(", ")},
        updated_at = datetime(CURRENT_TIMESTAMP, '+1 hour')
    WHERE id = ?
  `;

  try {
    await db.run(sql, values);

    // Return updated user
    const updatedUser = await db.get("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    await db.close();
    return updatedUser;
  } catch (err) {
    await db.close();
    throw err;
  }
}
