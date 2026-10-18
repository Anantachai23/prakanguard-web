# 🛡️ นโยบายและมาตรการความปลอดภัยของระบบ PrakanGuard (Security Blueprint)

เอกสารนี้ระบุรายละเอียดมาตรการรักษาความปลอดภัยทั้งฝั่ง Client, Edge Serverless API และ Admin Command Center เพื่อการปกป้องข้อมูล ความเสถียร และความเป็นส่วนตัวของผู้ใช้งาน

---

## 1. การประเมินภัยคุกคามและการป้องกัน (Threat Modeling & Mitigation)

| ภัยคุกคาม (Threat Vector) | ความเสี่ยง | มาตรการป้องกันใน PrakanGuard (Mitigation) | จุดตรวจจับในโค้ด |
| :--- | :---: | :--- | :--- |
| **XSS (Cross-Site Scripting)** | สูง | กำจัดแท็ก HTML/JS (`<script>`, `<iframe>`, `javascript:`, Event Handlers `onload`, `onerror`) และแปลงสัญลักษณ์เป็น Entity ปลอดภัย | [`src/services/securityService.js`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/src/services/securityService.js#L26-L65) |
| **Geo-Location Spoofing** | ปานกลาง | ตรวจสอบว่าพิกัดละติจูด/ลองจิจูดอยู่ในกรอบพื้นที่ จ.สมุทรปราการ เท่านั้น หากอยู่นอกพื้นที่ระบบจะปฏิเสธการบันทึกรายงานทันที | [`src/data/samutPrakanBoundary.js`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/src/data/samutPrakanBoundary.js) |
| **Brute Force (Admin Login)** | สูง | ใช้ระบบ Progressive Exponential Lockout ล็อกไม่ให้พยายามล็อกอินหากกรอกผิดเกิน 5 ครั้ง โดยเวลาล็อกจะเพิ่มขึ้นเรื่อยๆ (1 นาที, 5 นาที, 15 นาที) | [`src/services/securityService.js`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/src/services/securityService.js#L140-L195) |
| **API Denial of Service (DoS / Spam)** | สูง | ใช้ Sliding-Window IP Rate Limiting จำกัดไม่เกิน 120 Requests/นาที ต่อ 1 IP สำหรับทุก API เส้นทาง | [`admin/server/app.js`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/admin/server/app.js#L98-L125) |
| **Directory Traversal Attack** | สูง | ตรวจสอบ Path ของไฟล์ในฝั่งเซิร์ฟเวอร์ หากมี `../` หรือไม่ได้ขึ้นต้นด้วยไดเรกทอรีที่ได้รับอนุญาต ระบบจะตัดการทำงานด้วย HTTP 403 Forbidden | [`admin/server/app.js`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/admin/server/app.js#L62-L67) |
| **Clickjacking / MIME Sniffing** | ปานกลาง | ติดตั้ง Security Headers ใน Edge Serverless (`vercel.json`) และ Admin Server ได้แก่ `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` | [`vercel.json`](file:///c:/Users/User/OneDrive/Desktop/PrakanGuard/vercel.json#L20-L30) |

---

## 2. ข้อมูลจำเพาะของ Security Headers ที่เปิดใช้งาน

```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

---

## 3. ความปลอดภัยของระบบโทรมาตรและข้อมูลภายนอก (Data Integrity)

1. **SHA-256 Versioning Cache:**
   * ข้อมูลน้ำท่วมจาก Traffy Fondue Open API จะถูกคำนวณ Hash ด้วย SHA-256
   * หากข้อมูลไม่มีการเปลี่ยนแปลง Client จะไม่สร้าง DOM หรือ Marker ใหม่เพื่อประหยัดทรัพยากรและป้องกัน Memory Leak
2. **In-Memory Cache Layer (TTL 180s):**
   * ป้องกันการเรียก API ของ Open-Meteo และหน่วยงานราชการบ่อยเกินไป (Anti-Throttling) โดยมี Fallback ข้อมูลเดิมหากเครือข่ายภายนอกล่ม
3. **Session Inactivity Guard:**
   * สิทธิ์การเข้าใช้งานของแอดมินจะหมดอายุอัตโนมัติหากไม่มีการโต้ตอบกับระบบเกินเวลาที่กำหนด เพื่อความปลอดภัยสูงสุดในกรณีลืมปิดหน้าจอในจุดควบคุม
