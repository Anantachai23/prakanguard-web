export const ANALYTICS_DATA = {
  summary: {
    averageOccupancyRate: 84.6, // %
    totalGuestsYearToDate: 28450,
    averageStayNights: 2.4,
    revenueGrowthYearOverYear: 18.2, // %
    bestSellingCategory: 'ห้องใหญ่ (6 คนขึ้นไป) วันหยุดสุดสัปดาห์',
  },

  // 1. แนวโน้มรายวัน (Daily Trend - 7 Days)
  daily: [
    { day: 'จันทร์', guests: 110, occupancy: 65, largeRooms: 12, mediumRooms: 20, smallRooms: 40, revenue: 345000 },
    { day: 'อังคาร', guests: 105, occupancy: 62, largeRooms: 10, mediumRooms: 22, smallRooms: 38, revenue: 320000 },
    { day: 'พุธ', guests: 125, occupancy: 70, largeRooms: 15, mediumRooms: 25, smallRooms: 42, revenue: 380000 },
    { day: 'พฤหัสบดี', guests: 140, occupancy: 78, largeRooms: 18, mediumRooms: 28, smallRooms: 45, revenue: 430000 },
    { day: 'ศุกร์', guests: 195, occupancy: 95, largeRooms: 25, mediumRooms: 34, smallRooms: 48, revenue: 690000 },
    { day: 'เสาร์', guests: 220, occupancy: 99, largeRooms: 28, mediumRooms: 35, smallRooms: 50, revenue: 840000 },
    { day: 'อาทิตย์', guests: 175, occupancy: 85, largeRooms: 22, mediumRooms: 30, smallRooms: 46, revenue: 560000 },
  ],

  // 2. แนวโน้มรายเดือน (Monthly Trend - 12 Months)
  monthly: [
    { month: 'ม.ค.', guests: 2850, occupancy: 92, revenueM: 8.9, season: 'High Season (ปีใหม่/ท่องเที่ยว)' },
    { month: 'ก.พ.', guests: 2420, occupancy: 86, revenueM: 7.6, season: 'High Season (วาเลนไทน์/ตรุษจีน)' },
    { month: 'มี.ค.', guests: 2200, occupancy: 78, revenueM: 6.8, season: 'Shoulder Season' },
    { month: 'เม.ย.', guests: 3100, occupancy: 98, revenueM: 10.2, season: 'Peak Season (เทศกาลสงกรานต์)' },
    { month: 'พ.ค.', guests: 1950, occupancy: 69, revenueM: 5.9, season: 'Green Season' },
    { month: 'มิ.ย.', guests: 1850, occupancy: 66, revenueM: 5.4, season: 'Green Season' },
    { month: 'ก.ค.', guests: 2300, occupancy: 81, revenueM: 7.1, season: 'Shoulder Season (วันหยุดยาว)' },
    { month: 'ส.ค.', guests: 2250, occupancy: 79, revenueM: 6.9, season: 'Shoulder Season (วันแม่)' },
    { month: 'ก.ย.', guests: 1780, occupancy: 63, revenueM: 5.1, season: 'Low Season (หน้าฝน)' },
    { month: 'ต.ค.', guests: 2400, occupancy: 82, revenueM: 7.4, season: 'Shoulder Season (ปิดเทอม)' },
    { month: 'พ.ย.', guests: 2750, occupancy: 89, revenueM: 8.6, season: 'High Season (เทศกาลลอยกระทง)' },
    { month: 'ธ.ค.', guests: 3350, occupancy: 99, revenueM: 11.5, season: 'Peak Season (คริสต์มาสและปีใหม่)' },
  ],

  // 3. แนวโน้มรายปี (Yearly Growth Trend)
  yearly: [
    { year: '2024', totalGuests: 23500, avgOccupancy: 74, totalRevenueM: 72.5, growth: '+12.4%' },
    { year: '2025', totalGuests: 27800, avgOccupancy: 81, totalRevenueM: 88.2, growth: '+21.6%' },
    { year: '2026 (ปัจจุบัน)', totalGuests: 31200, avgOccupancy: 85, totalRevenueM: 102.4, growth: '+16.1%' },
    { year: '2027 (ประมาณการ)', totalGuests: 36000, avgOccupancy: 90, totalRevenueM: 122.0, growth: '+19.1%' }
  ],

  // 4. สัดส่วนกลุ่มผู้เข้าพัก (Demographic Segmentation)
  demographics: [
    { segment: 'กลุ่มครอบครัวใหญ่ (6+ ท่าน)', percentage: 42, preferredCategory: 'ห้องใหญ่ (Pool Villa / Penthouse)', spendingScore: 'สูงมาก' },
    { segment: 'กลุ่มครอบครัวขนาดกลาง / เพื่อน (4-5 ท่าน)', percentage: 28, preferredCategory: 'ห้องกลาง (Family Suite)', spendingScore: 'ปานกลาง-สูง' },
    { segment: 'คู่รักและนักเดินทางเดี่ยว (1-3 ท่าน)', percentage: 22, preferredCategory: 'ห้องเล็ก (Cozy Studio / Horizon)', spendingScore: 'ปานกลาง' },
    { segment: 'กลุ่มสัมมนาองค์กรและจัดประชุม', percentage: 8, preferredCategory: 'ห้องผสมผสานทุกระดับ', spendingScore: 'สูง' }
  ],

  // 5. กลยุทธ์การตลาดแนะนำ (Marketing Insights & Recommendations)
  marketingStrategies: [
    {
      title: 'กระตุ้นยอดจองวันธรรมดา (Weekday Boost - จันทร์-พฤหัส)',
      issue: 'อัตราการเข้าพักวันธรรมดาอยู่ที่ 62-70% ต่ำกว่าสุดสัปดาห์ (95-99%)',
      action: 'จัดโปรโมชั่น "Workation & Relax" มอบฟรี Afternoon Tea และสิทธิอัปเกรดห้องเล็กเป็นห้องกลางสำหรับผู้เข้าพัก 2 คืนขึ้นไปในวันธรรมดา',
      expectedImpact: 'คาดว่าจะเพิ่ม Occupancy วันธรรมดาขึ้นอีก +12% และขยายฐานกลุ่ม Digital Nomad'
    },
    {
      title: 'ขยายแพ็กเกจครอบครัวล่วงหน้าสำหรับห้องใหญ่ (Early Bird Family Villa)',
      issue: 'ห้องใหญ่ (6 คนขึ้นไป) มียอดค้นหาสูงมากและมักเต็มล่วงหน้า 3 สัปดาห์ แต่ช่วง Low season ยอดตกเล็กน้อย',
      action: 'เปิดจอง "Happy Family Escape" จองล่วงหน้า 30 วัน รับฟรีบุฟเฟต์ BBQ ซีฟู้ดริมสระว่ายน้ำสำหรับ 6-8 ท่าน',
      expectedImpact: 'ช่วยรักษา Cash Flow ล่วงหน้า และเพิ่มสัดส่วนการจองห้องราคาสูงในช่วง Shoulder Season'
    },
    {
      title: 'แคมเปญกระตุ้นยอดขายช่วง Low Season (ก.ย. - ต.ค.)',
      issue: 'เดือนกันยายนมีอัตราผู้เข้าพักต่ำสุดของปี (63%) เนื่องจากฤดูมรสุม',
      action: 'นำเสนอแพ็กเกจ "Indoor Wellness & Spa Retreat" เน้นกิจกรรมในร่ม สปาอโรมา และ Private Cinema ภายในห้องพักหรู',
      expectedImpact: 'เปลี่ยนจุดด้อยของสภาพอากาศให้เป็นจุดเด่นการพักผ่อนแบบผ่อนคลายเต็มรูปแบบ คาดการณ์ยอดเข้าพักเพิ่มขึ้นเป็น 75%'
    }
  ]
};
