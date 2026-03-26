
# AI NPC Metaverse Platform

A browser-based metaverse/game prototype with:

- Player movement and world exploration
- Interactive NPCs
- Local AI-powered NPC conversations
- World-aware NPC behavior
- Quest and merchant commands
- Simple conversation memory
- Inventory and quest log UI
- Direct NPC interaction using the keyboard

This project is designed to run **locally** on your machine and uses **Ollama** for local LLM inference, so you do not need a cloud AI API.

<img width="1231" height="1216" alt="1" src="https://github.com/user-attachments/assets/40ffbc52-7b02-4433-b1b5-21007b50ddb0" />
<img width="1255" height="1248" alt="2" src="https://github.com/user-attachments/assets/a2b6b5bc-8087-4ea8-9707-49554665d76b" />
<img width="1254" height="1244" alt="3" src="https://github.com/user-attachments/assets/aae6f069-28c6-425d-8802-25dd41550baf" />
<img width="1251" height="1251" alt="4" src="https://github.com/user-attachments/assets/73d4d427-2908-46e4-954c-62991ecfb9a2" />
<img width="1254" height="1243" alt="5" src="https://github.com/user-attachments/assets/3fa12f65-8e35-4485-aac3-22a2b4fe7678" />
<img width="1255" height="1199" alt="6" src="https://github.com/user-attachments/assets/4f558afd-d5ba-4ff6-bf88-31506a7415b0" />


---

# Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [How It Works](#how-it-works)
5. [System Requirements](#system-requirements)
6. [Installation](#installation)
   - [Windows Setup](#windows-setup)
   - [macOS Setup](#macos-setup)
7. [Running the Project](#running-the-project)
8. [Gameplay Controls](#gameplay-controls)
9. [NPC Commands](#npc-commands)
10. [How the AI NPC System Works](#how-the-ai-npc-system-works)
11. [Troubleshooting](#troubleshooting)
12. [Recommended Models](#recommended-models)
13. [Development Notes](#development-notes)
14. [Security and Local Usage Notes](#security-and-local-usage-notes)
15. [Future Improvement Ideas](#future-improvement-ideas)

---

# Project Overview

This project is a local web-based game/metaverse prototype where the player can move through different worlds and interact with NPCs.  
The unique part of this build is that NPCs can be powered by a **local LLM** through **Ollama**, which means:

- AI runs on your machine
- No paid API is required
- You can switch between local models such as **Qwen** or **Llama**
- NPC responses can be context-aware and themed by world

The game frontend runs in the browser, while the AI NPC backend runs as a small local Python server.

---

# Features

## Core Game Features

- Browser-based client
- Movement and world exploration
- Visual UI for chat, quest log, and inventory
- Interactable NPCs
- Context-sensitive direct interaction

## AI Features

- Local AI NPC support through Ollama
- Supports models such as:
  - `qwen2.5:3b`
  - `llama3.2:3b`
- AI NPC health/status detection
- Fallback behavior when AI is unavailable
- NPC replies can be based on:
  - current world
  - current interaction mode
  - lightweight conversation memory

## RPG / Interaction Features

- World-aware NPC roleplay
- Direct interaction mode using **F**
- Quick NPC command system
- Simple quest flow
- Merchant interaction
- Conversation memory saved locally
- Quest log UI
- Inventory updates

---

# Project Structure

A typical project folder may include files similar to the following:

```text
index.html
style.css
engine.js
ui.js
worlds.js
physics.js
particles.js
avatar.js
npc_ai_server.py
requirements.txt
README.md
```

## Important Files

### `index.html`
Main entry point for the browser app.

### `style.css`
Visual styling for the game UI and layout.

### `engine.js`
Core runtime/game logic.

### `ui.js`
Handles chat, UI interactions, NPC messaging, command routing, and status displays.

### `worlds.js`
Defines available worlds and their world-specific behavior/context.

### `physics.js`
Movement and physics behavior.

### `particles.js`
Visual effects logic.

### `avatar.js`
Player/avatar handling.

### `npc_ai_server.py`
Local Python backend that receives NPC requests from the browser and forwards them to Ollama.

### `requirements.txt`
Python dependencies needed for the local AI server.

---

# How It Works

The project is split into two parts:

## 1. Frontend (Browser Game)
Runs in your browser and handles:

- rendering
- controls
- chat UI
- NPC interaction
- quest and merchant commands

## 2. Backend (Local Python AI Proxy)
Runs locally and handles:

- health checks
- communication with Ollama
- model requests
- safe fallback behavior
- structured NPC response generation

## Request Flow

```text
Player -> Browser UI -> local Python server -> Ollama -> Python server -> Browser UI -> NPC reply
```

If the AI server or Ollama is offline, the project should fall back to non-AI responses instead of crashing.

---

# System Requirements

## Minimum Suggested Requirements

### For the Game
- Modern browser:
  - Google Chrome
  - Microsoft Edge
  - Safari
  - Firefox

### For Local AI
- Python 3.10+
- Ollama installed
- At least 8 GB RAM recommended
- More RAM is helpful for larger models

## Recommended
- 16 GB RAM or higher for smoother local model performance
- SSD storage
- Stable CPU performance
- If supported, Apple Silicon on macOS performs very well with local models

---

# Installation

# Windows Setup

## Step 1: Install Python

1. Go to the official Python website.
2. Download Python 3.10 or later.
3. During installation, make sure you enable:

```text
Add Python to PATH
```

4. Verify installation in Command Prompt:

```bash
python --version
```

If `python` does not work, also try:

```bash
py --version
```

## Step 2: Install Ollama

1. Download and install Ollama for Windows from the official Ollama site.
2. After installation, open **Command Prompt** or **PowerShell** and test:

```bash
ollama --version
```

## Step 3: Download a Local Model

Recommended lightweight models:

```bash
ollama pull qwen2.5:3b
```

or

```bash
ollama pull llama3.2:3b
```

To confirm the model is installed:

```bash
ollama list
```

## Step 4: Extract the Project

Extract the project ZIP file into a folder, for example:

```text
C:\Projects\ai-npc-metaverse
```

## Step 5: Install Python Dependencies

Open Command Prompt in the project folder and run:

```bash
pip install -r requirements.txt
```

If `pip` is not recognized:

```bash
python -m pip install -r requirements.txt
```

or:

```bash
py -m pip install -r requirements.txt
```

---

# macOS Setup

## Step 1: Install Python

Check whether Python is already installed:

```bash
python3 --version
```

If not installed, install Python 3.10+.

You can install it from the official Python site, or using Homebrew:

```bash
brew install python
```

## Step 2: Install Ollama

Install Ollama for macOS from the official Ollama site.

After installation, verify:

```bash
ollama --version
```

## Step 3: Pull a Model

Recommended:

```bash
ollama pull qwen2.5:3b
```

or:

```bash
ollama pull llama3.2:3b
```

Confirm:

```bash
ollama list
```

## Step 4: Extract the Project

Extract the ZIP into a folder, for example:

```text
/Users/yourname/Projects/ai-npc-metaverse
```

## Step 5: Install Python Dependencies

Open Terminal in the project folder and run:

```bash
pip3 install -r requirements.txt
```

If needed:

```bash
python3 -m pip install -r requirements.txt
```

---

# Running the Project

You need **two terminal windows**.

## Terminal 1: Start the AI NPC Server

### Windows

```bash
python npc_ai_server.py
```

If needed:

```bash
py npc_ai_server.py
```

### macOS

```bash
python3 npc_ai_server.py
```

This local server usually listens on:

```text
http://127.0.0.1:8765
```

You can test health in your browser:

```text
http://127.0.0.1:8765/health
```

A healthy response should return JSON indicating the server is up.  
Depending on your implementation, this may also confirm whether Ollama is reachable.

---

## Terminal 2: Start a Local Web Server

Do **not** just double-click `index.html` unless you know the project works that way.  
It is strongly recommended to serve the files locally.

### Windows

```bash
python -m http.server 8000
```

or:

```bash
py -m http.server 8000
```

### macOS

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

---

# Quick Start Summary

## Windows

```bash
ollama pull qwen2.5:3b
pip install -r requirements.txt
python npc_ai_server.py
```

Open a second terminal:

```bash
python -m http.server 8000
```

Then visit:

```text
http://127.0.0.1:8000
```

## macOS

```bash
ollama pull qwen2.5:3b
pip3 install -r requirements.txt
python3 npc_ai_server.py
```

Open a second terminal:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://127.0.0.1:8000
```

---

# Gameplay Controls

The exact controls depend on your frontend implementation, but the expected controls are:

- **W / A / S / D** = move
- **Mouse** = look around
- **F** = interact with nearby NPC
- **T** = open chat (if implemented that way)
- **Enter** = send message in chat

## Recommended NPC Interaction Flow

1. Move close to an NPC
2. Press **F**
3. Enter direct interaction mode
4. Type a command or normal message
5. Wait for the NPC response

---

# NPC Commands

These commands are intended to work while interacting with an NPC.

## `/guide`
Ask the NPC to guide you or explain the current area/world.

Example:
```text
/guide
```

## `/quest`
Ask the NPC for a quest.

Example:
```text
/quest
```

## `/complete`
Tell the NPC you want to complete or submit a quest.

Example:
```text
/complete
```

## `/merchant`
Open merchant-style behavior or ask what items are available.

Example:
```text
/merchant
```

## `/remember`
Store or recall a simple piece of memory depending on your implementation.

Example:
```text
/remember I like science worlds
```

---

# How the AI NPC System Works

The AI stack is typically:

- Browser frontend
- Local Python API
- Ollama model backend

## Health Check

The frontend usually checks whether the AI system is online by hitting something like:

```text
GET /health
```

If healthy:
- UI may show `AI NPC: ONLINE`

If not:
- UI may show `AI NPC: OFFLINE`
- The project may use fallback replies instead

## NPC Prompt Composition

The backend can build prompts from:

- player message
- NPC role
- current world
- direct interaction context
- recent chat memory
- quest/merchant state

## Why Use Ollama?

Ollama makes it easy to run LLMs locally. This means:

- no cloud key required
- faster iteration for development
- privacy-friendly local execution
- easy model switching

---

# Recommended Models

## `qwen2.5:3b`
Good balance between speed and quality on many local setups.

```bash
ollama pull qwen2.5:3b
```

## `llama3.2:3b`
Another good lightweight option.

```bash
ollama pull llama3.2:3b
```

## If You Want Better Quality
You can try larger models if your hardware can handle them, but response speed may become slower.

---

# Troubleshooting

# 1. The AI does not respond in chat

## Possible Causes

- `npc_ai_server.py` is not running
- Ollama is not running
- the selected model is not installed
- the UI is in global chat instead of direct NPC mode
- browser fetch requests are failing
- wrong port is configured
- the health endpoint reports online but Ollama itself is unavailable

## What to Check

### Check the Python server
Open in browser:

```text
http://127.0.0.1:8765/health
```

### Check Ollama
Run:

```bash
ollama list
```

### Test the model directly
Run:

```bash
ollama run qwen2.5:3b
```

Then type:
```text
Hello
```

If the model does not reply, the issue is with Ollama/model setup rather than the game UI.

### Check interaction mode
Make sure you:
1. approach an NPC
2. press **F**
3. send a message in NPC interaction mode

---

# 2. `pip` is not recognized

### Windows
Try:

```bash
python -m pip install -r requirements.txt
```

or:

```bash
py -m pip install -r requirements.txt
```

### macOS
Try:

```bash
python3 -m pip install -r requirements.txt
```

---

# 3. Port 8000 is already in use

Run the web server on another port:

### Windows
```bash
python -m http.server 8080
```

### macOS
```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

---

# 4. Port 8765 is already in use

This means another process is already using the AI server port.

Possible fixes:
- stop the other process
- change the backend port in `npc_ai_server.py`
- update the frontend fetch URL to match the new port

---

# 5. Browser shows CORS or fetch errors

This usually happens when:
- the frontend is opened incorrectly
- the local backend is not configured to allow the request
- the file is opened directly instead of through a local web server

Fix:
- run `python -m http.server 8000`
- open the site through `http://127.0.0.1:8000`

---

# 6. `AI NPC: OFFLINE` is always shown

Check:
1. Is `npc_ai_server.py` running?
2. Is Ollama installed?
3. Is the model pulled?
4. Does `/health` return success?
5. Does the frontend point to the correct backend URL?

---

# 7. Messages still do not reach the NPC

Things to inspect in code:

- chat mode switching
- whether direct NPC interaction is preserved before chat closes
- whether the message is routed through the NPC path
- any JavaScript console errors in browser dev tools
- any Python exceptions in the server terminal

Open browser developer tools and check:
- **Console**
- **Network**

---

# Development Notes

## Frontend
The frontend is static and can be served with Python’s built-in HTTP server.

## Backend
The backend is a lightweight Python service that can be expanded to support:

- more structured NPC memory
- multiple NPC personalities
- dynamic world state
- better quest management
- persistent inventory files
- richer merchant logic

## Suggested Improvements
- add gold / credits system
- add pricing to merchant items
- add real quest completion rewards
- add NPC patrol/movement
- add speech synthesis (TTS)
- add speech-to-text input
- add save/load profile support
- add richer memory persistence

---

# Security and Local Usage Notes

This project is meant for **local development and local play**.

Notes:
- Ollama runs locally
- the AI Python server runs locally
- the browser client connects to local endpoints
- no public deployment is required for basic usage

If you later expose this project on a public network, you should:
- secure backend endpoints
- validate input carefully
- add rate limiting
- review CORS configuration
- avoid exposing unrestricted model endpoints publicly

---

# Future Improvement Ideas

- Persistent NPC memory database
- World-specific story arcs
- Dynamic missions and branching quests
- Multiple merchants with separate inventories
- Reputation/faction system
- Voice conversation with NPCs
- Combat system
- Save slots and player progression
- Multiplayer sync layer
- Better UI panels and debugging tools

---

# Recommended First Test

After everything is installed and running:

1. Start Ollama
2. Start `npc_ai_server.py`
3. Start `python -m http.server 8000`
4. Open the browser
5. Enter the world
6. Approach an NPC
7. Press **F**
8. Type:

```text
/guide
```

Then try:

```text
hello
```

If both work, your setup is operating correctly.

---

# License / Usage

This README does not define a license by itself.  
Use your own project license if needed.

---

# Final Notes

This project is ideal for experimenting with:

- local AI game interactions
- browser-based NPC systems
- lightweight RPG mechanics
- offline-friendly AI gameplay prototypes

If you continue developing it, the next best upgrades are usually:
- stronger quest state management
- better memory persistence
- more structured NPC roles
- better debugging tools in the UI
