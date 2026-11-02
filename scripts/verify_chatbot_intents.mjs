// Verification test for ChatBot synthesis logic
import fs from 'fs';
import path from 'path';

// Extract synthesizeAnswer logic from ChatBot.jsx
const chatBotSource = fs.readFileSync(path.resolve('src/components/ChatBot.jsx'), 'utf-8');

// Mock context variables used inside synthesizeAnswer
const weather = {
  weatherDesc: 'มีเมฆเป็นส่วนมาก มีฝนฟ้าคะนองร้อยละ 60 ของพื้นที่',
  temp: 29,
  tempMax: 33,
  tempMin: 26,
  humidity: 78,
  rainAlertLevel: 'เฝ้าระวังกลุ่มฝนปานกลางถึงหนัก',
  rainProbabilityToday: 60,
  rainSumToday: 12.5,
  peakHour: '15:00 – 18:30 น. (ช่วงบ่ายแก่ถึงค่ำ)',
  rainProbabilityTomorrow: 55,
  peakHourTomorrow: '15:30 – 19:00 น.',
  forecast24h: {
    todayProbability: 60,
    todayRiskLabel: 'เฝ้าระวังฝนฟ้าคะนอง',
    todayTimeWindow: '15:00 – 18:30 น. (ช่วงบ่ายแก่ถึงค่ำ)',
    todayDateLabel: 'วันจันทร์ที่ 2 พฤศจิกายน',
    tomorrowProbability: 55,
    tomorrowRiskLabel: 'มีฝนฟ้าคะนองกระจาย',
    tomorrowTimeWindow: '15:30 – 19:00 น.',
    tomorrowDateLabel: 'วันอังคารที่ 3 พฤศจิกายน'
  }
};

const points = [
  { id: 'sp-01', name: 'ซอยทรัพย์บุญชัย', district: 'เมืองสมุทรปราการ', depthCm: 15, depthRange: '15-20 ซม.', level: 1, trafficStatus: 'ระมัดระวัง', isResolved: false, isActive: true },
  { id: 'sp-02', name: 'ซอยวัดด่านสำโรง', district: 'เมืองสมุทรปราการ', depthCm: 25, depthRange: '20-30 ซม.', level: 2, trafficStatus: 'รถเล็กควรเลี่ยง', isResolved: false, isActive: true }
];

const OFFICIAL_EMERGENCY_CONTACTS = [
  { name: "สายด่วนนิรภัย (ปภ.)", tel: "1784", desc: "รับแจ้งเหตุสาธารณภัยตลอด 24 ชม." },
  { name: "ศูนย์กู้ชีพการแพทย์ฉุกเฉิน", tel: "1669", desc: "เจ็บป่วยฉุกเฉินและอุบัติเหตุ" }
];

const FLOOD_SAFETY_TIPS = [
  { title: "ความปลอดภัยจากไฟฟ้า", tips: ["ปลดคัตเอาต์ชั้นล่าง", "ห้ามแตะปลั๊กไฟเปียก"] }
];

// Extract helper functions and dictionaries from ChatBot.jsx
// We can evaluate the function by setting up an environment with eval or regex extraction
const synthBodyMatch = chatBotSource.match(/const synthesizeAnswer = \((.*?)\) => \{([\s\S]*?)\n  \};/);
if (!synthBodyMatch) {
  console.error("Could not extract synthesizeAnswer from ChatBot.jsx");
  process.exit(1);
}

// Extract LOCATION_TYPO_DICTIONARY and DISTRICT_RAIN_PROFILES
const locationDictMatch = chatBotSource.match(/export const LOCATION_TYPO_DICTIONARY = (\[[\s\S]*?\n\]);/);
const districtProfilesMatch = chatBotSource.match(/export const DISTRICT_RAIN_PROFILES = (\[[\s\S]*?\n\]);/);
const findDistrictMatchCode = chatBotSource.match(/export function findDistrictMatch[\s\S]*?\n\}/);
const findLocationMatchCode = chatBotSource.match(/export function findLocationMatch[\s\S]*?\n\}/);

const LOCATION_TYPO_DICTIONARY = eval(locationDictMatch[1]);
const DISTRICT_RAIN_PROFILES = eval(districtProfilesMatch[1]);
const findDistrictMatch = new Function('DISTRICT_RAIN_PROFILES', 'return ' + findDistrictMatchCode[0].replace('export function findDistrictMatch', 'function findDistrictMatch'))(DISTRICT_RAIN_PROFILES);
const findLocationMatch = new Function('LOCATION_TYPO_DICTIONARY', 'return ' + findLocationMatchCode[0].replace('export function findLocationMatch', 'function findLocationMatch'))(LOCATION_TYPO_DICTIONARY);

const fnSource = `
  return function(queryText, history = []) {
    ${synthBodyMatch[2]}
  };
`;

const synthesizeAnswer = new Function(
  'weather', 'points', 'OFFICIAL_EMERGENCY_CONTACTS', 'FLOOD_SAFETY_TIPS',
  'LOCATION_TYPO_DICTIONARY', 'DISTRICT_RAIN_PROFILES', 'findDistrictMatch', 'findLocationMatch',
  fnSource
)(weather, points, OFFICIAL_EMERGENCY_CONTACTS, FLOOD_SAFETY_TIPS, LOCATION_TYPO_DICTIONARY, DISTRICT_RAIN_PROFILES, findDistrictMatch, findLocationMatch);

console.log("=== RUNNING CHATBOT INTENT TESTS ===");

const testCases = [
  {
    query: "วันนี้ในสมุทรปราการมีโอกาสฝนตกช่วงกี่โมง?",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก", "ช่วงเวลาที่มีโอกาสเกิดฝนตกสูงสุดวันนี้", "15:00"],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน", "เวลาปัจจุบัน:"],
    desc: "Target user bug: 'กี่โมง' rain query must give rain forecast with peak time, NOT clock time"
  },
  {
    query: "ฝนตกกี่โมง",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก", "ช่วงเวลาที่มีโอกาสเกิดฝนตกสูงสุดวันนี้"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Short rain query with 'กี่โมง'"
  },
  {
    query: "ตอนนี้กี่โมง",
    mustInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน", "เวลาปัจจุบัน:"],
    mustNotInclude: ["รายงานพยากรณ์อากาศ"],
    desc: "Clock inquiry"
  },
  {
    query: "วันนี้วันที่เท่าไหร่",
    mustInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน", "วันที่:"],
    mustNotInclude: ["รายงานพยากรณ์อากาศ"],
    desc: "Date inquiry"
  },
  {
    query: "ตอนนี้ในสมุทรปราการมีน้ำท่วมตรงไหนบ้าง?",
    mustInclude: ["จุดน้ำท่วมสดบนผิวจราจร", "ซอยทรัพย์บุญชัย"],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน"],
    desc: "Quick question 1: Live flood points"
  },
  {
    query: "รถยนต์ลุยน้ำได้กี่เซนติเมตร และระดับไหนห้ามผ่านเด็ดขาด?",
    mustInclude: ["เกณฑ์มาตรฐานระดับน้ำและความปลอดภัย", "5 - 20 ซม.", "เกิน 50 ซม."],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน"],
    desc: "Quick question 3: Vehicle water clearance"
  },
  {
    query: "ขอดูกล้อง CCTV และจุดตรวจวัดระดับน้ำ",
    mustInclude: ["กล้องวงจรปิดจราจร", "CCTV Traffic Live"],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน"],
    desc: "Quick question 4: CCTV live"
  },
  {
    query: "ขอเบอร์โทรศัพท์สายด่วนฉุกเฉินหน่วยงานช่วยเหลือในสมุทรปราการ",
    mustInclude: ["สายด่วนฉุกเฉิน", "1784", "1669"],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน"],
    desc: "Quick question 5: Emergency hotlines"
  },
  {
    query: "ในสมุทรปราการมีจุดจอดรถที่สูงหรือลานจอดหนีน้ำท่วมที่ไหนบ้าง?",
    mustInclude: ["พิกัดอาคารจอดรถยกสูง", "BTS เคหะสมุทรปราการ"],
    mustNotInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน"],
    desc: "Quick question 6: Elevated parking"
  },
  {
    query: "ถ้าฝนตกหนักจะท่วมไหม",
    mustInclude: ["การวิเคราะห์คาดการณ์ความเสี่ยงและโอกาสเกิดน้ำท่วม"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Flood risk when raining"
  },
  {
    query: "มีโอกาสฝนตกไหม",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก", "โอกาสเกิดฝนตกวันนี้"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "General rain chance inquiry"
  },
  {
    query: "ฝนจะตกช่วงไหน",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก", "ช่วงเวลาที่มีโอกาสเกิดฝนตกสูงสุดวันนี้"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Rain time window query"
  },
  {
    query: "เรดาร์ฝนตอนนี้",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Rain radar query"
  },
  {
    query: "สภาพอากาศวันนี้",
    mustInclude: ["รายงานพยากรณ์อากาศและคาดการณ์ฝนตก", "สถานะอากาศปัจจุบัน"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Weather inquiry"
  },
  {
    query: "ทรัพย์บุญชัยฝนตกกี่โมง",
    mustInclude: ["พยากรณ์ฝน: ซอยทรัพย์บุญชัย", "ช่วงเวลาเสี่ยงฝนตกหนัก"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Specific location rain time query"
  },
  {
    query: "น้ำทะเลหนุนช่วงกี่โมง",
    mustInclude: ["ข้อมูลอุทกศาสตร์และการเกิดน้ำทะเลหนุน", "ป้อมพระจุลจอมเกล้า"],
    mustNotInclude: ["เวลาปัจจุบัน:"],
    desc: "Tide query with 'กี่โมง'"
  },
  {
    query: "เวลาปัจจุบันกี่โมง",
    mustInclude: ["ข้อมูลเวลาและวันที่ตามเวลามาตรฐาน", "เวลาปัจจุบัน:"],
    mustNotInclude: ["รายงานพยากรณ์อากาศ"],
    desc: "Real clock time query"
  }
];

let failed = 0;
for (const tc of testCases) {
  const ans = synthesizeAnswer(tc.query);
  let pass = true;
  for (const inc of tc.mustInclude) {
    if (!ans.includes(inc)) {
      console.error(`❌ FAIL [${tc.desc}]: Output missing "${inc}"`);
      console.error(`Query: "${tc.query}"`);
      console.error(`Got output:\n${ans}\n`);
      pass = false;
      failed++;
      break;
    }
  }
  if (pass) {
    for (const notInc of tc.mustNotInclude) {
      if (ans.includes(notInc)) {
        console.error(`❌ FAIL [${tc.desc}]: Output unexpectedly contained "${notInc}"`);
        console.error(`Query: "${tc.query}"`);
        console.error(`Got output:\n${ans}\n`);
        pass = false;
        failed++;
        break;
      }
    }
  }
  if (pass) {
    console.log(`✅ PASS: ${tc.desc}`);
  }
}

if (failed === 0) {
  console.log(`\n🎉 ALL ${testCases.length} INTENT TESTS PASSED!`);
} else {
  console.error(`\n💥 ${failed} TESTS FAILED!`);
  process.exit(1);
}
