import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = { prompt: "", out: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--prompt" && argv[i + 1]) {
      args.prompt = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--out" && argv[i + 1]) {
      args.out = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function extFromMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

function safeFileStem(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "generated-image";
}

async function main() {
  readEnvFile();
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is missing. Set it in gemini_arcade/.env.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-pro-image-preview";
  const prompt =
    args.prompt || "Create a tiny blue robot icon with transparent background.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData);
    if (!imagePart?.inlineData?.data) {
      console.error(`[FAIL] ${model}: API responded but no image data was returned.`);
      process.exit(2);
    }

    const mimeType = imagePart.inlineData.mimeType || "application/octet-stream";
    const ext = extFromMimeType(mimeType);
    const defaultDir = path.join(__dirname, "generated_images");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFileName = `${timestamp}_${safeFileStem(prompt)}.${ext}`;
    const outputPath = args.out
      ? path.resolve(process.cwd(), args.out)
      : path.join(defaultDir, defaultFileName);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(imagePart.inlineData.data, "base64"));

    console.log(`[PASS] ${model} is callable and returned image data.`);
    console.log(`mimeType=${mimeType}`);
    console.log(`prompt=${prompt}`);
    console.log(`saved=${outputPath}`);
  } catch (error) {
    const status = error?.status ? `status=${error.status} ` : "";
    const message = error?.message || String(error);
    console.error(`[FAIL] ${model}: ${status}${message}`);
    console.error("Usage: npm run test:gemini-image-model -- --prompt \"...\" --out \"path/to/file.png\"");
    process.exit(3);
  }
}

main();
