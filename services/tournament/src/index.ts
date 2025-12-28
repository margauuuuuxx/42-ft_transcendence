import { server, startServer } from "./server.js";
import { initTournamentDb } from "./db.js";
import { registerTournamentRoutes } from "./tournament.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("Starting Tournament Service...");
  
  // Initialize database
  await initTournamentDb();
  
  // Register routes
  registerTournamentRoutes(server);
  
  // Start server
  await startServer();
}

main().catch(err => {
  console.error("Fatal error starting tournament service:", err);
  process.exit(1);
});
