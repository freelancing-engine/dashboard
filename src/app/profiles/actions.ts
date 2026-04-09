"use server";

import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export type FileResult =
  | { mode: "text"; text: string }
  | { mode: "file"; file_base64: string; mime: string }
  | { error: string };

export async function processFileForCV(formData: FormData): Promise<FileResult> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió archivo" };

  if (file.size > MAX_FILE_SIZE) {
    return { error: "El archivo excede el límite de 10 MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
    return { error: "Formato no soportado. Usá PDF, DOCX o TXT." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    // PDF: send as base64 for GPT-4o to read directly
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return { mode: "file", file_base64: base64, mime: "application/pdf" };
    }

    // DOCX: extract text with mammoth (works fine in Next.js)
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) return { error: "No se pudo extraer texto del DOCX" };
      return { mode: "text", text };
    }

    // Plain text
    const text = Buffer.from(arrayBuffer).toString("utf-8").trim();
    if (!text) return { error: "El archivo está vacío" };
    return { mode: "text", text };
  } catch (e) {
    console.error("File processing error:", e);
    return { error: "Error al procesar el archivo" };
  }
}
