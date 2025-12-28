import fastify from "fastify";
import {sanitizeInput} from "./sanitise.js"

export const server = fastify({
  logger: false
});

// Enable CORS for cross-origin requests
server.addHook("preHandler", async (req: any, reply: any) => {
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


export async function startServer() {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Tournament service listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
