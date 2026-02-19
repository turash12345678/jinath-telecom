
const { createClient } = require("@libsql/client");
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    try {
        console.log("Starting migration...");

        // 1. Create sale_batch_allocations table
        console.log("Creating sale_batch_allocations table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS sale_batch_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_item_id INTEGER NOT NULL,
                stock_log_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
                FOREIGN KEY (stock_log_id) REFERENCES stock_logs(id)
            )
        `);
        console.log("Created sale_batch_allocations table.");

        // 2. Add buy_price_at_sale to sale_items
        try {
            console.log("Adding buy_price_at_sale column to sale_items...");
            await client.execute("ALTER TABLE sale_items ADD COLUMN buy_price_at_sale REAL");
            console.log("Added buy_price_at_sale column.");
        } catch (e) {
            console.log("Column buy_price_at_sale might already exist or error:", e.message);
        }

        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration Failed:", e);
    }
}

migrate();
