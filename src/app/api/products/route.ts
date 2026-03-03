export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ---------------------------
// D1 + R2 Interfaces
// ---------------------------
interface D1BoundStatement {
  run: () => Promise<D1Result>;
  all: () => Promise<D1Result>;
}

interface D1PreparedStatement {
  run: () => Promise<D1Result>;
  all: () => Promise<D1Result>;
  bind: (...args: unknown[]) => D1BoundStatement;
}

interface D1Result {
  results?: any[];
  meta?: { last_row_id?: number; [key: string]: any };
}

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface R2BucketBinding {
  put: (key: string, value: ArrayBuffer | Buffer, options?: any) => Promise<any>;
}

interface CloudflareEnv {
  DB: D1Database;
  R2_BUCKET: R2BucketBinding;
}

// ---------------------------
// Helpers
// ---------------------------
async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as CloudflareEnv;
  if (!e.DB) console.error("DEBUG: DB binding missing!");
  if (!e.R2_BUCKET) console.error("DEBUG: R2_BUCKET binding missing!");
  return e;
}

function getR2Url(fileName: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("R2_PUBLIC_URL environment variable is not set");
  return `${base}/${fileName}`;
}

// ---------------------------
// GET PRODUCTS
// ---------------------------
export async function GET(req: NextRequest) {
  try {
    const { DB } = await getEnv();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const productId = searchParams.get("id");

    // Single product with images
    if (productId) {
      const pr = await DB.prepare("SELECT * FROM products WHERE id = ?")
        .bind(productId)
        .all();
      const product = pr.results?.[0] ?? null;

      if (!product) {
        return NextResponse.json({ product: null }, { status: 404 });
      }

      const ir = await DB.prepare(
        "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC"
      )
        .bind(productId)
        .all();

      return NextResponse.json({ product: { ...product, images: ir.results ?? [] } });
    }

    // All products (optionally filtered by category)
    const baseQuery = `
      SELECT p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url
      FROM products p
    `;
    const query = categoryId
      ? `${baseQuery} WHERE p.category_id = ? ORDER BY p.created_at DESC`
      : `${baseQuery} ORDER BY p.created_at DESC`;

    const res = categoryId
      ? await DB.prepare(query).bind(categoryId).all()
      : await DB.prepare(query).all();

    return NextResponse.json({ results: res.results ?? [] });
  } catch (err: any) {
    console.error("GET /products error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ---------------------------
// POST PRODUCT + R2 UPLOAD
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    const { DB, R2_BUCKET } = await getEnv();

    const formData = await req.formData();
    const name = (formData.get("name") as string | null)?.trim();
    const price = Number(formData.get("price"));
    const description = ((formData.get("description") as string | null) ?? "").trim();
    const category_id = Number(formData.get("category_id"));
    const files = formData.getAll("images") as File[];

    // Validate
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!price || isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "A valid positive price is required" }, { status: 400 });
    }
    if (!category_id || isNaN(category_id)) {
      return NextResponse.json({ error: "category_id is required" }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    // Upload images to R2
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a valid image` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `products/${Date.now()}-${i}-${safeName}`;

      await R2_BUCKET.put(fileName, buffer, {
        httpMetadata: { contentType: file.type },
      });

      uploadedUrls.push(getR2Url(fileName));
    }

    const firstImage = uploadedUrls[0];

    // Insert product row
    const insertResult = await DB.prepare(
      "INSERT INTO products (name, price, description, category_id, image_url) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(name, price, description, category_id, firstImage)
      .run();

    const productId = insertResult.meta?.last_row_id;
    if (!productId) {
      throw new Error("Product insert did not return a valid ID");
    }

    // Insert product_images rows
    for (let i = 0; i < uploadedUrls.length; i++) {
      await DB.prepare(
        "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)"
      )
        .bind(productId, uploadedUrls[i], i)
        .run();
    }

    return NextResponse.json(
      {
        success: true,
        product: { id: productId, name, price, description, category_id, image_url: firstImage },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /products error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create product" },
      { status: 500 }
    );
  }
}

// ---------------------------
// DELETE PRODUCT
// ---------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { DB } = await getEnv();

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

    // Check product exists
    const existing = await DB.prepare("SELECT id FROM products WHERE id = ?").bind(id).all();
    if (!existing.results?.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await DB.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
    await DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /products error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete product" },
      { status: 500 }
    );
  }
}