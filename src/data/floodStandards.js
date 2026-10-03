// เกณฑ์มาตรฐานระดับน้ำท่วมขังบนผิวจราจรและการสัญจร
// อ้างอิงเกณฑ์: กรมทางหลวง และความปลอดภัยทางถนน
// ระดับ 1 (5 - 20 cm) | ระดับ 2 (21 - 50 cm) | ระดับ 3 (มากกว่า 50 cm)

export function getFloodLevel(depthCm) {
  const d = Number(depthCm) || 0;
  if (d > 50) return 3;
  if (d >= 21) return 2;
  return 1;
}

export const FLOOD_STANDARDS = [
  {
    level: 1,
    name: "ระดับ 1: น้ำท่วมปกติ",
    shortName: "น้ำท่วมปกติ",
    depthRange: "5 - 20 cm",
    depthCmMin: 5,
    depthCmMax: 20,
    color: "emerald",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    glowColor: "#10b981",
    waterDepthVisual: "ระดับข้อเท้าถึงใต้ท้องรถเก๋ง",
    vehicleImpact: {
      sedan: { status: "safe", label: "รถเก๋ง / Eco car", desc: "ผ่านได้ตามปกติ ชะลอความเร็ว" },
      motorcycle: { status: "safe", label: "รถจักรยานยนต์", desc: "ผ่านได้ตามปกติ ระวังถนนลื่น" },
      suv: { status: "safe", label: "รถกระบะ / SUV", desc: "ผ่านได้สบาย ไม่มีปัญหา" },
      truck: { status: "safe", label: "รถบรรทุก", desc: "ผ่านได้ตามปกติ" }
    },
    trafficAdvice: "รถทุกประเภทผ่านได้ตามปกติ ควรชะลอความเร็วเพื่อความปลอดภัย",
    oicDamageLevel: "ระดับปกติ (ยังไม่เกิดความเสียหายต่อตัวรถ)",
    officialRef: "เกณฑ์มาตรฐานผิวจราจร"
  },
  {
    level: 2,
    name: "ระดับ 2: น้ำท่วมปานกลาง",
    shortName: "น้ำท่วมปานกลาง",
    depthRange: "21 - 50 cm",
    depthCmMin: 21,
    depthCmMax: 50,
    color: "amber",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    glowColor: "#f59e0b",
    waterDepthVisual: "ระดับหน้าแข้งถึงครึ่งล้อรถเก๋ง",
    vehicleImpact: {
      sedan: { status: "warning", label: "รถเก๋ง / Eco car", desc: "เสี่ยงสูงมาก แนะนำเลี่ยงเส้นทาง หรือปิดแอร์ทันที" },
      motorcycle: { status: "warning", label: "รถจักรยานยนต์", desc: "เสี่ยงเครื่องดับ ควรชิดเลนขวาสุด" },
      suv: { status: "safe", label: "รถกระบะ / SUV", desc: "ผ่านได้ในเลนขวา ใช้ความเร็วสม่ำเสมอ" },
      truck: { status: "safe", label: "รถบรรทุก", desc: "ผ่านได้ตามปกติ" }
    },
    trafficAdvice: "รถเก๋งและรถเล็กควรเลี่ยงเส้นทาง หากจำเป็นต้องผ่านให้ปิดแอร์ทันที และใช้เกียร์ต่ำ",
    oicDamageLevel: "เริ่มมีความเสี่ยงน้ำเข้าท่อไอเสียและพรมพื้นรถ",
    officialRef: "เกณฑ์เฝ้าระวังรถเล็ก"
  },
  {
    level: 3,
    name: "ระดับ 3: น้ำท่วมวิกฤต",
    shortName: "น้ำท่วมวิกฤต",
    depthRange: "มากกว่า 50 cm",
    depthCmMin: 51,
    depthCmMax: 100,
    color: "rose",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    glowColor: "#f43f5e",
    waterDepthVisual: "ระดับหัวเข่า มิดล้อรถเก๋ง ถึงระดับเอว",
    vehicleImpact: {
      sedan: { status: "danger", label: "รถเก๋ง / Eco car", desc: "ห้ามผ่านเด็ดขาด! น้ำท่วมมิดล้อและห้องเครื่อง" },
      motorcycle: { status: "danger", label: "รถจักรยานยนต์", desc: "ห้ามผ่านเด็ดขาด! เครื่องดับและรถลอยน้ำ" },
      suv: { status: "warning", label: "รถกระบะ / SUV", desc: "ผ่านได้เฉพาะรถกระบะยกสูงพิเศษ" },
      truck: { status: "warning", label: "รถบรรทุก", desc: "ผ่านด้วยความระมัดระวังสูงสุด" }
    },
    trafficAdvice: "วิกฤต! ห้ามรถเล็กทุกชนิดผ่านเด็ดขาด หากเครื่องดับห้ามสตาร์ทรถซ้ำ",
    oicDamageLevel: "ระดับอันตราย น้ำท่วมเข้าห้องโดยสาร",
    officialRef: "เกณฑ์วิกฤตจราจร"
  }
];

export const VEHICLE_TOLERANCES = [
  { type: "รถเก๋ง / Eco Car", limitCm: 15, safeMax: 20, note: "ระยะใต้ท้องรถ 15-20 cm" },
  { type: "รถจักรยานยนต์", limitCm: 15, safeMax: 20, note: "ท่อไอเสียสูงประมาณ 20 cm" },
  { type: "รถกระบะ / SUV", limitCm: 25, safeMax: 40, note: "ระยะท้องรถสูง 25-40 cm" },
  { type: "รถกระบะยกสูง 4x4", limitCm: 45, safeMax: 60, note: "ท่อไอดีสูงมากกว่า 60 cm" },
  { type: "รถบรรทุก", limitCm: 60, safeMax: 80, note: "เครื่องยนต์สูงมากกว่า 75 cm" }
];
