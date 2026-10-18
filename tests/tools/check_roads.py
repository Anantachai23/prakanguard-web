import urllib.request
import json
import sys

overpass_url = 'https://overpass-api.de/api/interpreter'

# Query ways for Srinakarin Road
query = """
[out:json][timeout:30];
(
  way["name"="ถนนศรีนครินทร์"](13.58,100.58,13.68,100.66);
  way["name:en"="Srinagarindra Road"](13.58,100.58,13.68,100.66);
  way["ref"="3344"](13.58,100.58,13.68,100.66);
);
out geom;
"""

req = urllib.request.Request(overpass_url, data=query.encode('utf-8'), headers={'User-Agent': 'Antigravity/1.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        elements = data.get('elements', [])
        print(f"Total elements found: {len(elements)}")
        # Collect all points
        all_pts = []
        for el in elements:
            for pt in el.get('geometry', []):
                all_pts.append((pt['lat'], pt['lon']))
        all_pts = sorted(all_pts, key=lambda p: p[0], reverse=True) # North to South
        print("Sample points North to South:")
        step = max(1, len(all_pts) // 25)
        for i in range(0, len(all_pts), step):
            print(f"[{all_pts[i][0]:.5f}, {all_pts[i][1]:.5f}]")
except Exception as e:
    print("Error:", e)
