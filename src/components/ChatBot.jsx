import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Send, 
  X, 
  Phone, 
  ArrowRight, 
  HelpCircle, 
  MessageSquareText, 
  CloudRain, 
  Waves, 
  Car, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  GripHorizontal,
  Minus,
  Square,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { INITIAL_FLOOD_POINTS } from '../data/samutPrakanPoints';
import { FLOOD_STANDARDS } from '../data/floodStandards';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
// พจนานุกรมสถานที่ในจังหวัดสมุทรปราการ พร้อมระบบจับคู่คำสะกดผิด/คำพ้องเสียง (Fuzzy Typo Dictionary)
export const LOCATION_TYPO_DICTIONARY = [
  {
    name: "ทรัพย์บุญชัย",
    canonical: "ซอยทรัพย์บุญชัย (ถ.ศรีนครินทร์ - ถ.แพรกษา)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["ทรัพย์บุญชัย", "ซอยทรัพย์บุญชัย"],
    typos: [
      "ทรัพบุนชัย", "ทับบุนชัย", "ทับบุญชัย", "ทรัพย์บุนชัย", "ทัพบุญชัย",
      "ทัพบุนชัย", "สับบุนชัย", "สับบุญชัย", "ทรัพย์บุญไชย", "ทับบุนไช",
      "ซอยทับบุนชัย", "ซอยทรัพบุนชัย", "ทรัพยบุญชัย", "ทับบุนไชย", "ทับบุญไชย"
    ],
    aliases: ["เปาโลสมุทรปราการ", "รพ.เปาโล", "สามแยกการไฟฟ้า"],
    depthRange: "15 - 30 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 20,
    cause: "พื้นที่ชุมชนแอ่งกระทะ ระบายน้ำลงสู่คลองบางปิ้งหน่วงตัวช่วงฝนตกหนักสะสม",
    criticalSpots: "ช่วงกลางซอยทรัพย์บุญชัย (ซอย 1-39) และจุดเชื่อมต่อ รพ.เปาโล - ถ.แพรกษา",
    trafficGuidance: "รถเก๋งและมอเตอร์ไซค์ควรเลี่ยงเข้าซอยลึกช่วงฝนตกหนัก แนะนำให้ใช้ ถ.ศรีนครินทร์ หรือ ถ.สุขุมวิทสายหลักแทน",
    agencies: "[เทศบาลนครสมุทรปราการ] และ [เทศบาลตำบลแพรกษา]",
    phones: "[เทศบาลนครสมุทรปราการ] โทร. 02-382-6199 • [เทศบาลตำบลแพรกษา] โทร. 02-388-0056"
  },
  {
    name: "ซอยวัดด่านสำโรง",
    canonical: "ซอยวัดด่านสำโรง (สุขุมวิท 113)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["วัดด่าน", "วัดด่านสำโรง", "ด่านสำโรง", "ซอยวัดด่าน", "สุขุมวิท 113", "สุขุมวิท113"],
    typos: ["วัดดาน", "วัดด่านสำโลง", "วัดดานสำโรง", "ดานสำโรง", "วันด่าน"],
    aliases: ["113"],
    depthRange: "15 - 35 ซม.",
    floodRiskMultiplier: 0.85,
    floodRiskBase: 24,
    cause: "พื้นที่แอ่งกระทะลุ่มต่ำเชื่อมต่อระหว่าง กทม. (แบริ่ง) และสมุทรปราการ รองรับน้ำฝนสะสมได้จำกัด",
    criticalSpots: "ช่วงกลางซอยวัดด่าน หน้าตลาดด่านสำโรง และแยกศรีนครินทร์",
    trafficGuidance: "รถเก๋งปิดแอร์ทันที ชิดเลนขวาสูง เลี่ยงเข้าซอยช่วงเวลาฝนตกหนัก",
    agencies: "[เทศบาลตำบลสำโรงเหนือ] และ [แขวงทางหลวงสมุทรปราการ]",
    phones: "[เทศบาลตำบลสำโรงเหนือ] โทร. 02-398-3333 • [แขวงทางหลวงสมุทรปราการ] โทร. 1586"
  },
  {
    name: "ตลาดปากน้ำ",
    canonical: "ตลาดปากน้ำ และ ถ.ท้ายบ้าน (แนวเขื่อนเจ้าพระยา)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["ปากน้ำ", "ตลาดปากน้ำ", "ท้ายบ้าน", "ถนนท้ายบ้าน", "วงเวียนท้ายบ้าน"],
    typos: ["ปากนำ", "ปากนั้ม", "ท้ายบาน", "วิบูลศรี", "วิบูนศรี"],
    aliases: ["วิบูลย์ศรี", "หน้าศาลากลาง"],
    depthRange: "15 - 35 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 28,
    cause: "อิทธิพลน้ำทะเลหนุนสูงในแม่น้ำเจ้าพระยา เอ่อล้นแนวเขื่อนและผุดตามท่อระบายน้ำ",
    criticalSpots: "ถนนวิบูลย์ศรี ตลาดปากน้ำ และ ถ.ท้ายบ้าน เลียบแม่น้ำเจ้าพระยา",
    trafficGuidance: "รถเก๋งห้ามผ่านช่วงน้ำทะเลหนุนสูงสุด เลี่ยงไปใช้ถนนสุขุมวิทสายหลัก",
    agencies: "[เทศบาลนครสมุทรปราการ] และ [กรมอุทกศาสตร์ กองทัพเรือ]",
    phones: "[เทศบาลนครสมุทรปราการ] โทร. 02-382-6199 • [ปภ.สมุทรปราการ] โทร. 02-382-6040"
  },
  {
    name: "สำโรง - แบริ่ง",
    canonical: "ถนนสุขุมวิท ช่วงแยกแบริ่ง - สำโรง (BTS สำโรง)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["สำโรง", "แบริ่ง", "bts สำโรง", "บีทีเอสสำโรง", "แยกสำโรง", "แยกแบริ่ง", "อิมพีเรียลสำโรง"],
    typos: ["สำโลง", "สัมโรง", "แบริง", "แบลิ่ง", "อิมพิเรียล"],
    aliases: ["สุขุมวิทตอนปลาย"],
    depthRange: "15 - 30 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 20,
    cause: "น้ำฝนสะสมระบายลงคลองสำโรงไม่ทัน ร่วมกับอิทธิพลน้ำทะเลหนุนหน่วงการสูบระบาย",
    criticalSpots: "ทางลอดใต้สถานี BTS สำโรง และเลนคู่ขนานสุขุมวิทฝั่งขาเข้า",
    trafficGuidance: "รถเก๋งชิดเลนขวา เลี่ยงเลนซ้ายสุด หรือใช้ทางด่วนวงแหวนกาญจนาภิเษก",
    agencies: "[แขวงทางหลวงสมุทรปราการ] และ [เทศบาลตำบลสำโรงเหนือ]",
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [เทศบาลตำบลสำโรงเหนือ] โทร. 02-398-3333"
  },
  {
    name: "ถนนแพรกษา",
    canonical: "ถนนแพรกษา (ช่วงหน้าซอยมังกร-ขันดี)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["แพรกษา", "ซอยมังกร", "ซอยมังกรขันดี", "มังกรขันดี", "อบต.แพรกษา", "เทศบาลแพรกษา"],
    typos: ["แพกสา", "แพรกสา", "แพรกศา", "ซอยมังกรขันดิ"],
    aliases: ["ขันดี"],
    depthRange: "10 - 25 ซม.",
    floodRiskMultiplier: 0.78,
    floodRiskBase: 18,
    cause: "น้ำรอการระบายจากพื้นผิวถนนหลังฝนตกหนักชั่วคราวและน้ำหน่วงลงคลองแพรกษา",
    criticalSpots: "ช่วงหน้าซอยมังกร และบริเวณจุดกลับรถหน้าโรงเรียนแพรกษาวิเทศศึกษา",
    trafficGuidance: "มีน้ำขังเลนซ้ายชิดฟุตบาท รถทุกชนิดสัญจรผ่านได้ ชะลอความเร็ว",
    agencies: "[เทศบาลตำบลแพรกษา] และ [สภ.เมืองสมุทรปราการ]",
    phones: "[เทศบาลตำบลแพรกษา] โทร. 02-388-0056 • [สภ.เมืองสมุทรปราการ] โทร. 02-389-5555"
  },
  {
    name: "นิคมอุตสาหกรรมบางปู",
    canonical: "นิคมอุตสาหกรรมบางปู และ ถ.สุขุมวิทสายเก่า (กม.34-37)",
    district: "เมืองสมุทรปราการ",
    correctNames: ["บางปู", "นิคมบางปู", "นิคมอุตสาหกรรมบางปู", "สถานตากอากาศบางปู", "ซอยพัฒนา 1", "ซอยพัฒนา1"],
    typos: ["บางปู่", "บ่างปู", "นิคมบางปู่"],
    aliases: ["เขตส่งออก", "เขตส่งออกบางปู"],
    depthRange: "20 - 40 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 22,
    cause: "พื้นที่แอ่งกระทะลุ่มต่ำ น้ำทะเลหนุนชายฝั่งอ่าวไทย ส่งผลให้อัตราสูบระบายหน่วงตัว",
    criticalSpots: "ซอยพัฒนา 1 และเขตประกอบการเสรี นิคมฯ บางปู",
    trafficGuidance: "รถเก๋งควรเลี่ยงเข้าซอยลึก จอดบนลานจอดที่สูง ใช้ถนนสุขุมวิทสายหลัก",
    agencies: "[การนิคมอุตสาหกรรมแห่งประเทศไทย (กนอ.)] และ [เทศบาลตำบลบางปู]",
    phones: "[ศูนย์ประสานงานนิคมฯ บางปู] โทร. 02-709-3421 • [กู้ภัยบางปู] โทร. 1669"
  },
  {
    name: "ถนนกิ่งแก้ว",
    canonical: "ถนนกิ่งแก้ว (แยกกิ่งแก้ว - ซอย 25/1 ลาดกระบัง)",
    district: "บางพลี",
    correctNames: ["กิ่งแก้ว", "แยกกิ่งแก้ว", "ซอยกิ่งแก้ว", "ถนนกิ่งแก้ว"],
    typos: ["กิ่งแกว", "กิงแก้ว", "กิงแกว"],
    aliases: ["กิ่งแก้ว25", "กิ่งแก้วลาดกระบัง"],
    depthRange: "25 - 45 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 22,
    cause: "พื้นที่แอ่งกระทะ คลองลาดกระบังและคลองบางโฉลงระบายช้าช่วงฝนตกหนักสะสม",
    criticalSpots: "ถนนกิ่งแก้วช่วงตัดถนนลาดกระบัง ถึง บางนา-ตราด (กม.10-14)",
    trafficGuidance: "รถเก๋งโหลดต่ำและมอเตอร์ไซค์เสี่ยงเครื่องดับ แนะนำเลี่ยงไปใช้ถนนกาญจนาภิเษกหรือมอเตอร์เวย์",
    agencies: "[อบต.ราชาเทวะ] และ [ศูนย์กู้ภัยบางพลี]",
    phones: "[อบต.ราชาเทวะ] โทร. 02-337-3114 • [กู้ภัยบางพลี] โทร. 02-337-3333"
  },
  {
    name: "ถนนเทพารักษ์",
    canonical: "ถนนเทพารักษ์ (กม.12 - 25 ชุมชนเคหะบางพลี)",
    district: "บางพลี",
    correctNames: ["เทพารักษ์", "เคหะบางพลี", "แยกคลองขุด", "บางพลี-คลองขุด", "คลองขุด"],
    typos: ["เทพารัก", "เทพา", "เทพารักส์", "เคหะบางพี"],
    aliases: ["รพ.บางนา5"],
    depthRange: "15 - 35 ซม.",
    floodRiskMultiplier: 0.78,
    floodRiskBase: 20,
    cause: "น้ำรอการระบายจากชุมชนหนาแน่น และคลองสำโรงระบายช้า",
    criticalSpots: "กม.12-14 (หน้า รพ.บางนา 5) และ กม.23-25 (ชุมชนเคหะบางพลี)",
    trafficGuidance: "ชิดเลนขวากลางถนน หลีกเลี่ยงเลนคู่ขนานซ้ายสุด",
    agencies: "[แขวงทางหลวงสมุทรปราการ] และ [อบต.บางพลีใหญ่]",
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [อบต.บางพลีใหญ่] โทร. 02-337-3135"
  },
  {
    name: "ถนนบางนา-ตราด",
    canonical: "ถนนบางนา-ตราด (กม.16 - 26 ม.หัวเฉียว - รพ.รวมชัยประชารักษ์)",
    district: "บางพลี",
    correctNames: ["บางนา", "บางนาตราด", "บางนา-ตราด", "หัวเฉียว", "ม.หัวเฉียว", "เมกาบางนา", "เซ็นทรัลบางนา"],
    typos: ["บางนาตาด", "บางนา-ตาด", "หัวเฉีย"],
    aliases: ["กม.16", "กม.18", "กม.26", "รวมชัยประชารักษ์"],
    depthRange: "15 - 30 ซม.",
    floodRiskMultiplier: 0.75,
    floodRiskBase: 18,
    cause: "น้ำฝนสะสมระบายลงคลองจรเข้ใหญ่หน่วงตัว ท่วมช่องทางคู่ขนาน",
    criticalSpots: "ช่องทางคู่ขนาน หน้า ม.หัวเฉียวเฉลิมพระเกียรติ และ กม.26",
    trafficGuidance: "รถเก๋งควรใช้ทางด่วนบูรพาวิถี หรือช่องทางด่วนหลัก (เลนใน) หลีกเลี่ยงช่องคู่ขนาน",
    agencies: "[แขวงทางหลวงสมุทรปราการ] และ [สภ.บางแก้ว]",
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [สภ.บางพลี] โทร. 02-337-3377"
  },
  {
    name: "ตลาดคลองด่าน",
    canonical: "ตลาดคลองด่าน และ ถ.สุขุมวิทสายเก่า (อ.บางบ่อ)",
    district: "บางบ่อ",
    correctNames: ["คลองด่าน", "บางบ่อ", "สุขุมวิทสายเก่า", "วัดคลองด่าน", "ประตูน้ำคลองด่าน"],
    typos: ["คลองดาน", "บางบอ"],
    aliases: ["สป.1011", "ป่าพญาไท"],
    depthRange: "20 - 45 ซม.",
    floodRiskMultiplier: 0.82,
    floodRiskBase: 26,
    cause: "คลื่นลมชายฝั่งและน้ำทะเลหนุนสูงสุด (Spring Tide) เอ่อล้นตลิ่งชายฝั่งอ่าวไทย",
    criticalSpots: "ถนนสุขุมวิทสายเก่า (กม.55-58) หน้าตลาดคลองด่าน",
    trafficGuidance: "ร้านค้าควรยกของสูงเกิน 50 ซม. รถเล็กหลีกเลี่ยงสุขุมวิทสายเก่าช่วงน้ำหนุน",
    agencies: "[สำนักงาน ปภ. สาขาบางบ่อ] และ [เทศบาลตำบลคลองด่าน]",
    phones: "[ปภ.สาขาบางบ่อ] โทร. 02-708-4100 • [เทศบาลตำบลคลองด่าน] โทร. 02-330-1234"
  },
  {
    name: "ท่าน้ำพระประแดง - ปู่เจ้า",
    canonical: "ท่าน้ำพระประแดง และ ถ.ปู่เจ้าสมิงพราย (อ.พระประแดง)",
    district: "พระประแดง",
    correctNames: ["พระประแดง", "ปู่เจ้า", "ปู่เจ้าสมิงพราย", "ท่าน้ำพระประแดง", "สะพานภูมิพล", "คลองลัดโพธิ์", "บางกระเจ้า"],
    typos: ["พระปะแดง", "ประแดง", "ปู่เจ่า", "รัดโพธิ์", "บางกะเจ้า"],
    aliases: ["ลัดโพธิ์"],
    depthRange: "20 - 40 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 22,
    cause: "น้ำทะเลหนุนโค้งแม่น้ำเจ้าพระยา เอ่อล้นจุดกลับรถใต้สะพานภูมิพลและแนวกระสอบทราย",
    criticalSpots: "จุดกลับรถใต้สะพานภูมิพล 1-2 และถนนปู่เจ้าสมิงพรายช่วงท่าน้ำ",
    trafficGuidance: "ห้ามใช้จุดกลับรถใต้สะพานภูมิพลช่วงน้ำหนุน ใช้สะพานลอยกลับรถด้านบนแทน",
    agencies: "[เทศบาลเมืองพระประแดง] และ [โครงการประตูระบายน้ำคลองลัดโพธิ์]",
    phones: "[เทศบาลเมืองพระประแดง] โทร. 02-463-4841 • [คลองลัดโพธิ์] โทร. 02-463-4841"
  },
  {
    name: "สถานีป้อมพระจุลจอมเกล้า",
    canonical: "สถานีป้อมพระจุลจอมเกล้า และ ถ.สุขสวัสดิ์ (อ.พระสมุทรเจดีย์)",
    district: "พระสมุทรเจดีย์",
    correctNames: ["พระสมุทรเจดีย์", "ป้อมพระจุล", "ป้อมพระจุลจอมเกล้า", "แหลมฟ้าผ่า", "สุขสวัสดิ์", "สามแยกพระสมุทรเจดีย์"],
    typos: ["ป้อมพระจุน", "แหลมผ่าผ่า", "สุขสวัส", "สมุทรเจดีย์"],
    aliases: ["เจดีย์"],
    depthRange: "25 - 50 ซม.",
    floodRiskMultiplier: 0.82,
    floodRiskBase: 26,
    cause: "สถานีหลักตรวจวัดปากอ่าวไทย ได้รับอิทธิพลน้ำทะเลหนุนเต็มที่ช่วงน้ำเกิด",
    criticalSpots: "ถนนสุขสวัสดิ์-ป้อมพระจุลฯ กม.22 และสามแยกพระสมุทรเจดีย์",
    trafficGuidance: "เช็กตารางเวลาน้ำขึ้น-น้ำลงกองทัพเรือก่อนเข้าพื้นที่ รถเล็กเลี่ยงช่วงน้ำขึ้นสูงสุด",
    agencies: "[กรมอุทกศาสตร์ กองทัพเรือ] และ [เทศบาลตำบลแหลมฟ้าผ่า]",
    phones: "[สถานีป้อมพระจุลฯ] โทร. 02-425-8888 • [เทศบาลตำบลแหลมฟ้าผ่า] โทร. 02-425-8864"
  }
];

// ฟังก์ชันค้นหาและจับคู่สถานที่ พร้อมตรวจจับคำสะกดผิด (Fuzzy Typo Matcher)
export function findLocationMatch(queryText) {
  if (!queryText) return null;
  const cleanQ = queryText.toLowerCase().replace(/\s+/g, '');

  // ลำดับที่ 1: ตรวจสอบคำสะกดถูกต้อง (Correct / Standard Names) ก่อน
  for (const loc of LOCATION_TYPO_DICTIONARY) {
    const list = loc.correctNames || [];
    for (const name of list) {
      const cleanName = name.toLowerCase().replace(/\s+/g, '');
      if (cleanQ.includes(cleanName)) {
        return {
          matched: true,
          location: loc,
          matchedAlias: name,
          isTypo: false,
          originalQuery: queryText
        };
      }
    }
  }

  // ลำดับที่ 2: ตรวจสอบคำสะกดผิด / คำพ้องเสียง (Typo / Phonetic Aliases)
  for (const loc of LOCATION_TYPO_DICTIONARY) {
    const typos = loc.typos || [];
    for (const typo of typos) {
      const cleanTypo = typo.toLowerCase().replace(/\s+/g, '');
      if (cleanQ.includes(cleanTypo)) {
        return {
          matched: true,
          location: loc,
          matchedAlias: typo,
          isTypo: true,
          originalQuery: queryText
        };
      }
    }
  }

  // ลำดับที่ 3: ตรวจสอบสถานที่ข้างเคียง / แลนด์มาร์ก (Other Aliases)
  for (const loc of LOCATION_TYPO_DICTIONARY) {
    const others = loc.aliases || [];
    for (const other of others) {
      const cleanOther = other.toLowerCase().replace(/\s+/g, '');
      if (cleanQ.includes(cleanOther)) {
        return {
          matched: true,
          location: loc,
          matchedAlias: other,
          isTypo: false,
          originalQuery: queryText
        };
      }
    }
  }

  return null;
}

export default function ChatBot({ points = INITIAL_FLOOD_POINTS, onSelectPoint, theme = 'light', weather: propWeather, isPointSelected = false }) {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [weather, setWeather] = useState(propWeather || {
    temp: 29,
    humidity: 78,
    weatherDesc: 'มีเมฆบางส่วน',
    rainProbabilityToday: 60,
    rainSumToday: 8.5,
    peakHour: '16:00 น. (โอกาส 60%)',
    rainAlertLevel: 'เฝ้าระวังฝนฟ้าคะนอง',
    lastUpdated: 'สด'
  });

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `สวัสดีครับ ยินดีต้อนรับสู่ **ระบบตอบข้อซักถามสารสนเทศอุทกภัยและเส้นทางสัญจร จังหวัดสมุทรปราการ (PrakanGuard AI)**

💡 ท่านสามารถพิมพ์สอบถามได้อย่างอิสระทุกเรื่องเกี่ยวกับน้ำท่วม ไม่จำกัดเฉพาะคำถามตัวอย่าง เช่น:
• 📍 **ความเสี่ยงรายพิกัด:** *"ซอยทรัพย์บุญชัย / วัดด่าน / ปากน้ำ มีโอกาสท่วมไหม"*
• 🚗 **เกณฑ์รถยนต์:** *"รถเก๋งลุยน้ำได้กี่เซน / รถดับกลางน้ำทำอย่างไร"*
• 🛡️ **การเตรียมตัว & บ้าน:** *"น้ำจะเข้าบ้านเตรียมตัวอย่างไร / กั้นกระสอบทรายแบบไหน"*
• ⚡️ **ความปลอดภัยไฟฟ้า:** *"วิธีตัดไฟป้องกันไฟดูดช่วงน้ำท่วม"*
• 🅿️ **จุดจอดรถที่สูง:** *"ในสมุทรปราการมีที่จอดรถหนีน้ำที่ไหนบ้าง"*
• 🐍 **สัตว์มีพิษ & สุขภาพ:** *"ป้องกันงูและสัตว์มีพิษ / วิธีรักษาโรคน้ำกัดเท้า"*
• 🌧️ **สภาพอากาศสด:** *"วันนี้ฝนตกกี่โมง / กี่เปอร์เซ็นต์"*

⏱️ ระบบรายงานสภาพอากาศและอุณหภูมิอัปเดตสดตลอดเวลา และท่านสามารถกด **[⏹️ หยุดตอบ]** หรือกด **[-] ย่อขนาด** ได้ตลอดเวลาครับ!`,
      time: 'ระบบพร้อมให้บริการตลอด 24 ชม.'
    }
  ]);

  const messagesEndRef = useRef(null);
  const chipsRef = useRef(null);
  const chipsAnimRef = useRef(null);
  const modalRef = useRef(null);

  // Draggable Modal State & Free Movement Tracking
  const [position, setPosition] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const modalDragRef = useRef({
    startX: 0,
    startY: 0,
    modalX: 0,
    modalY: 0
  });

  const streamingIntervalRef = useRef(null);
  const thinkingTimeoutRef = useRef(null);

  // Sync propWeather whenever updated by App.jsx
  useEffect(() => {
    if (propWeather) {
      setWeather(propWeather);
    }
  }, [propWeather]);

  // Continuous background real-time weather & temperature heartbeat every 45s
  useEffect(() => {
    let isMounted = true;
    const syncContinuousWeather = async () => {
      try {
        const fresh = await getLiveSamutPrakanWeather(true);
        if (isMounted && fresh) {
          setWeather(fresh);
        }
      } catch (e) {
        console.warn("Continuous weather telemetry err:", e);
      }
    };

    syncContinuousWeather();
    const interval = setInterval(syncContinuousWeather, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStopResponse = () => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsThinking(false);
    setStreamingMessageId(null);
  };

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Window resize handler: clamp position within viewport if modal is active
  useEffect(() => {
    const handleResize = () => {
      if (!position || !modalRef.current) return;
      const modalWidth = modalRef.current.offsetWidth || 420;
      const modalHeight = modalRef.current.offsetHeight || 580;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);
      setPosition(prev => {
        if (!prev) return null;
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(8, prev.y), maxY)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Modal Drag Handlers (Supports both PC Mouse Drag & Mobile Touch Drag)
  const handleModalDragStart = (clientX, clientY, target) => {
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const rect = modalEl.getBoundingClientRect();
    const currentX = position ? position.x : rect.left;
    const currentY = position ? position.y : rect.top;

    modalDragRef.current = {
      startX: clientX,
      startY: clientY,
      modalX: currentX,
      modalY: currentY
    };

    if (!position) {
      setPosition({ x: currentX, y: currentY });
    }

    setIsDraggingModal(true);
  };

  const handleMouseDownHeader = (e) => {
    if (e.button !== 0) return;
    handleModalDragStart(e.clientX, e.clientY, e.target);
  };

  const handleTouchStartHeader = (e) => {
    if (e.touches.length !== 1) return;
    handleModalDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  };

  useEffect(() => {
    if (!isDraggingModal) return;

    const onMouseMove = (e) => {
      const modalEl = modalRef.current;
      const modalWidth = modalEl?.offsetWidth || 420;
      const modalHeight = modalEl?.offsetHeight || 580;

      const dx = e.clientX - modalDragRef.current.startX;
      const dy = e.clientY - modalDragRef.current.startY;

      const rawX = modalDragRef.current.modalX + dx;
      const rawY = modalDragRef.current.modalY + dy;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);

      setPosition({
        x: Math.min(Math.max(minX, rawX), maxX),
        y: Math.min(Math.max(minY, rawY), maxY)
      });
    };

    const onMouseUp = () => {
      setIsDraggingModal(false);
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const modalEl = modalRef.current;
      const modalWidth = modalEl?.offsetWidth || 420;
      const modalHeight = modalEl?.offsetHeight || 580;

      const dx = touch.clientX - modalDragRef.current.startX;
      const dy = touch.clientY - modalDragRef.current.startY;

      const rawX = modalDragRef.current.modalX + dx;
      const rawY = modalDragRef.current.modalY + dy;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);

      setPosition({
        x: Math.min(Math.max(minX, rawX), maxX),
        y: Math.min(Math.max(minY, rawY), maxY)
      });
    };

    const onTouchEnd = () => {
      setIsDraggingModal(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingModal]);

  const handleResetPosition = (e) => {
    e?.stopPropagation();
    setPosition(null);
  };

  // 60fps Butter-Smooth RequestAnimationFrame Glide for Quick Question Chips
  const isDraggingChipsRef = useRef(false);
  const chipsStartXRef = useRef(0);
  const chipsScrollLeftRef = useRef(0);
  const chipsHasDraggedRef = useRef(false);

  const scrollChips = (direction) => {
    const el = chipsRef.current;
    if (!el) return;

    if (chipsAnimRef.current) {
      cancelAnimationFrame(chipsAnimRef.current);
    }

    const distance = direction === 'left' ? -220 : 220;
    const startPos = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetPos = Math.max(0, Math.min(maxScroll, startPos + distance));
    const delta = targetPos - startPos;

    if (Math.abs(delta) < 1) return;

    const duration = 460; // 460ms fluid glide with easeOutQuint
    const startTime = performance.now();
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = startPos + delta * easeOutQuint(progress);

      if (progress < 1) {
        chipsAnimRef.current = requestAnimationFrame(step);
      } else {
        chipsAnimRef.current = null;
      }
    };

    chipsAnimRef.current = requestAnimationFrame(step);
  };

  const handleChipsMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    if (chipsAnimRef.current) cancelAnimationFrame(chipsAnimRef.current);
    isDraggingChipsRef.current = true;
    chipsStartXRef.current = e.pageX - el.offsetLeft;
    chipsScrollLeftRef.current = el.scrollLeft;
    chipsHasDraggedRef.current = false;
    el.style.scrollBehavior = 'auto';
  };

  const handleChipsMouseMove = (e) => {
    if (!isDraggingChipsRef.current) return;
    const el = chipsRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - chipsStartXRef.current) * 1.35;
    if (Math.abs(walk) > 4) {
      chipsHasDraggedRef.current = true;
    }
    el.scrollLeft = chipsScrollLeftRef.current - walk;
  };

  const handleChipsMouseUp = () => {
    isDraggingChipsRef.current = false;
    setTimeout(() => {
      chipsHasDraggedRef.current = false;
    }, 60);
  };

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;

    let wheelAnim = null;
    let targetLeft = el.scrollLeft;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        const maxScroll = el.scrollWidth - el.clientWidth;
        targetLeft = Math.max(0, Math.min(maxScroll, targetLeft + e.deltaY * 1.4));
        
        const startPos = el.scrollLeft;
        const delta = targetLeft - startPos;
        const duration = 260;
        const startTime = performance.now();
        const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

        if (wheelAnim) cancelAnimationFrame(wheelAnim);
        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          el.scrollLeft = startPos + delta * easeOutQuad(progress);
          if (progress < 1) {
            wheelAnim = requestAnimationFrame(step);
          } else {
            wheelAnim = null;
          }
        };
        wheelAnim = requestAnimationFrame(step);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelAnim) cancelAnimationFrame(wheelAnim);
    };
  }, [isOpen]);

  // High-Intelligence Domain Knowledge & Telemetry Synthesizer
  const synthesizeAnswer = (queryText, history = []) => {
    const q = queryText.toLowerCase().trim();
    const rainChance = weather.rainProbabilityToday || 60;
    const rainSum = weather.rainSumToday || 8.5;
    const peakTime = weather.peakHour || '16:00 น.';

    // Helper to format risk badges
    const getRiskBadge = (prob) => {
      if (prob >= 75) return `🔴 เสี่ยงสูงมาก (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
      if (prob >= 55) return `🟠 เสี่ยงปานกลางถึงสูง (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
      return `🟡 เฝ้าระวังปกติ (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
    };

    // 0. CHECK IF USER WANTS A SUMMARY / SHORT / CONCISE / PLAYFUL ANSWER (ย่อลง / สั้นลง / สรุป)
    const shortenKeywords = [
      "ย่อ", "สั้น", "สรุป", "ยาวไป", "ยาวเกิน", "ขอสั้น", "เอาสั้น", "สั้นๆ", 
      "ย่อๆ", "พอสังเขป", "เนื้อๆ", "ขอเนื้อ", "ย่อให้", "สรุปให้", "สั้นลง", 
      "ย่อลง", "กระชับ", "อ่านไม่ทัน", "ขอแบบย่อ", "สั้นกว่านี้", "ย่ออีก", 
      "พูดสั้นๆ", "ตอบสั้นๆ", "สั้นหน่อย", "ย่อหน่อย"
    ];
    const wantsShort = shortenKeywords.some(kw => q.includes(kw));

    // ค้นหาพิกัดสถานที่ในคำถาม พร้อมตรวจจับคำสะกดผิด (Fuzzy Typo Matcher)
    const lastBotMessage = (history || []).slice().reverse().find(m => m.sender === 'bot');
    const locMatch = findLocationMatch(q) || (wantsShort && lastBotMessage ? findLocationMatch(lastBotMessage.text) : null);

    if (locMatch) {
      const loc = locMatch.location;
      const floodProb = Math.min(92, Math.max(35, Math.round(rainChance * loc.floodRiskMultiplier + loc.floodRiskBase)));
      
      const typoNotice = locMatch.isTypo 
        ? `💡 ระบบเข้าใจว่าคุณหมายถึง: **${loc.name || 'ทรัพย์บุญชัย'}** *(คุณระบุ: "${locMatch.matchedAlias}")*\n` +
          `📍 พิกัดข้อมูล: **${loc.canonical}** (อ.${loc.district})\n\n`
        : '';

      if (wantsShort) {
        return `${typoNotice}⚡️ **สรุปสถานการณ์น้ำ ${loc.canonical} แบบกระชับ:**\n\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%** (ระดับน้ำคาดการณ์ ${loc.depthRange})\n` +
          `• **ช่วงเฝ้าระวังสูงสุด:** ⏱️ **${peakTime}** (หากมีฝนตกหนักสะสม)\n` +
          `• **จุดเปราะบาง:** ${loc.criticalSpots}\n` +
          `• **ยานพาหนะ:** ${loc.trafficGuidance}\n` +
          `• **สายด่วน:** ${loc.phones}\n\n` +
          `สั้นกระชับ ตรงใจไหมครับ! สอบถามจุดอื่นหรือเกณฑ์ความลึกเพิ่มเติมได้ตลอดเลยนะครับ 😊`;
      }

      return `${typoNotice}🌊 **การวิเคราะห์คาดการณ์โอกาสเกิดน้ำท่วม: ${loc.canonical}**\n` +
        `อ้างอิงข้อมูล: ${loc.agencies} • [กรมอุตุนิยมวิทยา (TMD)] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนฟ้าคะนองและปริมาณน้ำฝนสะสม (กรมอุตุนิยมวิทยา TMD):**\n` +
        `• โอกาสเกิดฝนตกในพื้นที่: **${rainChance}%** (ฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
        `• ช่วงเวลาที่ต้องเฝ้าระวังสูงสุด: ⏱️ **${peakTime}**\n` +
        `• **การประเมิน:** หากมีกลุ่มฝนตกหนักสะสมเกิน 30 – 40 มม. ในพื้นที่ อัตราการไหลเข้าพื้นที่ผิวถนนจะสูงกว่าอัตราการไหลออก สภาพผิวถนนจะเกิดน้ำขังรอการระบายทันที\n\n` +
        `🌊 **2. ปัจจัยทางกายภาพและสาเหตุหลัก:**\n` +
        `• ${loc.cause}\n` +
        `• **จุดวิกฤตที่มักท่วมขัง:** ${loc.criticalSpots} (ระดับน้ำท่วมขังเฉลี่ย **${loc.depthRange}**)\n\n` +
        `⚙️ **3. การระบายน้ำและการเตรียมพร้อมของพื้นที่:**\n` +
        `• มีการเดินเครื่องสูบน้ำประจำสถานีเพื่อเร่งผลักดันน้ำออกจากแนวท่อระบายน้ำหลัก\n` +
        `• หากไม่มีเศษขยะอุดตันท่อระบายน้ำ คาดว่าจะใช้เวลาหน่วงระบายแห้งเป็นปกติประมาณ **30 – 60 นาที** หลังฝนหยุดตก\n\n` +
        `🚗 **4. เกณฑ์ความปลอดภัยของยานพาหนะและคำแนะนำการสัญจร:**\n` +
        `• **รถเก๋ง / Eco car:** ${loc.trafficGuidance}\n` +
        `• **มอเตอร์ไซค์:** ชิดช่องทางขวากลางถนน หลีกเลี่ยงแอ่งน้ำขังชิดฟุตบาทที่อาจลึกกว่าระดับสายตา\n` +
        `• **รถกระบะ / รถยกสูง:** สัญจรผ่านได้ ชะลอความเร็วเพื่อไม่ให้เกิดคลื่นน้ำกระทบบ้านเรือนประชาชน\n\n` +
        `📞 **สายด่วนประสานงานและขอความช่วยเหลือ (24 ชม.):**\n` +
        `• ${loc.phones}\n` +
        `• [สนง.ปภ. จังหวัดสมุทรปราการ] โทร. **02-382-6040** (สายด่วน 1784)`;
    }

    // กรณีต้องการสรุปสั้นแต่ไม่ได้ระบุสถานที่
    if (wantsShort) {
      if (q.includes("รถ") || q.includes("เกณฑ์") || q.includes("เซนติเมตร") || q.includes("ซม.")) {
        return `จัดให้แบบสั้นจี๊ด เข้าใจง่ายใน 3 บรรทัดครับ! 🚗💨\n\n` +
          `🚦 **เกณฑ์ลุยน้ำฉบับย่อ:**\n` +
          `• **< 15 ซม. (เสมอข้อเท้า):** รถเก๋ง มอไซค์ ลุยได้สบาย\n` +
          `• **16 – 35 ซม. (เสมอหน้าแข้ง):** รถเก๋งเสี่ยงน้ำเข้าท่อ ปิดแอร์ทันที! มอไซค์ชิดขวา\n` +
          `• **> 35 ซม. (เสมอหัวเข่าขึ้นไป):** 🛑 **ห้ามผ่านเด็ดขาด!** ลุยไปรถพังแน่นอน\n\n` +
          `จำง่ายๆ แค่นี้ปลอดภัยชัวร์ มีจุดไหนอยากรู้อีก ทักมาได้เลยค้าบ! 😎`;
      }

      return `ฮั่นแน่! ชอบแบบสั้นๆ ใช่ไหมล้าา จัดไปแบบกระชับมินิมอล 3 บรรทัดจบค้าบ! 🌧️⚡️\n\n` +
        `📊 **สรุปสถานการณ์น้ำ & ฝน จ.สมุทรปราการ:**\n` +
        `• **ฝนตกวันนี้:** โอกาส **${rainChance}%** (สะสม ~${rainSum} มม.)\n` +
        `• **เวลาต้องระวัง:** ⏱️ **${peakTime}**\n` +
        `• **จุดที่ท่วมบ่อย:** ซอยทรัพย์บุญชัย, วัดด่าน, ปากน้ำ, คลองด่าน, นิคมบางปู\n` +
        `สรุปคือ พกร่ม+เลี่ยงลุยน้ำช่วงเย็น สบายใจหายห่วงแน่นอนค้าบ เป็นห่วงน้า! ☂️🥰\n\n` +
        `อยากให้ย่อตรงไหนเพิ่ม บอกชื่อซอยหรือถนนมาได้เลยน้าา เช่น "ทับบุนชัย", "วัดด่าน" พร้อมเสิร์ฟ! 🚀`;
    }

    // ถามคำถามทั่วไปเกี่ยวกับ "โอกาสเกิดน้ำท่วม" / "จะท่วมไหม" / "เสี่ยงไหม" (ไม่มีการระบุพิกัดเจาะจง)
    const isGeneralFloodQuery = 
      q.includes("โอกาส") || 
      q.includes("ท่วม") || 
      q.includes("เสี่ยง") || 
      q.includes("น้ำท่วม") || 
      q.includes("ท่วมไหม") || 
      q.includes("ท่วมมั้ย") || 
      q.includes("ท่วมป่าว") || 
      q.includes("ท่วมเปล่า") || 
      q.includes("จะท่วม") || 
      q.includes("ท่วมอีก") ||
      q.includes("เสี่ยงไหม") ||
      q.includes("เสี่ยงมั้ย");

    if (isGeneralFloodQuery) {
      const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 20)));
      return `🌊 **การวิเคราะห์คาดการณ์ความเสี่ยงและโอกาสเกิดน้ำท่วม จ.สมุทรปราการ (24 ชั่วโมง)**\n` +
        `อ้างอิงข้อมูล: [สนง.ปภ. จังหวัดสมุทรปราการ] • [กรมอุตุนิยมวิทยา (TMD)] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงเฉลี่ยของจังหวัดวันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนฟ้าคะนอง (เรดาร์ตรวจอากาศ TMD):**\n` +
        `• โอกาสเกิดฝนตกภาพรวม: **${rainChance}%** (ปริมาณฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
        `• ช่วงเวลาเสี่ยงฝนตกหนักสูงสุด: ⏱️ **${peakTime}**\n\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน (สถานีป้อมพระจุลจอมเกล้า):**\n` +
        `• เฝ้าระวังช่วงน้ำขึ้นสูงสุดในแม่น้ำเจ้าพระยา (ระดับเตือนภัย +1.70 ม. รทก.)\n\n` +
        `📍 **3. พิกัด 4 จุดเปราะบางสำคัญที่ต้องเฝ้าระวังเป็นพิเศษ:**\n` +
        `  1. **ซอยทรัพย์บุญชัย (ถ.ศรีนครินทร์ - ถ.แพรกษา):** ชุมชนแอ่งกระทะระบายลงคลองบางปิ้ง (~${Math.min(90, Math.round(rainChance * 0.8 + 20))}%) \n` +
        `  2. **ซอยวัดด่านสำโรง (สุขุมวิท 113):** พื้นที่แอ่งกระทะรับน้ำฝนสะสม (~${Math.min(92, Math.round(rainChance * 0.85 + 24))}%) \n` +
        `  3. **ตลาดปากน้ำ / ถนนท้ายบ้าน:** อิทธิพลน้ำทะเลหนุนแม่น้ำเจ้าพระยา (~${Math.min(92, Math.round(rainChance * 0.8 + 28))}%) \n` +
        `  4. **ถนนกิ่งแก้ว / ลาดกระบัง (บางพลี):** แอ่งกระทะรับน้ำรอบสุวรรณภูมิ (~${Math.min(88, Math.round(rainChance * 0.8 + 22))}%) \n\n` +
        `💡 **คำแนะนำ:** หากท่านต้องการทราบความเสี่ยงของจุดเฉพาะ สามารถพิมพ์ชื่อจุด (เช่น *"ทรัพย์บุญชัย"*, *"ทับบุนชัย"*, *"วัดด่าน"*, *"กิ่งแก้ว"*, *"ปากน้ำ"*) เพื่อให้ระบบวิเคราะห์รายพิกัดได้ทันทีครับ`;
    }

    // 10. ถามเรื่องพยากรณ์อากาศ / ฝนจะตกไหม / ฝนตกกี่เปอร์เซ็นต์ / ฝนตกหนัก
    if (q.includes("พยากรณ์") || q.includes("ฝน") || q.includes("ตกกี่") || q.includes("อากาศ") || q.includes("ตกหนัก")) {
      const isRainy = (weather.rainProbabilityToday || 0) >= 50;
      return `🌧️ **รายงานพยากรณ์อากาศและคาดการณ์ฝนตกหนัก จ.สมุทรปราการ**\n` +
        `อ้างอิงข้อมูล: [กรมอุตุนิยมวิทยา (TMD)] และ [ศูนย์พยากรณ์อากาศยุโรป ECMWF]\n\n` +
        `• **สถานะอากาศ:** ${weather.weatherDesc}\n` +
        `• **อุณหภูมิ:** ${weather.temp}°C (สูงสุด ${weather.tempMax || 33}°C / ต่ำสุด ${weather.tempMin || 26}°C)\n` +
        `• **ความชื้นสัมพัทธ์:** ${weather.humidity}%\n` +
        `• **โอกาสเกิดฝนตกวันนี้:** 🌧️ **${weather.rainProbabilityToday}%**\n` +
        `• **ปริมาณน้ำฝนสะสมคาดการณ์:** **${weather.rainSumToday} มิลลิเมตร**\n` +
        `• **ช่วงเวลาเสี่ยงฝนตกหนักที่สุด:** ⏱️ **${weather.peakHour}**\n` +
        `• **ระดับการแจ้งเตือน:** ${isRainy ? '⚠️ ' + weather.rainAlertLevel : '🟢 สภาพอากาศปกติ'}\n\n` +
        `💡 **ข้อแนะนำ:** หากมีฝนตกสะสมเกิน 30 มม. ใน 2 ชั่วโมง มักจะเกิดน้ำรอการระบายบนถนนสุขุมวิท, ศรีนครินทร์ และกิ่งแก้ว ควรเผื่อเวลาเดินทาง 30 - 45 นาทีครับ`;
    }

    // 11. ถามเรื่องรถเก๋ง / มอเตอร์ไซค์ / รถกระบะ / สัญจรได้ไหม
    if (q.includes("เก๋ง") || q.includes("มอเตอร์ไซค์") || q.includes("รถเล็ก") || q.includes("กระบะ") || q.includes("ผ่านได้") || q.includes("ลุยน้ำ") || q.includes("กี่เซน")) {
      return `🚗 **เกณฑ์มาตรฐานระดับน้ำและความปลอดภัยในการขับขี่ (อ้างอิง: [กรมทางหลวง] & [สำนักงาน คปภ.]):**\n\n` +
        `• **ระดับน้ำ 5 – 15 ซม. (ระดับข้อเท้า):**\n` +
        `  🟢 รถทุกประเภทสัญจรได้ตามปกติ ลดความเร็วเพื่อป้องกันน้ำกระเซ็น\n\n` +
        `• **ระดับน้ำ 16 – 35 ซม. (เสมอชายประตูล่าง / ปริ่มปลายท่อไอเสีย):**\n` +
        `  ⚠️ **รถเก๋งและ Eco car เสี่ยงสูงมาก** หากจำเป็นต้องผ่าน ให้ **ปิดแอร์ (A/C) ทันที** ใช้เกียร์ต่ำ และห้ามเร่งเครื่องกะทันหัน\n\n` +
        `• **ระดับน้ำเกิน 35 ซม. ขึ้นไป (มิดครึ่งล้อรถเก๋ง):**\n` +
        `  🔴 **ห้ามรถเก๋งและมอเตอร์ไซค์สัญจรผ่านโดยเด็ดขาด** เสี่ยงน้ำเข้าท่อไอดี เครื่องยนต์พังถาวร\n\n` +
        `📌 *ข้อควรจำสำคัญ:* หากรถยนต์ดับกลางน้ำ **ห้ามสตาร์ทเครื่องยนต์ซ้ำเด็ดขาด** ให้ปลดเกียร์ว่าง (N) และเข็นรถเข้าข้างทาง หรือโทร 1669/1197 ครับ`;
    }

    // 12. ถามเรื่องจุดวิกฤต / จุดที่ท่วมสูงที่สุด / จุดเสี่ยงหนัก
    if (q.includes("วิกฤต") || q.includes("หนัก") || q.includes("เยอะ") || q.includes("สูง") || q.includes("ท่วมมาก")) {
      const severe = points.filter(p => p.level === 3);
      return `🔴 **จุดเสี่ยงน้ำท่วมผิวจราจรระดับวิกฤตในสมุทรปราการ (อ้างอิง: [สนง.ปภ. จังหวัดสมุทรปราการ]):**\n\n` +
        severe.map((p, i) => 
          `**${i + 1}. ${p.name}** (อ.${p.district})\n` +
          `   • ระดับความลึกเฉลี่ย: ${p.depthRange}\n` +
          `   • สาเหตุ: ${p.cause}\n` +
          `   • คำแนะนำ: ${p.officialGuidance}`
        ).join("\n\n") +
        `\n\n⚠️ **เส้นทางเลี่ยง:** ใช้สะพานภูมิพล, ถนนวงแหวนกาญจนาภิเษก หรือทางด่วนบูรพาวิถี`;
    }

    // 13. ถามเรื่องน้ำทะเลหนุน / ตารางน้ำขึ้น-น้ำลง
    if (q.includes("หนุน") || q.includes("ทะเล") || q.includes("ขึ้นลง")) {
      return `🌊 **ข้อมูลอุทกศาสตร์และการเกิดน้ำทะเลหนุน (อ้างอิง: [กรมอุทกศาสตร์ กองทัพเรือ]):**\n\n` +
        `• **สถานีตรวจวัดหลัก:** สถานีป้อมพระจุลจอมเกล้า อ.พระสมุทรเจดีย์\n` +
        `• **เกณฑ์เฝ้าระวัง:** เมื่อระดับน้ำสูงเกิน **+1.70 เมตร รทก.** น้ำในแม่น้ำเจ้าพระยาจะเริ่มเอ่อล้นเข้าท่วมถนนแนวเขื่อน\n` +
        `• **ช่วงน้ำเกิด (Spring Tide):** วันขึ้น 15 ค่ำ และแรม 15 ค่ำ (วันพระ) ระดับน้ำจะขึ้นสูงสุด 2 ครั้งต่อวัน\n` +
        `• **พื้นที่เสี่ยงสูงสุด:** ตลาดปากน้ำ (อ.เมือง), ซอยวัดด่าน (สำโรง), ท่าน้ำพระประแดง และตลาดคลองด่าน (อ.บางบ่อ)\n\n` +
        `🔗 ตรวจสอบตารางน้ำขึ้น-น้ำลงรายวันได้ที่เว็บไซต์ทางการ **hydro.navy.mi.th** ครับ`;
    }

    // 14. ถามเบอร์โทรฉุกเฉิน / กู้ภัย / กระสอบทราย / แจ้งเหตุ
    if (q.includes("เบอร์") || q.includes("สายด่วน") || q.includes("โทร") || q.includes("กู้ภัย") || q.includes("ช่วยเหลือ") || q.includes("ฉุกเฉิน") || q.includes("ลากรถ")) {
      return `📞 **หมายเลขโทรศัพท์สายด่วนฉุกเฉิน 24 ชั่วโมง จ.สมุทรปราการ:**\n\n` +
        `• **1669** : ศูนย์กู้ชีพการแพทย์ฉุกเฉินแห่งชาติ (EMS)\n` +
        `• **1784** : กรมป้องกันและบรรเทาสาธารณภัย (สายด่วนนิรภัย ปภ.)\n` +
        `• **02-382-6040** : สนง.ปภ. จังหวัดสมุทรปราการ\n` +
        `• **02-382-6199** : เทศบาลนครสมุทรปราการ (ศูนย์สูบน้ำและขอกระสอบทราย)\n` +
        `• **1197** : ศูนย์ควบคุมและสั่งการจราจร (บก.02)\n` +
        `• **1586** : สายด่วนกรมทางหลวง`;
    }

    // 15. ทักทาย / ขอบคุณ
    if (q.includes("สวัสดี") || q.includes("หวัดดี") || q.includes("hello") || q.includes("hi")) {
      return `สวัสดีครับ ยินดีให้บริการข้อมูลอุทกภัย เส้นทางสัญจร และสภาพอากาศ จ.สมุทรปราการ ครับ ท่านสามารถพิมพ์คำถามหรือเลือกหัวขอด้านบนได้เลยครับ`;
    }

    if (q.includes("ขอบคุณ") || q.includes("แต๊ง") || q.includes("thank")) {
      return `ด้วยความยินดีครับ ขอให้ทุกท่านเดินทางสัญจรด้วยความปลอดภัยครับ`;
    }

    // 16. การเตรียมตัวรับมือน้ำท่วม / ป้องกันบ้าน / กระสอบทราย / ก่ออิฐกั้นน้ำ
    if (q.includes("เตรียมตัว") || q.includes("รับมือ") || q.includes("เตรียมพร้อม") || q.includes("น้ำเข้าบ้าน") || q.includes("ป้องกันบ้าน") || q.includes("กระสอบทราย") || q.includes("กั้นน้ำ") || q.includes("ยกของ") || q.includes("บ้านน้ำท่วม") || q.includes("ก่ออิฐ") || q.includes("ท่วมบ้าน")) {
      return `🏡 **คู่มือการเตรียมตัวและป้องกันบ้านรับมือน้ำท่วม (อ้างอิง: [กรมป้องกันและบรรเทาสาธารณภัย ปภ.]):**\n\n` +
        `• **1. ตัดกระแสไฟฟ้าชั้นล่างทันที:** หากระดับน้ำเริ่มปริ่มเข้าขอบประตูบ้าน ให้สับคัตเอาต์/เบรกเกอร์เฉพาะชั้นล่างลง เพื่อป้องกันไฟฟ้ารั่วและไฟดูด\n` +
        `• **2. การวางกระสอบทรายที่ถูกต้อง:**\n` +
        `   - เรียงกระสอบทรายสลับชั้นแบบก่ออิฐ โดยหันปากถุงเข้าหาตัวบ้าน\n` +
        `   - ทำมุมลาดเอียง 45 องศาเพื่อต้านแรงดันน้ำ พร้อมปูแผ่นพลาสติกหนารองใต้แนวกระสอบ\n` +
        `• **3. ยกของขึ้นที่สูง:** ยกเครื่องใช้ไฟฟ้า (ตู้เย็น, เครื่องซักผ้า, ทีวี) และเอกสารสำคัญ (โฉนด, ทะเบียนบ้าน, บัตรประชาชน) ขึ้นชั้น 2\n` +
        `• **4. อุดท่อน้ำทิ้งและโถสุขภัณฑ์:** ป้องกันน้ำเอ่อดันย้อนกลับเข้าบ้านด้วยถุงทรายหรือลูกยางอุดท่อ\n` +
        `• **5. ขอรับกระสอบทรายและเครื่องสูบน้ำ:** สามารถติดต่อเทศบาลหรือ อบต. ในพื้นที่ของท่านได้ตลอด 24 ชม. เช่น เทศบาลนครสมุทรปราการ โทร. **02-382-6199** หรือสายด่วนนิรภัย ปภ. **1784**`;
    }

    // 17. ความปลอดภัยทางไฟฟ้า / ไฟดูด / ไฟรั่ว / ปลั๊กไฟ / ตัดเบรกเกอร์
    if (q.includes("ไฟดูด") || q.includes("ไฟฟ้า") || q.includes("ไฟรั่ว") || q.includes("ตัดไฟ") || q.includes("เบรกเกอร์") || q.includes("ปลั๊ก") || q.includes("มิเตอร์") || q.includes("สายไฟ") || q.includes("แช่น้ำ")) {
      return `⚡️ **ข้อควรระวังและวิธีป้องกันอันตรายจากไฟฟ้าช่วงน้ำท่วม (อ้างอิง: [การไฟฟ้านครหลวง (MEA)]):**\n\n` +
        `🔴 **กฎเหล็กเพื่อความปลอดภัยสูงสุด:**\n` +
        `• **ห้ามสัมผัสสวิตช์ไฟหรือเสียบปลั๊ก** ในขณะที่ร่างกายเปียกชื้น หรือยืนแช่อยู่ในน้ำเด็ดขาด\n` +
        `• **ปลดเมนสวิตช์ (เบรกเกอร์) ชั้นล่างลง:** หากระดับน้ำท่วมถึงระดับเต้ารับหรือใกล้ปลั๊กไฟฝาผนัง ให้ตัดไฟเฉพาะส่วนล่างทันที\n` +
        `• **ระวังเสาไฟฟ้าริมทางและตู้ไฟสาธารณะ:** ขณะเดินลุยน้ำ ให้เว้นระยะห่างจากเสาไฟ โคมไฟถนน และป้ายโฆษณาอย่างน้อย **3 - 5 เมตร** เพราะอาจมีกระแสไฟฟ้ารั่วลงน้ำ\n` +
        `• **หากพบผู้ถูกไฟดูดในน้ำ:**\n` +
        `   1. **ห้ามลงไปช่วยด้วยมือเปล่าเด็ดขาด!**\n` +
        `   2. ตัดกระแสไฟฟ้าที่เมนสวิตช์ก่อนเป็นอันดับแรก\n` +
        `   3. ใช้วัตถุที่เป็นฉนวนแห้งสนิท (เช่น ไม้แห้ง, ท่อ PVC, เชือกแห้ง) ดึงตัวผู้ประสบภัยออกมา\n` +
        `   4. รีบโทรแจ้ง **1669** หรือสายด่วนการไฟฟ้านครหลวง **1130** (สมุทรปราการ-กทม.-นนทบุรี) ตลอด 24 ชั่วโมงครับ`;
    }

    // 18. สัตว์มีพิษและสัตว์เลื้อยคลานช่วงน้ำท่วม (งู, ตะขาบ, แมงป่อง)
    if (q.includes("งู") || q.includes("ตะขาบ") || q.includes("แมงป่อง") || q.includes("สัตว์มีพิษ") || q.includes("สัตว์เลื้อยคลาน") || q.includes("จระเข้") || q.includes("สัตว์อันตราย")) {
      return `🐍 **วิธีป้องกันและรับมือสัตว์มีพิษหนีน้ำท่วม (อ้างอิง: [กรมอุทยานฯ] & [สภากาชาดไทย]):**\n\n` +
        `• **พฤติกรรมสัตว์ช่วงน้ำท่วม:** สัตว์เลื้อยคลาน (งูพิษ, ตะขาบ, แมงป่อง) จะหนีน้ำขึ้นที่แห้ง มักซ่อนตัวตาม **รองเท้า, ใต้พรม, ซอกตู้, ขอบเตียง, กองผ้า และฝ้าเพดาน**\n` +
        `• **วิธีป้องกันในบ้าน:**\n` +
        `   - เคาะรองเท้า คว่ำตรวจดูทุกครั้งก่อนสวมใส่\n` +
        `   - ใช้ไฟฉายส่องก่อนเดินเข้ามุมมืดหรือห้องน้ำเสมอ\n` +
        `   - โรยปูนขาว หรือน้ำมันก๊าด/กำมะถัน บริเวณรอยต่อประตูและบันได\n` +
        `• **หากถูกงูกัด:**\n` +
        `   - **ห้าม** ใช้ปากดูดพิษ ห้ามใช้มีดกรีดแผล และ **ห้ามขันชะเนาะ (Tourniquet) แน่นเกินไป** เพราะเนื้อเยื่ออาจตาย\n` +
        `   - ให้ล้างแผลด้วยน้ำสะอาด ดามอวัยวะให้นิ่งที่สุด และจดจำลักษณะงูหรือถ่ายภาพไว้\n` +
        `   - โทรเรียกรถพยาบาลด่วน **1669** หรือศูนย์กู้ภัยช่วยจับงู/สัตว์เลื้อยคลาน โทร. **199** ตลอด 24 ชม.`;
    }

    // 19. โรคและสุขภาพช่วงน้ำท่วม (น้ำกัดเท้า, ไข้ฉี่หนู, ท้องเสีย, ตาแดง)
    if (q.includes("โรค") || q.includes("น้ำกัดเท้า") || q.includes("ฉี่หนู") || q.includes("เลปโต") || q.includes("ท้องเสีย") || q.includes("ท้องร่วง") || q.includes("ตาแดง") || q.includes("สุขภาพ") || q.includes("คันเท้า") || q.includes("เชื้อรา") || q.includes("แผลเปื่อย")) {
      return `🩺 **4 โรคสำคัญที่มากับน้ำท่วมและวิธีดูแลรักษา (อ้างอิง: [กรมควบคุมโรค กระทรวงสาธารณสุข]):**\n\n` +
        `• **1. โรคน้ำกัดเท้า (Hong Kong Foot):**\n` +
        `   - เกิดจากเท้าแช่น้ำสกปรกเป็นเวลานานจนผิวหนังเปื่อย คัน และติดเชื้อรา\n` +
        `   - *วิธีดูแล:* หลังลุยน้ำ ให้ฟอกสบู่และล้างด้วยน้ำสะอาดทันที เช็ดซอกนิ้วเท้าให้แห้งสนิท หากมีแผลเปื่อยให้ทายาฆ่าเชื้อรา\n\n` +
        `• **2. โรคไข้ฉี่หนู (Leptospirosis):**\n` +
        `   - เชื้อแบคทีเรียจากปัสสาวะหนูปนเปื้อนในน้ำ เข้าสู่ร่างกายทางบาดแผลหรือเยื่อบุตา\n` +
        `   - *อาการเตือน:* มีไข้สูงเฉียบพลัน ปวดศีรษะ โดยเฉพาะ **ปวดกล้ามเนื้อน่องและโคนขาอย่างรุนแรง** ตาแดง ควรรีบพบแพทย์ทันที\n\n` +
        `• **3. โรคอุจจาระร่วงและอาหารเป็นพิษ:**\n` +
        `   - ดื่มน้ำบรรจุขวดที่ปิดสนิทหรือน้ำต้มสุก ล้างมือก่อนรับประทานอาหารทุกครั้ง\n\n` +
        `• **4. โรคตาแดง:** เกิดจากน้ำสกปรกกระเด็นเข้าตา ห้ามใช้มือเปียกขยี้ตา\n` +
        `💡 *คำแนะนำ:* ควรสวมรองเท้าบูทยางทุกครั้งที่ต้องลุยน้ำขัง และติดต่อสายด่วนกรมควบคุมโรค โทร. **1422** ครับ`;
    }

    // 20. การดูแลรถยนต์หลังลุยน้ำ / รถดับในน้ำ / ตรวจเช็คน้ำมันเครื่อง
    if (q.includes("รถดับ") || q.includes("น้ำเข้าเครื่อง") || q.includes("สตาร์ทไม่ติด") || q.includes("ลุยน้ำมา") || q.includes("ดูแลรถ") || q.includes("ตรวจรถ") || q.includes("เบรกลื่น") || q.includes("น้ำเข้ารถ") || q.includes("พรมเปียก") || q.includes("น้ำมันเครื่อง")) {
      return `🚘 **คู่มือดูแลรถยนต์เมื่อต้องลุยน้ำและวิธีแก้ไขเมื่อรถดับ (อ้างอิง: [กรมการขนส่งทางบก] & [คปภ.]):**\n\n` +
        `🛑 **กรณีที่ 1: หากรถดับสนิทขณะลุยน้ำขัง:**\n` +
        `• **ห้ามบิดกุญแจสตาร์ทเครื่องยนต์ซ้ำเด็ดขาด!** เพราะน้ำจะถูกดูดเข้าสู่ห้องเผาไหม้ทำให้ก้านสูบหัก/คด (Hydrolock) เครื่องยนต์พังถาวรทันที\n` +
        `• ปลดเป็นเกียร์ว่าง (N) เข็นรถขึ้นที่แห้ง และถอดขั้วแบตเตอรี่ออก โทรเรียกรถยกหรือสายด่วนกู้ภัย 1197 / 1586\n\n` +
        `🚗 **กรณีที่ 2: เมื่อขับรถลุยน้ำพ้นมาได้แล้ว:**\n` +
        `• **อย่าเพิ่งดับเครื่องยนต์ทันที:** ให้ติดเครื่องเดินเบาไว้ 10 - 15 นาที เพื่อให้ความร้อนระบายความชื้นออกจากห้องเครื่อง\n` +
        `• **เหยียบเบรกย้ำๆ ถี่ๆ ด้วยความเร็วต่ำ:** เพื่อไล่น้ำออกจากจานเบรกและผ้าเบรก ป้องกันอาการเบรกลื่นหรือเบรกหาย\n` +
        `• **ตรวจเช็คก้านวัดน้ำมันเครื่อง:** หากดึงขึ้นมาดูแล้วพบว่าน้ำมันเครื่องเปลี่ยนเป็น **สีขุ่นคล้ายชานมเย็น / กาแฟใส่นม** แสดงว่ามีน้ำรั่วซึมเข้าเครื่องยนต์ ห้ามใช้งาน ให้เปลี่ยนถ่ายน้ำมันเครื่องทันทีครับ`;
    }

    // 21. ประกันภัย / เคลมประกันน้ำท่วม (คปภ.)
    if (q.includes("ประกัน") || q.includes("เคลม") || q.includes("คปภ") || q.includes("เงินชดเชย") || q.includes("เยียวยา") || q.includes("ถ่ายรูป") || q.includes("ประกันจ่าย")) {
      return `📑 **แนวทางการเคลมประกันภัยรถยนต์กรณีถูกน้ำท่วม (อ้างอิง: [สำนักงาน คปภ.]):**\n\n` +
        `• **ประเภทประกันที่คุ้มครองน้ำท่วม:**\n` +
        `  - **ประกันภัยชั้น 1:** คุ้มครองภัยธรรมชาติและน้ำท่วมเต็มรูปแบบ ทั้งกรณีจอดจมน้ำและขับผ่านน้ำ\n` +
        `  - **ประกันภัยชั้น 2+ หรือ 3+:** คุ้มครองเฉพาะกรมธรรม์ที่มีการระบุความคุ้มครองเสริมภัยน้ำท่วม\n\n` +
        `📸 **4 ขั้นตอนปฏิบัติในการเคลมให้ได้เงินชดเชยเร็ว:**\n` +
        `  1. **ถ่ายภาพหลักฐานทันที:** ถ่ายรูปมุมกว้างให้เห็นระดับน้ำ ทะเบียนรถ และตำแหน่งพิกัดที่รถจมน้ำ\n` +
        `  2. **อย่าพยายามสตาร์ทเครื่องยนต์:** การพยายามสตาร์ทในน้ำจนเครื่องพัง อาจถูกพิจารณาเป็นความประมาทเลินเล่อ\n` +
        `  3. **จดบันทึกวันและเวลาเกิดเหตุ:** พร้อมระบุสถานที่ให้ชัดเจน (เช่น ถนน, ซอย, อำเภอ)\n` +
        `  4. **โทรแจ้งศูนย์เคลมของบริษัทประกันภัยทันที**\n\n` +
        `📞 หากมีข้อพิพาทหรือสอบถามสิทธิประโยชน์ ติดต่อสายด่วนประกันภัย คปภ. โทร. **1186** (วันและเวลาราชการ) ครับ`;
    }

    // 22. จุดจอดรถหนีน้ำที่สูงในสมุทรปราการ
    if (q.includes("จอดรถ") || q.includes("ที่จอดรถ") || q.includes("หนีน้ำ") || q.includes("ที่สูง") || q.includes("จอดรถที่ไหน") || q.includes("จอดรถตรงไหน") || q.includes("ฝากรถ")) {
      return `🅿️ **พิกัดอาคารจอดรถยกสูงและพื้นที่ปลอดภัยน้ำไม่ท่วม จ.สมุทรปราการ:**\n\n` +
        `• **1. อาคารจอดแล้วจร (Park & Ride) BTS เคหะสมุทรปราการ:**\n` +
        `  - อาคารจอดรถ 3 ชั้น รองรับรถยนต์ได้กว่า 1,200 คัน พื้นที่ยกสูงเหนือระดับน้ำทะเลอย่างปลอดภัย\n\n` +
        `• **2. ศูนย์การค้าเมกาบางนา (Mega Bangna):**\n` +
        `  - อาคารจอดรถในร่ม 7 ชั้น โซน IKEA และโซน Big C ถ.บางนา-ตราด\n\n` +
        `• **3. โรบินสัน ไลฟ์สไตล์ สมุทรปราการ:**\n` +
        `  - ถ.สุขุมวิท (ใกล้สถานี BTS แพรกษา) มีพื้นที่จอดรถในร่มยกสูง\n\n` +
        `• **4. อิมพีเรียล เวิลด์ สำโรง:**\n` +
        `  - อาคารจอดรถชั้น 3 ขึ้นไป พ้นระดับน้ำท่วมถนนสุขุมวิท\n\n` +
        `• **5. อาคารจอดรถสถานีรถไฟฟ้าสายสีเหลือง (สถานีศรีเอี่ยม):**\n` +
        `  - อาคารจอดรถ 7 ชั้น เชื่อมต่อถนนศรีนครินทร์และบางนา\n\n` +
        `💡 *ข้อแนะนำ:* ควรนำเอกสารประจำตัวและกุญแจสำรองติดตัวไว้ และปลดเบรกมือทิ้งเกียร์ N ไว้ในกรณีต้องจอดขวางครับ`;
    }

    // 23. สัตว์เลี้ยงช่วงน้ำท่วม (หมา แมว)
    if (q.includes("หมา") || q.includes("แมว") || q.includes("สัตว์เลี้ยง") || q.includes("สุนัข") || q.includes("อาหารหมา") || q.includes("อาหารแมว")) {
      return `🐾 **การดูแลและอพยพสัตว์เลี้ยงช่วงน้ำท่วม (อ้างอิง: [กรมปศุสัตว์]):**\n\n` +
        `• **1. เตรียมเสบียงสัตว์เลี้ยง:** สำรองอาหารเม็ด อาหารเปียก และน้ำสะอาดอย่างน้อย **5 - 7 วัน**\n` +
        `• **2. อุปกรณ์อพยพ:** จัดเตรียมกรง/กระเป๋าเดินทางสัตว์เลี้ยง ปลอกคอ สายจูง และยาประจำตัว\n` +
        `• **3. กฎความปลอดภัย:**\n` +
        `   - **ห้ามล่ามโซ่สัตว์เลี้ยงไว้กับเสาหรือรั้วชั้นล่างเด็ดขาด** เพราะเมื่อระดับน้ำสูงขึ้น สัตว์จะไม่สามารถหนีน้ำได้\n` +
        `   - ย้ายกรงสัตว์เลี้ยงขึ้นชั้น 2 หรือพื้นที่แห้ง ระวังยุงและสัตว์เลื้อยคลานเข้ามารบกวน\n` +
        `• **4. ขอความช่วยเหลืออพยพสัตว์เลี้ยง:** หากติดอยู่ในพื้นที่น้ำท่วมสูง ติดต่อสายด่วนกู้ภัย ปภ. **1784** หรือมูลนิธิกู้ภัยในพื้นที่สมุทรปราการครับ`;
    }

    // 24. ระบบคลองระบายน้ำและประตูน้ำในสมุทรปราการ
    if (q.includes("คลอง") || q.includes("คลองสำโรง") || q.includes("คลองบางปิ้ง") || q.includes("คลองด่าน") || q.includes("ลัดโพธิ์") || q.includes("ประตูน้ำ") || q.includes("สูบน้ำ") || q.includes("เครื่องสูบ")) {
      return `🌊 **โครงข่ายคลองระบายน้ำและประตูระบายน้ำสำคัญ จ.สมุทรปราการ (อ้างอิง: [กรมชลประทาน]):**\n\n` +
        `• **1. คลองสำโรง:** ลำน้ำสายประวัติศาสตร์ เชื่อมระหว่างแม่น้ำเจ้าพระยากับแม่น้ำบางปะกง เป็นแนวระบายน้ำหลักของ อ.เมือง และ อ.บางพลี โดยมีสถานีสูบน้ำสำโรงเร่งผลักดันน้ำลงสู่แม่น้ำเจ้าพระยา\n` +
        `• **2. คลองบางปิ้ง:** รับน้ำจากซอยทรัพย์บุญชัย, ถ.ศรีนครินทร์ และ ถ.แพรกษา เพื่อระบายออกสู่อ่าวไทย\n` +
        `• **3. ประตูระบายน้ำคลองลัดโพธิ์อันเนื่องมาจากพระราชดำริ (อ.พระประแดง):** ช่วยตัดโค้งแม่น้ำเจ้าพระยาจาก 18 กม. เหลือเพียง 600 ม. ทำให้ระบายน้ำหลากลงสู่อ่าวไทยได้เร็วขึ้นกว่าเดิมถึง 10 เท่า\n` +
        `• **4. สถานีสูบน้ำชลหารพิจิตร (คลองด่าน อ.บางบ่อ):** สถานีสูบน้ำชายทะเลที่ใหญ่ที่สุดในเอเชียตะวันออกเฉียงใต้ ทำหน้าที่สูบน้ำจากคลองระบายน้ำสุวรรณภูมิและพื้นที่ฝั่งตะวันออกทิ้งลงสู่อ่าวไทย\n\n` +
        `⚙️ เจ้าหน้าที่ชลประทานและเทศบาลเดินเครื่องสูบน้ำตลอด 24 ชั่วโมงเพื่อควบคุมระดับน้ำครับ`;
    }

    // 25. เส้นทางเลี่ยง / ทางยกระดับ / สะพานภูมิพล / ทางด่วน
    if (q.includes("ทางเลี่ยง") || q.includes("เลี่ยงทาง") || q.includes("เส้นทางเลี่ยง") || q.includes("ทางด่วน") || q.includes("สะพานภูมิพล") || q.includes("บูรพาวิถี") || q.includes("กาญจนาภิเษก") || q.includes("ไปทางไหน") || q.includes("เลี่ยงรถติด")) {
      return `🛣️ **3 เส้นทางยกระดับหลักที่ปลอดภัยจากน้ำท่วม 100% ในสมุทรปราการ:**\n\n` +
        `• **1. สะพานภูมิพล 1 และ สะพานภูมิพล 2:**\n` +
        `  - สะพานข้ามแม่น้ำเจ้าพระยาเชื่อมระหว่าง อ.พระประแดง กับ ถ.พระราม 3 และ ถ.ปู่เจ้าสมิงพราย ใช้ข้ามเลี่ยงจุดน้ำท่วมถนนผิวราบแนวริมน้ำเจ้าพระยาได้ดีที่สุด\n\n` +
        `• **2. ทางพิเศษกาญจนาภิเษก (บางพลี - สุขสวัสดิ์):**\n` +
        `  - สะพานกาญจนาภิเษกข้ามแม่น้ำเจ้าพระยา เชื่อมฝั่งตะวันออก (บางพลี, ปากน้ำ) ไปยังฝั่งตะวันตก (พระสมุทรเจดีย์, สุขสวัสดิ์, พระราม 2) โดยไม่ต้องผ่านผิวจราจรด้านล่าง\n\n` +
        `• **3. ทางพิเศษบูรพาวิถี (บางนา - ตราด):**\n` +
        `  - ทางยกระดับตลอดสายเหนือถนนบางนา-ตราด (กม.0 ถึง กม.55) เลี่ยงปัญหาน้ำท่วมขังผิวถนนบางนา-ตราด และกิ่งแก้วได้อย่างสมบูรณ์แบบ\n\n` +
        `💡 ตรวจสอบสภาพจราจรสดได้ที่ศูนย์ควบคุม บก.02 โทร. **1197** หรือสายด่วนทางหลวง **1586** ครับ`;
    }

    // 26. ถุงยังชีพและสิ่งของจำเป็น
    if (q.includes("ถุงยังชีพ") || q.includes("ของจำเป็น") || q.includes("เสบียง") || q.includes("อาหารแห้ง") || q.includes("ไฟฉาย") || q.includes("เตรียมของ")) {
      return `🎒 **รายการสิ่งของจำเป็น 7 หมวดสำหรับจัดเตรียม "ถุงยังชีพฉุกเฉิน":**\n\n` +
        `• **1. น้ำดื่มสะอาด:** อย่างน้อยคนละ 2 - 3 ลิตรต่อวัน (สำรอง 3 วันขึ้นไป)\n` +
        `• **2. อาหารแห้งที่ไม่ต้องปรุง:** ปลากระป๋อง, บะหมี่กึ่งสำเร็จรูป, ขนมปังกรอบ, นมกล่อง UHT\n` +
        `• **3. ยาสามัญและยาประจำตัว:** พาราเซตามอล, ยาแก้แพ้, ผงเกลือแร่ (ORS), เบตาดีน, แอลกอฮอล์, ยาทาน้ำกัดเท้า และยาประจำตัวสำหรับผู้สูงอายุ\n` +
        `• **4. อุปกรณ์ส่องสว่าง & พลังงาน:** ไฟฉายกันน้ำพร้อมถ่านสำรอง, พาวเวอร์แบงค์ชาร์จเต็ม 100%, เทียนไขและไฟแช็ก\n` +
        `• **5. ของใช้สุขอนามัย:** ทิชชูเปียก, สบู่, หน้ากากอนามัย, ถุงดำสำหรับทิ้งขยะและใช้เป็นถุงขับถ่ายฉุกเฉิน\n` +
        `• **6. เอกสารสำคัญ:** บัตรประชาชน, ทะเบียนบ้าน, เอกสารรถยนต์, กรมธรรม์ประกันภัย (ใส่ซองซิปล็อกกันน้ำ)\n` +
        `• **7. อุปกรณ์ส่งสัญญาณ:** นกหวีดสำหรับเป่าขอความช่วยเหลือยามฉุกเฉิน`;
    }

    // 27. ข้อมูลรายอำเภอทั้ง 6 อำเภอของสมุทรปราการ
    if (q.includes("อำเภอ") || q.includes("อ.เมือง") || q.includes("บางพลี") || q.includes("พระประแดง") || q.includes("พระสมุทรเจดีย์") || q.includes("บางบ่อ") || q.includes("บางเสาธง")) {
      return `🗺️ **สรุปลักษณะความเสี่ยงและจุดเฝ้าระวัง 6 อำเภอ จ.สมุทรปราการ (อ้างอิง: [ปภ.สมุทรปราการ]):**\n\n` +
        `• **1. อ.เมืองสมุทรปราการ:** เฝ้าระวัง 2 ปัจจัยหลัก ทั้งน้ำฝนสะสม (ซอยทรัพย์บุญชัย, วัดด่าน, แบริ่ง) และน้ำทะเลหนุนเจ้าพระยา (ตลาดปากน้ำ, ท้ายบ้าน)\n` +
        `• **2. อ.บางพลี:** พื้นที่ลุ่มต่ำแอ่งกระทะรับน้ำรอบสุวรรณภูมิ (ถ.กิ่งแก้ว, ถ.บางนา-ตราด กม.12-16, ซอยวัดศรีวารีน้อย)\n` +
        `• **3. อ.พระประแดง:** แนวเขื่อนแม่น้ำเจ้าพระยาและพื้นที่ริมน้ำ (ท่าน้ำพระประแดง, ตลาดบางพึ่ง, ปู่เจ้าสมิงพราย)\n` +
        `• **4. อ.พระสมุทรเจดีย์:** ติดชายทะเลอ่าวไทย ได้รับอิทธิพลน้ำทะเลหนุนสูงโดยตรง (ถ.สุขสวัสดิ์-ป้อมพระจุลฯ, สามแยกพระสมุทรเจดีย์)\n` +
        `• **5. อ.บางบ่อ:** แนวคลองสำโรงและชายฝั่งทะเล (ตลาดคลองด่าน, คลองด่าน-สุขุมวิทสายเก่า, บางพลีน้อย)\n` +
        `• **6. อ.บางเสาธง:** พื้นที่รองรับน้ำทุ่งตะวันออก (ถ.เทพารักษ์ กม.21-25, เคหะบางพลี)\n\n` +
        `📞 สอบถามศูนย์ ปภ. จังหวัดสมุทรปราการ โทร. **02-382-6040** ได้ตลอด 24 ชั่วโมงครับ`;
    }

    // 28. ทำไมสมุทรปราการถึงน้ำท่วมบ่อย
    if (q.includes("ทำไม") || q.includes("สาเหตุ") || q.includes("ท่วมบ่อย") || q.includes("แผ่นดินทรุด") || q.includes("เพราะอะไร")) {
      return `🌏 **3 สาเหตุสำคัญเชิงภูมิศาสตร์และอุทกวิทยาที่ทำให้ จ.สมุทรปราการ เกิดน้ำท่วมบ่อยครั้ง:**\n\n` +
        `• **1. ลักษณะพื้นที่เป็น "แอ่งกระทะลุ่มต่ำ" (Lowland Depression):**\n` +
        `  - พื้นที่ส่วนใหญ่ของจังหวัดมีความสูงใกล้เคียงหรือต่ำกว่าระดับน้ำทะเลปานกลาง (รทก.) ในบางจุดเกิดการทรุดตัวของชั้นดินสะสม ทำให้เมื่อมีฝนตกหนัก น้ำจึงไหลมารวมตัวกันและระบายออกสู่ธรรมชาติได้ช้า\n\n` +
        `• **2. อิทธิพล "น้ำทะเลหนุนสูง" (High Sea Tide) บริเวณปากอ่าวไทย:**\n` +
        `  - สมุทรปราการเป็นจุดบรรจบสุดท้ายของแม่น้ำเจ้าพระยาก่อนออกสู่อ่าวไทย ในช่วงน้ำขึ้นสูงสุด ระดับน้ำในแม่น้ำจะสูงกว่าระดับผิวถนนแนวชายฝั่ง ทำให้น้ำดันย้อนขึ้นมาตามท่อระบายน้ำและล้นแนวเขื่อน\n\n` +
        `• **3. การขยายตัวของเมืองและพื้นที่รับน้ำจาก กทม.:**\n` +
        `  - สมุทรปราการทำหน้าที่เป็น "ทางผ่านน้ำหลาก" (Floodway) จาก กทม. ฝั่งตะวันออกและแม่น้ำเจ้าพระยาตอนบนเพื่อระบายออกสู่ทะเลทางคลองสำโรงและคลองด่าน\n\n` +
        `💡 ระบบนี้จัดทำขึ้นเพื่อช่วยให้พี่น้องประชาชนติดตามสถานการณ์และวางแผนสัญจรได้อย่างปลอดภัยล่วงหน้าครับ`;
    }

    // 29. คำถามทั่วไป / สนทนานอกกรอบอย่างชาญฉลาด (Intelligent Conversational Responder)
    return `🤖 **PrakanGuard AI ยินดีตอบข้อซักถามและให้ข้อมูลครับ:**\n\n` +
      `ขณะนี้ในพื้นที่ **จังหวัดสมุทรปราการ** มีข้อมูลสภาพอากาศและสถานการณ์สดดังนี้:\n` +
      `• 🌡️ **อุณหภูมิปัจจุบัน:** **${weather.temp}°C** (สถานะ: ${weather.weatherDesc})\n` +
      `• 🌧️ **โอกาสเกิดฝนตกวันนี้:** **${rainChance}%** (ปริมาณฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
      `• ⏱️ **ช่วงเวลาที่ต้องเฝ้าระวังฝนตกหนักสูงสุด:** **${peakTime}**\n\n` +
      `💡 **ท่านสามารถพิมพ์ถามเรื่องอื่นๆ เพิ่มเติมได้อย่างอิสระ เช่น:**\n` +
      `1. **เช็คจุดเสี่ยงเฉพาะพิกัด:** เช่น *"ซอยทรัพย์บุญชัยท่วมไหม"*, *"วัดด่าน"*, *"ปากน้ำ"*, *"กิ่งแก้ว"*\n` +
      `2. **ความปลอดภัยและการเตรียมตัว:** เช่น *"น้ำเข้าบ้านเตรียมตัวอย่างไร"*, *"ป้องกันไฟดูด"*, *"สัตว์มีพิษ"*\n` +
      `3. **การสัญจรและยานพาหนะ:** เช่น *"รถเก๋งลุยน้ำได้กี่เซน"*, *"จุดจอดรถหนีน้ำที่สูง"*, *"เคลมประกันน้ำท่วม"*\n` +
      `4. **ขอความช่วยเหลือ:** สายด่วน ปภ. **1784**, กู้ชีพ **1669**, เทศบาลนครสมุทรปราการ **02-382-6199** ครับ`;
  };

  // Smooth Streaming Typer with Real-time Cancellation / Stop Support
  const streamBotResponse = (fullText) => {
    handleStopResponse();

    const newMsgId = `bot-${Date.now()}`;
    const newBotMsg = {
      id: newMsgId,
      sender: 'bot',
      text: '',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newBotMsg]);
    setStreamingMessageId(newMsgId);
    setIsThinking(false);

    let currentIdx = 0;
    const speed = 12;

    streamingIntervalRef.current = setInterval(() => {
      currentIdx += Math.floor(Math.random() * 2) + 2;
      if (currentIdx >= fullText.length) {
        currentIdx = fullText.length;
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
        setStreamingMessageId(null);
      }

      const displayedText = fullText.slice(0, currentIdx);
      setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, text: displayedText } : m));
    }, speed);
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // If already streaming, cancel existing stream before sending new message
    handleStopResponse();

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    thinkingTimeoutRef.current = setTimeout(() => {
      const fullAnswer = synthesizeAnswer(query, [...messages, userMsg]);
      streamBotResponse(fullAnswer);
    }, 280);
  };

  // Smart Formatter for Message Text (Highlighting Government Agency Citations Prominently)
  const renderFormattedMessage = (rawText) => {
    if (!rawText) return null;

    const paragraphs = rawText.split('\n');

    return paragraphs.map((para, pIdx) => {
      if (!para.trim()) {
        return <div key={pIdx} className="h-1.5" />;
      }

      const tokens = [];
      const regex = /(\[.*?\])|(\*\*.*?\*\*)/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(para)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ type: 'text', content: para.substring(lastIndex, match.index) });
        }

        if (match[1]) {
          const agencyName = match[1].slice(1, -1);
          tokens.push({ type: 'agency', content: agencyName });
        } else if (match[2]) {
          const boldText = match[2].slice(2, -2);
          tokens.push({ type: 'bold', content: boldText });
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < para.length) {
        tokens.push({ type: 'text', content: para.substring(lastIndex) });
      }

      return (
        <p key={pIdx} className="leading-relaxed mb-1 text-xs sm:text-sm">
          {tokens.map((token, tIdx) => {
            if (token.type === 'agency') {
              return (
                <span 
                  key={tIdx} 
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 mx-0.5 rounded-md text-[11px] font-bold shadow-xs align-baseline ${
                    isDark 
                      ? 'bg-blue-950/80 text-cyan-300 border border-blue-800' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                  title="แหล่งอ้างอิงข้อมูลเปิดสาธารณะ"
                >
                  <ShieldCheck className={`w-3 h-3 shrink-0 inline ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>{token.content}</span>
                </span>
              );
            }
            if (token.type === 'bold') {
              return <strong key={tIdx} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{token.content}</strong>;
            }
            return <span key={tIdx}>{token.content}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Helpdesk Launcher Button - Theme-Adaptive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-semibold text-xs sm:text-sm shadow-xl items-center gap-2.5 border cursor-pointer transition-all hover:scale-105 active:scale-95 backdrop-blur-xl group ${
            isPointSelected ? 'hidden sm:flex' : 'flex'
          } ${
            isDark 
              ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-blue-500' 
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400'
          }`}
          title="ศูนย์บริการข้อมูลเส้นทางและน้ำท่วม (ถาม-ตอบอัจฉริยะ)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className={`block text-xs sm:text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PrakanGuard AI</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}>Online</span>
            </div>
            <span className={`block text-[10px] font-medium ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>ถามตอบแม่นยำ • พยากรณ์ฝนสด</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white ml-1"></span>
        </button>
      )}

      {/* Minimized Floating Dock Bar (When minimized) */}
      {isOpen && isMinimized && (
        <div 
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto'
          } : undefined}
          className={`fixed z-50 bottom-4 right-3 sm:bottom-6 sm:right-6 max-w-[92vw] sm:w-[380px] border rounded-2xl shadow-2xl flex items-center justify-between gap-2 px-3 py-2.5 backdrop-blur-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            isDark 
              ? 'bg-slate-900/95 border-slate-700 text-slate-100 ring-1 ring-blue-500/20' 
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-blue-500/10'
          }`}
        >
          {/* Clickable Area to Restore */}
          <div 
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
            title="คลิกเพื่อขยายหน้าต่างแชท AI กลับขึ้นมา"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm truncate">PrakanGuard AI</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                  isDark ? 'bg-blue-950/80 text-cyan-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>ย่อขนาด</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                {(isThinking || streamingMessageId) ? (
                  <span className="text-amber-400 font-semibold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    กำลังตอบคำถาม...
                  </span>
                ) : (
                  <span>คลิกเพื่อขยายหน้าต่างถามตอบ</span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons inside Minimized Bar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Instant Stop Button if AI is generating */}
            {(isThinking || streamingMessageId) && (
              <button
                type="button"
                onClick={handleStopResponse}
                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm animate-pulse"
                title="หยุดการตอบคำถามของ AI ทันที"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>หยุดตอบ</span>
              </button>
            )}

            {/* Restore/Expand Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="ขยายหน้าต่างขึ้น"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsMinimized(false); }}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="ปิดแชท"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Official Public Information Dialog - Theme-Adaptive & Freely Draggable */}
      {isOpen && !isMinimized && (
        <div 
          ref={modalRef}
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto'
          } : undefined}
          className={`fixed z-50 w-[95vw] ${
            isExpanded ? 'sm:w-[620px] h-[720px] max-h-[92vh]' : 'sm:w-[460px] h-[600px] max-h-[85vh] sm:max-h-[88vh]'
          } border rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-[width,height,box-shadow,border-color] duration-200 ${
            !position ? 'bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:bottom-6 sm:right-6' : ''
          } ${
            isDraggingModal ? 'ring-2 ring-blue-500/60 shadow-blue-500/30 cursor-grabbing' : ''
          } ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          
          {/* Header (Freely Draggable Handle for PC Mouse & Mobile Touch) */}
          <div 
            onMouseDown={handleMouseDownHeader}
            onTouchStart={handleTouchStartHeader}
            className={`px-4 py-3 border-b flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-colors ${
              isDraggingModal 
                ? (isDark ? 'bg-blue-950/90 border-blue-700' : 'bg-blue-50/90 border-blue-300')
                : (isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200')
            }`}
            title="กดค้างที่แถบนี้เพื่อลากย้ายหน้าต่าง AI ChatBot ได้อย่างอิสระ"
          >
            <div className="flex items-center space-x-2.5 min-w-0 pointer-events-none">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 border border-blue-400/30 flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>PrakanGuard AI สารสนเทศอุทกภัย</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  }`}>Online</span>
                </h4>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  อ้างอิงประกาศและข้อมูลสาธารณะที่เป็นประโยชน์
                </p>
              </div>
            </div>

            {/* Drag Handle Badge & Control Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <div 
                className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium pointer-events-none select-none border transition-colors ${
                  isDark 
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700' 
                    : 'bg-white/90 text-slate-600 border-slate-200 shadow-xs'
                }`}
                title="คลิกค้างแล้วลากเพื่อย้ายหน้าต่าง"
              >
                <GripHorizontal className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>ลากย้ายได้</span>
              </div>

              {position && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-xs'
                  }`}
                  title="รีเซ็ตตำแหน่งกลับมุมจอขวาล่าง"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Size Expand/Normal Toggle Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-xs'
                }`}
                title={isExpanded ? "ย่อขนาดหน้าต่างให้กะทัดรัด" : "ขยายขนาดหน้าต่างให้กว้างขึ้น"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Minimize Dock Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-amber-600 border border-slate-200 shadow-xs'
                }`}
                title="ย่อขนาดเก็บลงแถบด้านข้าง/มุมล่าง"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs'
                }`}
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live Meteorological Telemetry Status Bar */}
          <div className={`px-3.5 py-1.5 border-b flex items-center justify-between text-[11px] ${
            isDark ? 'bg-blue-950/70 border-blue-900 text-blue-200' : 'bg-blue-50/90 border-blue-100 text-blue-900'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              <CloudRain className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span className="truncate">
                อากาศสมุทรปราการ: <strong className={`font-bold ${isDark ? 'text-cyan-300' : 'text-blue-950'}`}>{weather.temp}°C</strong> • โอกาสฝน: <strong className={`font-bold ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>{weather.rainProbabilityToday}%</strong>
              </span>
            </div>
            <span className={`text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-md border ${
              isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100/90 text-amber-800 border-amber-300'
            }`}>
              เฝ้าระวัง: {weather.peakHour}
            </span>
          </div>

          {/* Quick Smart Inquiry Chips (With Left & Right Slider Controls) */}
          <div className={`relative px-2 py-1.5 border-b flex items-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollChips('left')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 mr-1 border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="เลื่อนดูคำถามก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Chips Strip (Touch, Wheel & Drag with Butter-Smooth Gliding) */}
            <div 
              ref={chipsRef}
              onMouseDown={handleChipsMouseDown}
              onMouseMove={handleChipsMouseMove}
              onMouseUp={handleChipsMouseUp}
              onMouseLeave={handleChipsMouseUp}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto smooth-slider no-scrollbar text-xs py-0.5 touch-pan-x cursor-grab active:cursor-grabbing select-none"
            >
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ช่วยย่อและสรุปสั้นๆ ให้หน่อย"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-200 border border-purple-700 hover:from-purple-800 hover:to-indigo-800' 
                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-300 hover:from-purple-100 hover:to-indigo-100'
                }`}
                title="ขอคำตอบแบบย่อสั้น กระชับ ตรงประเด็น"
              >
                ⚡️ ย่อ/สรุปสั้นๆ หน่อย
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ซอยทรัพย์บุญชัย มีโอกาสเกิดน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700 hover:bg-emerald-900' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                🏡 ซอยทรัพย์บุญชัยท่วมไหม?
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ปากน้ำมีโอกาสท่วมไหม และต้องเตรียมตัวอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-blue-950/90 text-cyan-300 border border-blue-700 hover:bg-blue-900' 
                    : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                }`}
              >
                📍 ปากน้ำมีโอกาสท่วมไหม?
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("อยากทราบว่าวัดด่านมีโอกาสท่วมอีกไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-700 hover:bg-amber-900' 
                    : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                🌊 วัดด่านมีโอกาสท่วมอีกไหม?
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("วิธีตัดไฟและป้องกันไฟดูดช่วงน้ำท่วมต้องทำอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-yellow-950/90 text-yellow-300 border border-yellow-700 hover:bg-yellow-900' 
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-300 hover:bg-yellow-100'
                }`}
              >
                ⚡️ ป้องกันไฟดูด & ตัดไฟ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ในสมุทรปราการมีจุดจอดรถที่สูงหรือลานจอดหนีน้ำท่วมที่ไหนบ้าง?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-700 hover:bg-indigo-900' 
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-300 hover:bg-indigo-100'
                }`}
              >
                🅿️ จุดจอดรถที่สูงหนีน้ำ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("รถเก๋งลุยน้ำได้กี่เซนติเมตร และระดับไหนห้ามผ่านเด็ดขาด?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚗 เกณฑ์รถเก๋งลุยน้ำ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("สัตว์มีพิษที่มักมากับน้ำท่วมมีอะไรบ้าง และวิธีป้องกันงูเข้าบ้าน?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🐍 สัตว์มีพิษช่วงน้ำท่วม
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("โรคน้ำกัดเท้าและโรคไข้ฉี่หนู อาการเป็นอย่างไรและรักษายังไง?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                💊 โรคน้ำกัดเท้า & ไข้ฉี่หนู
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("จัดเตรียมถุงยังชีพฉุกเฉินรับมือน้ำท่วม มีสิ่งของจำเป็นอะไรบ้าง?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🛡️ จัดถุงยังชีพฉุกเฉิน
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("วันนี้ฝนจะตกกี่เปอร์เซ็นต์ และคาดการณ์ตกหนักช่วงเวลาไหน?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌧️ คาดการณ์ฝนตกหนักวันนี้
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("สถานการณ์จุดเสี่ยงสำโรงและแบริ่งเป็นอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚇 สำโรง-แบริ่ง
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("นิคมอุตสาหกรรมบางปู เสี่ยงน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🏭 นิคมฯ บางปู
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ถนนกิ่งแก้ว และอำเภอบางพลี สภาพการสัญจรเป็นอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                ✈️ กิ่งแก้ว-บางพลี
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ท่าน้ำพระประแดง และถนนปู่เจ้าสมิงพราย มีน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚢 พระประแดง-ปู่เจ้า
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("น้ำทะเลหนุนสถานีป้อมพระจุลฯ ส่งผลกระทบพื้นที่ไหนบ้าง?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌊 น้ำทะเลหนุนป้อมพระจุลฯ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ตลาดคลองด่าน และอำเภอบางบ่อ เสี่ยงน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌊 คลองด่าน-บางบ่อ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ขอหมายเลขโทรศัพท์สายด่วนฉุกเฉินและหน่วยกู้ภัยในสมุทรปราการ"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900/60' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                📞 สายด่วน ปภ. 24 ชม.
              </button>
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollChips('right')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 ml-1 border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="เลื่อนดูคำถามถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Message History Feed */}
          <div className={`flex-1 p-3.5 sm:p-4 space-y-3 overflow-y-auto text-xs sm:text-sm ${
            isDark ? 'bg-slate-950/40' : 'bg-slate-50/40'
          }`}>
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
                
                <div 
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-xs font-medium' 
                      : isDark
                        ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-bl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedMessage(m.text)}
                  
                  {streamingMessageId === m.id && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                  )}

                  <span className={`block text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-blue-100 text-right' : (isDark ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {m.time}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className={`border rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-sm ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-xs ml-1.5 font-medium">กำลังค้นหาข้อมูลประกาศและสภาพอากาศ...</span>
                </div>
              </div>
            )}

            {/* Prominent Floating Stop Button while streaming or thinking */}
            {(isThinking || Boolean(streamingMessageId)) && (
              <div className="sticky bottom-1 z-20 flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleStopResponse}
                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/20 animate-in fade-in zoom-in-95"
                  title="หยุดการพิมพ์ตอบของ AI ทันที"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>⏹️ หยุดตอบ</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={Boolean(streamingMessageId)}
              placeholder={isThinking || streamingMessageId ? "AI กำลังตอบคำถาม... สามารถกดปุ่มหยุดตอบได้" : "พิมพ์คำถามได้อย่างอิสระ เช่น ซอยทรัพย์บุญชัยท่วมไหม, ตัดไฟอย่างไร..."}
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:bg-slate-800' 
                  : 'bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
            {isThinking || Boolean(streamingMessageId) ? (
              <button
                type="button"
                onClick={handleStopResponse}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0 animate-pulse"
                title="หยุดการตอบของ AI ทันที"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>หยุดตอบ</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md shrink-0"
                title="ส่งข้อความ"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>

        </div>
      )}
    </>
  );
}
