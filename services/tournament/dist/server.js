import fastify from "fastify";
export const server = fastify({
    logger: false
});
// Enable CORS for cross-origin requests
server.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') {
        reply.code(200).send();
    }
});
export async function startServer() {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Tournament service listening on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
//# sourceMappingURL=server.js.map