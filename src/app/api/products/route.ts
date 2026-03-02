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

// GET all products (optionally filter by category_id) with images
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');
    const productId = searchParams.get('id');

    const isDev = process.env.NODE_ENV === 'development';

    // Single product with all images
    if (productId) {
      let product, images;
      if (isDev) {
        product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(productId);
      } else {
        const pr = await db.prepare('SELECT * FROM products WHERE id = ?').all(productId);
        product = pr.results[0];
        const ir = await db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(productId);
        images = ir.results;
      }
      return NextResponse.json({ product: { ...product, images } });
    }

    // All products with first image
    let products;
    if (isDev) {
      if (categoryId) {
        products = db.prepare('SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url FROM products p WHERE p.category_id = ? ORDER BY p.created_at DESC').all(categoryId);
      } else {
        products = db.prepare('SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url FROM products p ORDER BY p.created_at DESC').all();
      }
    } else {
      const query = categoryId
        ? 'SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url FROM products p WHERE p.category_id = ? ORDER BY p.created_at DESC'
        : 'SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url FROM products p ORDER BY p.created_at DESC';
      const res = categoryId
        ? await db.prepare(query).all(categoryId)
        : await db.prepare(query).all();
      products = res.results;
    }

    return NextResponse.json({ results: products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST create product + upload multiple images
export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const { name, price, description, category_id, image_urls } = await req.json() as {
      name: string;
      price: number;
      description: string;
      category_id: number;
      image_urls: string[];
    };

    if (!name || !price || !category_id) {
      return NextResponse.json({ error: 'name, price and category_id are required' }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === 'development';
    let productId: number;

    if (isDev) {
      const result = db.prepare(
        'INSERT INTO products (name, price, description, category_id) VALUES (?, ?, ?, ?)'
      ).run(name, price, description || '', category_id);
      productId = result.lastInsertRowid;

      if (image_urls?.length) {
        const stmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)');
        image_urls.forEach((url: string, i: number) => stmt.run(productId, url, i));
      }
    } else {
      const result = await db.prepare(
        'INSERT INTO products (name, price, description, category_id) VALUES (?, ?, ?, ?)'
      ).run(name, price, description || '', category_id);
      productId = result.lastInsertRowid as number;

      if (image_urls?.length) {
        for (let i = 0; i < image_urls.length; i++) {
          await db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)').run(productId, image_urls[i], i);
        }
      }
    }

    return NextResponse.json({ success: true, product: { id: productId, name, price, description, category_id } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// DELETE product and its images
export async function DELETE(req: NextRequest) {
  try {
    const db = getDB();
    const { id } = await req.json() as { id: number };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
    } else {
      await db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      await db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}