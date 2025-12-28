import { FastifyInstance } from "fastify";
import {addFriendship, updateStatus, getUserFriendships} from './friend_db.js';

export function setupFriendsRoutes (server: FastifyInstance) {

server.post("/friends/request", async (req: any, reply: any) => {
  try {
    const requesterId = Number(req.headers["x-user-id"]);
    if (!requesterId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { userId: addresseeId } = req.body;

    if (!addresseeId || typeof addresseeId !== "number") {
      return reply.code(400).send({ error: "userId is required" });
    }

    if (addresseeId === requesterId) {
      return reply.code(400).send({ error: "You cannot add yourself." });
    }

    // Appelle la fonction DB
    const result = await addFriendship(requesterId, addresseeId);

    if (result?.autoAccepted) {
      return reply.code(200).send({ message: "Friendship auto-accepted!" });
    }

    return reply.code(201).send({ message: "Friend request sent." });

  } catch (err: any) {
    if (err.message.includes("already sent")) {
      return reply.code(409).send({ error: err.message });
    }

    console.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

server.post("/friends/accept", async (req: any, reply: any) => {
  try {
    const addresseeId = Number(req.headers["x-user-id"]);
    if (!addresseeId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { userId: requesterId, accept: accept } = req.body;

    if (!requesterId || typeof requesterId !== "number") {
      return reply.code(400).send({ error: "userId is required" });
    }

    if (addresseeId === requesterId) {
      return reply.code(400).send({ error: "Cannot accept your own request." });
    }

    // Update the friendship status to accepted
    await updateStatus(requesterId, addresseeId, accept);

    return reply.code(200).send({ message: "Friend request handled." });

  } catch (err: any) {
    console.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

server.get("/friends", async (req: any, reply: any) => {
  try {
    const userId = Number(req.headers["x-user-id"]);
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const friendships = await getUserFriendships(userId);

    return reply.code(200).send({ friendships });

  } catch (err: any) {
    console.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});



}