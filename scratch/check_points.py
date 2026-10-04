import re

with open('src/data/samutPrakanPoints.js', 'r', encoding='utf-8') as f:
    text = f.read()

points_block_start = text.find('export const INITIAL_FLOOD_POINTS = [')
points_text = text[points_block_start:]

# Find all depthCm lines in INITIAL_FLOOD_POINTS
depth_lines = [l.strip() for l in points_text.splitlines() if 'depthCm:' in l]
print(f'Total depthCm lines in INITIAL_FLOOD_POINTS: {len(depth_lines)}')
for l in depth_lines[:30]:
    print(l)
