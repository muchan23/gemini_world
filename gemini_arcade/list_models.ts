import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");
  try {
    // Note: The SDK might not have a direct listModels, we might need to use the REST API
    // or just try common patterns based on the DOCS.
    console.log("Checking for Gemini 3 series models...");
    const models = ["gemini-3.1-pro-preview", "gemini-3.1-flash-preview", "gemini-3-flash-preview", "gemini-2.0-flash-exp", "gemini-1.5-flash"];
    
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            // Small test call
            await model.generateContent("test");
            console.log(`[AVAILABLE] ${m}`);
        } catch (e: any) {
            console.log(`[NOT FOUND] ${m}: ${e.message.substring(0, 50)}...`);
        }
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
