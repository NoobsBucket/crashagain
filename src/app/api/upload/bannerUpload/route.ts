import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Env variables
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY!;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;

const s3Client = new S3Client({
  endpoint: R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}-${file.name}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileName,
        Body: buffer,       
        ContentType: file.type
      })
    );

    const publicUrl = `https://pub-2bbed4cb70334d47bdd2825ee931d263.r2.dev/${fileName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
