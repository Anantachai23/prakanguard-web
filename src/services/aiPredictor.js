// ระบบบริการข้อมูลสถานการณ์อุทกภัยและแหล่งข้อมูลทางการ จ.สมุทรปราการ (Truth-Based Portal)
// เชื่อมโยงข้อมูลกับหน่วยงานรัฐ: กรมอุทกศาสตร์ กองทัพเรือ, กรมอุตุนิยมวิทยา TMD, ปภ. และ ThaiWater

export const OFFICIAL_DATA_SOURCES = [
  {
    agency: "กรมอุทกศาสตร์ กองทัพเรือ",
    station: "สถานีป้อมพระจุลจอมเกล้า จ.สมุทรปราการ",
    desc: "ตารางน้ำขึ้น-น้ำลง และระดับน้ำทะเลหนุนสูงสุดรายวันของจังหวัดสมุทรปราการ",
    url: "https://hydro.navy.mi.th",
    type: "ระดับน้ำทะเลหนุน",
    badge: "ข้อมูลทางการกองทัพเรือ"
  },
  {
    agency: "กรมอุตุนิยมวิทยา (TMD)",
    station: "สถานีเรดาร์ตรวจอากาศสุวรรณภูมิ / สมุทรปราการ",
    desc: "ภาพถ่ายเรดาร์กลุ่มฝนสดแบบ Real-time ทิศทางการเคลื่อนตัวของกลุ่มฝน",
    url: "https://weather.tmd.go.th",
    type: "เรดาร์ฝน Real-time",
    badge: "เรดาร์สด TMD"
  },
  {
    agency: "คลังข้อมูลน้ำแห่งชาติ (สทนช.)",
    station: "ThaiWater Samut Prakan",
    desc: "ระดับน้ำในลำน้ำสายหลัก คลองสำโรง ประตูระบายน้ำ และปริมาณน้ำสะสม",
    url: "https://www.thaiwater.net",
    type: "สถานการณ์ลุ่มน้ำ",
    badge: "ระบบสารสนเทศน้ำแห่งชาติ"
  },
  {
    agency: "กรมทางหลวง (DOH)",
    station: "ศูนย์บริหารจัดการจราจรและอุบัติเหตุ (HDMS)",
    desc: "รายงานสภาพผิวจราจรและทางหลวงที่ได้รับผลกระทบจากน้ำท่วมขัง",
    url: "https://hdms.doh.go.th/dashboard",
    type: "ผิวจราจรทางหลวง",
    badge: "สายด่วน 1586"
  }
];

export function getOfficialAdvisorySummary(points) {
  const severePoints = points.filter(p => p.level === 3);
  const districtCount = new Set(points.map(p => p.district)).size;

  return {
    title: "ศูนย์ข้อมูลเฝ้าระวังอุทกภัย จ.สมุทรปราการ",
    summary: `เฝ้าระวังจุดเสี่ยงน้ำท่วมผิวจราจร ${points.length} พิกัดสำคัญใน 6 อำเภอ โดยเฉพาะแนวเขื่อนแม่น้ำเจ้าพระยา (พระประแดง, ตลาดปากน้ำ), ย่านชุมชน (บางโฉลง/บางฉโลง, หนามแดง, ทรัพย์บุญชัย, วัดด่าน) และแนวชายฝั่ง (คลองด่าน, นิคมบางปู) ในช่วงน้ำทะเลหนุนสูงและฝนตกสะสม`,
    keyRule: "เมื่อระดับน้ำเกิน 15 ซม. รถเก๋งควรปิดแอร์ทันที และหากเกิน 35 ซม. ห้ามรถเก๋งผ่านเด็ดขาด",
    severeCount: severePoints.length,
    totalPoints: points.length,
    districtCount
  };
}
