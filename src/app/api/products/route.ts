export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const { DB, R2_BUCKET } = getCloudflareContext().env;

interface D1Database {
  prepare: (query: string) => {
    run: (...args: unknown[]) => { lastInsertRowid?: number; meta?: any };
    all: (...args: unknown[]) => { results?: any[]; meta?: any };
    bind: (...args: unknown[]) => { run: (...args: unknown[]) => { lastInsertRowid?: number; meta?: any } };
  };
}

interface R2BucketBinding {
  put: (key: string, value: ArrayBuffer | Buffer, options?: any) => Promise<any>;
}

function getEnv() {
  const { env } = getCloudflareContext();
  if (!env.DB) console.error("DEBUG: DB binding missing!");
  if (!env.R2_BUCKET) console.error("DEBUG: R2_BUCKET binding missing!");
  return env;
}

// =============================
// GET PRODUCTS
// =============================
export async function GET(req: NextRequest) {
  try {
    const { DB } = getEnv();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");

    let query = `
      SELECT *
      FROM products
    `;

    if (categoryId) query += " WHERE category_id = ?";
    query += " ORDER BY created_at DESC";

    const result = categoryId
      ? await DB.prepare(query).bind(categoryId).all()
      : await DB.prepare(query).all();

    console.log("DEBUG GET PRODUCTS:", result.results);

    return NextResponse.json({ results: result.results });
  } catch (err: any) {
    console.error("DEBUG GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =============================
// POST PRODUCT (UPLOAD TO R2 + SAVE TO D1)
// =============================
export async function POST(req: NextRequest) {
  try {
    const { DB, R2_BUCKET } = getEnv();

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const description = (formData.get("description") as string) || "";
    const category_id = Number(formData.get("category_id"));

    const files = formData.getAll("images") as File[];

    console.log("DEBUG RECEIVED:", { name, price, category_id, filesCount: files.length });

    if (!name || !price || !category_id || !files.length) {
      return NextResponse.json(
        { error: "name, price, category_id and at least one image required" },
        { status: 400 }
      );
    }

    // ============================
    // 1️⃣ Upload images to R2
    // ============================
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileName = `${Date.now()}-${i}-${file.name}`;

      await R2_BUCKET.put(fileName, buffer, {
        httpMetadata: { contentType: file.type }
      });

      const publicUrl = `https://5ddbcd13948de6131b3554fdd3fe04a4.r2.cloudflarestorage.com/${fileName}`;
      uploadedUrls.push(publicUrl);
    }

    console.log("DEBUG R2 Uploaded:", uploadedUrls);

    const firstImage = uploadedUrls[0];

    // ============================
    // 2️⃣ Insert into products
    // ============================
    const insertResult = await DB.prepare(
      "INSERT INTO products (name, price, description, category_id, image_url) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(name, price, description, category_id, firstImage)
      .run();

    const productId = insertResult.meta?.last_row_id;

    console.log("DEBUG PRODUCT INSERTED:", productId);

    // ============================
    // 3️⃣ Insert into product_images
    // ============================
    for (let i = 0; i < uploadedUrls.length; i++) {
      await DB.prepare(
        "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)"
      )
        .bind(productId, uploadedUrls[i], i)
        .run();
    }

    console.log("DEBUG IMAGES INSERTED");

    return NextResponse.json({
      success: true,
      product: {
        id: productId,
        name,
        price,
        description,
        category_id,
        image_url: firstImage
      }
    });
  } catch (err: any) {
    console.error("DEBUG POST ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// =============================
// DELETE PRODUCT
// =============================
export async function DELETE(req: NextRequest) {
  try {
    const { DB } = getEnv();
    const { id } = (await req.json()) as { id: number };

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await DB.prepare("DELETE FROM product_images WHERE product_id = ?")
      .bind(id)
      .run();

    await DB.prepare("DELETE FROM products WHERE id = ?")
      .bind(id)
      .run();

    console.log("DEBUG PRODUCT DELETED:", id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DEBUG DELETE ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}