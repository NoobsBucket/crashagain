export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

// GET reviews for a product — public
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');

    if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 });

    let results;
    if (process.env.NODE_ENV === 'development') {
      results = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(productId);
    } else {
      const res = await db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(productId);
      results = res.results;
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST a review — must be logged in
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('AUTH DEBUG v6:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'You must be logged in to leave a review' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const user_name = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Anonymous';

    const db = getDB();
    const { product_id, rating, comment } = await req.json() as {
      product_id: number;
      rating: number;
      comment: string;
    };

    if (!product_id || !rating || !comment?.trim()) {
      return NextResponse.json({ error: 'product_id, rating and comment are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    let result;
    if (process.env.NODE_ENV === 'development') {
      result = db.prepare(
        'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)'
      ).run(product_id, userId, user_name, rating, comment.trim());
    } else {
      result = await db.prepare(
        'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)'
      ).run(product_id, userId, user_name, rating, comment.trim());
    }

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}

// DELETE a review — only by the author
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    const { id } = await req.json() as { id: number };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (process.env.NODE_ENV === 'development') {
      const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
      if (!review || review.user_id !== userId) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    } else {
      const res = await db.prepare('SELECT * FROM reviews WHERE id = ?').all(id);
      const review = res.results[0] as { user_id: string } | undefined;
      if (!review || review.user_id !== userId) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      await db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}