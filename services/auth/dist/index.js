//will handle JWT creation and JWT verification 
import { setupRoutes, startServer } from "./server.js";
import { initDb } from "./db.js";
await initDb();
setupRoutes();
startServer();
