import urllib.request
import json
import re

print("1. Fetching schema from Steam Community...")
url = "https://steamcommunity.com/stats/976730/achievements/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept-Language": "en-US,en;q=0.9"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

pos = html.find("1_26_YOUR_JOURNEY_BEGINS")
data_start = html.rfind('[', 0, pos)
data_end = html.find(']', pos) + 1
cleaned = html[data_start:data_end].replace('\\"', '"').replace('\\\\', '\\').replace('\\/', '/')
achievements_raw = json.loads(cleaned)
print(f"Fetched {len(achievements_raw)} achievements.")

print("2. Fetching global achievement percentages...")
pct_req = urllib.request.Request("https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=976730")
with urllib.request.urlopen(pct_req) as resp:
    pct_data = json.loads(resp.read().decode())['achievementpercentages']['achievements']

pct_map = {item['name'].lower(): float(item['percent']) for item in pct_data}
print(f"Loaded {len(pct_map)} global percentages.")

def classify_game(api_name, name, desc):
    text = (name + " " + desc).lower()
    prefix = api_name.split('_')[0]
    
    # Prefix hints from MCC schema
    # Prefixes:
    # 2, 3, 4 -> Halo CE
    # 5, 6, 7, 8, 13 -> Halo 2
    # 9, 10, 15 -> Halo 3
    # 11 -> Halo 4
    # 17, 18, 19 -> Halo 3: ODST
    # 20, 21, 22 -> Halo: Reach
    # 1, 14, 16 -> Cross-Game / Global (with some H2A/H3 specific medals)

    if "halo: reach" in text or "halo reach" in text or "reach:" in text or "reach " in text or "data pad" in text or prefix in ["20", "21", "22"]:
        return "Halo: Reach"
    elif "h3: odst" in text or "odst" in text or prefix in ["17", "18", "19"]:
        return "Halo 3: ODST"
    elif "halo 4" in text or "halo: 4" in text or "spartan ops" in text or prefix == "11":
        return "Halo 4"
    elif "halo 3" in text or "halo: 3" in text or prefix in ["9", "10"]:
        return "Halo 3"
    elif "halo 2" in text or "halo: 2" in text or "h2a" in text or prefix in ["5", "6", "7", "8", "13"]:
        return "Halo 2: Anniversary"
    elif "halo ce" in text or "halo: ce" in text or "combat evolved" in text or prefix in ["2", "3", "4"]:
        return "Halo: Combat Evolved"
    else:
        return "Cross-Game / Global"

def classify_type(name, desc):
    text = (name + " " + desc).lower()
    if "par time" in text or ("under" in text and "minutes" in text) or "beat the time" in text:
        return "Speedrun (Par Time)"
    elif "par score" in text or ("score" in text and ("points" in text or "beat the par" in text)):
        return "Score (Par Score)"
    elif "laso" in text or "playlist" in text:
        return "LASO & Playlists"
    elif any(k in text for k in ["skull", "terminal", "audio log", "data pad", "toy", "doll", "blast soda", "missing link"]):
        return "Collectibles & Secrets"
    elif any(k in text for k in ["multiplayer", "matchmaking", "matchmade", "custom game", "medal", "kill 100", "kill 500", "kill 1,000", "kill 1000", "firefight", "assault", "ctf", "slayer", "infection", "koth", "headshot"]):
        return "Multiplayer & Combat"
    elif any(k in text for k in ["complete", "beat", "finish", "mission", "legendary", "heroic", "difficulty", "campaign"]):
        return "Campaign Progression"
    else:
        return "Challenges & Easter Eggs"

processed = []
for a in achievements_raw:
    api = a['api_name']
    pct = pct_map.get(api.lower(), 0.0)
    game = classify_game(api, a['name'], a['description'])
    typ = classify_type(a['name'], a['description'])
    
    # Steam CDN icon URL
    icon_ach = f"https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/976730/{a['icon_achieved']}"
    icon_unach = f"https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/976730/{a['icon_unachieved']}"
    
    processed.append({
        "id": a['internal_key'],
        "api": api,
        "name": a['name'],
        "desc": a['description'],
        "game": game,
        "type": typ,
        "pct": pct,
        "hidden": a.get('hidden', False),
        "icon": icon_ach,
        "icon_locked": icon_unach
    })

print(f"Processed {len(processed)} achievements.")

# Output both JSON and JS
with open("achievements.json", "w", encoding="utf-8") as f:
    json.dump(processed, f, indent=2)

with open("achievements_data.js", "w", encoding="utf-8") as f:
    f.write("const MCC_ACHIEVEMENTS = " + json.dumps(processed, indent=2) + ";\n")

print("Successfully written achievements.json and achievements_data.js!")
