import type { GameConfig } from "./gemini";

export interface GamePackage {
  schemaVersion: number;
  exportedAt: string;
  sourcePrompt: string;
  config: GameConfig;
}

export function sanitizeFileName(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "gemini-arcade-game";
}

export function buildGamePackage(config: GameConfig, sourcePrompt: string): GamePackage {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sourcePrompt,
    config,
  };
}

export function downloadGamePackage(pkg: GamePackage, fileBaseName?: string) {
  const json = JSON.stringify(pkg, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFileName(fileBaseName || pkg.config.theme || "gemini-arcade-game")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseGamePackageText(text: string): GamePackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid package shape.");
  }

  const pkg = parsed as Partial<GamePackage>;
  if (pkg.schemaVersion !== 1) {
    throw new Error("Unsupported package schema version.");
  }
  if (!pkg.config || typeof pkg.config !== "object") {
    throw new Error("Missing config in package.");
  }

  return {
    schemaVersion: 1,
    exportedAt: typeof pkg.exportedAt === "string" ? pkg.exportedAt : new Date().toISOString(),
    sourcePrompt: typeof pkg.sourcePrompt === "string" ? pkg.sourcePrompt : "",
    config: pkg.config as GameConfig,
  };
}
