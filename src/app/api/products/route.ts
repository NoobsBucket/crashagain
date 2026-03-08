export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  // eslint-disable-next-line no-var
  var env: {
    DB: any;
    R2_BUCKET: any;
  };
}

async function getEnv() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) console.error("[products] DB binding missing!");
  return env as { DB: any; R2_BUCKET: any };
}

// ── GET ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { DB } = await getEnv();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const productId  = searchParams.get("id");

    if (productId) {
      const pr = await DB.prepare("SELECT * FROM products WHERE id = ?").bind(productId).all();
      const product = pr.results?.[0] ?? null;
      if (!product) return NextResponse.json({ product: null }, { status: 404 });

      const ir = await DB.prepare(
        "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC"
      )
        .bind(productId)
        .all();

      return NextResponse.json({ product: { ...product, images: ir.results ?? [] } });
    }

    const base = `
      SELECT p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url
      FROM products p
    `;
    const query = categoryId
      ? `${base} WHERE p.category_id = ? ORDER BY p.created_at DESC`
      : `${base} ORDER BY p.created_at DESC`;

    const res = categoryId
      ? await DB.prepare(query).bind(categoryId).all()
      : await DB.prepare(query).all();

    return NextResponse.json({ results: res.results ?? [] });
  } catch (err: any) {
    console.error("[products] GET error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch products" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { DB } = await getEnv();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, price, description = "", category_id, image_urls } = body;

    if (!name?.trim())
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      return NextResponse.json({ error: "A valid positive price is required" }, { status: 400 });
    if (!category_id || isNaN(Number(category_id)))
      return NextResponse.json({ error: "category_id is required" }, { status: 400 });
    if (!Array.isArray(image_urls) || image_urls.length === 0)
      return NextResponse.json({ error: "At least one image_url is required" }, { status: 400 });

    const firstImage = image_urls[0];

    const insertResult = await DB.prepare(
      "INSERT INTO products (name, price, description, category_id, image_url) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(name.trim(), Number(price), description.trim(), Number(category_id), firstImage)
      .run();

    const productId = insertResult.meta?.last_row_id;
    if (!productId) throw new Error("Product insert did not return a valid ID");

    for (let i = 0; i < image_urls.length; i++) {
      await DB.prepare(
        "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)"
      )
        .bind(productId, image_urls[i], i)
        .run();
    }

    return NextResponse.json(
      {
        success: true,
        product: {
          id: productId,
          name,
          price: Number(price),
          description,
          category_id: Number(category_id),
          image_url: firstImage,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[products] POST error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create product" }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────
// Accepts JSON body: { id, name, price, description, category_id, image_url? }
// image_url is optional — only updated if provided.
export async function PATCH(req: NextRequest) {
  try {
    const { DB } = await getEnv();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { id, name, price, description, category_id, image_url } = body;

    // ── Validate ──
    const numId = Number(id);
    if (!numId || isNaN(numId))
      return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    if (!name?.trim())
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      return NextResponse.json({ error: "A valid positive price is required" }, { status: 400 });
    if (!category_id || isNaN(Number(category_id)))
      return NextResponse.json({ error: "category_id is required" }, { status: 400 });

    // ── Check product exists ──
    const existing = await DB.prepare("SELECT id, image_url FROM products WHERE id = ?")
      .bind(numId)
      .all();
    if (!existing.results?.length)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const currentImageUrl = existing.results[0].image_url;
    const newImageUrl     = image_url ?? currentImageUrl;

    // ── Update products table ──
    await DB.prepare(
      `UPDATE products
       SET name = ?, price = ?, description = ?, category_id = ?, image_url = ?
       WHERE id = ?`
    )
      .bind(
        name.trim(),
        Number(price),
        description?.trim() ?? "",
        Number(category_id),
        newImageUrl,
        numId
      )
      .run();

    // ── If a new image was provided, also update product_images cover slot ──
    if (image_url && image_url !== currentImageUrl) {
      // Update sort_order = 0 row if it exists, otherwise insert
      const coverRow = await DB.prepare(
        "SELECT id FROM product_images WHERE product_id = ? AND sort_order = 0"
      )
        .bind(numId)
        .all();

      if (coverRow.results?.length) {
        await DB.prepare(
          "UPDATE product_images SET image_url = ? WHERE product_id = ? AND sort_order = 0"
        )
          .bind(image_url, numId)
          .run();
      } else {
        await DB.prepare(
          "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, 0)"
        )
          .bind(numId, image_url)
          .run();
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: numId,
        name: name.trim(),
        price: Number(price),
        description: description?.trim() ?? "",
        category_id: Number(category_id),
        image_url: newImageUrl,
      },
    });
  } catch (err: any) {
    console.error("[products] PATCH error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update product" },
      { status: 500 }
    );
  }
}

// ── DELETE ────────────────────────────────────────────────────────
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
    if (!id || isNaN(id))
      return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });

    const existing = await DB.prepare("SELECT id FROM products WHERE id = ?").bind(id).all();
    if (!existing.results?.length)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // 1. Delete reviews first
    await DB.prepare("DELETE FROM reviews WHERE product_id = ?").bind(id).run();
    // 2. Delete product images
    await DB.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
    // 3. Delete the product
    await DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[products] DELETE error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete product" },
      { status: 500 }
    );
  }
}