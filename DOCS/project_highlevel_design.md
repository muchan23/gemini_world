
# Game Design Requirements: Hub & Spoke Web RPG

## 1. Architecture Overview

This project utilizes a "Hub and Spoke" architecture. The game consists of a central Overworld (the Hub) containing interactive trigger zones. Entering a zone pauses the Overworld and transitions the player into an isolated Mini-Game (the Spoke).

**Tech Stack:**

* **Frontend:** Phaser.js (Handles the 2D rendering, game loops, and Scene Management).
* **Backend:** Firebase (Firestore/Realtime Database handles state management and secure AI API calls).

---

## 2. The Overworld (The Hub) Design

**The Thematic Anchor**
The Overworld must be a cohesive 2D tilemap environment that justifies housing five distinct activities. Choose a unified theme, such as a neon cyberpunk arcade, a bustling fantasy tavern, or a Wild West town square.

**Visual Zoning**
Create clear, distinct areas or buildings that visually hint at the type of game inside (e.g., a building with a smoking chimney for a cooking mini-game).

**The Interaction Mechanic**
Place visual cues like a glowing mat, a brightly colored door, or a specific NPC in front of each mini-game location to guide the player.

**The Prompt UI**
When the player's avatar enters the invisible collision box (trigger zone), display a lightweight UI prompt above the player's head.

* *Example text:* "Press [Space] to play [Game Name]"

---

## 3. Mini-Game Integration Constraints

To ensure the mini-games seamlessly plug back into the main world without breaking the game state, designers must adhere to the following rules:

**Isolated Assets**
Each mini-game must use its own dedicated sprite sheets and audio files. This prevents the Overworld from loading memory for games the player hasn't entered.

**Standardized Exits**
Every mini-game must have clear "Win", "Lose", or "Exit" states. Upon completion, the game must return a standardized data payload to the Overworld for Firebase synchronization.

* *Example payload:* `{ coins_earned: 50, game_cleared: true }`

**Consistent UI Canvas**
Maintain visual immersion by ensuring menus, fonts, and "Exit to Main World" buttons look identical across all five games, regardless of the core gameplay differences.

---

## 4. Proposed AI-Powered Mini-Games

| Game Title | Gameplay Mechanic | AI Integration Feature |
| --- | --- | --- |
| **The Interrogation** | Text-based puzzle. The player has 60 seconds to question a suspect to find hidden loot. | Gemini 1.5 Flash acts as the suspect's brain, generating dynamic, real-time responses. |
| **The Appraisal** | Vision-based guessing game. The player estimates the value of a bizarre item presented by a merchant. | Image generation tools create unique, weird item combinations on the fly. |
| **The Translation** | Logic puzzle. The player decodes an "alien" syntax terminal to unlock a door. | Gemini procedural generation creates the riddles and validates the player's logical solution. |

---

Would you like me to write out the basic Phaser.js Scene Manager boilerplate code to show your developers how to handle the transitions between the Overworld and these mini-games?