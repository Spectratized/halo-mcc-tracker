"""
Halo MCC Steam Achievement Tracker - Local Server
Zero dependencies required (uses built-in Python standard library).
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MCCTrackerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == "/api/steam-stats":
            self.handle_steam_stats(parsed_url)
        elif parsed_url.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "ok", "app": "Halo MCC Tracker"}')
        else:
            super().do_GET()

    def handle_steam_stats(self, parsed_url):
        params = urllib.parse.parse_qs(parsed_url.query)
        user = params.get("user", [""])[0].strip()
        
        # Enable CORS for flexibility
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

        if not user:
            response = {"success": False, "error": "No Steam username or SteamID provided."}
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # Clean user string (handle if user pasted full profile URL)
        user = user.rstrip("/")
        if "steamcommunity.com/id/" in user:
            user = user.split("steamcommunity.com/id/")[-1].split("/")[0]
        elif "steamcommunity.com/profiles/" in user:
            user = user.split("steamcommunity.com/profiles/")[-1].split("/")[0]

        is_steamid64 = user.isdigit() and len(user) >= 16

        urls_to_try = []
        if is_steamid64:
            urls_to_try.append(f"https://steamcommunity.com/profiles/{user}/stats/976730/?xml=1")
        else:
            urls_to_try.append(f"https://steamcommunity.com/id/{user}/stats/976730/?xml=1")
            # If user might actually be a vanity name or numeric ID
            if user.isdigit():
                urls_to_try.append(f"https://steamcommunity.com/profiles/{user}/stats/976730/?xml=1")

        result = None
        last_error = ""

        for target_url in urls_to_try:
            try:
                req = urllib.request.Request(
                    target_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept-Language": "en-US,en;q=0.9"
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    xml_content = resp.read()
                    root = ET.fromstring(xml_content)
                    
                    # Check for errors in XML
                    err_elem = root.find("error")
                    if err_elem is not None and err_elem.text:
                        last_error = err_elem.text
                        continue

                    # Check privacy
                    privacy = root.findtext("privacyState", default="")
                    visibility = root.findtext("visibilityState", default="")

                    player_elem = root.find("player")
                    steam_id = player_elem.findtext("steamID64") if player_elem is not None else user
                    custom_url = player_elem.findtext("customURL") if player_elem is not None else user

                    achievements_elem = root.find("achievements")
                    if achievements_elem is None:
                        if privacy in ["friendsonly", "private"]:
                            result = {
                                "success": False,
                                "error": f"The Steam profile '{user}' is set to Private or Friends Only. Please set 'Game details' to Public in Steam Privacy Settings to live sync achievements.",
                                "privacy": privacy
                            }
                            break
                        else:
                            last_error = f"No Halo MCC stats found for '{user}'. The user might not own Halo: The Master Chief Collection or has never played it."
                            continue

                    unlocked_map = {}
                    ach_items = achievements_elem.findall("achievement")
                    for a in ach_items:
                        is_closed = a.get("closed") == "1"
                        if is_closed:
                            api_name = a.findtext("apiname", default="").lower()
                            unlock_time = a.findtext("unlockTimestamp", default="0")
                            unlocked_map[api_name] = int(unlock_time) if unlock_time.isdigit() else 0

                    total = 700
                    unlocked_count = len(unlocked_map)
                    pct = round((unlocked_count / total) * 100, 2)

                    result = {
                        "success": True,
                        "player": {
                            "steamID64": steam_id,
                            "customURL": custom_url or user,
                            "unlockedCount": unlocked_count,
                            "totalCount": total,
                            "percentage": pct
                        },
                        "unlocked": unlocked_map
                    }
                    break
            except Exception as e:
                last_error = str(e)

        if not result:
            result = {
                "success": False,
                "error": last_error or f"Unable to fetch achievement stats for '{user}'. Make sure the username is correct and your profile's 'Game details' are set to Public."
            }

        self.wfile.write(json.dumps(result).encode("utf-8"))

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), MCCTrackerHandler) as httpd:
        print(f"=======================================================")
        print(f"  HALO MCC STEAM ACHIEVEMENT TRACKER")
        print(f"  Server running at: http://localhost:{PORT}")
        print(f"  Press Ctrl+C to stop the server.")
        print(f"=======================================================")
        # open browser automatically if not suppressed
        if os.environ.get("NO_BROWSER") != "1":
            webbrowser.open(f"http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    run_server()
