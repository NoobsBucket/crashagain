import { NextRequest, NextResponse } from "next/server";

const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY!;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// ── Crypto helpers ──────────────────────────────────────────────

/** Always returns a plain ArrayBuffer — never SharedArrayBuffer */
function toPlainArrayBuffer(input: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input;
  return input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength
  ) as ArrayBuffer;
}

function encode(str: string): ArrayBuffer {
  return toPlainArrayBuffer(new TextEncoder().encode(str));
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSign(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encode(data));
  return toPlainArrayBuffer(sig);
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const result = await hmacSign(key, data);
  return Array.from(new Uint8Array(result))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSigningKey(
  secret: string,
  date: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate    = await hmacSign(encode(`AWS4${secret}`), date);
  const kRegion  = await hmacSign(kDate, region);
  const kService = await hmacSign(kRegion, service);
  return hmacSign(kService, "aws4_request");
}

// ── Upload ──────────────────────────────────────────────────────

async function signAndUpload(
  fileName: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const url       = `${R2_ENDPOINT}/${R2_BUCKET}/${fileName}`;
  console.log("[bannerUpload] R2_ENDPOINT:", R2_ENDPOINT);
console.log("[bannerUpload] R2_BUCKET:", R2_BUCKET);
console.log("[bannerUpload] Upload URL:", url);
  const now       = new Date();
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzdate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const region    = "auto";
  const service   = "s3";

  const payloadHash = await sha256Hex(body);
  const host        = new URL(url).host;

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzdate}\n`;
  const signedHeaders   = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    `/${R2_BUCKET}/${fileName}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign    = [
    "AWS4-HMAC-SHA256",
    amzdate,
    credentialScope,
    await sha256Hex(encode(canonicalRequest)),
  ].join("\n");

  const signingKey    = await getSigningKey(R2_SECRET_KEY, datestamp, region, service);
  const signature     = await hmacHex(signingKey, stringToSign);
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzdate,
      Authorization: authorization,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed: ${response.status} ${text}`);
  }
}

// ── Route handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files are allowed" }, { status: 400 });
    }

    const body     = toPlainArrayBuffer(new Uint8Array(await file.arrayBuffer()));
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `banners/${Date.now()}-${safeName}`;

    await signAndUpload(fileName, body, file.type);

    return NextResponse.json({ success: true, url: `${R2_PUBLIC_URL}/${fileName}` });
  } catch (err: any) {
    console.error("[bannerUpload] error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}