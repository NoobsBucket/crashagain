export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ---------------------------
// D1 interfaces
// ---------------------------
interface D1BoundStatement {
  run: () => Promise<{ meta?: { last_row_id?: number } }>;
  all: () => Promise<{ results: unknown[] }>;
}

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => D1BoundStatement;
    all: () => Promise<{ results: unknown[] }>;
  };
}

// ---------------------------
// Helper: get DB
// ---------------------------
async function getDB(): Promise<D1Database> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const sqlite = new Database(path.join(process.cwd(), "local.db"));

    // Wrap better-sqlite3 (sync) to match the async D1 interface
    return {
      prepare: (query: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            const result = sqlite.prepare(query).run(...args);
            return { meta: { last_row_id: result.lastInsertRowid as number } };
          },
          all: async () => ({
            results: sqlite.prepare(query).all(...args),
          }),
        }),
        all: async () => ({
          results: sqlite.prepare(query).all(),
        }),
      }),
    };
  }

  // Production — Cloudflare D1 (must be async)
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB: D1Database }).DB;
  if (!db) throw new Error("D1 DB binding is missing. Check your Cloudflare bindings.");
  return db;
}

// ---------------------------
// POST: Add a new category
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const { name, slug } = (await req.json()) as { name?: string; slug?: string };

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Please provide both name and slug" }, { status: 400 });
    }

    const result = await db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
      .bind(name.trim(), slug.trim())
      .run();

    return NextResponse.json(
      { success: true, category: { id: result.meta?.last_row_id, name, slug } },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("POST /categories error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------
// GET: Fetch all categories
// ---------------------------
export async function GET() {
  try {
    const db = await getDB();
    const res = await db.prepare("SELECT * FROM categories ORDER BY id DESC").all();
    return NextResponse.json({ results: res.results });
  } catch (err: unknown) {
    console.error("GET /categories error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}