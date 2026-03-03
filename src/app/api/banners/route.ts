export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDB() {
  if (process.env.NODE_ENV === "development") {
    const Database = require("better-sqlite3");
    const path = require("path");
    return new Database(path.join(process.cwd(), "local.db"));
  }
  const { env } = getCloudflareContext();
  return (env as any).DB;
}

const isDev = process.env.NODE_ENV === "development";
export async function GET() {
  try {
    const db = getDB();
    const sql = "SELECT * FROM banners ORDER BY sort_order ASC";
    const results = isDev
      ? db.prepare(sql).all()
      : (await db.prepare(sql).all()).results;

    return NextResponse.json({ results: results ?? [] });
  } catch (err: any) {
    console.error("[banners] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const { image_url, heading, button_text, sort_order, link_to } =
      (await req.json()) as {
        image_url: string;
        heading: string;
        button_text: string;
        sort_order?: number;
        link_to?: string | null;
      };

    if (!image_url || !heading || !button_text) {
      return NextResponse.json(
        { error: "image_url, heading and button_text are required" },
        { status: 400 }
      );
    }

    const sql =
      "INSERT INTO banners (image_url, heading, button_text, sort_order, link_to) VALUES (?, ?, ?, ?, ?)";
    const params = [image_url, heading, button_text, sort_order ?? 0, link_to ?? null];

    let id: number;
    if (isDev) {
      const result = db.prepare(sql).run(...params);
      id = result.lastInsertRowid;
    } else {
     
      const result = await db.prepare(sql).bind(...params).run();
      id = result.meta?.last_row_id;
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[banners] POST error:", err);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}

// ── DELETE 
export async function DELETE(req: NextRequest) {
  try {
    const db = getDB();

    let body: { id?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const id = Number(body?.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }
    const sql = "DELETE FROM banners WHERE id = ?";
    if (isDev) {
      db.prepare(sql).run(id);
    } else {
      await db.prepare(sql).bind(id).run();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[banners] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}