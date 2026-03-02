export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server";

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
// Simple fuzzy match — checks if query chars appear in order in the target
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact or contains match
  if (t.includes(q)) return true;

  // Fuzzy: all chars of query appear in order in target
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return true;

  // Typo tolerance: allow 1 char difference (simple edit distance check)
  if (q.length >= 4) {
    for (let skip = 0; skip < q.length; skip++) {
      const shortened = q.slice(0, skip) + q.slice(skip + 1);
      if (t.includes(shortened)) return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) return NextResponse.json({ results: [] });

    const isDev = process.env.NODE_ENV === 'development';

    // Get all products with their first image
    let allProducts;
    if (isDev) {
      allProducts = db.prepare(`
        SELECT p.*, 
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.created_at DESC
      `).all();
    } else {
      const res = await db.prepare(`
        SELECT p.*, 
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.created_at DESC
      `).all();
      allProducts = res.results;
    }

    // Filter with fuzzy matching on name, description, category
    const results = allProducts.filter((p: Record<string, string>) =>
      fuzzyMatch(query, p.name || '') ||
      fuzzyMatch(query, p.description || '') ||
      fuzzyMatch(query, p.category_name || '')
    );

    return NextResponse.json({ results, query });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}