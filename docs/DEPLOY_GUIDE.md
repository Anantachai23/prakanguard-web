# 🚀 คู่มือการอัพโหลดขึ้น GitHub และ Deploy เว็บแอป PrakanGuard

> **ขั้นตอนการนำโปรเจกต์ PrakanGuard ขึ้น GitHub และการ Deploy สู่ระบบออนไลน์**

---

## 📌 ขั้นตอนที่ 1 : ตรวจสอบไฟล์ `.gitignore`
ให้แน่ใจว่าในโฟลเดอร์หลักมีไฟล์ `.gitignore` ระบุรายการโฟลเดอร์ที่ไม่ควรส่งขึ้น GitHub เช่น:
```gitignore
node_modules/
dist/
.env
```

---

## 📌 ขั้นตอนที่ 2 : สร้าง Repository บน GitHub
1. เข้าไปที่ [GitHub](https://github.com) แล้วลงชื่อเข้าใช้
2. คลิกเครื่องหมาย **`+`** มุมขวาบน -> เลือก **New repository**
3. ตั้งชื่อ Repository เช่น `prakanguard` หรือ `prakanguard-web`
4. เลือกระดับสิทธิ์เป็น **Public** หรือ **Private** ตามต้องการ
5. ปล่อยตัวเลือก *Add a README file* และ *.gitignore* ว่างไว้
6. คลิก **Create repository**
7. คัดลอก URL ของ Repository เช่น:
   ```
   https://github.com/<username>/prakanguard.git
   ```

---

## 📌 ขั้นตอนที่ 3 : คำสั่งอัพโหลดผ่าน PowerShell / Terminal
เปิด Terminal หรือ PowerShell ในโฟลเดอร์โปรเจกต์ `PrakanGuard` แล้วรันคำสั่ง:

```bash
# 1. เริ่มต้น Git (ถ้ายังไม่ได้ทำ)
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้าสู่ Staging
git add .

# 3. บันทึก Commit
git commit -m "feat: PrakanGuard project update"

# 4. ตั้งชื่อ Branch หลักเป็น main
git branch -M main

# 5. เชื่อมต่อกับ GitHub Remote
git remote add origin https://github.com/<username>/prakanguard.git

# 6. ส่งโค้ดขึ้น GitHub
git push -u origin main
```

*(หรือสามารถใช้ไฟล์คลิกเดียว [`deploy_to_github.bat`](../deploy_to_github.bat) ในโฟลเดอร์หลักได้เช่นกัน)*

---

## 📌 ทางเลือก : ใช้ GitHub Desktop
1. ดาวน์โหลดโปรแกรม [GitHub Desktop](https://desktop.github.com)
2. เปิดโปรแกรมแล้วล็อกอินด้วยบัญชี GitHub
3. ไปที่เมนู **File** -> **Add Local Repository** -> เลือกโฟลเดอร์โปรเจกต์นี้
4. พิมพ์ข้อความในช่อง Summary เช่น `"Initial commit"` แล้วคลิก **Commit to main**
5. คลิกปุ่ม **Publish repository** ด้านบน

---

## 🌐 วิธีนำขึ้นออนไลน์ (Deploy เว็บไซต์)

### วิธีที่ 1 : Vercel (แนะนำสำหรับทั้งเว็บและ API)
1. ติดตั้ง Vercel CLI หรือเชื่อมต่อ Repository บน [Vercel Dashboard](https://vercel.com)
2. นำเข้า Repository จาก GitHub
3. Vercel จะตรวจจับการตั้งค่าจาก [`vercel.json`](../vercel.json) และสร้างโปรดักชันอัตโนมัติ

### วิธีที่ 2 : Netlify Drop (อัปโหลดโฟลเดอร์ dist แบบเร็วที่สุด)
1. รันคำสั่ง `npm run build` ในเครื่องเพื่อสร้างโฟลเดอร์ `dist/`
2. เข้าไปที่ [Netlify Drop](https://app.netlify.com/drop)
3. ลากโฟลเดอร์ `dist/` ไปวางบนหน้าเว็บ
4. ระบบจะสร้าง URL สำหรับเปิดใช้งานจริงทันทีพร้อมใบรับรอง HTTPS ฟรี

---

## 📝 คำอธิบายโปรเจกต์ (Project Description)

### 🇹🇭 ภาษาไทย
> **PrakanGuard (ปราการการ์ด)** คือ ระบบสารสนเทศและเฝ้าระวังอุทกภัยผิวจราจร 6 อำเภอ จังหวัดสมุทรปราการ พัฒนาขึ้นเพื่อสาธารณประโยชน์ ช่วยให้ประชาชนผู้ใช้รถใช้ถนนสามารถตรวจสอบระดับน้ำท่วมขังบนถนนสายสำคัญ 23 พิกัด ติดตามเรดาร์ฝนและน้ำทะเลหนุนแบบเรียลไทม์ 24 ชั่วโมง อ้างอิงเกณฑ์มาตรฐาน ปภ. และเกจวัดระดับน้ำเทียบกับสเกลรถยนต์ พร้อมระบบแจ้งเตือนจุดน้ำท่วมจากประชาชน (Crowdsourcing) ที่ผ่านการตรวจสอบโดยผู้ดูแลระบบ และผู้ช่วยตอบคำถามเส้นทางอัจฉริยะ (AI ChatBot)

### 🇬🇧 English
> **PrakanGuard** is a real-time road flood monitoring and hydro-meteorological information web application for Samut Prakan Province, Thailand. Developed for public benefit, the platform helps commuters track road flooding across 6 districts, monitor 24/7 rain radar and tidal surge telemetry, report local flood conditions via crowdsourcing with admin verification, and interact with a draggable smart AI information assistant.
