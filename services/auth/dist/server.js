import Fastify from "fastify";
import { clearTwoFACode, getTwoFAData, saveTwoFACode } from "./db.js";
import { generateCode, send_mail } from "./email.js";
import { createTokens, getUserByEmail, getUserById, verify_password, } from "./utils.js";
import cookie from "@fastify/cookie";
import "dotenv/config";
import Jwt from "jsonwebtoken";
const jwt = Jwt;
const server = Fastify({
    logger: true,
});
// Main route
const setupRoutes = () => {
    server.post("/login", async (request, reply) => {
        const { email, password } = request.body;
        if (!email)
            return reply.code(400).send({ error: "email required" });
        if (!password)
            return reply.code(400).send({ error: "password required" });
        //verify password and email
        const response = await verify_password(email, password);
        if (!response.valid) {
            return reply
                .code(403)
                .send({ error: response.error || "Wrong password or email" });
        }
        const user = await getUserByEmail(email);
        if (!user)
            return reply.code(500).send({ error: "can't fetch user data" });
        console.log("User object:", user);
        console.log("user.token_Version:", user.token_Version);
        console.log("user.token_version:", user.token_version);
        //create the tokens
        const { refreshToken, accessToken } = await createTokens(email, user.id, user.token_version);
        if (user.twoFa == 1) {
            console.log("setup two fa");
            //send email et stack the secret key in the db
            console.log("generate code");
            let code = generateCode(6);
            const expires = new Date(Date.now() + 5 * 60 * 1000); // expire dans 5 min
            console.log("save code");
            await saveTwoFACode(email, code, expires);
            console.log("send mail");
            await send_mail(email, code);
            console.log(`📧 [DEV] 2FA Code for ${email}: ${code}`);
            return reply
                .code(200)
                .send({ twoFa: true, message: "email sent with 2FA code" });
        }
        // Set HTTP-only cookie
        reply.setCookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: false, // set to false only in local dev without HTTPS
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        console.log("send tokens");
        return reply
            .code(200)
            .send({ twoFa: false, accessToken: accessToken, message: "access token" });
    });
    server.post("/send-email-code", async (req, res) => {
        const { email } = req.body;
        if (!email)
            return res.code(400).send({ error: "email required" });
        let code = generateCode(6);
        const expires = new Date(Date.now() + 5 * 60 * 1000); // expire dans 5 min
        await saveTwoFACode(email, code, expires);
        await send_mail(email, code);
        console.log(`📧 [DEV] 2FA Code for ${email}: ${code}`);
        return res.code(200).send({ message: "email sent" });
    });
    server.post("/verify-2fa", async (request, reply) => {
        const { email, code } = request.body;
        if (!email)
            return reply.code(400).send({ error: "email required" });
        if (!code)
            return reply.code(400).send({ error: "code required" });
        // Récupération du 2FA depuis la DB
        const record = await getTwoFAData(email);
        if (!record) {
            return reply
                .code(400)
                .send({ error: "No 2FA code found for this email" });
        }
        // Vérifier expiration
        const now = new Date();
        const expiresAt = new Date(record.two_fa_expires_at);
        if (now > expiresAt) {
            return reply.code(403).send({ error: "2FA code expired" });
        }
        // Vérifier code
        if (record.two_fa_code !== code) {
            return reply.code(403).send({ error: "Invalid 2FA code" });
        }
        // Si OK : supprimer le code de la DB
        await clearTwoFACode(record.user_id);
        // response with jwts
        //create the tokens
        const user = await getUserByEmail(email);
        if (!user)
            return reply.code(500).send({ error: "can't fetch user data" });
        console.log("User object in 2FA route:", user);
        console.log("user.token_Version:", user.token_Version);
        console.log("user.token_version:", user.token_version);
        console.log("create token after two fa");
        const { refreshToken, accessToken } = await createTokens(email, user.id, user.token_version);
        // Set HTTP-only cookie
        reply.setCookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: false, // set to false only in local dev without HTTPS
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        console.log("send tokens");
        return reply
            .code(200)
            .send({ accessToken: accessToken, message: "access token, twofa valide" });
    });
    server.get("/jwt_check", async (req, reply) => {
        const authHeader = req.headers.authorization;
        console.log("checking JWT!");
        // Pas de token → refus d’accès
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("no bearer header");
            return reply.code(401).send();
        }
        console.log("authHeader: " + authHeader);
        const token = authHeader.split(" ")[1];
        console.log("token: " + token);
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessTokenSecret) {
            req.log.error("ACCESS_TOKEN_SECRET is not set");
            return reply.code(500).send();
        }
        try {
            // Vérification du JWT
            const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log("id form payload " + payload.sub);
            reply
                .header("X-User-Id", payload.sub)
                .code(204)
                .send();
            return reply.send();
        }
        catch (err) {
            // Token invalide
            console.log(err);
            return reply.code(401).send();
        }
    });
    server.post("/refresh", async (req, res) => {
        const refreshToken = req.cookies?.refresh_token;
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!refreshTokenSecret || !accessTokenSecret) {
            req.log.error("ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not set");
            return res
                .code(500)
                .send({ error: "internal_error", message: "Server misconfiguration" });
        }
        if (!refreshToken) {
            return res
                .code(401)
                .send({ error: "unauthorized", message: "No refresh token provided" });
        }
        try {
            const payload = jwt.verify(refreshToken, refreshTokenSecret);
            console.log("payload: ", payload);
            console.log("payload.sub:", payload.sub);
            console.log("payload.version:", payload.version);
            //get the version
            console.log("try to refresh token for user " + payload.sub);
            const user = await getUserById(payload.sub);
            if (!user)
                return res.code(500).send({ error: "can't fetch user data" });
            console.log(user);
            const version = user.user.token_version;
            console.log("version " + version + " payload version " + payload.version);
            if (!version || version !== payload.version)
                return res
                    .code(403)
                    .send({
                    error: "forbidden",
                    message: payload.version.toString() + version?.toString(),
                });
            console.log("debug");
            // Créer un nouvel access token
            console.log("create new access token");
            const newAccessToken = jwt.sign({ sub: payload.sub }, accessTokenSecret, {
                algorithm: "HS256",
                expiresIn: "15m",
            });
            return res.code(200).send({ accessToken: newAccessToken });
        }
        catch (err) {
            return res
                .code(403)
                .send({ error: "forbidden", message: "Invalid refresh token" });
        }
    });
    server.post("/logout", async (req, reply) => {
        const refreshToken = req.cookies?.refresh_token;
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
        const payload = jwt.verify(refreshToken, refreshTokenSecret);
        const response = await fetch("http://users:3000/modifyUserTokenVersion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: payload.sub }),
        });
        reply.clearCookie("refresh_token", {
            path: "/",
        });
        return reply.code(200).send({ message: "Logged out" });
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
export { setupRoutes, startServer };
