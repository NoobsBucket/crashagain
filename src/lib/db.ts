declare global {
  // eslint-disable-next-line no-var
  var env: {
    DB: any;
    R2_BUCKET: any;
  };
}

function getDB() {
  console.log("[db.ts] NODE_ENV:", process.env.NODE_ENV);

  if (process.env.NODE_ENV === "development") {
    console.log("[db.ts] Using local better-sqlite3 database");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "local.db");
    console.log("[db.ts] DB path:", dbPath);
    const db = new Database(dbPath);
    console.log("[db.ts] better-sqlite3 connected successfully");
    return db;
  }

  console.log("[db.ts] Using Cloudflare D1");
  console.log("[db.ts] globalThis.env:", globalThis.env);
  console.log("[db.ts] globalThis.env.DB:", globalThis.env?.DB);

  if (!globalThis.env) {
    console.error("[db.ts] ERROR: globalThis.env is undefined");
    throw new Error("globalThis.env is not set — Cloudflare bindings are missing");
  }

  if (!globalThis.env.DB) {
    console.error("[db.ts] ERROR: globalThis.env.DB is undefined");
    throw new Error("DB binding is missing from globalThis.env");
  }

  return globalThis.env.DB;
}

export default getDB;