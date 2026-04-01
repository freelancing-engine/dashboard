"use server";

import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

async function extractPdfText(data: Uint8Array): Promise<string> {
  // Use pdfjs-dist legacy build directly — no workers needed for Node.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => item.str ?? "")
      .join(" ");
    pages.push(pageText);
  }
  await doc.destroy();
  return pages.join("\n");
}

export async function extractTextFromFile(
  formData: FormData,
): Promise<{ text: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió archivo" };

  if (file.size > MAX_FILE_SIZE) {
    return { error: "El archivo excede el límite de 10 MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
    return {
      error: "Formato no soportado. Usá PDF, DOCX o TXT.",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const text = (await extractPdfText(new Uint8Array(arrayBuffer))).trim();
      if (!text)
        return { error: "No se pudo extraer texto del PDF. ¿Está escaneado?" };
      return { text };
    }

    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) return { error: "No se pudo extraer texto del DOCX" };
      return { text };
    }

    // Plain text
    const text = buffer.toString("utf-8").trim();
    if (!text) return { error: "El archivo está vacío" };
    return { text };
  } catch (e) {
    console.error("File extraction error:", e);
    return { error: "Error al procesar el archivo" };
  }
}
