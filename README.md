# Halo: The Master Chief Collection — Achievement Tracker & Service Record

[![Halo MCC](https://img.shields.io/badge/Halo-MCC%20700%20Directives-52b72a?style=flat-square&logo=xbox)](https://store.steampowered.com/app/976730/)
[![Theme](https://img.shields.io/badge/Theme-2007%20Bungie.net%20Dark%20Green-ffd700?style=flat-square)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

A tactical achievement tracker for all **700 achievements** in **Halo: The Master Chief Collection**, featuring the iconic **2007 Bungie.net Halo 3 Service Record** design system and a modern **RetroAchievements-style Game Hub & Badge Matrix**.

---

## 🎖️ Key Features

### 1. Dual-View Presentation (`[RETRO BADGE GRID]` vs `[TABLE]`)
- **RetroAchievements-Style Game Hubs & Badge Matrix**:
  - Directives organized by individual game campaigns:
    - **Halo 1: Combat Evolved**
    - **Halo 2: Anniversary**
    - **Halo 3**
    - **Halo 3: ODST**
    - **Halo 4**
    - **Halo: Reach**
    - **Halo: MCC Global Directives**
  - **Visual Stamp States**:
    - **Locked Directives**: Styled as tactile, desaturated stamps (`grayscale` filter with subtle dark borders).
    - **Confirmed Directives**: Fully illuminated in vibrant color with a glowing double-golden frame.
    - **Next Up Targets**: Highlighted with an animated, glowing golden outline and target corner notch.
  - **Floating Popover Tooltip**:
    - Hover over any badge for an instant preview: large icon, directive title, full mission objective, rarity percentage, classification category, game campaign, and unlock status.
  - **Collapsible Cards & Progress Orbs**:
    - Click any game header to collapse or expand its badge matrix (with quick `[EXPAND ALL]` / `[COLLAPSE ALL]` buttons).
    - Per-game linear progress meters and circular mastery orbs (empty at 0%, silver shield in progress, radiant gold star when 100% mastered).
- **Classic 2007 Bungie.net Carnage Report Data Table**:
  - High-density compact tabular manifest with interactive rows.
  - Columns for completion status (`[X]` / `[ ]`), Steam CDN icon thumbnails, directive title & description, theater tag, classification, rarity, and unlock date.

### 2. Spartan Dossier & Telemetry HUD
- Real-time digital completion gauge (`0.0%` to `100.0%`) with total directives unlocked vs. remaining.
- Interactive Spartan ID card displaying your Gamertag, military rank insignia, and synced Steam ID.
- **"Next Up" Active Target Tracker**: Tag directives you are actively hunting with a single click or row select; track active targets directly on your HUD.

### 3. Live Steam Synchronization & Offline Persistence
- Synchronize your live progress directly from Steam using your **Steam Username**, **Vanity Custom URL**, or **SteamID64**.
- Zero setup needed for offline or manual tracking — click badges or table rows to check off achievements; all states persist automatically in browser `localStorage`.

### 4. Tactical Search & Multi-Tier Filtering Engine
- **Instant Search**: Filter by achievement name, mission objective, skull name, difficulty, or level title.
- **Status Tabs**: `[ALL 700]`, `[CONFIRMED]`, `[LOCKED]`, and `[NEXT UP]`.
- **Campaign Theater Filter**: Filter specifically for *Reach*, *CE*, *Halo 2A*, *Halo 3*, *ODST*, *Halo 4*, or *Global MCC*.
- **Classification Categories**:
  - Campaign Progression
  - Speedrun (Par Time)
  - Score (Par Score)
  - Collectibles & Secrets (Skulls, Terminals, Data Pads, Audio Logs)
  - LASO & Playlists
  - Multiplayer & Combat
  - Challenges & Easter Eggs
- **Rarity Breakdown**: Legendary (<1%), Ultra-Rare (1%–5%), Rare (5%–15%), Standard (>15%).
- **Sorting Options**: Default Index, Rarest First, Most Common, Directive A-Z, Directive Z-A, and Recently Unlocked.

---

## 🚀 Quick Start

### Method 1: One-Click Windows Launcher (Recommended)
Double-click **`start_tracker.bat`** in this directory.
> This launches the lightweight Python server and automatically opens `http://localhost:8000` in your default browser.

### Method 2: Command Line (Cross-Platform)
Run the built-in local server:
```bash
python server.py
```
Then navigate to:
```
http://localhost:8000
```

### Method 3: Static / Direct Browser
You can open **`index.html`** directly in any modern web browser or deploy it to static hosts like **GitHub Pages**. (When hosted statically without `server.py`, Steam synchronization utilizes a public CORS proxy fallback).

---

## 🔒 Steam Profile Privacy Requirement

For live Steam synchronization to succeed, your Steam account's Game Details must be visible:
1. Open Steam $\rightarrow$ View Profile $\rightarrow$ **Edit Profile**.
2. Navigate to **Privacy Settings**.
3. Set **Game details** to **Public**.

---

## 📁 Repository Structure

```
halo-achieves/
├── index.html                   # Main application interface and DOM structure
├── app.js                       # Application engine, state manager, dual-view renderer, Steam sync
├── styles.css                   # 2007 Bungie.net aesthetic, badge matrix grid, tooltips, responsive layout
├── achievements.json            # Complete manifest of all 700 MCC achievements
├── achievements_data.js         # JavaScript array dataset for immediate offline access
├── server.py                    # Lightweight Python standard-library HTTP server & Steam XML proxy
├── start_tracker.bat            # Windows 1-click batch launcher
├── build_achievements_dataset.py # Scraper utility to generate and update achievement dataset from Steam
└── .gitignore                   # Standard Git ignore rules for Python, OS, and IDE caches
```

---

## ⚖️ Legal & Attribution

This is an unofficial community fan project built for personal tracking and achievement completion.
- **Halo**, **The Master Chief Collection**, and related marks are trademarks of Microsoft Corporation / 343 Industries / Bungie.
- **Steam** and the Steam logo are trademarks of Valve Corporation.
- Design inspired by the legendary 2007 era of **Bungie.net** and the **RetroAchievements.org** profile interface.
