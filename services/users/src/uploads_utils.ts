import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.join(__dirname, '..', 'uploads');

export const ensureUploadDir = async () => {
  try {
    console.log("try to create upload dir " + uploadsDir)
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log("dirr created")
  } catch (err) {
    console.error("❌ Failed to create upload directory:", err);
    throw err;
  }
};
