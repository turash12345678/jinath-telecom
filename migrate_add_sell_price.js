const { createClient } = require("@libsql/client");
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    try {
        console.log("Adding sell_price column to stock_logs...");
        try {
            await client.execute("ALTER TABLE stock_logs ADD COLUMN sell_price REAL DEFAULT 0");
            console.log("SUCCESS: sell_price column added.");
        } catch (e) {
            if (e.message && e.message.includes('duplicate column name')) {
                console.log("Column sell_price already exists, skipping.");
            } else {
                throw e;
            }
        }
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        process.exit(0);
    }
}

migrate();
