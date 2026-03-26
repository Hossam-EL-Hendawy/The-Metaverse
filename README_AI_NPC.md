# AI NPC Upgrade

## Added features
- World-aware NPC identities
- Local AI NPC chat through Ollama
- F key direct interaction with the nearest NPC
- NPC roles: guide, quest, merchant
- Short conversation memory per NPC
- Fallback replies when AI is offline

## Run
1. Install and start Ollama.
2. Pull a model:
   - `ollama pull qwen2.5:3b`
   - or `ollama pull llama3.2:3b`
3. Start the local proxy:
   - `python npc_ai_server.py`
4. Open `index.html`

## Chat usage
- `F` near an NPC: open direct NPC chat
- `T`: general chat
- Commands you can type:
  - `/guide`
  - `/quest`
  - `/merchant`

## Notes
- The game will still work if the AI server is offline.
- AI status appears in the stats panel as `AI NPC`.


## New additions in this build
- World-aware NPC interactions.
- Direct F interaction channel with quick command chips.
- Local persistent NPC memory via localStorage.
- Quest log with accept/progress/turn-in flow.
- Merchant purchases that add items into inventory.

### NPC commands
- `/guide` ask the NPC for navigation/help in the current world
- `/quest` request or review a quest
- `/complete` turn in a ready quest
- `/merchant` open shop behavior / buy items
- `/remember` ask the NPC what it remembers from recent chats

### Notes
Quest and inventory state are stored locally in the browser using localStorage.
