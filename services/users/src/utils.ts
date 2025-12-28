import * as bcrypt from 'bcrypt';
const saltRounds = 10; // The cost factor (higher is slower and more secure)

const SALT_ROUNDS: number = 10;

export async function hashPassword(password: string): Promise<string> {
    if (!password) {
        throw new Error("Password cannot be empty.");
    }
    try {
        // bcrypt.hash handles salt generation and hashing in one call
        const hash: string = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error("Bcrypt hashing failed:", error);
        throw new Error("Failed to secure the password.");
    }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash)
        return false;
    try {
        const match: boolean = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        // Log error but treat verification as failed for security
        console.error("Bcrypt verification failed:", error);
        return false;
    }
}