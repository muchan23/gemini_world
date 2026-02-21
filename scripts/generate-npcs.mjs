#!/usr/bin/env node
/**
 * LPC NPC Spritesheet Generator
 * Downloads sprite layers from the Universal LPC Spritesheet Character Generator
 * and composites them into walk-cycle spritesheets for game NPCs.
 *
 * Output: 576x256 PNG per NPC (9 frames × 4 directions at 64×64 each)
 * Row order: up, left, down, right
 *
 * Assets from: https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/
 * License: CC-BY-SA 3.0 / GPLv3 (credit required)
 */

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'sprites');
const BASE_URL = 'https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/spritesheets/';

// ─── NPC Definitions ──────────────────────────────────────────
// Each NPC has layers ordered by z-index (bottom to top)
// Layer paths map to: BASE_URL + path + 'walk/' + variant + '.png'

const NPC_CONFIGS = [
  {
    name: 'aldric',
    layers: [
      { path: 'body/bodies/male/', variant: 'olive' },
      { path: 'feet/shoes/basic/male/', variant: 'brown' },
      { path: 'legs/pants/male/', variant: 'maroon' },
      { path: 'torso/clothes/longsleeve/longsleeve2_polo/male/', variant: 'purple' },
      { path: 'head/heads/human/male_plump/', variant: 'olive' },
      { path: 'hair/braid2/adult/', variant: 'redhead' },
    ],
  },
  {
    name: 'brendan',
    layers: [
      { path: 'body/bodies/male/', variant: 'olive' },
      { path: 'feet/boots/rim/male/', variant: 'teal' },
      { path: 'legs/pants2/male/', variant: 'red' },
      { path: 'torso/clothes/longsleeve/longsleeve2_cardigan/male/', variant: 'teal' },
      { path: 'head/heads/human/male_elderly/', variant: 'olive' },
      { path: 'hair/bob_side_part/adult/', variant: 'platinum' },
    ],
  },
  {
    name: 'cedric',
    layers: [
      { path: 'body/bodies/male/', variant: 'taupe' },
      { path: 'feet/boots/rim_fold/male/', variant: 'maroon' },
      { path: 'legs/pants/male/', variant: 'brown' },
      { path: 'torso/clothes/longsleeve/longsleeve2_cardigan/male/', variant: 'maroon' },
      { path: 'head/heads/human/male/', variant: 'taupe' },
      { path: 'hair/parted2/adult/', variant: 'blonde' },
    ],
  },
  {
    name: 'dorian',
    layers: [
      { path: 'body/bodies/male/', variant: 'taupe' },
      { path: 'feet/shoes/basic/male/', variant: 'brown' },
      { path: 'legs/pants/male/', variant: 'purple' },
      { path: 'torso/clothes/longsleeve/longsleeve2_cardigan/male/', variant: 'gray' },
      { path: 'head/heads/human/male_elderly/', variant: 'taupe' },
      { path: 'hair/side_parted_bangs2/adult/', variant: 'platinum' },
    ],
  },
  {
    name: 'edmund',
    layers: [
      { path: 'body/bodies/male/', variant: 'black' },
      { path: 'feet/shoes/sara/male/', variant: 'blue' },
      { path: 'legs/pants2/male/', variant: 'red' },
      { path: 'torso/clothes/longsleeve/laced/male/', variant: 'red' },
      { path: 'head/heads/human/male_gaunt/', variant: 'black' },
      { path: 'hair/flat_top_fade/adult/', variant: 'black' },
    ],
  },
];

// ─── Sprite Generation ────────────────────────────────────────

async function fetchLayer(layerPath, variant) {
  const url = `${BASE_URL}${layerPath}walk/${variant}.png`;
  console.log(`  Fetching: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return await loadImage(buffer);
  } catch (err) {
    console.warn(`  ⚠ Failed to load ${url}: ${err.message}`);
    return null;
  }
}

async function generateNPC(config) {
  console.log(`\nGenerating ${config.name}...`);

  // Walk sprites are 576×256 (9 frames × 4 directions at 64×64)
  const canvas = createCanvas(576, 256);
  const ctx = canvas.getContext('2d');

  // Load and composite each layer
  for (const layer of config.layers) {
    const img = await fetchLayer(layer.path, layer.variant);
    if (img) {
      // The walk animation PNG from LPC is 576×256
      ctx.drawImage(img, 0, 0, 576, 256);
    }
  }

  // Save as PNG
  const pngBuffer = canvas.toBuffer('image/png');
  const outPath = join(OUT_DIR, `${config.name}.png`);
  writeFileSync(outPath, pngBuffer);
  console.log(`  ✓ Saved ${outPath} (${(pngBuffer.length / 1024).toFixed(1)}KB)`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log('LPC NPC Spritesheet Generator');
  console.log('=============================\n');
  console.log(`Output: ${OUT_DIR}`);
  console.log(`NPCs to generate: ${NPC_CONFIGS.length}\n`);

  for (const config of NPC_CONFIGS) {
    await generateNPC(config);
  }

  // Also generate a metadata JSON for the game to use
  const metadata = NPC_CONFIGS.map(c => ({
    name: c.name,
    file: `${c.name}.png`,
    frameWidth: 64,
    frameHeight: 64,
    framesPerRow: 9,
    directions: ['up', 'left', 'down', 'right'],
  }));

  writeFileSync(
    join(OUT_DIR, 'npcs.json'),
    JSON.stringify(metadata, null, 2)
  );
  console.log(`\n✓ Metadata saved to ${join(OUT_DIR, 'npcs.json')}`);
  console.log('\nDone! Run `npm run dev` to see NPCs in Box World.');
}

main().catch(console.error);
