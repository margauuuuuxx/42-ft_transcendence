import { setupRoutes, startServer, server } from "./server.js";
import { setupFriendsRoutes } from './friend_server.js';
import { initDb, } from "./db.js";
import { friendsTable } from "./friend_db.js";
import { ensureUploadDir } from './uploads_utils.js';
//create folder for upload
await ensureUploadDir();
await initDb();
await friendsTable();
setupRoutes();
setupFriendsRoutes(server);
startServer();
