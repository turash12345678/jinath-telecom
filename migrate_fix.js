
const { createClient } = require("@libsql/client");
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    try {
        console.log("Starting migration...");

        // 1. Add created_at to products
        try {
            console.log("Adding created_at column to products...");
            await client.execute("ALTER TABLE products ADD COLUMN created_at TEXT");
            console.log("Added created_at column.");
        } catch (e) {
            console.log("Column created_at might already exist or error:", e.message);
        }

        // 2. Create stock_logs table
        console.log("Creating stock_logs table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS stock_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                remaining_quantity INTEGER NOT NULL,
                buy_price REAL NOT NULL,
                note TEXT,
                created_at TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        console.log("Created stock_logs table.");

        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration Failed:", e);
    }
}

migrate();
