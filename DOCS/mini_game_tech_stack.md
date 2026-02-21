# Battle Royale Mini-Game — Project Summary

## Concept

A top-down battle royale mini-game inspired by Supercell's visual style (Brawl Stars). Players fight AI opponents in a shrinking arena to be the last one standing.

## Tech Stack

### Frontend (Game Client)
- **Phaser 3** — Game rendering, physics, particles (2D top-down)
- **React** — UI shell (menus, HUD, transitions, result screens)
- **TypeScript** — Type safety across the codebase
- **Vite** — Fast dev server and bundling

### Backend & State Management: Firebase
- **Cloud Firestore** — Real-time world state (player data, match state, leaderboards, inventory)
- **Cloud Functions for Firebase** — Secure server-side logic; all AI API calls routed here (never expose API keys in the client)
- **Firebase Genkit** — AI integration framework; gives Gemini "tools" to directly mutate game state (e.g., `trigger_npc_action`, `update_match_state`)
- **Firebase Hosting** — Deployment and hosting

### AI Layer: Gemini Ecosystem (Hybrid)
- **Gemini Flash (Cloud via Vertex AI / AI Studio)** — Core NPC brain: strategic decisions, personality-driven behavior, processing match context in a single prompt
- **Gemini Nano (Local via Chrome Built-in AI)** — Zero-latency local inference: classifying player intent, summarizing events, generating ambient behavior without cloud overhead

## Project Structure

```
gemini_world/
├── src/
│   ├── game/              # Phaser game core
│   │   ├── scenes/        # Main, Lobby, Result
│   │   ├── entities/      # Player, Enemy, Bullet, Item
│   │   ├── systems/       # Physics, Zone shrink, Spawning
│   │   └── config.ts      # Phaser config
│   ├── ui/                # React UI layer
│   │   ├── components/    # HUD, Menu, Result screen
│   │   └── hooks/         # Game state management
│   ├── ai/                # Gemini integration
│   │   ├── cloud/         # Gemini Flash calls (via Cloud Functions)
│   │   ├── local/         # Gemini Nano (Chrome Built-in AI)
│   │   └── enemy-ai.ts    # Enemy AI state machine + AI bridge
│   ├── firebase/          # Firebase config & helpers
│   │   ├── config.ts      # Firebase initialization
│   │   ├── firestore.ts   # Firestore read/write helpers
│   │   └── functions.ts   # Cloud Functions client calls
│   ├── App.tsx
│   └── main.tsx
├── functions/             # Firebase Cloud Functions (server-side)
│   ├── src/
│   │   ├── ai/            # Genkit flows & Gemini tool definitions
│   │   └── index.ts       # Function entry points
│   └── package.json
├── public/assets/         # Sprites, maps, audio
├── firebase.json          # Firebase project config
├── firestore.rules        # Firestore security rules
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Implementation Phases

| Phase | Description | Details |
|-------|-------------|---------|
| **1** | Project Setup | Vite + React + Phaser + TypeScript + Firebase scaffolding |
| **2** | Game Foundation | Main scene, tilemap arena, player-following camera |
| **3** | Player | WASD movement, mouse aiming/shooting, HP, sprite animation |
| **4** | Combat | Bullets, weapon types, item drops, Arcade Physics collision |
| **5** | Battle Royale | Shrinking safe zone, storm damage, random spawns, win condition |
| **6** | AI Enemies | Local state machine (Idle→Patrol→Chase→Attack→Flee) + Gemini Nano for intent classification; Gemini Flash via Cloud Functions for strategic decisions |
| **7** | Firebase Integration | Firestore for match state & leaderboards, Cloud Functions for secure AI calls, Genkit for agentic NPC workflows |
| **8** | React UI | Lobby, HUD (HP, remaining players, minimap, kill log), result screen |
| **9** | Polish | SFX/BGM, particle effects, mobile touch support, deploy to Firebase Hosting |

## Design Approach (Supercell Style)

- **Start with placeholders** (colored circles/squares) to get gameplay working first
- **Style the UI** with Supercell-like CSS (gradients, drop shadows, bold rounded buttons, pop fonts like Lilita One)
- **Replace assets later** using AI-generated sprites (Midjourney / DALL-E with "Supercell style" prompts)
- **Add polish** with Phaser particle effects, screen shake, and tween animations

## Technical Notes

- **Phaser ↔ React communication** via EventEmitter to sync game state with UI
- **Security**: All Gemini API calls routed through Cloud Functions — never expose API keys in the client
- **Hybrid AI strategy**: Gemini Nano handles lightweight, zero-latency tasks in the browser (intent classification, ambient chatter); Gemini Flash handles heavy inference (NPC strategy, personality) server-side via Genkit
- **Firebase Genkit**: Defines AI "tools" that Gemini can invoke to directly update Firestore (e.g., move NPC, trigger animation, change faction loyalty)
- **Real-time sync**: Firestore real-time listeners ensure AI decisions are instantly reflected in the game world
- **Target enemy count**: 10–20 bots per match for performance
