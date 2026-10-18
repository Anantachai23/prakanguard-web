import os, re

for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['node_modules', '.git', 'dist', 'scratch']):
        continue
    for f in files:
        if f.endswith(('.js', '.jsx', '.json')):
            p = os.path.join(root, f)
            try:
                content = open(p, 'r', encoding='utf-8').read()
            except Exception:
                try:
                    content = open(p, 'r', encoding='utf-8-sig').read()
                except Exception:
                    continue
            
            # Check for depthCm: 20 or depthCm = 20 or similar
            matches = re.findall(r'.{0,40}(?:depthCm|depth_cm).{0,40}', content)
            for m in matches:
                if '20' in m:
                    print(f'{p}: {m.strip()}')
