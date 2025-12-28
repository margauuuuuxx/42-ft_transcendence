import { openDb } from "./db.js";
export async function friendsTable() {
    const db = await openDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      addressee_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending','accepted')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(requester_id, addressee_id)
    );
  `);
    await db.close();
}
export async function addFriendship(requester, addressee) {
    if (requester === addressee) {
        throw new Error("Cannot add yourself as friend");
    }
    const db = await openDb();
    // Vérifier si une relation existe déjà dans un sens
    const existing = await db.get("SELECT * FROM friendships WHERE requester_id = ? AND addressee_id = ?", [requester, addressee]);
    if (existing) {
        throw new Error("Friend request already sent");
    }
    // Vérifier si une demande existe EN SENS INVERSE
    const reverse = await db.get("SELECT * FROM friendships WHERE requester_id = ? AND addressee_id = ?", [addressee, requester]);
    if (reverse && reverse.status === "pending") {
        // Auto acceptation (logique moderne : Discord / Facebook)
        await db.run("UPDATE friendships SET status = 'accepted' WHERE id = ?", [reverse.id]);
        await db.close();
        return { autoAccepted: true };
    }
    // Sinon créer une nouvelle demande
    await db.run("INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')", [requester, addressee]);
    await db.close();
}
export async function updateStatus(requester, addressee, accepted) {
    const db = await openDb();
    if (accepted) {
        await db.run("UPDATE friendships SET status = 'accepted' WHERE requester_id = ? AND addressee_id = ?", [requester, addressee]);
    }
    else {
        await db.run("DELETE FROM friendships WHERE requester_id = ? AND addressee_id = ?", [requester, addressee]);
    }
    await db.close();
}
export async function getUserFriendships(userId) {
    const db = await openDb();
    const friendships = await db.all(`SELECT 
      f.id,
      CASE 
        WHEN f.requester_id = ? THEN f.addressee_id
        ELSE f.requester_id
      END as friend_id,
      f.status,
      f.requester_id = ? as is_requester,
      f.created_at,
      f.updated_at,
      u.username AS friend_username,
      u.last_active_at AS friend_last_active_at
    FROM friendships f
    JOIN users u
      ON u.id = CASE
                  WHEN f.requester_id = ? THEN f.addressee_id
                  ELSE f.requester_id
                END
    WHERE (f.requester_id = ? OR f.addressee_id = ?)
    ORDER BY f.created_at DESC`, [userId, userId, userId, userId, userId]);
    await db.close();
    return friendships;
}
