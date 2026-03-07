export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCloudflareContext } from '@opennextjs/cloudflare';

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

function getDB() {
  if (process.env.NODE_ENV === 'development') {
    const Database = require('better-sqlite3');
    const path = require('path');
    return new Database(path.join(process.cwd(), 'local.db'));
  }
  const { env } = getCloudflareContext();
  return (env as any).DB;
}

const isDev = process.env.NODE_ENV === 'development';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── GET: Fetch reviews for a product ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const productId = new URL(req.url).searchParams.get('product_id');
    if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 });

    const sql = 'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC';
    const results = isDev
      ? db.prepare(sql).all(productId)
      : (await db.prepare(sql).bind(productId).all()).results;

    return NextResponse.json({ results: results ?? [] });
  } catch (err: any) {
    console.error('[reviews] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// ── POST: Add a review ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'You must be logged in to leave a review' }, { status: 401 });

    const userId = user.id;
    const user_name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Anonymous';

    const db = getDB();
    const { product_id, rating, comment } = (await req.json()) as {
      product_id: number;
      rating: number;
      comment: string;
    };

    if (!product_id || !rating || !comment?.trim()) {
      return NextResponse.json(
        { error: 'product_id, rating and comment are required' },
        { status: 400 }
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const sql =
      'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)';
    const params = [product_id, userId, user_name, rating, comment.trim()];

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
    console.error('[reviews] POST error:', err);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}

// ── DELETE: Remove a review (owner or admin) ──────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

    const db = getDB();
    let body: { id?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const id = Number(body?.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'A valid numeric id is required' }, { status: 400 });
    }

    if (isDev) {
      const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
      if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      // Admin can delete any review; others can only delete their own
      if (!isAdmin && review.user_id !== user.id) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      }
      db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    } else {
      const res = await db.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).all();
      const review = res.results?.[0] as { user_id: string } | undefined;
      if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      // Admin can delete any review; others can only delete their own
      if (!isAdmin && review.user_id !== user.id) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      }
      await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[reviews] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}