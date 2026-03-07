export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

async function getDB(): Promise<D1Database> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const sqlite = new Database(path.join(process.cwd(), "local.db"));

    return {
      prepare: (query: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            const result = sqlite.prepare(query).run(...args);
            return { meta: { last_row_id: result.lastInsertRowid as number } };
          },
          all: async () => ({ results: sqlite.prepare(query).all(...args) }),
        }),
        all: async () => ({ results: sqlite.prepare(query).all() }),
      }),
    };
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB: D1Database }).DB;
  if (!db) throw new Error("D1 DB binding is missing. Check your Cloudflare bindings.");
  return db;
}

// ── GET: Fetch all categories ─────────────────────────────────────
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

// ── POST: Add a new category ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const { name, slug } = (await req.json()) as { name?: string; slug?: string };

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Please provide both name and slug" }, { status: 400 });
    }

    const result = await db
      .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
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

// ── DELETE: Remove a category and all its products/images/reviews ─
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDB();
    const { id } = (await req.json()) as { id?: unknown };

    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }

    // Check category exists
    const existing = await db.prepare("SELECT id FROM categories WHERE id = ?").bind(numId).all();
    if (!existing.results.length) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 1. Get all products in this category
    const productsRes = await db
      .prepare("SELECT id FROM products WHERE category_id = ?")
      .bind(numId)
      .all();
    const productIds = (productsRes.results as { id: number }[]).map((p) => p.id);

    // 2. For each product, delete reviews and images first
    for (const productId of productIds) {
      await db.prepare("DELETE FROM reviews WHERE product_id = ?").bind(productId).run();
      await db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(productId).run();
    }

    // 3. Delete all products in the category
    await db.prepare("DELETE FROM products WHERE category_id = ?").bind(numId).run();

    // 4. Delete the category
    await db.prepare("DELETE FROM categories WHERE id = ?").bind(numId).run();

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /categories error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}