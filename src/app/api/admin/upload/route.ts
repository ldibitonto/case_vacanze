import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// POST /api/admin/upload
// Riceve un file immagine (multipart/form-data, campo "file").
// - Su Vercel il filesystem è di sola lettura e non persistente (a parte
//   /tmp): non si può scrivere in public/uploads a runtime. Se è configurato
//   Vercel Blob (variabile BLOB_READ_WRITE_TOKEN presente, creata in automatico
//   collegando uno store Blob al progetto da Vercel > Storage) carichiamo lì
//   e l'immagine resta persistente tra deploy.
// - In locale (nessun BLOB_READ_WRITE_TOKEN) si continua a salvare su disco in
//   public/uploads/properties come prima, comodo per lo sviluppo senza dover
//   configurare nulla di esterno.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato: usa JPG, PNG, WEBP o GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Immagine troppo grande (max 5MB)" }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`properties/${filename}`, bytes, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "properties");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/properties/${filename}` });
}
