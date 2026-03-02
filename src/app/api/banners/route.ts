export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server";

function getDB() {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    return new Database(path.join(process.cwd(), 'local.db'));
  }
  // Production — Cloudflare D1
  return (globalThis as any).env?.DB ?? (process.env as any).DB;
}

export async function GET() {
  try {
    const db = getDB();
    let results;
    if (process.env.NODE_ENV === 'development') {
      results = db.prepare('SELECT * FROM banners ORDER BY sort_order ASC').all();
    } else {
      const res = await db.prepare('SELECT * FROM banners ORDER BY sort_order ASC').all();
      results = res.results;
    }
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const { image_url, heading, button_text, sort_order, link_to } = await req.json() as {
      image_url: string;
      heading: string;
      button_text: string;
      sort_order: number;
      link_to?: string | null;
    };

    if (!image_url || !heading || !button_text) {
      return NextResponse.json(
        { error: 'image_url, heading and button_text are required' },
        { status: 400 }
      );
    }

    let result;
    if (process.env.NODE_ENV === 'development') {
      result = db
        .prepare(
          'INSERT INTO banners (image_url, heading, button_text, sort_order, link_to) VALUES (?, ?, ?, ?, ?)'
        )
        .run(image_url, heading, button_text, sort_order || 0, link_to ?? null);
    } else {
      result = await db
        .prepare(
          'INSERT INTO banners (image_url, heading, button_text, sort_order, link_to) VALUES (?, ?, ?, ?, ?)'
        )
        .run(image_url, heading, button_text, sort_order || 0, link_to ?? null);
    }

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDB();
    const { id } = await req.json() as { id: number };

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (process.env.NODE_ENV === 'development') {
      db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    } else {
      await db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}