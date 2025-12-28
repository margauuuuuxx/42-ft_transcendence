import cookie from "@fastify/cookie";
import "dotenv/config";
import Fastify from "fastify";
import Jwt from "jsonwebtoken";
import { addUser, getUserByEmail, getUserById, getUserHashPassword, getUserTokenVersion, ModifyUserTokenVersion, updateUser, addAvatarUrl, updateUserLastActivity } from "./db.js";
import { hashPassword, verifyPassword } from "./utils.js";
//for uploads
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { uploadsDir } from "./uploads_utils.js";
import { fastifyMultipart } from "@fastify/multipart";
import { randomUUID } from "crypto";
import { sanitizeInput } from "./sanitise.js";
const jwt = Jwt;
const server = Fastify({
    logger: true,
});
// Register multipart plugin for file uploads
await server.register(fastifyMultipart);
server.addHook("preHandler", async (req, reply) => {
    req.userId = req.headers["x-user-id"];
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    // Sanitize URL parameters
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
});
// Main route
const setupRoutes = () => {
    //upload
    server.post("/avatar", async (request, reply) => {
        const file = await request.file();
        if (!file) {
            return reply.code(400).send({ error: "No file uploaded" });
        }
        // Validate MIME type
        const allowedMime = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!allowedMime.includes(file.mimetype)) {
            return reply.code(400).send({ error: "Invalid file type" });
        }
        // Generate safe filename
        const ext = path.extname(file.filename) || ".png";
        const safeName = `${randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, safeName);
        try {
            await pipeline(file.file, createWriteStream(filePath));
            addAvatarUrl(safeName, request.userId);
            return reply.code(201).send({
                success: true,
                file: {
                    filename: safeName,
                    mimetype: file.mimetype,
                    path: filePath,
                },
            });
        }
        catch (err) {
            request.log.error(err);
            return reply.code(500).send({ error: "Failed to save file" });
        }
    });
    //fetch user data based on his id
    server.get("/me", async (req, reply) => {
        const userId = req.headers["x-user-id"];
        if (!userId)
            console.log("no userId in request");
        const user = await getUserById(userId);
        if (!user)
            return reply.code(404).send({ error: "User not found" });
        reply.code(200).send(user);
    });
    server.patch("/me", async (req, reply) => {
        const userId = req.headers["x-user-id"];
        const { username, email, twoFA } = req.body;
        const updated = await updateUser(userId, { username, email, twoFA });
        reply.code(200).send({ message: "User updated", updated });
    });
    // Update user activity (for nginx middleware) - accept all methods
    server.all('/users/activity', async (req, reply) => {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return reply.code(200).send({ success: false, error: 'x-user-id header required' });
        }
        try {
            const success = await updateUserLastActivity(Number(userId));
            return reply.code(200).send({ success });
        }
        catch (err) {
            console.error('Error updating user activity:', err);
            return reply.code(500).send({ error: 'Failed to update activity' });
        }
    });
    //fetch the user data based on the email but can be expends to other key
    server.post("/users/search", async (req, res) => {
        const { email } = req.body;
        console.log("searching user");
        if (!email) {
            return res.code(400).send({ error: "email is required" });
        }
        try {
            const user = await getUserByEmail(email);
            if (!user) {
                return res.code(404).send({ error: "User not found" });
            }
            return res.code(200).send(user);
        }
        catch (err) {
            console.error("POST /users/search", err);
            return res.code(500).send({ error: "internal error" });
        }
    });
    //get user based on id 
    server.get('/users/:id', async (req, res) => {
        const id = Number(req.params.id);
        // Vérification basique de l'ID
        if (isNaN(id)) {
            return res.code(400).send({ error: "Invalid user id" });
        }
        try {
            const user = await getUserById(id);
            if (!user) {
                return res.code(404).send({ error: "User not found" });
            }
            return res.code(200).send({
                message: "user found",
                user: user
            });
        }
        catch (err) {
            console.error("GET /users/:id error:", err);
            return res.code(500).send({ error: "Internal server error" });
        }
    });
    server.post("/modifyUserTokenVersion", async (req, res) => {
        const id = req.body?.id;
        if (!id)
            return res.code(400).send({ error: "no id in the request" });
        ModifyUserTokenVersion(id);
        const version = getUserTokenVersion(id);
        res
            .code(200)
            .send({ message: "token version updated", token_version: version });
    });
    server.post("/verify_password", async (request, reply) => {
        console.log("cheking password");
        const { email, password } = request.body;
        const userPasswordHash = await getUserHashPassword(email);
        if (await verifyPassword(password, userPasswordHash)) {
            return reply
                .code(200)
                .send({ message: "the password is valid", valid: true });
        }
        else
            return reply.code(401).send({ valid: false, error: "Invalid password" });
    });
    server.post("/register", async (request, reply) => {
        const { username, email, password } = request.body; // pick specific fields
        if (!username)
            return reply.code(400).send({ error: "username required" });
        else if (!email)
            return reply.code(400).send({ error: "email required" });
        else if (!password)
            return reply.code(400).send({ error: "password required" });
        try {
            const hash_password = await hashPassword(password);
            await addUser(username, email, hash_password); // await the Promise
            return reply.code(201).send({ message: "new user registered" });
        }
        catch (err) {
            if (err?.code === "SQLITE_CONSTRAINT") {
                const msg = err.message || "";
                if (msg.includes("users.username")) {
                    return reply
                        .code(409)
                        .send({ error: "The username is already used" });
                }
                if (msg.includes("users.email")) {
                    return reply.code(409).send({ error: "The email is already used" });
                }
                return reply.code(409).send({ error: "User already exists" });
            }
            request.log.error(err);
            return reply.code(500).send({ error: "internal error" });
        }
    });
};
const startServer = async () => {
    try {
        await server.register(cookie);
        // If startServer is the only place you call it, also:
        await server.listen({
            port: 3000,
            host: "0.0.0.0",
        });
        server.log.info(`Server listening on port 3000`);
    }
    catch (err) {
        server.log.error(err);
    }
};
export { setupRoutes, startServer, server };
