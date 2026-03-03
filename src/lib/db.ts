import type { D1Database } from "@cloudflare/workers-types";

declare global {
  // eslint-disable-next-line no-var
  var env: {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
  };
}

function getDB() {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const path = require("path");
    const db = new Database(path.join(process.cwd(), "local.db"));
    return db;
  }
  return globalThis.env.DB;
}

export default getDB;