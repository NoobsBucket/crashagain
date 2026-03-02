export {};
export const dynamic = 'force-dynamic';

declare global {
  var env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare: (query: string) => {
    run: (...args: unknown[]) => { lastInsertRowid?: number };
    bind?: (...args: unknown[]) => { run: () => { last_row_id?: number } };
    all: () => { results: unknown[] };
  };
}

import { getCloudflareContext } from '@opennextjs/cloudflare';

// ---------------------------
// Helper to get database
// ---------------------------
function getDB() {
  if (process.env.NODE_ENV === 'development') {
    const Database = require('better-sqlite3');
    const path = require('path');
    return new Database(path.join(process.cwd(), 'local.db'));
  }
  // Production — Cloudflare D1
  const { env } = getCloudflareContext();
  if (!env.DB) {
    console.error('DEBUG: env.DB is undefined! Make sure your D1 binding exists.');
  }
  return env.DB;
}

// ---------------------------
// POST: Add a new category
// ---------------------------
export const POST = async (req: Request) => {
  try {
    const db = getDB();
    const { name, slug } = await req.json() as { name: string; slug: string };

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: "Please provide both name and slug" }), { status: 400 });
    }

    let result;

    if (process.env.NODE_ENV === 'development') {
      result = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
      console.log('DEBUG: Inserted in local DB:', result);
    } else {
      // D1 requires .bind()
      result = await db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
                       .bind(name, slug)
                       .run();
      console.log('DEBUG: Inserted in D1 DB:', result);
    }

    return new Response(JSON.stringify({
      success: true,
      category: { id: result.lastInsertRowid ?? result.meta?.last_row_id, name, slug }
    }), { status: 200 });

  } catch (err: unknown) {
    console.error('DEBUG POST ERROR:', err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

// ---------------------------
// GET: Fetch all categories
// ---------------------------
export const GET = async () => {
  try {
    const db = getDB();

    let results;
    if (process.env.NODE_ENV === 'development') {
      results = db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
      console.log('DEBUG: Fetched from local DB:', results);
    } else {
      const res = await db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
      results = res.results;
      console.log('DEBUG: Fetched from D1 DB:', results);
    }

    return new Response(JSON.stringify({ results }), { status: 200 });

  } catch (err: unknown) {
    console.error('DEBUG GET ERROR:', err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};