# 📡 ข้อมูลจำเพาะของ API ระบบ PrakanGuard (API Specification)

ระบบ PrakanGuard ประกอบด้วย REST API และ Real-time Server-Sent Events (SSE) สำหรับการสื่อสารระหว่าง Frontend, Backend Proxy และ Admin Command Center

---

## 1. Edge Serverless Endpoints (Vercel / Backend Proxy)

### 1.1 `GET /api/health`
ตรวจสอบสถานะความพร้อมและสุขภาพของระบบ (System Health & Uptime Probe)
* **Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "service": "PrakanGuard Autonomous Flood Intelligence Platform",
  "version": "1.0.0",
  "timestamp": "2026-10-18T14:30:00.000Z",
  "uptimeSeconds": 3600,
  "environment": "production",
  "security": {
    "hardenedHeaders": true,
    "xssSanitization": "active",
    "rateLimiter": "active",
    "geoFencing": "Samut Prakan (6 Districts)"
  },
  "services": {
    "weatherTelemetry": "Open-Meteo ECMWF / TMD Radar Suvarnabhumi",
    "floodComplaints": "Traffy Fondue Open API (Samut Prakan)",
    "astronomicalTide": "Fort Chula Naval Hydrographic Department",
    "cloudSync": "Supabase Real-Time Bridge"
  },
  "latencyMs": 4
}
```

### 1.2 `GET /api/sync`
ดึงข้อมูลสภาพอากาศ 6 อำเภอ พร้อมสถิติจุดน้ำท่วมแบบมีแคช 180 วินาที
* **Headers:** `Cache-Control: public, s-maxage=180, stale-while-revalidate=60`
* **Response:** สรุปปริมาณฝน, ความน่าจะเป็น, อุณหภูมิ, และจุดเสี่ยงน้ำท่วม

### 1.3 `GET /api/official-flood`
ดึงข้อมูลข้อร้องเรียนน้ำท่วมจาก Traffy Fondue Open API เฉพาะ จ.สมุทรปราการ
* **Response:** รายการจุดน้ำท่วมพร้อมค่า `version` (SHA-256 Hash) สำหรับ Client-Side Diffing

---

## 2. Admin Command Center Endpoints (Port 4000)

| Endpoint | Method | คำอธิบาย |
| :--- | :---: | :--- |
| `/api/health` | `GET` | สรุปสถานะเซิร์ฟเวอร์แอดมิน, จำนวน SSE Clients, และจำนวน Session ที่กำลังใช้งาน |
| `/api/events` | `GET` | สตรีม Server-Sent Events (SSE) แจ้งเตือนแบบ Real-time ไปยังหน้าแดชบอร์ด |
| `/api/reports` | `GET, POST, PATCH` | บริหารจัดการรายงานน้ำท่วม (อนุมัติ, ตรวจสอบ, ปรับระดับน้ำ) |
| `/api/feedback`| `GET, POST` | บริหารจัดการข้อเสนอแนะจากประชาชน |
| `/api/visitors`| `GET, POST` | ติดตามสถิติผู้เข้าชมเว็บไซต์และอุปกรณ์แบบไม่ระบุตัวตน |
| `/api/trash`   | `GET, DELETE` | จัดการถังขยะและประวัติการลบจุดน้ำท่วม |
| `/api/stats`   | `GET` | สรุปสถิติภาพรวมอุทกภัย 6 อำเภอ |
