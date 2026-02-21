import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export interface ImageResult {
  url: string;
  modelUsed: string;
}

export interface ImageGenOptions {
  modelsToTry?: string[];
  allowFallback?: boolean;
}

export async function generateImageAsset(prompt: string, options: ImageGenOptions = {}): Promise<ImageResult> {
  const modelsToTry = options.modelsToTry ?? ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"];
  const allowFallback = options.allowFallback ?? true;
  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p: any) => p.inlineData);
      if (imagePart) {
        return {
          url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
          modelUsed: modelName,
        };
      }
      lastError = new Error(`No image data was returned by ${modelName}`);
    } catch (error: any) {
      console.warn(`[ImageGen] Failed with ${modelName}:`, error.message);
      lastError = error;
    }
  }

  if (!allowFallback) {
    throw (lastError instanceof Error ? lastError : new Error("Image generation failed."));
  }

  // フォールバック: Robohash
  const roboUrl = await generateRobohash(prompt);
  return { url: roboUrl, modelUsed: "Robohash (Fallback)" };
}

async function generateRobohash(prompt: string): Promise<string> {
  const isEnemy = prompt.toLowerCase().includes("enemy") || prompt.toLowerCase().includes("red");
  const set = isEnemy ? "set2" : "set1";
  try {
    const response = await fetch(`https://robohash.org/${encodeURIComponent(prompt)}?set=${set}&size=128x128`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return "";
  }
}
