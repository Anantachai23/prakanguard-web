# PrakanGuard (ปราการการ์ด)
> **ระบบสารสนเทศและเฝ้าระวังอุทกภัยผิวจราจร 6 อำเภอ จังหวัดสมุทรปราการ**  
> *Samut Prakan Road Flood Monitoring & Telemetry Information Web Application*

---

## 🇹🇭 ภาษาไทย (Thai Overview)

### บทนำและวัตถุประสงค์
จังหวัดสมุทรปราการเป็นพื้นที่ลุ่มต่ำชายฝั่งทะเลและจุดรองรับน้ำสำคัญก่อนไหลลงสู่อ่าวไทย มักเผชิญกับปัญหาน้ำท่วมขังบนผิวจราจรบ่อยครั้ง ทั้งจากฝนตกสะสมและปรากฏการณ์น้ำทะเลหนุนสูง ส่งผลกระทบต่อการเดินทาง เศรษฐกิจ และชีวิตประจำวันของประชาชน 

**PrakanGuard** พัฒนาขึ้นจากแนวคิดเพื่อสาธารณประโยชน์ โดยกลุ่มเยาวชนนักเรียน มีเป้าหมายในการแปลงข้อมูลทางการที่ซับซ้อนให้กลายเป็น **"สารสนเทศที่เข้าใจง่าย เข้าถึงได้ทุกคน ทุกวัย และใช้งานได้จริงขณะเดินทาง"**

### ฟังก์ชันและจุดเด่นสำคัญ
* 🗺️ **แผนที่ติดตามจุดเสี่ยงน้ำท่วมผิวจราจร 6 อำเภอ:** เฝ้าระวัง 16 พิกัดสำคัญบนถนนสายหลักและสายรอง (เมืองสมุทรปราการ, บางพลี, พระประแดง, บางบ่อ, พระสมุทรเจดีย์ และบางเสาธง) พร้อมสลับดูได้ทั้งแผนที่ทางหลวง ภาพถ่ายดาวเทียมความละเอียดสูง และแผนที่ภูมิประเทศ
* 📏 **เกณฑ์วัดระดับน้ำอิงมาตรฐาน ปภ. และเกจวัดสายตารถยนต์ (Visual Gauge):** แบ่งความรุนแรง 3 ระดับ (🟢 เฝ้าระวัง <15 ซม., 🟠 เสี่ยงสูง 16-35 ซม., 🔴 วิกฤตห้ามสัญจร >35 ซม.) แสดงภาพจำลองระดับน้ำเทียบกับสเกลรถยนต์ (รถเก๋ง, SUV, กระบะ) ให้คนขับรู้ได้ทันทีว่ารถของตนลุยน้ำได้หรือไม่
* 📡 **ระบบซิงก์สภาพอากาศและเรดาร์ 24 ชม. จากแหล่งข้อมูลจริง:** ดึงข้อมูลสดจากกรมอุตุนิยมวิทยา (TMD) และสถานีตรวจวัดน้ำขึ้น-น้ำลง กรมอุทกศาสตร์ กองทัพเรือ (สถานีป้อมพระจุลจอมเกล้า) โดยไม่มีการสร้างข้อมูลหรือสุ่มจุดน้ำท่วมปลอม
* 📢 **การมีส่วนร่วมของภาคประชาชน (Crowdsourced Reporting):** เปิดให้ประชาชนในพื้นที่รายงานเหตุน้ำท่วมจริง ระบุระดับน้ำเทียบกับร่างกาย (เสมอตาตุ่ม, ระดับหัวเข่า, ระดับเอว) พร้อมแนบภาพถ่ายและพิกัด GPS
* 🤖 **ผู้ช่วยอัจฉริยะ PrakanGuard AI Information Desk:** แชทบอทตอบคำถามเรื่องสภาพอากาศ เส้นทางปลอดภัย และเกณฑ์มาตรฐานน้ำท่วม หน้าต่างแชทสามารถคลิกลากย้ายได้อย่างอิสระ (Freely Draggable)
* 📱 **รองรับทุกขนาดหน้าจอและผู้สูงอายุ (Universal UI/UX):** สลับโหมดมืด/สว่างได้ ตัวหนังสือคมชัด มีนาฬิกาดิจิทัลและวันที่แบบเรียลไทม์ พร้อมปุ่มกดโทรสายด่วนฉุกเฉิน ปภ. 1784 และเบอร์ศูนย์ควบคุมแต่ละอำเภอได้ทันทีด้วยคลิกเดียว

---

## 🇬🇧 English Overview

### Introduction & Mission
Located at the mouth of the Chao Phraya River, Samut Prakan Province frequently suffers from surface road flooding caused by heavy tropical downpours and seasonal sea-level tidal surges. These flood incidents cause severe traffic congestion, vehicle damage, and safety hazards for commuters.

**PrakanGuard** was initiated and engineered by secondary school youth to bridge the information gap. The project transforms complex meteorological data into an **intuitive, accessible, and life-saving decision-making tool** for all citizens, drivers, and local communities.

### Key Capabilities & Architecture
* 🗺️ **Comprehensive 6-District Road Flood Map:** Interactive monitoring of 16 critical traffic points across Mueang Samut Prakan, Bang Phli, Phra Pradaeng, Bang Bo, Phra Samut Chedi, and Bang Sao Thong, with Google Roadmap, Satellite, and Terrain overlays.
* 📏 **Visual Vehicle Depth Gauges & DDPM Standards:** Classified into 3 standardized safety levels (🟢 Minor <15 cm, 🟠 Moderate 16–35 cm, 🔴 Severe >35 cm). Dynamic visual vehicle silhouettes allow drivers of sedans, SUVs, and pickup trucks to immediately evaluate crossing safety.
* 📡 **24/7 Verified Meteorological & Tidal Telemetry:** Real-time synchronization with official government sources, including rain radar and precipitation forecasts from the Thai Meteorological Department (TMD) and tidal surge telemetry from the Royal Thai Navy Hydrographic Department (Fort Chula Station).
* 📢 **Crowdsourced Citizen Reporting:** Empowers commuters to submit live flood reports using intuitive human body landmarks (ankle, knee, waist), complete with GPS geo-location and photo uploads.
* 🤖 **PrakanGuard AI Assistant Desk:** A context-aware virtual inquiry desk capable of providing instant guidance on route safety, weather forecasts, and emergency protocols, housed in a freely draggable floating window.
* 📱 **Senior-Friendly, Fully Responsive Design:** Clean, accessible typography supporting Light/Dark themes, live digital Buddhist/Gregorian clocks, and single-click emergency hotline dialing (DDPM 1784 and local district disaster centers). Optimized for mobile smartphones, iPads, tablets, and desktop workstations.

---

## 🛠️ Tech Stack & Libraries
* **Frontend:** React 18, Vite
* **Styling:** Tailwind CSS, PostCSS, Lucide React
* **Maps & Geo-spatial:** Leaflet.js
* **Visual Data:** Canvas Confetti, Chart.js
* **Hosting Support:** Vercel (`vercel.json`), Netlify (`_redirects`), Cloudflare Pages, GitHub Pages

---

## 🚀 Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Build production bundle
npm run build

# 4. Preview production build locally
npm run preview
```

---
© 2026 PrakanGuard Project. Built with dedication for the community of Samut Prakan.
