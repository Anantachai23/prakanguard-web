import urllib.request
import urllib.parse
import json

stations = [
    'MRT Si Lasalle', 
    'MRT Si Bearing', 
    'MRT Si Dan', 
    'MRT Si Thepha', 
    'MRT Thipphawan', 
    'MRT Samrong',
    'สถานีศรีลาซาล',
    'สถานีศรีแบริ่ง',
    'สถานีศรีด่าน',
    'สถานีศรีเทพา',
    'สถานีทิพวัล',
    'สามแยกการไฟฟ้า สมุทรปราการ',
    'โรงเรียนสตรีสมุทรปราการ',
    'สถานีสายลวด'
]

for st in stations:
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(st)}&format=json&limit=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'FloodMap/1.0 (test@prakanguard.org)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode())
            if d:
                print(f"{st}: lat={float(d[0]['lat']):.5f}, lng={float(d[0]['lon']):.5f}")
    except Exception as e:
        print(f"{st}: {e}")
