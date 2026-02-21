import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateImageAsset } from "./imageGen";

// Note: In a real app, use Firebase Cloud Functions to keep the API key secure.
// For this MVP, we'll assume the key is provided via environment variables.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export type UnitAbility = "none" | "ranged" | "shield" | "speed_burst";

export interface PlayerUnit {
  name: string;
  hp: number;
  speed: number;
  range: number;
  cost: number;
  color: string;
  ability?: UnitAbility;
  imageUrl?: string;
  imageSource?: string;
  textureKey?: string;
}

export interface EnemyUnit {
  name: string;
  hp: number;
  speed: number;
  color: string;
  ability?: UnitAbility;
  imageUrl?: string;
  imageSource?: string;
  textureKey?: string;
}

export interface GameConfig {
  theme: string;
  gameMode?: "lane-battle" | "sports-duel";
  spawnPattern?: "steady" | "waves" | "boss_rush";
  winCondition?: "destroy_base" | "survival" | "score_race";
  timerSeconds?: number;
  targetScore?: number;
  arenaImageUrl?: string;
  arenaImageSource?: string;
  arenaPrompt?: string;
  playerUnits: PlayerUnit[];
  enemyUnits: EnemyUnit[];
  waveDifficulty: number;
}

export async function generateGameConfig(userPrompt: string): Promise<GameConfig> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env file.");
  }

  // Based on DOCS/gemini_api.md, the latest models are in the Gemini 3 series.
  const modelsToTry = [
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest"
  ];

  let config: GameConfig | null = null;
  let lastError;

  // 1. Generate Game Logic/Config
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are a game designer for a Supercell-style arcade battle game.
        Based on the user's request: "${userPrompt}", generate a game configuration in JSON format.
        The output should match this interface:
        {
          "theme": string,
          "gameMode": "lane-battle" | "sports-duel",
          "spawnPattern": "steady" | "waves" | "boss_rush",
          "winCondition": "destroy_base" | "survival" | "score_race",
          "timerSeconds": number | null,
          "targetScore": number | null,
          "arenaPrompt": string,
          "playerUnits": [{ "name": string, "hp": number, "speed": number, "range": number, "cost": number, "color": string, "ability": "none" | "ranged" | "shield" | "speed_burst" }],
          "enemyUnits": [{ "name": string, "hp": number, "speed": number, "color": string, "ability": "none" | "ranged" | "shield" | "speed_burst" }],
          "waveDifficulty": number
        }
        Rules:
        - If the request is about sports like tennis/soccer/baseball, set "gameMode" to "sports-duel".
        - Otherwise set "gameMode" to "lane-battle".
        - "arenaPrompt" must describe a playable top-down battle arena that visually matches the theme.
        - For tennis specifically, "arenaPrompt" should clearly request a tennis court with center net and court lines, top-down.
        - Make sure the values are balanced for a fun experience.
        - "spawnPattern": zombies/horror themes → "waves", boss/dragon/epic themes → "boss_rush", otherwise → "steady"
        - "winCondition": defense/survival themes → "survival", sports/score themes → "score_race", attack/battle themes → "destroy_base"
        - "timerSeconds": 30–120 if winCondition is "survival", otherwise null
        - "targetScore": 3–10 if winCondition is "score_race", otherwise null
        - Unit "ability": archer/mage/ranged units → "ranged", tank/heavy units → "shield", scout/fast units → "speed_burst", fighter/brawler → "none"
        Only return the JSON. Do not add any markdown formatting or explanations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`Success with model: ${modelName}`);

      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        config = JSON.parse(cleanText) as GameConfig;
        if (!config.gameMode) {
          config.gameMode = /tennis|soccer|football|baseball|basketball|volleyball|sports?/i.test(userPrompt)
            ? "sports-duel"
            : "lane-battle";
        }
        if (!config.arenaPrompt) {
          config.arenaPrompt = config.gameMode === "sports-duel"
            ? `Top-down colorful ${config.theme} sports arena with field markings, center line, and clear play zone.`
            : `Top-down colorful ${config.theme} battle arena with lanes, clear pathing, and readable obstacles.`;
        }
        // Fallback defaults for new fields
        if (!config.spawnPattern) config.spawnPattern = "steady";
        if (!config.winCondition) config.winCondition = "destroy_base";
        if (config.winCondition === "survival" && !config.timerSeconds) config.timerSeconds = 60;
        if (config.winCondition === "score_race" && !config.targetScore) config.targetScore = 5;
        config.playerUnits = config.playerUnits.map(u => ({ ...u, ability: u.ability ?? "none" }));
        config.enemyUnits  = config.enemyUnits.map(u => ({ ...u, ability: u.ability ?? "none" }));
        break; // Success!
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error);
      lastError = error;
    }
  }

  if (!config) {
    throw lastError || new Error("All models failed to generate content.");
  }

  // 2. Generate arena image used directly inside the play field.
  const arenaPrompt = `
    Top-down game background art for active gameplay.
    Theme: ${config.theme}.
    Mode: ${config.gameMode}.
    User request: "${userPrompt}".
    Arena description: "${config.arenaPrompt}".
    Requirements: no text, no logos, no UI, clear ground markings, readable center area, vibrant style.
  `.trim();

  try {
    const arena = await generateImageAsset(arenaPrompt, {
      modelsToTry: ["gemini-3-pro-image-preview"],
      allowFallback: false,
    });
    config.arenaImageUrl = arena.url;
    config.arenaImageSource = arena.modelUsed;
  } catch (error) {
    console.warn("Arena image generation failed:", error);
  }

  // We generate unit images in parallel for all units.
  console.log("Generating assets with Nano Banana Pro...");

  const assetPromises = [
    ...config.playerUnits.map(async (unit) => {
        const imagePrompt = config!.gameMode === "sports-duel"
          ? `Supercell style 3D icon of ${unit.name}, ${config!.theme} sports athlete, action pose, transparent background, cute, vibrant colors`
          : `Supercell style 3D icon of ${unit.name}, ${config!.theme} theme, transparent background, cute, vibrant colors`;
        const result = await generateImageAsset(imagePrompt);
        unit.imageUrl = result.url;
        unit.imageSource = result.modelUsed;
    }),
    ...config.enemyUnits.map(async (unit) => {
        const imagePrompt = config!.gameMode === "sports-duel"
          ? `Supercell style 3D icon of ${unit.name}, ${config!.theme} rival athlete, action pose, transparent background, cute, vibrant colors`
          : `Supercell style 3D icon of ${unit.name}, ${config!.theme} theme, transparent background, cute, vibrant colors`;
        const result = await generateImageAsset(imagePrompt);
        unit.imageUrl = result.url;
        unit.imageSource = result.modelUsed;
    })
  ];

  await Promise.all(assetPromises);

  return config;
}
