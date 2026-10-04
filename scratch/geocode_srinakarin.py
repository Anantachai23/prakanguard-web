import urllib.request
import urllib.parse
import json
import time

places = [
    ("Lasalle-Srinakarin", "แยกลาซาล ศรีนครินทร์"),
    ("Makro Srinakarin", "แม็คโคร ศรีนครินทร์"),
    ("Big C Srinakarin", "บิ๊กซี ศรีนครินทร์"),
    ("Sridan MRT", "MRT ศรีด่าน"),
    ("Bearing-Srinakarin", "แยกแบริ่ง ศรีนครินทร์"),
    ("Wat Dan Srinakarin", "วัดด่านสำโรง ศรีนครินทร์"),
    ("Nham Daeng Srinakarin", "แยกหนามแดง ศรีนครินทร์"),
    ("Si Thepha MRT", "MRT ศรีเทพา"),
    ("Si Thepha Junction", "แยกศรีเทพา สมุทรปราการ"),
    ("Paolo Hospital", "โรงพยาบาลเปาโล สมุทรปราการ"),
    ("Sap Boonchai", "ซอยทรัพย์บุญชัย สมุทรปราการ"),
    ("PEA Samut Prakan", "การไฟฟ้านครหลวง สมุทรปราการ"),
    ("Phraeksa Intersection", "แยกแพรกษา สมุทรปราการ"),
    ("Sai Luat Intersection", "แยกสายลวด สมุทรปราการ"),
    ("Bangpoo Industrial", "สถานตากอากาศบางปู")
]

for name, query in places:
    q = urllib.parse.quote(query)
    url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'FloodMapAssistant/1.0 (contact@prakanguard.org)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                display_name = data[0]['display_name']
                print(f"{name}: lat={lat:.5f}, lng={lon:.5f} | {display_name[:50]}")
            else:
                print(f"{name}: Not found")
    except Exception as e:
        print(f"{name}: Error {e}")
    time.sleep(1)
