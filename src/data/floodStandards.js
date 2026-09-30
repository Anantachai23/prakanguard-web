// เกณฑ์มาตรฐานระดับน้ำท่วมขังบนผิวจราจรและการสัญจร
// อ้างอิงมาตรฐานจาก: กรมป้องกันและบรรเทาสาธารณภัย (ปภ.), สำนักการระบายน้ำ กทม., กรมทางหลวง และ คปภ.

export const FLOOD_STANDARDS = [
  {
    level: 1,
    name: "ระดับ 1: เล็กน้อย / เฝ้าระวัง",
    shortName: "ท่วมเล็กน้อย",
    depthRange: "5 - 15 ซม.",
    depthCmMin: 5,
    depthCmMax: 15,
    color: "emerald",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    glowColor: "#10b981",
    waterDepthVisual: "ระดับหลังเท้าถึงข้อเท้า",
    vehicleImpact: {
      sedan: { status: "safe", label: "รถเก๋ง / Eco car", desc: "ผ่านได้ตามปกติ (น้ำยังไม่ถึงชายประตูล่าง)" },
      motorcycle: { status: "safe", label: "รถจักรยานยนต์", desc: "ผ่านได้ตามปกติ ระวังถนนลื่น" },
      suv: { status: "safe", label: "รถกระบะ / SUV", desc: "ผ่านได้สบาย ไม่มีผลกระทบ" },
      truck: { status: "safe", label: "รถบรรทุก", desc: "ผ่านได้ตามปกติ" }
    },
    trafficAdvice: "ลดความเร็วลงเพื่อความปลอดภัย และป้องกันคลื่นน้ำกระเซ็นใส่ผู้สัญจรบนทางเท้า",
    oicDamageLevel: "ระดับปกติ (ยังไม่เกิดความเสียหายต่อตัวรถ)",
    officialRef: "สำนักการระบายน้ำ กทม. & กรมทางหลวง (ระดับน้ำขังรอการระบาย)"
  },
  {
    level: 2,
    name: "ระดับ 2: ปานกลาง / เตือนภัย",
    shortName: "ท่วมปานกลาง",
    depthRange: "16 - 35 ซม.",
    depthCmMin: 16,
    depthCmMax: 35,
    color: "amber",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    glowColor: "#f59e0b",
    waterDepthVisual: "ระดับหน้าแข้ง / เสมอชายประตูล่างรถเก๋ง",
    vehicleImpact: {
      sedan: { status: "warning", label: "รถเก๋ง / Eco car", desc: "เสี่ยงสูง! ปริ่มท่อไอเสีย เลี่ยงได้ควรเลี่ยง หากจำเป็นต้องปิดแอร์และใช้เกียร์ต่ำ" },
      motorcycle: { status: "warning", label: "รถจักรยานยนต์", desc: "เสี่ยงเครื่องดับหากขับลุยคลื่นน้ำ ควรชิดเลนขวาที่สูงกว่า" },
      suv: { status: "safe", label: "รถกระบะ / SUV", desc: "ผ่านได้ช้าๆ รักษาระยะห่าง" },
      truck: { status: "safe", label: "รถบรรทุก", desc: "ผ่านได้ปกติ" }
    },
    trafficAdvice: "ปิดแอร์ (A/C) ทันทีเพื่อไม่ให้พัดลมระบายความร้อนตีน้ำเข้าห้องเครื่อง ใช้เกียร์ต่ำ ห้ามเร่งเครื่องกะทันหัน",
    oicDamageLevel: "คปภ. ระดับ A (น้ำเริ่มแตะพรมพื้นรถยนต์)",
    officialRef: "ปภ. และ ศูนย์บริหารข้อมูลการจราจร กรมทางหลวง (HDMS)"
  },
  {
    level: 3,
    name: "ระดับ 3: วิกฤต / สัญจรไม่ได้",
    shortName: "วิกฤตห้ามผ่าน",
    depthRange: "> 35 ซม. (36 - 60+ ซม.)",
    depthCmMin: 36,
    depthCmMax: 100,
    color: "rose",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    glowColor: "#f43f5e",
    waterDepthVisual: "ระดับหัวเข่าถึงสะโพก / มิดล้อรถเก๋ง",
    vehicleImpact: {
      sedan: { status: "danger", label: "รถเก๋ง / Eco car", desc: "ห้ามผ่านเด็ดขาด! น้ำท่วมมิดห้องเครื่อง น้ำเข้าท่อไอดี เครื่องยนต์พังถาวร" },
      motorcycle: { status: "danger", label: "รถจักรยานยนต์", desc: "ห้ามผ่านเด็ดขาด เครื่องยนต์ดับและล้มได้ง่าย" },
      suv: { status: "warning", label: "รถกระบะ / SUV", desc: "เฉพาะรถกระบะยกสูง ลุยได้ด้วยความระมัดระวังสูงสุด รถเดิมๆ ไม่แนะนำ" },
      truck: { status: "safe", label: "รถบรรทุก", desc: "สัญจรได้ ใช้ความเร็วต่ำ ป้องกันคลื่นกระทบอาคารริมทาง" }
    },
    trafficAdvice: "ปิดเส้นทางจราจรเด็ดขาด ห้ามสตาร์ทรถซ้ำหากเครื่องดับกลางน้ำ และให้โทรสายด่วนขอความช่วยเหลือทันที",
    oicDamageLevel: "คปภ. ระดับ B-E (น้ำท่วมเบาะนั่ง ถึงคอนโซลหน้าหรือจมทั้งคัน)",
    officialRef: "กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) & สำนักงาน คปภ."
  }
];

export const VEHICLE_TOLERANCES = [
  { type: "รถเก๋ง / Eco Car (โหลดต่ำ)", limitCm: 15, safeMax: 20, note: "ระยะท้องรถสูง ~13-16 ซม." },
  { type: "รถจักรยานยนต์ ทั่วไป", limitCm: 15, safeMax: 20, note: "ท่อไอเสียสูง ~18-22 ซม." },
  { type: "รถกระบะ / SUV สแตนดาร์ด", limitCm: 30, safeMax: 40, note: "ระยะท้องรถสูง ~20-25 ซม." },
  { type: "รถกระบะยกสูง 4x4", limitCm: 45, safeMax: 60, note: "กรองอากาศสูงกว่า 70 ซม." },
  { type: "รถบรรทุก 6 ล้อ / 10 ล้อ", limitCm: 60, safeMax: 80, note: "เครื่องยนต์และท่อไอดีอยู่สูง" }
];
