import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = url ? createClient({
    url,
    authToken,
}) : {
    execute: async () => { throw new Error("Database not configured"); }
};

export default client;
