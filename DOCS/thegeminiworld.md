# The Gemini World: Overworld (The Hub) Implementation Plan

Based on the Hub & Spoke architecture and the High-Level Design requirements, this document outlines the implementation tasks for the 2D Overworld (The Hub).

## 1. Thematic Anchor & Foundation Setup
- [ ] **Define the Unified Theme**: Decide on the visual theme for the Overworld (e.g., Cyberpunk Arcade, Fantasy Tavern, Space Station) that can justify five distinct activities.
- [ ] **Gather/Create Assets**: Source or create 2D tilesets, sprite sheets, and environmental art matching the chosen theme.
- [ ] **Phaser.js Scene Initialization**: Set up the main `OverworldScene` in Phaser.js to handle the game loop and rendering.
- [ ] **Firebase Integration**: Initialize Firestore connection for loading/saving the initial world state (e.g., player position, coins, unlocked zones).

## 2. Environment Construction & Visual Zoning
- [ ] **Build the Tilemap**: Use Tiled or Phaser's built-in tilemap system to layout the Overworld.
- [ ] **Implement Collision Layers**: Define and apply collision layers for walls, buildings, and environmental obstacles.
- [ ] **Design 5 Distinct Zones**: Create clear architectural or thematic areas that visually hint at the 5 mini-games (e.g., The Interrogation, The Appraisal, The Translation).
- [ ] **Add Thematic Embellishments**: Place visual cues around each zone (e.g., a smoking chimney, neon signs, animated props) to reinforce the area's purpose.

## 3. Player Avatar & Locomotion
- [ ] **Player Sprite Setup**: Load the player avatar sprite sheet and create idle/walking animations for all 4 directions (Top-Down perspective).
- [ ] **Movement Logic**: Implement 2D physics-based movement using keyboard inputs (WASD or Arrow Keys).
- [ ] **Camera System**: Set up the Phaser camera to follow the player avatar seamlessly within the tilemap bounds.

## 4. The Interaction Mechanic & Visual Guidance
- [ ] **Place Visual Cues**: Add distinct, interactive-looking elements (e.g., glowing mats, brightly colored doors, specific NPCs) in front of the 5 mini-game zones.
- [ ] **Create Trigger Zones**: Define invisible collision boxes (using Phaser Physics) overlapping the visual cues to act as interaction triggers.

## 5. The Prompt UI System
- [ ] **UI Overlay Construction**: Create a lightweight HTML/CSS or Phaser UI layer that sits above the game canvas.
- [ ] **Proximity Detection**: Implement logic to detect when the player avatar overlaps with a trigger zone.
- [ ] **Dynamic Prompt Display**: Show the interaction prompt (e.g., "Press [Space] to play [Game Name]") over the player's head or on the UI when entering a zone, and hide it when exiting.

## 6. Mini-Game Transition & State Management
- [ ] **Interaction Input Handling**: Listen for the designated interaction key (e.g., `Spacebar`) while the player is inside a trigger zone.
- [ ] **Scene Transition Logic**: Write the Phaser Scene Manager boilerplate to pause/sleep the `OverworldScene` and launch the respective `SpokeScene` (Mini-Game).
- [ ] **Return Payload Handler**: Implement exactly how the Overworld handles the standardized data payload (e.g., `{ coins_earned: 50, game_cleared: true }`) returned when a mini-game finishes.
- [ ] **Sync State**: Update the visual Overworld state (e.g., unlocking a new path) and synchronize the new data back to Firebase Firestore upon returning.
