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
  ChevronDown,
  Copy,
  Check,
  ArrowUp
} from 'lucide-react';
import { INITIAL_FLOOD_POINTS } from '../data/samutPrakanPoints';
import { FLOOD_STANDARDS } from '../data/floodStandards';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import { playClickSound, playCloseSound, playAiChatSound, playToggleSound } from '../services/soundEffects';
import { 
  OFFICIAL_EMERGENCY_CONTACTS, 
  DISTRICT_KNOWLEDGE, 
  FLOOD_WATER_STANDARDS_OFFICIAL, 
  FLOOD_SAFETY_TIPS, 
  FAQS_OFFICIAL 
} from '../data/chatKnowledgeBase';

// PrakanBOT monogram – a clean "P" mark with a subtle water line (no AI clichés)
function AiOfficialEmblem({ size = 32, className = "" }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="10" fill="#1d4ed8" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="9.5" stroke="#ffffff" strokeOpacity="0.12" />
        <path
          d="M12 23V9h5.2a4.4 4.4 0 0 1 0 8.8H12"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 23.2c1.1-.8 2.2-.8 3.3 0s2.2.8 3.3 0"
          stroke="#93c5fd"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
// พจนานุกรมสถานที่ในจังหวัดสมุทรปราการ พร้อมระบบจับคู่คำสะกดผิด/คำพ้องเสียง (Fuzzy Typo Dictionary) และข้อมูลคาดการณ์ฝนเฉพาะจุด
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
    phones: "[เทศบาลนครสมุทรปราการ] โทร. 02-382-6199 • [เทศบาลตำบลแพรกษา] โทร. 02-388-0056",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (โซนศรีนครินทร์ - รพ.เปาโล - คลองบางปิ้ง)",
      peakTime: "15:00 – 18:30 น. (ช่วงบ่ายแก่ถึงหัวค่ำ)",
      rainProbOffset: 5,
      intensityDesc: "ฝนฟ้าคะนองปานกลางถึงหนัก มีฟ้าแลบฟ้าร้องเป็นช่วงๆ ลมกระโชก 15-25 กม./ชม.",
      accumulationEstimate: "25 – 40 มม.",
      radarMovement: "กลุ่มเมฆฝนเคลื่อนตัวจากแนวสมุทรปราการตอนบน (สำโรง) ลงมาทางทิศตะวันออกเฉียงใต้สู่คลองบางปิ้ง",
      impactRisk: "พื้นที่แอ่งกระทะในซอยทรัพย์บุญชัย (ซอย 1-39) เกิดน้ำท่วมขังผิวถนน 15-30 ซม. หลังฝนตกต่อเนื่อง 25 นาที",
      drainageRate: "ระบายลงสู่คลองบางปิ้ง ใช้เวลาหน่วงระบายประมาณ 45 – 60 นาทีหลังฝนหยุดตก"
    }
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
    phones: "[เทศบาลตำบลสำโรงเหนือ] โทร. 02-398-3333 • [แขวงทางหลวงสมุทรปราการ] โทร. 1586",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (รอยต่อสุขุมวิท 113 - แบริ่ง)",
      peakTime: "14:30 – 18:00 น. (ช่วงบ่ายถึงค่ำ)",
      rainProbOffset: 10,
      intensityDesc: "ฝนฟ้าคะนองกระจายตัวหนาแน่น ฝนตกหนักเป็นช่วงๆ เมฆฝนสะสมหนา",
      accumulationEstimate: "35 – 50 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนจากเขตบางนา กทม. ลงมาสู่แนวสุขุมวิทตอนปลาย-สำโรงเหนือ",
      impactRisk: "ช่วงกลางซอยวัดด่าน และหน้าตลาดด่านสำโรง เสี่ยงน้ำท่วมขังผิวทาง 15-35 ซม.",
      drainageRate: "หน่วงระบายลงคลองสำโรงและท่อลอดแบริ่ง ประมาณ 60 – 90 นาที"
    }
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
    phones: "[เทศบาลนครสมุทรปราการ] โทร. 02-382-6199 • [ปภ.สมุทรปราการ] โทร. 02-382-6040",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (แนวชายฝั่งแม่น้ำเจ้าพระยาและอ่าวไทย)",
      peakTime: "16:00 – 20:00 น. (ช่วงเย็นถึงหัวค่ำ)",
      rainProbOffset: 5,
      intensityDesc: "ฝนฟ้าคะนองร้อยละ 60-70 ของพื้นที่ ลมกระโชกแรงชายฝั่ง 20-30 กม./ชม.",
      accumulationEstimate: "25 – 40 มม.",
      radarMovement: "กลุ่มฝนก่อตัวตามแนวอ่าวไทยและเคลื่อนตัวเข้าสู่ปากแม่น้ำเจ้าพระยา",
      impactRisk: "ถนนวิบูลย์ศรีและท้ายบ้าน เสี่ยงน้ำท่วมจากฝนสะสมผสมน้ำทะเลหนุน 15-35 ซม.",
      drainageRate: "สถานีสูบน้ำเทศบาลนครสมุทรปราการเร่งสูบออกเจ้าพระยา ใช้เวลา 30 – 45 นาที"
    }
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
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [เทศบาลตำบลสำโรงเหนือ] โทร. 02-398-3333",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (สุขุมวิทตอนปลาย - แยกแบริ่ง - BTS สำโรง)",
      peakTime: "15:00 – 18:30 น.",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองตกหนัก ลมกระโชกแรง ทัศนวิสัยลดลง",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มเมฆฝนพัดจากแนวพระโขนง-บางนา ลงสู่แนวคลองสำโรง",
      impactRisk: "ทางลอดใต้ BTS สำโรง และเลนคู่ขนานสุขุมวิท น้ำท่วมขัง 15-30 ซม.",
      drainageRate: "ระบายลงสู่คลองสำโรง ใช้เวลาประมาณ 40 – 60 นาที"
    }
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
    phones: "[เทศบาลตำบลแพรกษา] โทร. 02-388-0056 • [สภ.เมืองสมุทรปราการ] โทร. 02-389-5555",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (โซนชุมชนแพรกษา - ถ.พุทธรักษา)",
      peakTime: "15:30 – 19:00 น.",
      rainProbOffset: 5,
      intensityDesc: "ฝนฟ้าคะนองปานกลาง มีฝนตกหนักชั่วขณะ ฟ้าคะนองกระจายตัว",
      accumulationEstimate: "20 – 35 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนจากศรีนครินทร์ตัดเข้าสู่ถนนแพรกษาและคลองแพรกษา",
      impactRisk: "เลนซ้ายหน้าซอยมังกร-ขันดี น้ำท่วมขังรอระบาย 10-25 ซม.",
      drainageRate: "ระบายลงสู่คลองแพรกษา ใช้เวลาประมาณ 30 – 45 นาที"
    }
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
    phones: "[ศูนย์ประสานงานนิคมฯ บางปู] โทร. 02-709-3421 • [กู้ภัยบางปู] โทร. 1669",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ (สุขุมวิทสายเก่า กม.34-37 - เขตส่งออกบางปู)",
      peakTime: "15:30 – 19:30 น. (ช่วงบ่ายแก่ถึงค่ำ)",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองหนัก ลมกระโชกแรงชายฝั่งอ่าวไทย 25-35 กม./ชม.",
      accumulationEstimate: "35 – 55 มม.",
      radarMovement: "กลุ่มฝนหนาแน่นจากอ่าวไทยพัดขึ้นฝั่งบางปูเข้าสู่นิคมอุตสาหกรรม",
      impactRisk: "ซอยพัฒนา 1 และเขตประกอบการเสรี น้ำท่วมขังผิวถนน 20-40 ซม.",
      drainageRate: "สถานีสูบน้ำตำหรุและคลองชายทะเลเร่งสูบระบาย หน่วงตัว 60-90 นาทีหากน้ำทะเลหนุน"
    }
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
    phones: "[อบต.ราชาเทวะ] โทร. 02-337-3114 • [กู้ภัยบางพลี] โทร. 02-337-3333",
    rainForecast: {
      zone: "อ.บางพลี (แยกกิ่งแก้ว - ซอยกิ่งแก้ว 25/1 ลาดกระบัง)",
      peakTime: "15:00 – 19:00 น.",
      rainProbOffset: 10,
      intensityDesc: "ฝนฟ้าคะนองตกหนักมาก มีลมกระโชกแรง ฟ้าคะนองต่อเนื่อง",
      accumulationEstimate: "40 – 60 มม.",
      radarMovement: "กลุ่มฝนขนาดใหญ่ก่อตัวบริเวณสนามบินสุวรรณภูมิและลาดกระบัง เคลื่อนลงแนวถนนกิ่งแก้ว",
      impactRisk: "ถนนกิ่งแก้วช่วง กม.10-14 เสี่ยงน้ำท่วมขัง 25-45 ซม. รถเล็กสัญจรลำบากมาก",
      drainageRate: "ระบายลงคลองลาดกระบังและคลองบางโฉลง ใช้เวลาหน่วง 60 – 100 นาที"
    }
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
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [อบต.บางพลีใหญ่] โทร. 02-337-3135",
    rainForecast: {
      zone: "อ.บางพลี (กม.12 - 25 ชุมชนเคหะบางพลี - แยกคลองขุด)",
      peakTime: "15:30 – 19:00 น.",
      rainProbOffset: 6,
      intensityDesc: "ฝนฟ้าคะนองปานกลางถึงหนัก ฝนซู่กระจายตัวกว้าง ลมพัดแรง",
      accumulationEstimate: "25 – 45 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนจากสำโรงและบางแก้วมุ่งสู่เคหะบางพลี",
      impactRisk: "หน้า รพ.บางนา 5 และเคหะบางพลี น้ำท่วมเลนคู่ขนาน 15-35 ซม.",
      drainageRate: "ระบายลงสู่คลองสำโรง ใช้เวลาประมาณ 40 – 60 นาที"
    }
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
    phones: "[แขวงทางหลวงสมุทรปราการ] โทร. 1586 • [สภ.บางพลี] โทร. 02-337-3377",
    rainForecast: {
      zone: "อ.บางพลี (กม.16 - 26 เมกาบางนา - ม.หัวเฉียว - บางพลี)",
      peakTime: "15:30 – 19:00 น.",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองตกหนัก ลมพัดแรง ทัศนวิสัยลดลงต่ำกว่า 500 เมตร",
      accumulationEstimate: "30 – 50 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนตัวตามแนวทางหลวงบางนา-ตราด จาก กทม. ออกสู่บางพลี",
      impactRisk: "ช่องทางคู่ขนานหน้า ม.หัวเฉียว และ กม.26 น้ำท่วมขัง 15-30 ซม.",
      drainageRate: "ระบายลงคลองจรเข้ใหญ่และคลองบางโฉลง ใช้เวลาประมาณ 45 – 60 นาที"
    }
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
    phones: "[ปภ.สาขาบางบ่อ] โทร. 02-708-4100 • [เทศบาลตำบลคลองด่าน] โทร. 02-330-1234",
    rainForecast: {
      zone: "อ.บางบ่อ (ถนนสุขุมวิทสายเก่า - ประตูระบายน้ำคลองด่าน)",
      peakTime: "16:00 – 20:00 น.",
      rainProbOffset: 6,
      intensityDesc: "ฝนฟ้าคะนองลมกระโชกแรง ลมมรสุมพัดเข้าหาฝั่งทะเล 20-30 กม./ชม.",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มฝนจากอ่าวไทยตอนบนเคลื่อนขึ้นฝั่งเข้าสู่อำเภอบางบ่อ",
      impactRisk: "สุขุมวิทสายเก่า กม.55-58 หน้าตลาดคลองด่าน น้ำท่วมขัง 20-45 ซม.",
      drainageRate: "ขึ้นกับช่วงเวลาน้ำขึ้น-น้ำลง ประตูน้ำคลองด่านเร่งสูบออกทะเล ใช้เวลา 60 – 90 นาที"
    }
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
    phones: "[เทศบาลเมืองพระประแดง] โทร. 02-463-4841 • [คลองลัดโพธิ์] โทร. 02-463-4841",
    rainForecast: {
      zone: "อ.พระประแดง (คุ้งบางกระเจ้า - ถนนปู่เจ้าสมิงพราย - สะพานภูมิพล)",
      peakTime: "15:30 – 19:00 น.",
      rainProbOffset: 6,
      intensityDesc: "ฝนฟ้าคะนองกระจายตัว มีฝนตกหนักบางแห่ง ลมพัดแรงตามโค้งน้ำ",
      accumulationEstimate: "25 – 40 มม.",
      radarMovement: "กลุ่มฝนพัดจากฝั่งธนบุรี (ราษฎร์บูรณะ-ทุ่งครุ) ข้ามแม่น้ำเจ้าพระยาเข้าสู่พระประแดง",
      impactRisk: "จุดกลับรถใต้สะพานภูมิพลและถนนปู่เจ้าช่วงท่าน้ำ น้ำท่วมขัง 20-40 ซม.",
      drainageRate: "ประตูระบายน้ำคลองลัดโพธิ์ช่วยผลักดันน้ำลงสู่แม่น้ำ ใช้เวลา 30 – 50 นาที"
    }
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
    phones: "[สถานีป้อมพระจุลฯ] โทร. 02-425-8888 • [เทศบาลตำบลแหลมฟ้าผ่า] โทร. 02-425-8864",
    rainForecast: {
      zone: "อ.พระสมุทรเจดีย์ (ถนนสุขสวัสดิ์ - ปากอ่าวไทย)",
      peakTime: "16:00 – 20:00 น.",
      rainProbOffset: 5,
      intensityDesc: "ฝนฟ้าคะนองลมกระโชกแรง ไอทะเล คลื่นลมแรงบริเวณปากอ่าว 20-30 กม./ชม.",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มเมฆฝนก่อตัวกลางอ่าวไทยเคลื่อนตัวสู่ปากแม่น้ำเจ้าพระยา",
      impactRisk: "ถนนสุขสวัสดิ์-ป้อมพระจุลฯ กม.22 เสี่ยงท่วม 25-50 ซม. (โดยเฉพาะช่วงน้ำทะเลหนุน)",
      drainageRate: "ระบายลงสู่ทะเลอ่าวไทย ใช้เวลา 45 – 75 นาที"
    }
  },
  {
    name: "บางโฉลง (บางฉโลง)",
    canonical: "ถนนบางนา-ตราด กม.18 (บางโฉลง / ม.หัวเฉียว - ซอยพูลเจริญ)",
    district: "บางพลี",
    correctNames: [
      "บางโฉลง", "ตำบลบางโฉลง", "ต.บางโฉลง", "หัวเฉียว", "ม.หัวเฉียว", 
      "มหาวิทยาลัยหัวเฉียว", "หัวเฉียวเฉลิมพระเกียรติ", "พูลเจริญ", 
      "ซอยพูลเจริญ", "วัดบางโฉลงใน", "วัดบางโฉลงนอก", "คลองบางโฉลง"
    ],
    typos: [
      "บางฉโลง", "ต.บางฉโลง", "ตำบลบางฉโลง", "บางฉลง", "บางโฉลงใน", 
      "บางฉโลงใน", "บางฉโลงนอก", "หัวเฉีย", "หัวเฉลียว", "พูนเจริญ", 
      "พูนจะเริน", "พูนเจริน", "คลองบางฉโลง"
    ],
    aliases: [
      "กม.18", "กม18", "บางนาตราด กม.18", "บางนาตราดกม18", 
      "บางนา-ตราด กม.18", "กิโลเมตรที่ 18", "ม.หัวเฉียวบางพลี", "ซอยวัดบางโฉลง"
    ],
    depthRange: "15 - 30 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 22,
    cause: "น้ำฝนสะสมท่วมขังทางคู่ขนานบางนา-ตราด กม.18 และซอยพูลเจริญ การระบายน้ำลงสู่คลองบางโฉลงหน่วงตัวช่วงฝนตกหนักสะสม",
    criticalSpots: "ช่องทางคู่ขนานหน้า มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ (กม.18) และช่วงต้น-กลางซอยพูลเจริญ",
    trafficGuidance: "รถเก๋งและรถเล็กควรหลีกเลี่ยงช่องทางคู่ขนาน ให้ใช้ช่องทางด่วนหลัก (Expressway) หรือขึ้นทางด่วนบูรพาวิถีด้านบน",
    agencies: "[อบต.บางโฉลง] และ [แขวงทางหลวงสมุทรปราการ]",
    phones: "[อบต.บางโฉลง] โทร. 02-337-3114 • [แขวงทางหลวงสมุทรปราการ] โทร. 1586",
    rainForecast: {
      zone: "อ.บางพลี (ต.บางโฉลง - บางนา-ตราด กม.18 - ซอยพูลเจริญ)",
      peakTime: "15:30 – 19:00 น. (ช่วงบ่ายแก่ถึงหัวค่ำ)",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองปานกลางถึงหนัก (ฝนซู่) มีลมกระโชกแรง 15-25 กม./ชม.",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มเมฆฝนพัดผ่านทางทิศตะวันออกเฉียงเหนือ จากแนวลาดกระบัง-คลองบางโฉลง มุ่งสู่ถนนบางนา-ตราด",
      impactRisk: "ช่องทางคู่ขนานหน้า ม.หัวเฉียว และซอยพูลเจริญ เกิดน้ำท่วมขังผิวถนน 15-30 ซม. หลังฝนตกต่อเนื่อง 20 นาที",
      drainageRate: "ระบายลงคลองบางโฉลง ใช้เวลาหน่วงประมาณ 45 - 60 นาทีหลังฝนหยุดตก"
    }
  },
  {
    name: "หนามแดง - บางพลี",
    canonical: "ถนนหนามแดง-บางพลี (ช่วงวัดหนามแดง - แยกศรีนครินทร์)",
    district: "บางพลี",
    correctNames: [
      "หนามแดง", "ถนนหนามแดง", "วัดหนามแดง", "หนามแดง-บางพลี", 
      "หนามแดงบางพลี", "สี่แยกหนามแดง", "ซอยหนามแดง", "แยกหนามแดง"
    ],
    typos: ["หนามเดง", "นามแดง", "หนามแดงบางพี", "วัดนามแดง"],
    aliases: ["บางแก้วหนามแดง", "ทางลัดกิ่งแก้วหนามแดง"],
    depthRange: "15 - 35 ซม.",
    floodRiskMultiplier: 0.82,
    floodRiskBase: 24,
    cause: "พื้นที่ชุมชนและโรงงานหนาแน่น คลองหนามแดงระบายน้ำลงสู่คลองสำโรงหน่วงตัวเมื่อฝนตกสะสม",
    criticalSpots: "ช่วงหน้าวัดหนามแดง ถึง สี่แยกหนามแดงตัดถนนศรีนครินทร์",
    trafficGuidance: "มีน้ำท่วมผิวจราจร 1-2 เลนซ้าย รถเก๋งวิ่งชิดเลนขวากึ่งกลางถนน เลี่ยงลุยน้ำชิดทางเท้า",
    agencies: "[อบต.บางแก้ว] และ [แขวงทางหลวงชนบทสมุทรปราการ]",
    phones: "[อบต.บางแก้ว] โทร. 02-740-0222 • [ทางหลวงชนบท] โทร. 1146",
    rainForecast: {
      zone: "อ.บางพลี (ถนนหนามแดง-บางพลี - ชุมชนบางแก้ว)",
      peakTime: "15:00 – 18:30 น.",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองกระจายตัว มีฝนตกหนักสะสม ลมกระโชกแรง",
      accumulationEstimate: "25 – 45 มม.",
      radarMovement: "กลุ่มฝนจากแนวถนนศรีนครินทร์เคลื่อนเข้าสู่หนามแดงและคลองสำโรง",
      impactRisk: "หน้าวัดหนามแดง ถึงสี่แยกศรีนครินทร์ น้ำท่วมขัง 1-2 เลนซ้าย 15-35 ซม.",
      drainageRate: "ระบายลงคลองหนามแดงและคลองสำโรง ใช้เวลาประมาณ 45 – 60 นาที"
    }
  },
  {
    name: "ลาซาล (สุขุมวิท 105)",
    canonical: "ซอยลาซาล (สุขุมวิท 105) และ ซอยแบริ่ง (สุขุมวิท 107)",
    district: "เมืองสมุทรปราการ",
    correctNames: [
      "ลาซาล", "ซอยลาซาล", "สุขุมวิท 105", "สุขุมวิท105", "โรงเรียนลาซาล", 
      "แบริ่ง", "ซอยแบริ่ง", "สุขุมวิท 107", "สุขุมวิท107", "bts แบริ่ง", "บีทีเอสแบริ่ง"
    ],
    typos: ["ลาสาน", "ลาสาร", "แบริง", "แบลิ่ง", "ซอยแบลิ่ง"],
    aliases: ["ศิครินทร์", "รพ.ศิครินทร์", "ตลาดลาซาล", "ดาดฟ้าลาซาล"],
    depthRange: "15 - 30 ซม.",
    floodRiskMultiplier: 0.82,
    floodRiskBase: 22,
    cause: "พื้นที่ลุ่มต่ำรอยต่อ กทม.-สมุทรปราการ ปริมาณน้ำฝนสะสมระบายลงคลองบางนาและคลองสำโรงช้า",
    criticalSpots: "ช่วงแยกตัดศรีนครินทร์ หน้าโรงพยาบาลศิครินทร์ และช่วงกลางซอยลาซาล",
    trafficGuidance: "รถเก๋งชิดเลนกลาง ปิดแอร์ทันทีหากระดับน้ำท่วมถึงขอบประตู เลี่ยงเข้าซอยย่อย",
    agencies: "[เทศบาลตำบลสำโรงเหนือ] และ [สน.บางนา]",
    phones: "[เทศบาลตำบลสำโรงเหนือ] โทร. 02-398-3333 • [สายด่วน กทม.] โทร. 1555",
    rainForecast: {
      zone: "อ.เมืองสมุทรปราการ / บางนา (ซอยลาซาล 105 - ซอยแบริ่ง 107)",
      peakTime: "14:30 – 18:00 น.",
      rainProbOffset: 8,
      intensityDesc: "ฝนฟ้าคะนองกระจายตัว มีฝนตกหนักชั่วคราว ลมกระโชกแรง",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนจากแนวสุขุมวิท-อุดมสุข ลงมาสู่ลาซาลและแบริ่ง",
      impactRisk: "แยกตัดศรีนครินทร์ หน้า รพ.ศิครินทร์ และกลางซอยลาซาล น้ำท่วมขัง 15-30 ซม.",
      drainageRate: "ระบายลงคลองบางนาและคลองสำโรง ใช้เวลา 45 – 70 นาที"
    }
  },
  {
    name: "บ้านสาขลา",
    canonical: "ชุมชนบ้านสาขลา และ ถ.เลียบคลองสรรพสามิต (อ.พระสมุทรเจดีย์)",
    district: "พระสมุทรเจดีย์",
    correctNames: [
      "สาขลา", "บ้านสาขลา", "วัดสาขลา", "นาเกลือ", "แหลมฟ้าผ่า", 
      "คลองสรรพสามิต", "สะพานสรรพสามิต"
    ],
    typos: ["สากลา", "บ้านสากลา", "วัดสากลา", "แหลมผ่าผ่า", "สานขลา"],
    aliases: ["สะพานข้ามคลองสรรพสามิต", "ป้อมพระจุลฯ"],
    depthRange: "35 - 55 ซม.",
    floodRiskMultiplier: 0.85,
    floodRiskBase: 30,
    cause: "น้ำทะเลหนุนสูงสุด (Spring Tide) ในอ่าวไทย เอ่อล้นคันกั้นน้ำและสะพานเลียบคลองสรรพสามิต",
    criticalSpots: "สะพานทางเดินไม้ชุมชนบ้านสาขลา และถนนสายเลียบคลองสรรพสามิต",
    trafficGuidance: "รถเก๋งห้ามผ่านช่วงน้ำทะเลหนุนสูงสุดเด็ดขาด ใช้รถกระบะยกสูงหรือเรือสัญจร",
    agencies: "[อบต.นาเกลือ] และ [เทศบาลตำบลแหลมฟ้าผ่า]",
    phones: "[อบต.นาเกลือ] โทร. 02-819-5099 • [เทศบาลตำบลแหลมฟ้าผ่า] โทร. 02-425-8864",
    rainForecast: {
      zone: "อ.พระสมุทรเจดีย์ (ตำบลนาเกลือ - ชุมชนบ้านสาขลา)",
      peakTime: "16:00 – 20:00 น.",
      rainProbOffset: 6,
      intensityDesc: "ฝนฟ้าคะนองชายทะเล ลมกระโชกแรง 20-30 กม./ชม.",
      accumulationEstimate: "30 – 50 มม.",
      radarMovement: "กลุ่มฝนก่อตัวตามแนวชายฝั่งอ่าวไทย พัดเข้าสู่คลองสรรพสามิต",
      impactRisk: "สะพานทางเดินไม้ชุมชนบ้านสาขลาและถนนเลียบคลอง เสี่ยงท่วม 35-55 ซม. เมื่อรวมน้ำหนุน",
      drainageRate: "ขึ้นกับระดับน้ำขึ้น-น้ำลงในอ่าวไทย ระบายแห้งใน 60 – 90 นาที"
    }
  },
  {
    name: "เคหะเมืองใหม่บางเสาธง",
    canonical: "การเคหะเมืองใหม่บางเสาธง และ มหาวิทยาลัยอัสสัมชัญ (เอแบค บางนา)",
    district: "บางเสาธง",
    correctNames: ["บางเสาธง", "เคหะบางเสาธง", "เมืองใหม่บางเสาธง", "เอแบค", "เอแบคบางนา", "ม.เอแบค", "คลองด่าน-บางพลี"],
    typos: ["บางเสาธง", "เคหะเมืองใหม", "เอแบคบางพลี", "อบต.บางเสาธง"],
    aliases: ["เคหะเมืองใหม่", "ซอยเอแบค"],
    depthRange: "15 - 35 ซม.",
    floodRiskMultiplier: 0.8,
    floodRiskBase: 22,
    cause: "พื้นที่ชุมชนขนาดใหญ่และสถานศึกษา ปริมาณน้ำฝนสะสมระบายลงคลองเจริญราษฎร์และคลองสำโรง",
    criticalSpots: "ซอยเอแบค (ถ.บางนา-ตราด กม.26) และวงเวียนเคหะเมืองใหม่บางเสาธง",
    trafficGuidance: "รถเก๋งชิดเลนกลาง เลี่ยงน้ำท่วมขังริมทางเท้าหน้าตลาดสดเคหะ",
    agencies: "[อบต.บางเสาธง] และ [สภ.บางเสาธง]",
    phones: "[อบต.บางเสาธง] โทร. 02-338-1111 • [สภ.บางเสาธง] โทร. 02-338-1199",
    rainForecast: {
      zone: "อ.บางเสาธง (การเคหะเมืองใหม่บางเสาธง - ม.เอแบค กม.26)",
      peakTime: "15:30 – 19:00 น.",
      rainProbOffset: 6,
      intensityDesc: "ฝนฟ้าคะนองปานกลางถึงหนัก ฝนตกชุกต่อเนื่อง",
      accumulationEstimate: "25 – 45 มม.",
      radarMovement: "กลุ่มฝนจากแนวคลองด่านและบางพลี พัดเข้าสู่พื้นที่บางเสาธง",
      impactRisk: "ซอยเอแบคและวงเวียนเคหะบางเสาธง น้ำท่วมขัง 15-35 ซม.",
      drainageRate: "ระบายลงคลองเจริญราษฎร์และคลองสำโรง ใช้เวลา 45 – 60 นาที"
    }
  },
  {
    name: "วัดบางพลีใหญ่ใน (หลวงพ่อโต)",
    canonical: "วัดบางพลีใหญ่ใน (หลวงพ่อโต) และ ตลาดโบราณบางพลี (ริมคลองสำโรง)",
    district: "บางพลี",
    correctNames: ["วัดบางพลีใหญ่ใน", "หลวงพ่อโต", "วัดหลวงพ่อโต", "ตลาดโบราณบางพลี", "บางพลีใหญ่ใน", "คลองสำโรงบางพลี"],
    typos: ["หลวงพอโต", "วัดบางพีใหญ่ใน", "ตลาดโบรานบางพลี"],
    aliases: ["วัดใหญ่บางพลี", "ตลาดน้ำบางพลี"],
    depthRange: "20 - 40 ซม.",
    floodRiskMultiplier: 0.82,
    floodRiskBase: 24,
    cause: "พื้นที่ริมคลองสำโรง ได้รับอิทธิพลจากระดับน้ำในคลองเอ่อล้นตลิ่งเมื่อมีฝนตกหนักร่วมกับน้ำทะเลหนุน",
    criticalSpots: "ท่าน้ำวัดบางพลีใหญ่ในและทางเดินเลียบตลาดโบราณบางพลี",
    trafficGuidance: "ระวังน้ำท่วมลานจอดรถริมน้ำ ควรย้ายรถขึ้นที่จอดสูงของวัด",
    agencies: "[อบต.บางพลีใหญ่] และ [เทศบาลตำบลบางพลี]",
    phones: "[อบต.บางพลีใหญ่] โทร. 02-337-3135 • [เทศบาลตำบลบางพลี] โทร. 02-337-3141",
    rainForecast: {
      zone: "อ.บางพลี (วัดบางพลีใหญ่ใน - ริมคลองสำโรง)",
      peakTime: "15:00 – 18:30 น.",
      rainProbOffset: 7,
      intensityDesc: "ฝนฟ้าคะนองกระจายตัว มีฝนตกหนักเป็นระลอก",
      accumulationEstimate: "30 – 45 มม.",
      radarMovement: "กลุ่มฝนเคลื่อนตามแนวคลองสำโรงจากฝั่งตะวันออกมุ่งสู่บางพลี",
      impactRisk: "ลานจอดรถริมคลองและตลาดโบราณบางพลี เสี่ยงน้ำล้นตลิ่ง 20-40 ซม.",
      drainageRate: "ขึ้นกับระดับน้ำในคลองสำโรงและสถานีสูบน้ำประตูน้ำบางพลี ประมาณ 45 – 70 นาที"
    }
  }
];

// ข้อมูลคาดการณ์ฝนตกแยกราย 6 อำเภอในจังหวัดสมุทรปราการ (District Rain Profiles)
export const DISTRICT_RAIN_PROFILES = [
  {
    name: "อำเภอเมืองสมุทรปราการ",
    districtKey: "เมืองสมุทรปราการ",
    keywords: ["เมืองสมุทรปราการ", "อ.เมือง", "อำเภอเมือง", "ปากน้ำ", "สำโรง", "แพรกษา", "บางปู", "ท้ายบ้าน"],
    peakTime: "15:00 – 18:30 น. (ช่วงบ่ายแก่ถึงค่ำ)",
    rainProbOffset: 5,
    accumulationEstimate: "25 – 45 มม.",
    intensityDesc: "ฝนฟ้าคะนองร้อยละ 60-70 ของพื้นที่ มีฝนตกหนักบางแห่งตามแนวสุขุมวิทและแพรกษา",
    radarMovement: "กลุ่มเมฆฝนพัดจากแนว กทม. (บางนา) และอ่าวไทย เคลื่อนผ่านแม่น้ำเจ้าพระยาเข้าสู่ตัวเมือง",
    criticalLocations: "ซอยทรัพย์บุญชัย, ซอยวัดด่านสำโรง, ตลาดปากน้ำ, นิคมบางปู, ซอยมังกร-แพรกษา"
  },
  {
    name: "อำเภอบางพลี",
    districtKey: "บางพลี",
    keywords: ["บางพลี", "อ.บางพลี", "อำเภอบางพลี", "กิ่งแก้ว", "บางนา-ตราด", "บางโฉลง", "บางฉโลง", "เทพารักษ์", "หนามแดง"],
    peakTime: "15:30 – 19:00 น. (ช่วงบ่ายแก่ถึงหัวค่ำ)",
    rainProbOffset: 8,
    accumulationEstimate: "30 – 50 มม.",
    intensityDesc: "ฝนฟ้าคะนองร้อยละ 65-75 ของพื้นที่ ตกหนักถึงหนักมาก ลมกระโชกแรงช่วงเปลี่ยนผ่านอากาศ",
    radarMovement: "กลุ่มฝนขนาดใหญ่ก่อตัวแถบสุวรรณภูมิ-ลาดกระบัง เคลื่อนลงทางทิศใต้สู่ ถ.กิ่งแก้ว และบางนา-ตราด",
    criticalLocations: "ต.บางโฉลง (บางฉโลง กม.18), ถนนกิ่งแก้ว, ถ.บางนา-ตราด หน้า ม.หัวเฉียว, หนามแดง-บางพลี"
  },
  {
    name: "อำเภอพระประแดง",
    districtKey: "พระประแดง",
    keywords: ["พระประแดง", "อ.พระประแดง", "อำเภอพระประแดง", "ปู่เจ้า", "สุขสวัสดิ์", "บางกระเจ้า", "ลัดโพธิ์"],
    peakTime: "15:30 – 19:00 น. (ช่วงบ่ายถึงค่ำ)",
    rainProbOffset: 5,
    accumulationEstimate: "25 – 40 มม.",
    intensityDesc: "ฝนฟ้าคะนองร้อยละ 55-65 ของพื้นที่ ลมพัดแรงตามโค้งแม่น้ำเจ้าพระยา",
    radarMovement: "กลุ่มฝนจากฝั่งธนบุรี (ทุ่งครุ-ราษฎร์บูรณะ) พัดข้ามแม่น้ำเข้าสู่คุ้งบางกระเจ้าและถนนปู่เจ้า",
    criticalLocations: "ท่าน้ำพระประแดง, จุดกลับรถใต้สะพานภูมิพล, ถนนปู่เจ้าสมิงพราย"
  },
  {
    name: "อำเภอพระสมุทรเจดีย์",
    districtKey: "พระสมุทรเจดีย์",
    keywords: ["พระสมุทรเจดีย์", "อ.พระสมุทรเจดีย์", "อำเภอพระสมุทรเจดีย์", "ป้อมพระจุล", "แหลมฟ้าผ่า", "สาขลา", "นาเกลือ"],
    peakTime: "16:00 – 20:00 น. (ช่วงเย็นถึงหัวค่ำ)",
    rainProbOffset: 5,
    accumulationEstimate: "30 – 45 มม.",
    intensityDesc: "ฝนฟ้าคะนองชายฝั่งอ่าวไทย ลมกระโชกแรง 20-30 กม./ชม. มีไอฝนหนาแน่น",
    radarMovement: "กลุ่มฝนเคลื่อนจากอ่าวไทยขึ้นฝั่งเข้าสู่ตำบลแหลมฟ้าผ่าและนาเกลือ",
    criticalLocations: "สถานีป้อมพระจุลจอมเกล้า (ถ.สุขสวัสดิ์ กม.22), ชุมชนบ้านสาขลา, สามแยกพระสมุทรเจดีย์"
  },
  {
    name: "อำเภอบางบ่อ",
    districtKey: "บางบ่อ",
    keywords: ["บางบ่อ", "อ.บางบ่อ", "อำเภอบางบ่อ", "คลองด่าน", "บางพลีน้อย", "คลองสวน"],
    peakTime: "16:00 – 19:30 น. (ช่วงเย็นถึงค่ำ)",
    rainProbOffset: 6,
    accumulationEstimate: "30 – 45 มม.",
    intensityDesc: "ฝนฟ้าคะนองร้อยละ 60-70 ของพื้นที่ ตกปานกลางถึงหนัก ฝนซู่ลมแรงริมทะเล",
    radarMovement: "กลุ่มฝนพัดผ่านจากอ่าวไทยและจังหวัดฉะเชิงเทรา เคลื่อนเข้าสู่แนวคลองด่านและบางบ่อ",
    criticalLocations: "ตลาดคลองด่าน (สุขุมวิทสายเก่า), ตลาดบางบ่อ, ประตูระบายน้ำคลองด่าน"
  },
  {
    name: "อำเภอบางเสาธง",
    districtKey: "บางเสาธง",
    keywords: ["บางเสาธง", "อ.บางเสาธง", "อำเภอบางเสาธง", "เคหะบางเสาธง", "เมืองใหม่บางเสาธง", "เอแบค"],
    peakTime: "15:30 – 19:00 น. (ช่วงบ่ายแก่ถึงค่ำ)",
    rainProbOffset: 6,
    accumulationEstimate: "25 – 45 มม.",
    intensityDesc: "ฝนฟ้าคะนองร้อยละ 60 ของพื้นที่ ฝนตกชุกช่วงเย็น",
    radarMovement: "กลุ่มฝนจากบางพลีและคลองด่าน เคลื่อนตัวเข้าสู่พื้นที่เคหะเมืองใหม่บางเสาธง",
    criticalLocations: "ซอยเอแบค (กม.26), วงเวียนการเคหะเมืองใหม่บางเสาธง, ถนนเทพารักษ์ กม.23-25"
  }
];

// ฟังก์ชันค้นหาข้อมูลอำเภอสำหรับคาดการณ์ฝน
export function findDistrictMatch(queryText) {
  if (!queryText) return null;
  const cleanQ = queryText.toLowerCase().replace(/\s+/g, '');
  for (const dist of DISTRICT_RAIN_PROFILES) {
    for (const kw of dist.keywords) {
      const cleanKw = kw.toLowerCase().replace(/\s+/g, '');
      if (cleanQ.includes(cleanKw)) {
        return dist;
      }
    }
  }
  return null;
}

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

  useEffect(() => {
    window.__prakanguard_is_chat_open = isOpen && !isMinimized;
    return () => {
      window.__prakanguard_is_chat_open = false;
    };
  }, [isOpen, isMinimized]);

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `สวัสดีครับ **PrakanBOT** พร้อมให้ข้อมูลสถานการณ์น้ำท่วมและการเดินทางในจังหวัดสมุทรปราการ

พิมพ์ถามได้เลย เช่น
• ซอยทรัพย์บุญชัยท่วมไหม
• รถเก๋งลุยน้ำได้กี่เซนติเมตร
• วันนี้ฝนจะตกช่วงกี่โมง
• เบอร์โทรขอความช่วยเหลือ`,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const chipsRef = useRef(null);
  const chipsAnimRef = useRef(null);
  const modalRef = useRef(null);

  // Draggable & Resizable Modal State
  const [position, setPosition] = useState(null);
  const [customSize, setCustomSize] = useState({ width: null, height: null });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [isResizingModal, setIsResizingModal] = useState(false);
  const modalDragRef = useRef({
    startX: 0,
    startY: 0,
    modalX: 0,
    modalY: 0
  });

  // Launcher Draggable State (PC & Tablet)
  const [launcherPosition, setLauncherPosition] = useState(null);
  const [isDraggingLauncher, setIsDraggingLauncher] = useState(false);
  const launcherDragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false
  });
  const launcherRef = useRef(null);

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
    if (isOpen && !isMinimized) {
      // Scroll only the message container (avoids jumping the whole page on mobile)
      const container = messagesEndRef.current?.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [messages, isThinking, isOpen, isMinimized]);

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

  const handleResetSize = (e) => {
    e?.stopPropagation();
    setCustomSize({ width: null, height: null });
  };

  // Mouse Drag Resize Handler for PC (drag from top-left corner)
  const handleMouseDownResizeCorner = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const modalEl = modalRef.current;
    if (!modalEl) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = modalEl.offsetWidth;
    const startH = modalEl.offsetHeight;
    setIsResizingModal(true);

    const onMouseMove = (moveEvent) => {
      const dx = startX - moveEvent.clientX; // dragging left expands width
      const dy = startY - moveEvent.clientY; // dragging up expands height
      const newW = Math.max(320, Math.min(window.innerWidth - 32, startW + dx));
      const newH = Math.max(340, Math.min(window.innerHeight - 60, startH + dy));
      setCustomSize({ width: newW, height: newH });
    };

    const onMouseUp = () => {
      setIsResizingModal(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Touch Drag Resize Handler from Corner (drag corner with finger on Mobile / Tablet)
  const handleTouchStartResizeCorner = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const startW = modalEl.offsetWidth;
    const startH = modalEl.offsetHeight;
    setIsResizingModal(true);

    const onTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const curTouch = moveEvent.touches[0];
      const dx = startX - curTouch.clientX; // dragging left expands width
      const dy = startY - curTouch.clientY; // dragging up expands height
      const newW = Math.max(280, Math.min(window.innerWidth - 16, startW + dx));
      const newH = Math.max(260, Math.min(window.innerHeight - 50, startH + dy));
      setCustomSize({ width: newW, height: newH });
      if (moveEvent.cancelable) moveEvent.preventDefault();
    };

    const onTouchEnd = () => {
      setIsResizingModal(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  // Launcher Drag Handlers (Drag floating launcher button before opening chat on PC & Tablet)
  const handleMouseDownLauncher = (e) => {
    if (e.button !== 0) return;
    const el = launcherRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    launcherDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false
    };
    setIsDraggingLauncher(true);
  };

  const handleTouchStartLauncher = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const el = launcherRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    launcherDragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false
    };
    setIsDraggingLauncher(true);
  };

  useEffect(() => {
    if (!isDraggingLauncher) return;

    const onMouseMove = (e) => {
      const dx = e.clientX - launcherDragRef.current.startX;
      const dy = e.clientY - launcherDragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        launcherDragRef.current.hasMoved = true;
      }
      const el = launcherRef.current;
      const w = el ? el.offsetWidth : 160;
      const h = el ? el.offsetHeight : 50;
      const newX = Math.max(8, Math.min(window.innerWidth - w - 8, launcherDragRef.current.initialX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - h - 8, launcherDragRef.current.initialY + dy));
      setLauncherPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsDraggingLauncher(false);
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - launcherDragRef.current.startX;
      const dy = touch.clientY - launcherDragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        launcherDragRef.current.hasMoved = true;
      }
      const el = launcherRef.current;
      const w = el ? el.offsetWidth : 160;
      const h = el ? el.offsetHeight : 50;
      const newX = Math.max(8, Math.min(window.innerWidth - w - 8, launcherDragRef.current.initialX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - h - 8, launcherDragRef.current.initialY + dy));
      setLauncherPosition({ x: newX, y: newY });
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      setIsDraggingLauncher(false);
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
  }, [isDraggingLauncher]);

  // Touch Drag Resize Handler for Mobile / Tablets (drag top bar with finger)
  const handleTouchStartResizeTop = (e) => {
    if (e.touches.length !== 1) return;
    const startY = e.touches[0].clientY;
    const modalEl = modalRef.current;
    const startH = modalEl ? modalEl.offsetHeight : 480;
    let hasMoved = false;
    setIsResizingModal(true);

    const onTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const currentY = moveEvent.touches[0].clientY;
      const dy = startY - currentY; // dragging finger up increases height
      if (Math.abs(dy) > 4) hasMoved = true;
      moveEvent.preventDefault();
      const newH = Math.max(260, Math.min(window.innerHeight - 75, startH + dy));
      setCustomSize(prev => ({ ...prev, height: newH }));
    };

    const onTouchEnd = () => {
      setIsResizingModal(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      // If simply tapped without dragging, toggle between compact (310px) and expanded (85vh)
      if (!hasMoved) {
        setCustomSize(prev => {
          const curH = prev.height || startH;
          if (curH > 380) {
            return { ...prev, height: 310 };
          } else {
            return { ...prev, height: Math.min(window.innerHeight - 80, 660) };
          }
        });
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
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

    // A. คำถามเกี่ยวกับข้อมูลสด ณ ปัจจุบัน (Live Flood Points Telemetry)
    const isLiveFloodQuery = 
      q.includes("ท่วมที่ไหน") || 
      q.includes("มีท่วม") || 
      q.includes("ตรงไหนท่วม") || 
      q.includes("จุดไหนท่วม") || 
      q.includes("สถานการณ์น้ำท่วม") || 
      q.includes("น้ำท่วมตอนนี้") ||
      q.includes("สรุปสถานการณ์") ||
      q.includes("ตอนนี้ท่วม") ||
      q.includes("มีน้ำท่วมไหม") ||
      q.includes("มีน้ำท่วมมั้ย") ||
      q.includes("น้ำท่วมกี่จุด");

    if (isLiveFloodQuery) {
      // คัดกรองจุดที่กำลังท่วมจริง (ไม่แห้ง ไม่ถูกปิดงาน)
      const activeFloods = points.filter(p => p && !p.isResolved && p.isActive !== false && p.depthCm > 0);
      
      if (activeFloods.length === 0) {
        return `✅ **รายงานสถานการณ์น้ำท่วม จ.สมุทรปราการ (อัปเดตสดทุก 15 วินาที):**\n\n` +
          `ขณะนี้ในระบบ **ไม่พบจุดน้ำท่วมขังวิกฤตบนผิวจราจร** ในพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการครับ ทุกเส้นทางหลักสัญจรได้ตามปกติ\n\n` +
          `• 🌡️ สภาพอากาศ: **${weather.weatherDesc || 'ปกติ'}** (อุณหภูมิ ${weather.temp}°C)\n` +
          `• 🌧️ โอกาสเกิดฝนตกวันนี้: **${rainChance}%** (ช่วงเฝ้าระวัง: ${peakTime})\n\n` +
          `💡 ประชาชนสามารถติดตามแผนที่สด หรือกดปุ่ม **แจ้ง** ตรงกลางเมนูด้านล่าง หากพบจุดน้ำท่วมในชุมชนของท่านครับ`;
      }

      // เรียงลำดับจุดที่ลึกที่สุด 5 อันดับแรก
      const sortedFloods = [...activeFloods].sort((a, b) => (b.depthCm || 0) - (a.depthCm || 0)).slice(0, 5);
      
      const listText = sortedFloods.map((p, idx) => {
        const levelBadge = p.level === 3 ? '🔴 วิกฤต' : (p.level === 2 ? '🟡 ปานกลาง' : '🟢 ปกติ');
        return `• **${idx + 1}. ${p.name}** (อ.${p.district})\n` +
          `  - ระดับน้ำ: **${p.depthCm || p.depthRange} ซม.** [${levelBadge}]\n` +
          `  - การสัญจร: ${p.trafficStatus || 'โปรดใช้ความระมัดระวัง'}`;
      }).join('\n\n');

      return `🌊 **สรุปรายงานจุดน้ำท่วมขังบนผิวจราจรสด (ทั้งหมด ${activeFloods.length} จุด):**\n\n` +
        `${listText}\n\n` +
        `📊 ข้อมูลดึงจากเซนเซอร์ตรวจวัดและรายงานประชาชนที่ผ่านการอนุมัติ อัปเดตสดทุก 15 วินาที\n` +
        `💡 แตะดูหมุดสีบนแผนที่หลักเพื่อดูพิกัดและภาพถ่ายจริงได้ทันทีครับ`;
    }

    // B. คำถามเกี่ยวกับสายด่วนและเบอร์โทรฉุกเฉิน (Official Emergency Hotlines)
    const isEmergencyQuery = 
      q.includes("เบอร์") || 
      q.includes("โทร") || 
      q.includes("สายด่วน") || 
      q.includes("ฉุกเฉิน") || 
      q.includes("ขอความช่วยเหลือ") || 
      q.includes("กู้ภัย") || 
      q.includes("ดับเพลิง") ||
      q.includes("แจ้งไฟดับ") ||
      q.includes("ไฟฟ้ารั่ว") ||
      q.includes("น้ำประปา");

    if (isEmergencyQuery) {
      const contactsText = OFFICIAL_EMERGENCY_CONTACTS.map(c => 
        `• **${c.name}**: โทร. **${c.tel}** (${c.desc})`
      ).join('\n');

      return `📞 **เบอร์โทรสายด่วนฉุกเฉินและหน่วยงานช่วยเหลือ จ.สมุทรปราการ (24 ชั่วโมง):**\n\n` +
        `${contactsText}\n\n` +
        `⚠️ กรณีมีผู้ป่วยติดเตียงหรือต้องการอพยพด่วน โทร. **1784** (ปภ. โทรฟรี) หรือ **1669** (กู้ชีพฉุกเฉิน) ได้ทันทีครับ`;
    }

    // C. คำถามเกี่ยวกับเกณฑ์มาตรฐานระดับน้ำและยานพาหนะ (Vehicle & Water Standards)
    const isVehicleStandardQuery = 
      q.includes("รถเก๋ง") || 
      q.includes("เก๋ง") || 
      q.includes("กระบะ") || 
      q.includes("suv") || 
      q.includes("มอเตอร์ไซค์") || 
      q.includes("มอไซค์") || 
      q.includes("รถบรรทุก") || 
      q.includes("ลุยน้ำได้กี่") || 
      q.includes("กี่เซน") || 
      q.includes("กี่ซม") || 
      q.includes("ระดับน้ำ");

    if (isVehicleStandardQuery) {
      return `🚗 **เกณฑ์มาตรฐานระดับน้ำและความปลอดภัยในการขับขี่ (เกณฑ์ระดับน้ำมาตรฐาน / กรมทางหลวง):**\n\n` +
        `🟢 **ระดับ 1: ท่วมปกติ (5 - 20 ซม.)**\n` +
        `• มอเตอร์ไซค์และรถเก๋งสัญจรผ่านได้ ขับช้าๆ ไม่เร่งเครื่อง เว้นระยะห่าง\n\n` +
        `🟡 **ระดับ 2: ท่วมปานกลาง (21 - 50 ซม.)**\n` +
        `• **รถเก๋งและอีโคคาร์:** เสี่ยงน้ำเข้าท่อไอเสียและห้องเครื่อง ห้ามลุยเกิน 30 ซม. เด็ดขาด!\n` +
        `• **มอเตอร์ไซค์:** เสี่ยงเครื่องดับสูง แนะนำเลี่ยงเส้นทาง\n` +
        `• **รถกระบะ / SUV:** ผ่านได้ด้วยความระมัดระวัง ใช้เกียร์ต่ำ L ปิดแอร์ทันที\n\n` +
        `🔴 **ระดับ 3: ท่วมวิกฤต (มากกว่า 50 ซม.)**\n` +
        `• **ห้ามรถยนต์และมอเตอร์ไซค์ทุกชนิดผ่านเด็ดขาด!** รถจะลอยน้ำและสูญเสียการควบคุม\n` +
        `• สัญจรได้เฉพาะรถบรรทุกยกสูง 6 ล้อขึ้นไป หรือเรือกู้ภัย ปภ.\n\n` +
        `💡 ข้อควรจำสำคัญ: เมื่อเจอน้ำท่วมทาง ให้ **ปิดแอร์ทันที** เพื่อป้องกันพัดลมตีน้ำเข้าเครื่องยนต์ครับ`;
    }

    // D. คำถามเกี่ยวกับความปลอดภัย ไฟฟ้า สัตว์มีพิษ โรคระบาด
    const isSafetyQuery = 
      q.includes("ไฟดูด") || 
      q.includes("ตัดไฟ") || 
      q.includes("ปลั๊กไฟ") || 
      q.includes("สวิตช์ไฟ") || 
      q.includes("งู") || 
      q.includes("สัตว์มีพิษ") || 
      q.includes("ตะขาบ") || 
      q.includes("ฉี่หนู") || 
      q.includes("น้ำกัดเท้า");

    if (isSafetyQuery) {
      const tipsText = FLOOD_SAFETY_TIPS.map(t => 
        `🛡️ **${t.title}:**\n` + t.tips.map(tip => `  - ${tip}`).join('\n')
      ).join('\n\n');

      return `⚠️ **ข้อควรระวังเพื่อความปลอดภัยในชีวิตช่วงน้ำท่วม:**\n\n` +
        `${tipsText}\n\n` +
        `📞 แจ้งเหตุด่วน กฟน. สมุทรปราการ โทร. **1130** | แจ้งจับสัตว์มีพิษ/กู้ภัย โทร. **199** ครับ`;
    }

    // E. ข้อมูลความสามารถของระบบ
    const isSystemInfoQuery = 
      q.includes("ทำอะไรได้") || 
      q.includes("ช่วยอะไรได้") || 
      q.includes("ระบบนี้คือ") || 
      q.includes("เกี่ยวกับ");

    if (isSystemInfoQuery) {
      return `ℹ️ **ระบบ PrakanGuard ผู้ช่วยข้อมูลน้ำท่วม จ.สมุทรปราการ:**\n\n` +
        `• ⏱️ **อัปเดตข้อมูลสดทุก 15 วินาที:** เชื่อมโยงข้อมูลเรดาร์ เซนเซอร์ และรายงานเหตุจากประชาชน\n` +
        `• 🎯 **แผนที่ติดตามระดับน้ำ:** แสดงจุดเฝ้าระวัง 3 ระดับสี 🟢 เขียว (5-20 ซม.) 🟡 เหลือง (21-50 ซม.) 🔴 แดง (>50 ซม.)\n` +
        `• 🧹 **ระบบตัดจุดน้ำแห้งอัตโนมัติ:** เมื่อจุดใดน้ำแห้งสนิทแล้ว จะนำออกจากแผนที่ทันที\n` +
        `• 📸 **ดูภาพถ่ายสถานการณ์จริง:** ตรวจสอบรูปภาพจากจุดที่มีประชาชนรายงานเข้ามา\n` +
        `• 🤖 **ผู้ช่วย AI ตอบคำถาม:** ให้ข้อมูลเส้นทาง สภาพอากาศ เบอร์โทรฉุกเฉิน และเกณฑ์สัญจรลุยน้ำครับ`;
    }

    // ตรวจสอบคำถามเกี่ยวกับฝน / พยากรณ์ / สภาพอากาศ
    const isRainQuery = 
      q.includes("ฝน") || 
      q.includes("ตกไหม") || 
      q.includes("ตกมั้ย") || 
      q.includes("จะตก") || 
      q.includes("ตกกี่โมง") || 
      q.includes("ตกหนัก") || 
      q.includes("พยากรณ์") || 
      q.includes("เรดาร์") || 
      q.includes("ฟ้าคะนอง") || 
      q.includes("พายุ") || 
      q.includes("ปริมาณฝน") || 
      q.includes("สภาพอากาศ");

    // ตรวจสอบคำถามคาดการณ์ฝนภาพรวมแต่ละสถานที่ / ทุกอำเภอ
    const isMultiLocationRainQuery = 
      (q.includes("ฝน") || q.includes("พยากรณ์") || q.includes("คาดการณ์") || q.includes("ตก")) &&
      (
        q.includes("แต่ละ") || 
        q.includes("ทุกที่") || 
        q.includes("ทุกอำเภอ") || 
        q.includes("ทุกแห่ง") || 
        q.includes("ที่ไหนบ้าง") || 
        q.includes("รายพื้นที่") || 
        q.includes("รายอำเภอ") || 
        q.includes("แต่ละสถานที่") || 
        q.includes("แต่ละจุด") || 
        q.includes("แต่ละอำเภอ") || 
        q.includes("ทั่วจังหวัด") ||
        q.includes("รอบจังหวัด") ||
        q.includes("ภาพรวมฝน")
      );

    // 1. กระดานคาดการณ์ฝนตกแยกรายสถานที่ / ทุกอำเภอ (Multi-Location Rain Forecast Board)
    if (isMultiLocationRainQuery) {
      if (wantsShort) {
        return `⚡️ **สรุปคาดการณ์ฝนรายพื้นที่ จ.สมุทรปราการ แบบกระชับ:**\n\n` +
          `• 🏙️ **อ.เมือง (วัดด่าน, ทรัพย์บุญชัย, ปากน้ำ, บางปู):** ฝนตกหนักช่วง 15:00-18:30 น. โอกาส ~65% (สะสม 25-45 มม.) เสี่ยงท่วมผิวทาง 15-35 ซม.\n` +
          `• ✈️ **อ.บางพลี (บางฉโลง, กิ่งแก้ว, หนามแดง, เทพารักษ์):** ฝนตกหนักช่วง 15:30-19:00 น. โอกาส ~68% (สะสม 30-50 มม.) กิ่งแก้ว/บางฉโลงเสี่ยงท่วม 20-45 ซม.\n` +
          `• 🌉 **อ.พระประแดง (ปู่เจ้า, สะพานภูมิพล, ท่าน้ำ):** ฝนตกหนักช่วง 15:30-19:00 น. โอกาส ~65% (สะสม 25-40 มม.) ใต้สะพานภูมิพลเสี่ยงท่วม 20-40 ซม.\n` +
          `• ⚓ **อ.พระสมุทรเจดีย์ (ป้อมพระจุลฯ, บ้านสาขลา):** ฝนตกหนักช่วง 16:00-20:00 น. โอกาส ~65% (สะสม 30-45 มม.) คลองสรรพสามิต/สุขสวัสดิ์ เสี่ยงท่วม 25-50 ซม.\n` +
          `• 🌊 **อ.บางบ่อ (คลองด่าน, สุขุมวิทสายเก่า):** ฝนตกหนักช่วง 16:00-19:30 น. โอกาส ~66% (สะสม 30-45 มม.) หน้าตลาดคลองด่านเสี่ยงท่วม 20-45 ซม.\n` +
          `• 🏫 **อ.บางเสาธง (เคหะบางเสาธง, ม.เอแบค):** ฝนตกหนักช่วง 15:30-19:00 น. โอกาส ~66% (สะสม 25-45 มม.) ซอยเอแบคเสี่ยงท่วม 15-35 ซม.\n\n` +
          `💡 พิมพ์ชื่อเฉพาะ เช่น *"บางฉโลง"*, *"ทรัพย์บุญชัย"*, *"นิคมบางปู"* เพื่อดูเรดาร์เจาะจงได้ครับ 😊`;
      }

      return `🌧️ **กระดานคาดการณ์ฝนตกแยกรายสถานที่ & ทุกอำเภอ จ.สมุทรปราการ**\n` +
        `อ้างอิงข้อมูล: [กรมอุตุนิยมวิทยา (TMD)] • [ศูนย์เรดาร์ตรวจอากาศหนองจอก-สุวรรณภูมิ] • [สนง.ปภ. จ.สมุทรปราการ]\n\n` +
        `📊 **ภาพรวมสภาพอากาศจังหวัด:** ${weather.weatherDesc} | อุณหภูมิ **${weather.temp}°C** | โอกาสฝนรวม **${weather.rainProbabilityToday}%** (~**${weather.rainSumToday} มม.**)\n` +
        `⏱️ **ช่วงเวลาเฝ้าระวังฝนตกหนักภาพรวม:** **${weather.peakHour}**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 **1. อำเภอเมืองสมุทรปราการ (ปากน้ำ / สำโรง / แพรกษา / บางปู)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 15:00 – 18:30 น. | **โอกาสฝน:** ~65% (สะสม 25 – 45 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** เคลื่อนจากบางนา-กทม. และอ่าวไทย ลงสู่คลองสำโรงและแม่น้ำเจ้าพระยา\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:**\n` +
        `   - **ซอยวัดด่านสำโรง:** เสี่ยงฝนตกหนักบ่ายแก่ น้ำขังผิวทาง 15-35 ซม.\n` +
        `   - **ซอยทรัพย์บุญชัย:** ฝนตกสะสมบ่ายถึงค่ำ แอ่งกระทะน้ำขัง 15-30 ซม.\n` +
        `   - **ตลาดปากน้ำ / ท้ายบ้าน:** ระวังฝนตกช่วงเย็นร่วมกับน้ำทะเลหนุน\n` +
        `   - **นิคมฯ บางปู:** ลมกระโชกแรงชายฝั่งอ่าวไทย ท่วมขังซอยพัฒนา 1 (20-40 ซม.)\n\n` +
        `📍 **2. อำเภอบางพลี (บางโฉลง / กิ่งแก้ว / เทพารักษ์ / หนามแดง)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 15:30 – 19:00 น. | **โอกาสฝน:** ~68% (สะสม 30 – 50 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** ก่อตัวแนวสุวรรณภูมิ-ลาดกระบัง เคลื่อนลงทางทิศใต้สู่บางนา-ตราด\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:**\n` +
        `   - **บางโฉลง (บางฉโลง / ม.หัวเฉียว กม.18):** ฝนซู่หนัก 15:30-19:00 น. คู่ขนานเสี่ยงขัง 15-30 ซม.\n` +
        `   - **ถนนกิ่งแก้ว:** ฝนตกหนักมากสะสม 40-60 มม. เสี่ยงท่วม 25-45 ซม.\n` +
        `   - **หนามแดง-บางพลี:** ฝนสะสมช่วงเย็น เลนซ้ายหน้าวัดหนามแดงท่วม 15-35 ซม.\n` +
        `   - **วัดบางพลีใหญ่ใน (หลวงพ่อโต):** ฝนตกเป็นระลอก ระวังน้ำล้นตลิ่งริมคลองสำโรง\n\n` +
        `📍 **3. อำเภอพระประแดง (ปู่เจ้า / คลองลัดโพธิ์ / บางกระเจ้า)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 15:30 – 19:00 น. | **โอกาสฝน:** ~65% (สะสม 25 – 40 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** เคลื่อนจากฝั่งธนบุรีข้ามแม่น้ำเจ้าพระยาเข้าสู่คุ้งบางกระเจ้าและถนนปู่เจ้า\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:** จุดกลับรถใต้สะพานภูมิพล และ ถ.ปู่เจ้าสมิงพรายช่วงท่าน้ำ (20-40 ซม.)\n\n` +
        `📍 **4. อำเภอพระสมุทรเจดีย์ (ป้อมพระจุลฯ / แหลมฟ้าผ่า / บ้านสาขลา)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 16:00 – 20:00 น. | **โอกาสฝน:** ~65% (สะสม 30 – 45 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** กลุ่มฝนจากอ่าวไทยพัดขึ้นฝั่ง ลมแรง 20-30 กม./ชม.\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:** ถ.สุขสวัสดิ์ กม.22 หน้าป้อมพระจุลฯ และสะพานชุมชนบ้านสาขลา (25-50 ซม.)\n\n` +
        `📍 **5. อำเภอบางบ่อ (ตลาดคลองด่าน / บางบ่อ)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 16:00 – 19:30 น. | **โอกาสฝน:** ~66% (สะสม 30 – 45 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** พัดจากอ่าวไทยและฉะเชิงเทราเข้าสู่แนวคลองด่านและบางบ่อ\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:** ถนนสุขุมวิทสายเก่าหน้าตลาดคลองด่าน ท่วมขัง 20-45 ซม.\n\n` +
        `📍 **6. อำเภอบางเสาธง (เคหะเมืองใหม่บางเสาธง / ม.เอแบค)**\n` +
        `• **ช่วงเวลาฝนตกหนัก:** ⏱️ 15:30 – 19:00 น. | **โอกาสฝน:** ~66% (สะสม 25 – 45 มม.)\n` +
        `• **เรดาร์กลุ่มฝน:** พัดจากแนวบางพลีและคลองด่านเข้าสู่ชุมชนเคหะ\n` +
        `• 📌 **คาดการณ์จุดสำคัญ:** ซอยเอแบค (กม.26) และวงเวียนเคหะบางเสาธง ท่วมขัง 15-35 ซม.\n\n` +
        `💡 **คำแนะนำการใช้งาน:** ท่านสามารถพิมพ์ชื่อสถานที่เฉพาะเจาะจง (เช่น *"บางฉโลงฝนจะตกไหม"*, *"ทรัพย์บุญชัยฝนตกกี่โมง"*, *"นิคมบางปู"*, *"วัดด่าน"*) เพื่อให้ระบบวิเคราะห์เรดาร์และระดับน้ำเฉพาะถนนได้ทันทีครับ!`;
    }

    // ค้นหาพิกัดสถานที่ในคำถาม พร้อมตรวจจับคำสะกดผิด (Fuzzy Typo Matcher)
    const lastBotMessage = (history || []).slice().reverse().find(m => m.sender === 'bot');
    const locMatch = findLocationMatch(q) || (wantsShort && lastBotMessage ? findLocationMatch(lastBotMessage.text) : null);

    if (locMatch) {
      const loc = locMatch.location;
      const floodProb = Math.min(92, Math.max(35, Math.round(rainChance * loc.floodRiskMultiplier + loc.floodRiskBase)));
      const rf = loc.rainForecast || {
        zone: `${loc.canonical} (อ.${loc.district})`,
        peakTime: peakTime,
        rainProbOffset: 5,
        intensityDesc: "ฝนฟ้าคะนองปานกลางถึงหนัก มีฟ้าแลบฟ้าร้องเป็นช่วงๆ",
        accumulationEstimate: `${rainSum} มม.`,
        radarMovement: "กลุ่มเมฆฝนเคลื่อนตัวตามแนวลมมรสุมพัดผ่านพื้นที่",
        impactRisk: `เกิดน้ำท่วมขังรอการระบายผิวถนน ${loc.depthRange} ในจุดลุ่มต่ำ`,
        drainageRate: "ระบายน้ำลงสู่คลองสายหลัก ใช้เวลา 30 - 60 นาที"
      };
      const locRainProb = Math.min(95, Math.max(30, Math.round(rainChance + (rf.rainProbOffset || 0))));

      const typoNotice = locMatch.isTypo 
        ? `💡 ระบบเข้าใจว่าคุณหมายถึง: **${loc.name || 'ทรัพย์บุญชัย'}** *(คุณระบุ: "${locMatch.matchedAlias}")*\n` +
          `📍 พิกัดข้อมูล: **${loc.canonical}** (อ.${loc.district})\n\n`
        : '';

      // กรณีถามเจาะจงเรื่องฝน / พยากรณ์ฝนที่สถานที่นี้
      if (isRainQuery) {
        if (wantsShort) {
          return `${typoNotice}⚡️ **สรุปคาดการณ์ฝนตกเฉพาะจุด: ${loc.canonical} แบบกระชับ:**\n\n` +
            `• **โอกาสเกิดฝน:** 🌧️ **${locRainProb}%** (สะสม ~**${rf.accumulationEstimate}**)\n` +
            `• **ช่วงเวลาฝนตกหนักสุด:** ⏱️ **${rf.peakTime}**\n` +
            `• **ลักษณะฝน & เรดาร์:** ${rf.intensityDesc} (${rf.radarMovement})\n` +
            `• **ผลกระทบน้ำท่วมผิวทาง:** ⚠️ ${rf.impactRisk}\n` +
            `• **การระบายน้ำ:** ⏱️ ${rf.drainageRate}\n\n` +
            `สั้นกระชับ ตรงใจไหมครับ! หากต้องการทราบจุดอื่น สอบถามได้เลยนะครับ 😊`;
        }

        return `${typoNotice}🌧️ **รายงานคาดการณ์ฝนตกเฉพาะพื้นที่: ${loc.canonical}**\n` +
          `📍 **โซนวิเคราะห์:** ${rf.zone}\n` +
          `อ้างอิงข้อมูล: [กรมอุตุนิยมวิทยา (TMD)] • [ศูนย์เรดาร์ตรวจอากาศหนองจอก-สุวรรณภูมิ] • ${loc.agencies}\n\n` +
          `📊 **ความน่าจะเป็นและช่วงเวลาฝนตก:**\n` +
          `• โอกาสเกิดฝนตกในพื้นที่: 🌧️ **${locRainProb}%** (${locRainProb >= 70 ? 'เสี่ยงฝนตกหนัก' : locRainProb >= 50 ? 'มีโอกาสฝนฟ้าคะนองปานกลาง' : 'โอกาสฝนโปรยบางส่วน'})\n` +
          `• ช่วงเวลาเสี่ยงฝนตกหนักสุด (Peak Rain Window): ⏱️ **${rf.peakTime}**\n` +
          `• ปริมาณน้ำฝนสะสมคาดการณ์: 📊 **${rf.accumulationEstimate}**\n` +
          `• ลักษณะฝนและลมกระโชก: ⛈️ **${rf.intensityDesc}**\n\n` +
          `🧭 **ทิศทางและการเคลื่อนตัวของกลุ่มเมฆฝน (Radar Vector):**\n` +
          `• ${rf.radarMovement}\n\n` +
          `🌊 **ผลกระทบต่อน้ำท่วมขังบนผิวถนน (Road Flooding Risk):**\n` +
          `• ${rf.impactRisk}\n` +
          `• **อัตราหน่วงการระบายน้ำ:** ${rf.drainageRate}\n` +
          `• **จุดวิกฤตที่ต้องระวังเป็นพิเศษ:** ${loc.criticalSpots}\n\n` +
          `🚗 **คำแนะนำยานพาหนะและการเดินทางในพื้นที่:**\n` +
          `• ${loc.trafficGuidance}\n\n` +
          `📞 **สายด่วนประสานงานฉุกเฉินและเครื่องสูบน้ำ:**\n` +
          `• ${loc.phones}`;
      }

      // กรณีถามเรื่องน้ำท่วมทั่วไปที่สถานที่นี้ (นำข้อมูลคาดการณ์ฝนเฉพาะจุดมาร่วมวิเคราะห์)
      if (wantsShort) {
        return `${typoNotice}⚡️ **สรุปสถานการณ์น้ำ ${loc.canonical} แบบกระชับ:**\n\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%** (ระดับน้ำคาดการณ์ ${loc.depthRange})\n` +
          `• **ช่วงเฝ้าระวังสูงสุด:** ⏱️ **${rf.peakTime || peakTime}** (หากมีฝนตกหนักสะสม)\n` +
          `• **โอกาสฝนเฉพาะจุด:** 🌧️ **${locRainProb}%** (สะสม ~${rf.accumulationEstimate})\n` +
          `• **จุดเปราะบาง:** ${loc.criticalSpots}\n` +
          `• **ยานพาหนะ:** ${loc.trafficGuidance}\n` +
          `• **สายด่วน:** ${loc.phones}\n\n` +
          `สั้นกระชับ ตรงใจไหมครับ! สอบถามจุดอื่นหรือเกณฑ์ความลึกเพิ่มเติมได้ตลอดเลยนะครับ 😊`;
      }

      return `${typoNotice}🌊 **การวิเคราะห์คาดการณ์โอกาสเกิดน้ำท่วม: ${loc.canonical}**\n` +
        `อ้างอิงข้อมูล: ${loc.agencies} • [กรมอุตุนิยมวิทยา (TMD)] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. คาดการณ์ฝนฟ้าคะนองและปริมาณน้ำฝนสะสมเฉพาะพื้นที่ (${rf.zone}):**\n` +
        `• โอกาสเกิดฝนตกเฉพาะจุด: 🌧️ **${locRainProb}%** (ปริมาณฝนสะสมคาดการณ์ ~**${rf.accumulationEstimate}**)\n` +
        `• ช่วงเวลาเสี่ยงฝนตกหนักสูงสุด: ⏱️ **${rf.peakTime}**\n` +
        `• ลักษณะกลุ่มฝนและลม: ⛈️ ${rf.intensityDesc}\n` +
        `• ทิศทางเรดาร์กลุ่มเมฆฝน: 🧭 ${rf.radarMovement}\n` +
        `• **การประเมินผลกระทบถนน:** ${rf.impactRisk}\n\n` +
        `🌊 **2. ปัจจัยทางกายภาพและสาเหตุหลัก:**\n` +
        `• ${loc.cause}\n` +
        `• **จุดวิกฤตที่มักท่วมขัง:** ${loc.criticalSpots} (ระดับน้ำท่วมขังเฉลี่ย **${loc.depthRange}**)\n\n` +
        `⚙️ **3. การระบายน้ำและการเตรียมพร้อมของพื้นที่:**\n` +
        `• มีการเดินเครื่องสูบน้ำประจำสถานีเพื่อเร่งผลักดันน้ำออกจากแนวท่อระบายน้ำหลัก\n` +
        `• ${rf.drainageRate}\n\n` +
        `🚗 **4. เกณฑ์ความปลอดภัยของยานพาหนะและคำแนะนำการสัญจร:**\n` +
        `• **รถเก๋ง / Eco car:** ${loc.trafficGuidance}\n` +
        `• **มอเตอร์ไซค์:** ชิดช่องทางขวากลางถนน หลีกเลี่ยงแอ่งน้ำขังชิดฟุตบาทที่อาจลึกกว่าระดับสายตา\n` +
        `• **รถกระบะ / รถยกสูง:** สัญจรผ่านได้ ชะลอความเร็วเพื่อไม่ให้เกิดคลื่นน้ำกระทบบ้านเรือนประชาชน\n\n` +
        `📞 **สายด่วนประสานงานและขอความช่วยเหลือ (24 ชม.):**\n` +
        `• ${loc.phones}\n` +
        `• [สนง.ปภ. จังหวัดสมุทรปราการ] โทร. **02-382-6040** (สายด่วน 1784)`;
    }

    // ค้นหาข้อมูลระดับอำเภอสำหรับคำถามพยากรณ์ฝนหรือน้ำท่วมรายอำเภอ
    const districtMatch = findDistrictMatch(q);
    if (districtMatch && (isRainQuery || q.includes("ท่วม") || q.includes("อากาศ"))) {
      const distRainProb = Math.min(92, Math.max(35, Math.round(rainChance + (districtMatch.rainProbOffset || 0))));
      if (wantsShort) {
        return `⚡️ **สรุปคาดการณ์ฝนรายอำเภอ: ${districtMatch.name} แบบกระชับ:**\n\n` +
          `• **โอกาสเกิดฝน:** 🌧️ **${distRainProb}%** (สะสม ~**${districtMatch.accumulationEstimate}**)\n` +
          `• **ช่วงเวลาเสี่ยงตกหนัก:** ⏱️ **${districtMatch.peakTime}**\n` +
          `• **เรดาร์กลุ่มฝน:** ${districtMatch.radarMovement}\n` +
          `• **จุดเฝ้าระวัง:** ${districtMatch.criticalLocations}\n\n` +
          `พิมพ์ชื่อจุดย่อย เช่น *"บางฉโลง"*, *"กิ่งแก้ว"*, *"วัดด่าน"* เพื่อดูเจาะลึกเฉพาะถนนได้ครับ 😊`;
      }

      return `🌧️ **รายงานคาดการณ์ฝนตกรายอำเภอ: ${districtMatch.name}**\n` +
        `อ้างอิงข้อมูล: [กรมอุตุนิยมวิทยา (TMD)] • [ศูนย์เรดาร์ตรวจอากาศหนองจอก-สุวรรณภูมิ] • [สนง.ปภ. จังหวัดสมุทรปราการ]\n\n` +
        `📊 **สภาพอากาศและโอกาสเกิดฝน:**\n` +
        `• โอกาสเกิดฝนตกในพื้นที่: 🌧️ **${distRainProb}%**\n` +
        `• ช่วงเวลาเสี่ยงฝนตกหนักสูงสุด: ⏱️ **${districtMatch.peakTime}**\n` +
        `• ปริมาณฝนสะสมคาดการณ์: 📊 **${districtMatch.accumulationEstimate}**\n` +
        `• ลักษณะสภาพอากาศ: ⛈️ **${districtMatch.intensityDesc}**\n\n` +
        `🧭 **การเคลื่อนตัวของกลุ่มเมฆฝน (Radar Vector):**\n` +
        `• ${districtMatch.radarMovement}\n\n` +
        `📍 **จุดเสี่ยงน้ำท่วมขังสำคัญใน${districtMatch.name}:**\n` +
        `• ${districtMatch.criticalLocations}\n\n` +
        `💡 **คำแนะนำ:** สามารถพิมพ์ชื่อซอยหรือถนนเฉพาะใน${districtMatch.name} (เช่น *"บางฉโลง"*, *"กิ่งแก้ว"*, *"เทพารักษ์"*, *"หนามแดง"*) เพื่อให้ระบบวิเคราะห์เรดาร์และระดับน้ำลึกเฉพาะจุดได้ทันทีครับ!`;
    }

    // กรณีต้องการสรุปสั้นแต่ไม่ได้ระบุสถานที่
    if (wantsShort) {
      if (q.includes("รถ") || q.includes("เกณฑ์") || q.includes("เซนติเมตร") || q.includes("ซม.")) {
        return `จัดให้แบบสั้นจี๊ด เข้าใจง่ายใน 3 บรรทัดครับ! 🚗💨\n\n` +
          `🚦 **เกณฑ์ลุยน้ำฉบับย่อ (มาตรฐานใหม่):**\n` +
          `• **ระดับ 1 (8 – 20 ซม.):** รถเก๋ง มอไซค์ ลุยได้ปลอดภัย (ชะลอความเร็ว)\n` +
          `• **ระดับ 2 (21 – 60 ซม.):** เสี่ยงน้ำเข้าท่อ/แตะประตู! ปิดแอร์ทันที รถเก๋งเลี่ยงได้ควรเลี่ยง\n` +
          `• **ระดับ 3 (> 60 ซม.):** 🛑 **ห้ามผ่านเด็ดขาด!** มิดล้อรถเก๋ง น้ำเข้าเครื่องยนต์พังแน่นอน\n\n` +
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
        `• **ระดับ 1: 8 – 20 ซม. (ระดับข้อเท้าถึงใต้ท้องรถ):**\n` +
        `  🟢 รถทุกประเภทสัญจรได้ตามปกติ ชะลอความเร็วเพื่อป้องกันน้ำกระเซ็นใส่ผู้อื่น\n\n` +
        `• **ระดับ 2: 21 – 60 ซม. (ระดับเสมอชายประตูล่าง ถึง 2/3 ล้อรถยนต์):**\n` +
        `  ⚠️ **รถเก๋งและ Eco car เสี่ยงสูงมาก** หากจำเป็นต้องผ่าน ให้ **ปิดแอร์ (A/C) ทันที** ใช้เกียร์ต่ำ และห้ามเร่งเครื่องกะทันหัน มอเตอร์ไซค์ชิดขวา\n\n` +
        `• **ระดับ 3: มากกว่า 60 ซม. ขึ้นไป (ท่วมมิดล้อรถเก๋ง / ระดับสะโพก):**\n` +
        `  🔴 **ห้ามรถเก๋งและมอเตอร์ไซค์สัญจรผ่านโดยเด็ดขาด** เสี่ยงน้ำเข้าท่อไอดีและห้องโดยสาร เครื่องยนต์พังถาวร รถอาจลอยน้ำ\n\n` +
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
        `🔗 ตรวจสอบตารางน้ำขึ้น-น้ำลงรายวันได้ที่เว็บไซต์ **hydro.navy.mi.th** ครับ`;
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
    return `🤖 **PrakanBOT ยินดีตอบข้อซักถามและให้ข้อมูลครับ:**\n\n` +
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

  const WELCOME_TEXT = `สวัสดีครับ **PrakanBOT** พร้อมให้ข้อมูลสถานการณ์น้ำท่วมและการเดินทางในจังหวัดสมุทรปราการ

พิมพ์ถามได้เลย เช่น
• ซอยทรัพย์บุญชัยท่วมไหม
• รถเก๋งลุยน้ำได้กี่เซนติเมตร
• วันนี้ฝนจะตกช่วงกี่โมง
• เบอร์โทรขอความช่วยเหลือ`;

  const handleResetChat = () => {
    handleStopResponse();
    playClickSound();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: WELCOME_TEXT,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Remove emoji / pictographs so answers read like a professional service desk
  const cleanBotText = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u20E3\u200D]/gu, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^[ \t]+/gm, '')
      .replace(/(^|\n)[ \t]*\*\*[ \t]*\*\*/g, '$1');
  };

  const toPlainText = (raw) =>
    cleanBotText(raw)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]/g, '$1');

  const handleCopyMessage = (msgId, text) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(toPlainText(text));
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      // Clipboard unavailable – ignore silently
    }
  };

  // Lightweight formatter: bold, quoted examples, agency names, lists and tappable phone numbers
  const renderInline = (text, keyPrefix) => {
    const nodes = [];
    const regex = /(\*\*[^*]+?\*\*)|(\[[^\]]+?\])|(\*[^*\s][^*]*?\*)/g;
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(<span key={`${keyPrefix}-t${i++}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      if (match[1]) {
        const inner = match[1].slice(2, -2).trim();
        const digits = inner.replace(/[^\d]/g, '');
        if (/^[\d\s-]+$/.test(inner) && digits.length >= 4 && digits.length <= 10) {
          nodes.push(
            <a
              key={`${keyPrefix}-p${i++}`}
              href={`tel:${digits}`}
              className={`font-semibold underline decoration-1 underline-offset-2 ${isDark ? 'text-sky-300 decoration-sky-300/40' : 'text-blue-700 decoration-blue-700/30'}`}
            >
              {inner}
            </a>
          );
        } else {
          nodes.push(
            <strong key={`${keyPrefix}-b${i++}`} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {inner}
            </strong>
          );
        }
      } else if (match[2]) {
        nodes.push(
          <span key={`${keyPrefix}-a${i++}`} className={`font-medium ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
            {match[2].slice(1, -1)}
          </span>
        );
      } else if (match[3]) {
        nodes.push(
          <span key={`${keyPrefix}-q${i++}`} className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            {match[3].slice(1, -1)}
          </span>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      nodes.push(<span key={`${keyPrefix}-t${i++}`}>{text.substring(lastIndex)}</span>);
    }
    return nodes;
  };

  const renderFormattedMessage = (rawText, isBot = true) => {
    if (!rawText) return null;
    const text = isBot ? cleanBotText(rawText) : rawText;

    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      const bullet = trimmed.match(/^(?:[•\-–]|(\d+)\.)\s+(.*)$/);
      if (bullet) {
        return (
          <div key={idx} className="flex gap-2 pl-0.5 my-0.5">
            <span className={`shrink-0 tabular-nums ${bullet[1] ? 'min-w-[1rem] text-right' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {bullet[1] ? `${bullet[1]}.` : '•'}
            </span>
            <span className="min-w-0">{renderInline(bullet[2], `l${idx}`)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-0.5">
          {renderInline(trimmed, `l${idx}`)}
        </p>
      );
    });
  };

  const QUICK_QUESTIONS = [
    { label: 'จุดน้ำท่วมตอนนี้', q: 'ตอนนี้ในสมุทรปราการมีน้ำท่วมตรงไหนบ้าง?' },
    { label: 'ฝนตกช่วงไหนวันนี้', q: 'วันนี้ในสมุทรปราการมีโอกาสฝนตกช่วงกี่โมง?' },
    { label: 'ระดับน้ำที่รถผ่านได้', q: 'รถเก๋งลุยน้ำได้กี่เซนติเมตร และระดับไหนห้ามผ่านเด็ดขาด?' },
    { label: 'เบอร์ฉุกเฉิน', q: 'ขอเบอร์โทรศัพท์สายด่วนฉุกเฉินหน่วยงานช่วยเหลือในสมุทรปราการ' },
    { label: 'ที่จอดรถหนีน้ำ', q: 'ในสมุทรปราการมีจุดจอดรถที่สูงหรือลานจอดหนีน้ำท่วมที่ไหนบ้าง?' },
    { label: 'ป้องกันไฟดูด', q: 'วิธีตัดไฟและป้องกันไฟดูดช่วงน้ำท่วมต้องทำอย่างไร?' }
  ];

  const isBusy = isThinking || Boolean(streamingMessageId);
  const showQuickQuestions = messages.length <= 1 && !isBusy;
  const ghostBtn = `w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`;

  return (
    <>
      {/* Floating launcher – compact pill, draggable */}
      {!isOpen && (
        <div
          ref={launcherRef}
          onMouseDown={handleMouseDownLauncher}
          onTouchStart={handleTouchStartLauncher}
          onClick={(e) => {
            if (launcherDragRef.current.hasMoved) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            playAiChatSound();
            setIsOpen(true);
          }}
          style={launcherPosition ? {
            position: 'fixed',
            left: `${launcherPosition.x}px`,
            top: `${launcherPosition.y}px`,
            bottom: 'auto',
            right: 'auto',
            touchAction: 'none'
          } : undefined}
          role="button"
          aria-label="เปิด PrakanBOT"
          className={`fixed bottom-[calc(5.8rem+env(safe-area-inset-bottom,0px))] right-2.5 sm:bottom-6 sm:right-6 z-40 items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border shadow-lg cursor-pointer select-none transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
            isPointSelected ? 'hidden' : 'flex'
          } ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-black/40 hover:border-slate-600'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10 hover:border-slate-300'
          }`}
          title="PrakanBOT – สอบถามข้อมูลน้ำท่วมและเส้นทาง"
        >
          <div className="relative shrink-0 pointer-events-none">
            <AiOfficialEmblem size={28} />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 ${isDark ? 'border-slate-900' : 'border-white'}`} />
          </div>
          <div className="text-left leading-tight pointer-events-none">
            <span className="block text-[12.5px] sm:text-[13px] font-semibold tracking-tight">PrakanBOT</span>
            <span className={`hidden sm:block text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              สอบถามน้ำท่วมและเส้นทาง
            </span>
          </div>
        </div>
      )}

      {/* Minimized dock */}
      {isOpen && isMinimized && (
        <div
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto'
          } : undefined}
          className={`smooth-pop fixed z-50 bottom-[calc(5.8rem+env(safe-area-inset-bottom,0px))] right-2.5 sm:bottom-6 sm:right-6 w-[min(280px,88vw)] sm:w-[320px] border rounded-2xl shadow-xl flex items-center justify-between gap-2 pl-2 pr-1.5 py-1.5 ${
            isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div
            onClick={() => {
              playToggleSound(true);
              setIsMinimized(false);
            }}
            className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
            title="ขยายหน้าต่าง"
          >
            <AiOfficialEmblem size={26} />
            <div className="min-w-0 leading-tight">
              <span className="block text-[12.5px] font-semibold truncate">PrakanBOT</span>
              <span className={`block text-[10.5px] truncate ${isBusy ? 'text-amber-600 dark:text-amber-400' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                {isBusy ? 'กำลังพิมพ์คำตอบ…' : 'แตะเพื่อเปิดต่อ'}
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {isBusy && (
              <button type="button" onClick={handleStopResponse} className={ghostBtn} title="หยุดตอบ">
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playToggleSound(true);
                setIsMinimized(false);
              }}
              className={ghostBtn}
              title="ขยายหน้าต่าง"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className={ghostBtn}
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat window – draggable & resizable */}
      {isOpen && !isMinimized && (
        <div
          ref={modalRef}
          style={{
            ...(position ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              right: 'auto',
              bottom: 'auto'
            } : {}),
            ...(customSize.width ? { width: `${customSize.width}px`, maxWidth: '96vw' } : {}),
            ...(customSize.height ? { height: `${customSize.height}px`, maxHeight: '85vh' } : {})
          }}
          className={`smooth-pop fixed z-50 w-[92vw] max-w-[360px] sm:max-w-none ${
            customSize.width || customSize.height
              ? ''
              : isExpanded
                ? 'sm:w-[540px] h-[460px] max-h-[74vh] sm:h-[680px] sm:max-h-[86vh]'
                : 'sm:w-[400px] h-[400px] max-h-[68vh] sm:h-[580px] sm:max-h-[84vh]'
          } border rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
            !position ? 'bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:bottom-6 sm:right-6' : ''
          } ${
            isDraggingModal || isResizingModal ? 'ring-2 ring-blue-500/40' : ''
          } ${
            isDark
              ? 'bg-slate-900 border-slate-700/70 text-slate-100 shadow-black/50'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15'
          }`}
        >
          {/* Desktop resize corner */}
          <div
            onMouseDown={handleMouseDownResizeCorner}
            onTouchStart={handleTouchStartResizeCorner}
            className="hidden sm:block absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-50"
            title="ลากเพื่อปรับขนาด"
          />

          {/* Mobile grab handle (tap to toggle height) */}
          <div
            onTouchStart={handleTouchStartResizeTop}
            onClick={() => {
              if (customSize.height && customSize.height > 340) {
                setCustomSize({ width: null, height: 300 });
              } else if (customSize.height && customSize.height <= 340) {
                setCustomSize({ width: null, height: Math.min(window.innerHeight - 110, 540) });
              } else if (isExpanded) {
                setIsExpanded(false);
                setCustomSize({ width: null, height: 300 });
              } else {
                setIsExpanded(true);
                setCustomSize({ width: null, height: Math.min(window.innerHeight - 110, 540) });
              }
            }}
            className="sm:hidden w-full pt-1.5 pb-0.5 flex justify-center cursor-ns-resize touch-none select-none"
            title="แตะเพื่อย่อ/ขยาย"
          >
            <div className={`w-9 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
          </div>

          {/* Header */}
          <div
            onMouseDown={handleMouseDownHeader}
            onTouchStart={handleTouchStartHeader}
            className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
            title="ลากเพื่อย้ายหน้าต่าง"
          >
            <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
              <div className="relative shrink-0">
                <AiOfficialEmblem size={32} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 ${isDark ? 'border-slate-900' : 'border-white'}`} />
              </div>
              <div className="min-w-0 leading-tight">
                <h4 className="text-[13.5px] sm:text-sm font-semibold tracking-tight">PrakanBOT</h4>
                <p className={`text-[10.5px] sm:text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isBusy ? 'กำลังพิมพ์…' : 'ออนไลน์ · ข้อมูลน้ำท่วมและการเดินทาง'}
                </p>
              </div>
            </div>

            <div className="flex items-center shrink-0 -mr-1">
              <button type="button" onClick={handleResetChat} className={ghostBtn} title="เริ่มการสนทนาใหม่">
                <RotateCcw className="w-[15px] h-[15px]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playToggleSound(false);
                  setIsMinimized(true);
                }}
                className={ghostBtn}
                title="ย่อหน้าต่าง"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  setCustomSize({ width: null, height: null });
                }}
                className={`${ghostBtn} !hidden sm:!flex`}
                title={isExpanded ? 'คืนขนาดเดิม' : 'ขยายหน้าต่าง'}
              >
                {isExpanded ? <Minimize2 className="w-[15px] h-[15px]" /> : <Maximize2 className="w-[15px] h-[15px]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setIsOpen(false);
                }}
                className={ghostBtn}
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live weather line */}
          <div className={`px-3 sm:px-4 py-1.5 border-b flex items-center justify-between gap-2 text-[10.5px] sm:text-[11px] tabular-nums ${
            isDark ? 'border-slate-800 text-slate-400 bg-slate-950/30' : 'border-slate-100 text-slate-500 bg-slate-50/60'
          }`}>
            <span className="truncate">
              สมุทรปราการ <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{weather.temp}°C</span>
              <span className="mx-1.5 opacity-40">|</span>
              โอกาสฝน <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{weather.rainProbabilityToday}%</span>
            </span>
            {weather.peakHour && (
              <span className="shrink-0 truncate max-w-[45%]">ช่วงฝนหนัก {String(weather.peakHour).split(' (')[0]}</span>
            )}
          </div>

          {/* Messages */}
          <div className={`pgb-scroll flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}>
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`pgb-msg-in group flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="shrink-0 mt-0.5">
                      <AiOfficialEmblem size={24} />
                    </div>
                  )}

                  <div className={`max-w-[84%] min-w-0 flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`px-3 py-2 text-[12.5px] sm:text-[13px] leading-[1.65] break-words ${
                        isBot
                          ? `rounded-2xl rounded-tl-md ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`
                          : 'rounded-2xl rounded-tr-md bg-blue-600 text-white'
                      }`}
                    >
                      {isBot ? renderFormattedMessage(m.text, true) : <p className="whitespace-pre-wrap">{m.text}</p>}
                      {streamingMessageId === m.id && (
                        <span className={`inline-block w-[2px] h-3.5 ml-0.5 align-[-2px] animate-pulse ${isDark ? 'bg-slate-300' : 'bg-slate-500'}`} />
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-1 px-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{m.time}</span>
                      {isBot && streamingMessageId !== m.id && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.id, m.text)}
                          className={`flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${
                            copiedMessageId === m.id ? 'text-emerald-600 dark:text-emerald-400 sm:opacity-100' : 'hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                          title="คัดลอกข้อความ"
                        >
                          {copiedMessageId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedMessageId === m.id ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="pgb-msg-in flex gap-2 justify-start">
                <div className="shrink-0 mt-0.5">
                  <AiOfficialEmblem size={24} />
                </div>
                <div className={`rounded-2xl rounded-tl-md px-3.5 py-3 flex items-center gap-1 ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                }`}>
                  <span className="pgb-dot" />
                  <span className="pgb-dot" />
                  <span className="pgb-dot" />
                </div>
              </div>
            )}

            {showQuickQuestions && (
              <div className="pgb-msg-in pl-8 flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleSend(chip.q)}
                    className={`px-3 py-1.5 rounded-full border text-[11.5px] sm:text-xs transition-colors ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion strip after the conversation has started */}
          {!showQuickQuestions && (
            <div
              ref={chipsRef}
              onMouseDown={handleChipsMouseDown}
              onMouseMove={handleChipsMouseMove}
              onMouseUp={handleChipsMouseUp}
              onMouseLeave={handleChipsMouseUp}
              className={`pgb-chips-fade smooth-slider no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 pt-2 touch-pan-x cursor-grab active:cursor-grabbing select-none ${
                isDark ? 'bg-slate-900' : 'bg-white'
              }`}
            >
              {QUICK_QUESTIONS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={isBusy}
                  onClick={() => { if (!chipsHasDraggedRef.current) handleSend(chip.q); }}
                  className={`smooth-slider-item shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full border text-[11px] transition-colors disabled:opacity-40 ${
                    isDark
                      ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className={`p-2.5 sm:p-3 ${isDark ? 'bg-slate-900' : 'bg-white'}`}
          >
            <div className={`flex items-center gap-1.5 rounded-full border pl-3.5 pr-1 py-1 transition-[border-color,box-shadow] ${
              isDark
                ? 'bg-slate-800/60 border-slate-700 focus-within:border-slate-500'
                : 'bg-slate-50 border-slate-200 focus-within:border-slate-400 focus-within:bg-white'
            }`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={Boolean(streamingMessageId)}
                placeholder={isBusy ? 'กำลังตอบ…' : 'พิมพ์คำถาม…'}
                aria-label="พิมพ์คำถาม"
                className={`flex-1 min-w-0 bg-transparent text-[13px] py-1.5 focus:outline-none ${
                  isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {isBusy ? (
                <button
                  type="button"
                  onClick={handleStopResponse}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDark ? 'bg-slate-200 text-slate-900 hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                  title="หยุดตอบ"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-slate-300 disabled:text-white dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                  title="ส่ง"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
