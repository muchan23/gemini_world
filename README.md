# PlayGo Workspace

This workspace contains two connected frontend apps:

- `world`: A Phaser-based overworld where the player moves through zones.
- `minigame`: A mini-game app launched from the overworld when the player enters a zone.

The current integration uses an embedded `iframe` flow:
- Enter a zone in `world`
- `world` opens `minigame`
- `minigame` sends results back to `world`

## Repository Structure

```text
worktree/
├── world/
│   └── gemini_world/        # Overworld app (React + Phaser + Firebase client)
└── minigame/
    └── gemini_arcade/       # Mini-game app (React + Phaser)
```

## Key Features

- Zone-based game entry from the overworld
- Embedded mini-game modal with postMessage communication
- Return-to-world flow with mini-game result display
- Custom world labels and title (`PlayGo`)
- Static dungeon-like background in the world
- Player icon loaded from generated asset (`public/generated/player-icon.png`)

## Local Development

Run both apps in separate terminals.

### 1) Start mini-game app

```bash
cd minigame/gemini_arcade
npm install
npm run dev -- --port 5274
```

### 2) Configure world app

Create `world/gemini_world/.env`:

```env
VITE_MINIGAME_URL=http://localhost:5274
VITE_GEMINI_API_KEY=YOUR_API_KEY   # optional for generation-related features
```

### 3) Start world app

```bash
cd world/gemini_world
npm install
npm run dev -- --port 5273
```

Open:

- World: `http://localhost:5273`
- Mini-game direct (optional): `http://localhost:5274`

## Communication Contract (Current)

### From world -> minigame

- `WORLD_INIT`
  - includes `zoneId`, `zoneName`, and start metadata

### From minigame -> world

- `MINIGAME_READY`
- `MINIGAME_FINISH`
  - includes `result`, optional `score`, optional `reward`
- `MINIGAME_CLOSE`

## Notes

- This workspace is organized as two separate Git working trees/repositories under one folder.
- Keep `.env` files local and out of commits.
- If ports are already in use, adjust both the dev server port and `VITE_MINIGAME_URL` accordingly.
