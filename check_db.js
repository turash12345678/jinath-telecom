
const { createClient } = require("@libsql/client");
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkSchema() {
    try {
        console.log("Checking tables...");
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows.map(r => r.name));

        const products = await client.execute("PRAGMA table_info(products)");
        console.log("Products Table Schema:", products.rows);

        const stockLogs = await client.execute("PRAGMA table_info(stock_logs)");
        console.log("Stock Logs Table Schema:", stockLogs.rows);

    } catch (e) {
        console.error("Error:", e);
    }
}

checkSchema();
