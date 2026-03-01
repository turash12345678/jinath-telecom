import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log("Starting migration to add device fields...");
    try {
        // Add ram_id, rom_id, color_id, imei to products
        await db.execute("ALTER TABLE products ADD COLUMN ram_id INTEGER REFERENCES categories(id)");
        await db.execute("ALTER TABLE products ADD COLUMN rom_id INTEGER REFERENCES categories(id)");
        await db.execute("ALTER TABLE products ADD COLUMN color_id INTEGER REFERENCES categories(id)");
        await db.execute("ALTER TABLE products ADD COLUMN imei TEXT");

        console.log("Migration successful!");
    } catch (error) {
        if (error.message.includes("duplicate column name")) {
            console.log("Columns already exist. Skipping.");
        } else {
            console.error("Migration failed:", error);
        }
    }
}

migrate();
