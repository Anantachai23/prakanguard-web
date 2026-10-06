# PrakanGuard Admin Command Center (ระบบบริหารจัดการแอดมิน)
> **ระบบแอดมินศูนย์ข้อมูลและเฝ้าระวังอุทกภัยสมุทรปราการ (แยกส่วนอิสระ 100%)**

---

## 📌 บทนำและภาพรวม
ระบบนี้ได้รับการออกแบบและพัฒนาขึ้นมาเป็น **"ระบบเว็บของแอดมินโดยเฉพาะ"** แยกออกมาอยู่ในโฟลเดอร์ `admin/` อย่างเป็นสัดส่วน โดยไม่กระทบต่อโครงสร้าง โค้ด และไฟล์เดิมของเว็บหลักแม้แต่อย่างใด 

ระบบแอดมินมีครบทุกฟังก์ชันตามที่ต้องการ:
1. 🌊 **ข้อมูลรายงานน้ำท่วมและลูกเห็บจากประชาชน:** ดูจุดที่แจ้งเข้ามา พิกัด GPS ความลึก ระดับเทียบสรีระ ภาพถ่าย และกดอนุมัติ/ปฏิเสธ/คลี่คลาย
2. 👥 **สถานะผู้เข้าใช้งานเว็บแบบเรียลไทม์:** ตรวจสอบได้ทันทีว่า ณ ขณะนี้มีผู้เข้าใช้งานออนไลน์อยู่กี่คน, ผู้เข้าชมสะสมตลอดวัน, สัดส่วนอุปกรณ์ (มือถือ/PC) และอำเภอที่มีผู้สนใจเปิดดูมากที่สุด
3. 💬 **ข้อเสนอแนะและข้อคิดเห็นจากผู้เข้าใช้งาน:** แสดงข้อความที่ประชาชนเขียนเข้ามาอย่างครบถ้วน ละเอียดทุกตัวอักษร พร้อมคะแนนดาว หมวดหมู่ ข้อมูลผู้ส่ง วันที่เวลา และฟังก์ชันบันทึกโน้ตของแอดมิน

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

### วิธีที่ 1: ดับเบิลคลิกไฟล์ Batch (ง่ายที่สุด)
- **เปิดเฉพาะระบบแอดมิน:** ดับเบิลคลิกที่ไฟล์ `start_admin.bat` ที่โฟลเดอร์หลัก หรือ `admin\start_admin.bat`
- **เปิดทั้งเว็บประชาชนและระบบแอดมินพร้อมกัน:** ดับเบิลคลิกที่ไฟล์ `start_all.bat`

### วิธีที่ 2: รันผ่านคำสั่ง Terminal
```bash
# รันระบบแอดมิน (พอร์ต 4000)
cd admin
node server.js
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:4000`

---

## 🔐 ข้อมูลเข้าสู่ระบบ (Admin Accounts)
- **Admin 01:**
  - **ชื่อผู้ใช้ (Username):** `admin_prakanguard01`
  - **รหัสผ่าน (Password):** `Prakan#Guard2026!Secured001`
- **Admin 02:**
  - **ชื่อผู้ใช้ (Username):** `admin_prakanguard02`
  - **รหัสผ่าน (Password):** `Prakan#Guard2026!Secured002`

---

## 🛠️ โครงสร้างไฟล์ระบบแอดมิน (`admin/`)
```
admin/
├── assets/                     # ส่วนประกอบหน้าเว็บแอดมิน (Frontend Assets)
│   ├── css/admin.css           # สไตล์ชีตระบบแอดมิน (ธีมมืด/สว่าง, สไตล์ Dashboard)
│   ├── img/logo.png            # โลโก้ศูนย์บัญชาการ
│   ├── js/                     # สคริปต์หน้าบ้าน (UI, State & Modules)
│   │   ├── api.js              # ตัวกลางเรียก API แอดมิน & Supabase
│   │   ├── auth.js             # ยืนยันตัวตนแอดมิน (PBKDF2 / Sessions)
│   │   ├── config.js           # ค่าคงที่ระบบและ Endpoint
│   │   ├── core.js             # ยูทิลิตี้ DOM, เสียงแจ้งเตือน, ตัวช่วยฟอร์แมต
│   │   └── dashboard.js        # Controller หลักคุมหน้า Dashboard และแต่ละแท็บ
│   └── vendor/chart.umd.js     # ไลบรารีกราฟสถิติ Chart.js
├── data/                       # ฐานข้อมูลไฟล์ JSON (Local Persistence)
│   ├── feedback.json           # ข้อมูลข้อเสนอแนะจากประชาชน
│   ├── reports.json            # รายงานน้ำท่วมและลูกเห็บ
│   ├── trash.json              # ถังขยะ (Soft Delete กู้คืนได้)
│   └── visitors.json           # สถิติและเซสชันผู้เข้าชมเว็บ
├── database/                   # สคริปต์และโครงสร้างฐานข้อมูล (SQL)
│   └── supabase_setup.sql      # Schema, RLS Policies, Database Functions สำหรับ Supabase
├── scripts/                    # เครื่องมือและสคริปต์เสริม (Telemetry)
│   └── visitor-tracker.js      # สคริปต์ตรวจจับเซสชันผู้เข้าชมเว็บ (ทางเลือกเสริม)
├── server/                     # โครงสร้างระบบหลังบ้าน (Modular Node.js Backend)
│   ├── config.js               # การตั้งค่าพอร์ต, Path, Supabase Keys, Topics
│   ├── storage.js              # แคชหน่วยความจำ & บันทึกไฟล์ JSON ใน /data/
│   ├── sse.js                  # ระบบ Real-Time Server-Sent Events (SSE)
│   ├── presence.js             # ตรวจจับและคำนวณผู้ใช้งานสด (Visitor Telemetry)
│   ├── sync/
│   │   ├── supabase-sync.js    # ซิงก์ข้อมูลสองทางกับ Supabase Cloud DB
│   │   └── cloud-bridge.js     # ซิงก์ข้อมูลผ่าน ntfy.sh Topics และ Action Dispatcher
│   ├── routes/
│   │   ├── reports.js          # API /api/reports (จัดการรายงานน้ำท่วม/ลูกเห็บ)
│   │   ├── feedback.js         # API /api/feedback (จัดการข้อเสนอแนะ/โน้ตแอดมิน)
│   │   ├── trash.js            # API /api/trash (ถังขยะ, กู้คืน, ลบถาวร)
│   │   ├── visitors.js         # API /api/visitors & /api/heartbeat (สถิติผู้เข้าชม)
│   │   └── stats.js            # API /api/stats, /api/status, /api/cloud-sync
│   └── app.js                  # Main Application Orchestrator & Static File Server
├── index.html                  # หน้า Single Page Application ศูนย์บัญชาการแอดมิน
├── server.js                   # Entry Point หลักสำหรับเริ่มเซิร์ฟเวอร์ (node server.js)
├── package.json                # ข้อมูลและคำสั่งรันระบบ
├── start_admin.bat             # ไฟล์เริ่มระบบแอดมิน 1 คลิก
└── README.md                   # คู่มือการใช้งานระบบแอดมิน
```

---

## 📡 ระบบซิงก์คลาวด์อัตโนมัติ 24 ชม. (Cloud Bridge)
เซิร์ฟเวอร์แอดมินมีตัวเชื่อมต่อคลาวด์ (`ntfy.sh`) ในตัว ทำงานแบบ Background Poller และ Server-Sent Events (SSE):
- เมื่อประชาชนเปิดเว็บหลัก (ไม่ว่าจะเปิดผ่านมือถือ คอมพิวเตอร์ หรือแท็บเล็ต) แล้วส่งรายงานน้ำท่วมหรือส่งข้อเสนอแนะ
- ข้อมูลจะถูกส่งขึ้น Cloud Topics และเซิร์ฟเวอร์แอดมินจะดึงลงมาบันทึกในเครื่องทันที พร้อมส่งเสียงเตือน Chime และแสดง Toast แจ้งเตือนแบบสดๆ โดยไม่ต้องกดรีเฟรชหน้าจอ
