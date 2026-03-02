export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDB() {
  const { env } = getCloudflareContext();
  if (!env.DB) console.error("DEBUG: env.DB is undefined!");
  return env.DB;
}

// ---------------------------
// GET all products or single product
// ---------------------------
export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const productId = searchParams.get("id");

    // Single product with all images
    if (productId) {
      const pr = await db.prepare("SELECT * FROM products WHERE id = ?").bind(productId).all();
      const product = pr.results[0];

      const ir = await db.prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC").bind(productId).all();
      const images = ir.results;

      console.log("DEBUG GET single product:", { product, images });
      return NextResponse.json({ product: { ...product, images } });
    }

    // All products with first image
    let query = `
      SELECT p.*, 
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url
      FROM products p
    `;
    if (categoryId) query += " WHERE p.category_id = ?";
    query += " ORDER BY p.created_at DESC";

    const res = categoryId
      ? await db.prepare(query).bind(categoryId).all()
      : await db.prepare(query).all();

    console.log("DEBUG GET all products:", res.results);
    return NextResponse.json({ results: res.results });
  } catch (err: unknown) {
    console.error("DEBUG GET ERROR:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: `Failed to fetch products: ${message}` }, { status: 500 });
  }
}

// ---------------------------
// POST create product
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const { name, price, description, category_id, image_urls } = await req.json() as {
      name: string;
      price: number;
      description: string;
      category_id: number;
      image_urls?: string[];
    };

    if (!name || !price || !category_id) {
      return NextResponse.json({ error: "name, price, and category_id are required" }, { status: 400 });
    }

    // Insert product
    const result = await db.prepare(
      "INSERT INTO products (name, price, description, category_id, image_url) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, price, description || "", category_id, image_urls?.[0] ?? "").run();

    const productId = result.meta?.last_row_id ?? 0;

    // Insert additional images
    if (image_urls?.length) {
      for (let i = 0; i < image_urls.length; i++) {
        await db.prepare(
          "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)"
        ).bind(productId, image_urls[i], i).run();
      }
    }

    console.log("DEBUG POST created product:", { productId, name, price, category_id, image_urls });
    return NextResponse.json({ success: true, product: { id: productId, name, price, description, category_id } });
  } catch (err: unknown) {
    console.error("DEBUG POST ERROR:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: `Failed to create product: ${message}` }, { status: 500 });
  }
}

// ---------------------------
// DELETE product
// ---------------------------
export async function DELETE(req: NextRequest) {
  try {
    const db = getDB();
    const { id } = await req.json() as { id: number };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
    await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    console.log("DEBUG DELETE product:", id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("DEBUG DELETE ERROR:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: `Failed to delete product: ${message}` }, { status: 500 });
  }
}