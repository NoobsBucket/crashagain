  export {};
  export const dynamic = 'force-dynamic'
  declare global {
    var env: {
      DB: D1Database;
    };
  }

  interface D1Database {
    prepare: (query: string) => {
      run: (...args: unknown[]) => { lastInsertRowid?: number };
      all: () => { results: unknown[] };
    };
  }

import { getCloudflareContext } from '@opennextjs/cloudflare';

function getDB() {
  if (process.env.NODE_ENV === 'development') {
    const Database = require('better-sqlite3');
    const path = require('path');
    return new Database(path.join(process.cwd(), 'local.db'));
  }
  // Production — Cloudflare D1
  const { env } = getCloudflareContext();
  return env.DB;
}

  // --- POST: add a new category ---
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
      } else {
        result = await db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
      }

      return new Response(JSON.stringify({
        success: true,
        category: { id: result.lastInsertRowid, name, slug }
      }), { status: 200 });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
  };

  // --- GET: fetch all categories ---
  export const GET = async () => {
    try {
      const db = getDB();

      let results;
      if (process.env.NODE_ENV === 'development') {
        results = db.prepare("SELECT * FROM categories ORDER BY created_at DESC").all();
      } else {
        const res = await db.prepare("SELECT * FROM categories ORDER BY created_at DESC").all();
        results = res.results;
      }

      return new Response(JSON.stringify({ results }), { status: 200 });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
  };