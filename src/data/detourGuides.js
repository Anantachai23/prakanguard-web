// PrakanGuard Smart Detour & Alternate Route Intelligence
// แผนเส้นทางเลี่ยงน้ำท่วมทางการ สำหรับ 6 อำเภอ จังหวัดสมุทรปราการ

export const DETOUR_CATALOG = [
  {
    id: "detour-sukhumvit-paknam",
    keywords: ["ท้ายบ้าน", "ปากน้ำ", "ตลาดปากน้ำ", "วงเวียนท้ายบ้าน", "แนวเขื่อน", "สุขุมวิทสายเก่า", "สายลวด"],
    district: "เมืองสมุทรปราการ",
    bottleneckRoad: "ถ.สุขุมวิทสายเก่า (ช่วงวงเวียนท้ายบ้าน - ตลาดปากน้ำ - แยกสายลวด)",
    detourSummary: "เลี่ยงเข้าตัวเมืองปากน้ำช่วงน้ำทะเลหนุนสูง ใช้ ถ.ศรีนครินทร์ หรือ ถ.สายลวด มุ่งหน้าบางปู",
    recommendedRoutes: [
      {
        name: "เส้นทางเลี่ยงที่ 1: ถ.สายลวด - ถ.ศรีนครินทร์",
        description: "จากสุขุมวิท เลี้ยวซ้ายเข้า ถ.สายลวด ตัดเข้า ถ.ศรีนครินทร์ เลี่ยงแนวเขื่อนริมแม่น้ำเจ้าพระยาได้ 100%",
        suitableFor: "รถทุกชนิด (รวมถึงรถเก๋ง / Eco Car)",
        safetyRating: "ปลอดภัยสูง ผิวทางแห้ง"
      },
      {
        name: "เส้นทางเลี่ยงที่ 2: ทางพิเศษกาญจนาภิเษก (บางพลี - สุขสวัสดิ์)",
        description: "ใช้ด่านบางเมือง ข้ามแม่น้ำเจ้าพระยามุ่งหน้าพระประแดง/พระราม 2 โดยไม่ต้องผ่าน ถ.สุขุมวิทตอนล่าง",
        suitableFor: "รถทุกชนิด",
        safetyRating: "ทางยกระดับ ปลอดภัยสูงสุด"
      }
    ],
    googleMapsSearchQuery: "ถนนสายลวด สมุทรปราการ"
  },
  {
    id: "detour-srinakarin-watdan",
    keywords: ["ศรีด่าน", "วัดด่าน", "แบริ่ง", "ลาซาล", "ศรีเทพา", "ศรีนครินทร์"],
    district: "เมืองสมุทรปราการ",
    bottleneckRoad: "ถ.ศรีนครินทร์ (ช่วงแยกศรีแบริ่ง - วัดด่านสำโรง - หน้าบิ๊กซี/แม็คโคร)",
    detourSummary: "ช่วงฝนตกหนักน้ำท่วมขังเลนซ้าย แนะนำชิดขวาขึ้นสะพานข้ามแยกศรีเทพา หรือเลี่ยงออก ถ.บางนา-ตราด",
    recommendedRoutes: [
      {
        name: "เส้นทางเลี่ยงที่ 1: ใช้สะพานยกระดับข้ามแยกศรีเทพา",
        description: "สัญจรเลนกลางและชิดขวาขึ้นสะพานข้ามแยกศรีเทพา หลีกเลี่ยงผิวจราจรราบด้านล่าง",
        suitableFor: "รถทุกชนิด",
        safetyRating: "ผิวทางแห้ง"
      },
      {
        name: "เส้นทางเลี่ยงที่ 2: เลี่ยงออก ถ.บางนา-ตราด (กม.4-6)",
        description: "จากซอยแบริ่ง/ลาซาล ตัดออก ถ.บางนา-ตราด มุ่งหน้าชลบุรี/บางพลี",
        suitableFor: "รถทุกชนิด",
        safetyRating: "ปลอดภัย การระบายน้ำดี"
      }
    ],
    googleMapsSearchQuery: "สะพานข้ามแยกศรีเทพา สมุทรปราการ"
  },
  {
    id: "detour-thepharak",
    keywords: ["เทพารักษ์", "หนามแดง", "บางพลี"],
    district: "บางพลี",
    bottleneckRoad: "ถ.เทพารักษ์ (ช่วง กม.1 - กม.4 และแยกหนามแดง)",
    detourSummary: "เลี่ยงจุดลุ่มต่ำหน้าตลาดหนามแดง ใช้ ถ.บางนา-ตราด ทางคู่ขนาน หรือทางด่วนบูรพาวิถี",
    recommendedRoutes: [
      {
        name: "เส้นทางเลี่ยงหลัก: ถ.บางนา-ตราด (ทางหลัก)",
        description: "ใช้ถนนบางนา-ตราด ช่องทางหลัก (Express Lane) มีระดับพื้นถนนยกสูง น้ำไม่ท่วมขัง",
        suitableFor: "รถทุกชนิด",
        safetyRating: "ปลอดภัยสูง"
      }
    ],
    googleMapsSearchQuery: "ถนนบางนาตราด กม 12 สมุทรปราการ"
  },
  {
    id: "detour-phrasamut-pomprachul",
    keywords: ["ป้อมพระจุล", "สุขสวัสดิ์", "พระสมุทรเจดีย์", "แหลมฟ้าผ่า"],
    district: "พระสมุทรเจดีย์",
    bottleneckRoad: "ถ.สุขสวัสดิ์ช่วงปลาย (แนวป้อมพระจุลจอมเกล้า ริมปากอ่าว)",
    detourSummary: "ช่วงน้ำทะเลหนุนสูงสุด (10:00 - 13:00 น.) เลี่ยงแนวถนนเลียบชายฝั่ง ให้ใช้ ถ.ประชาอุทิศ-คู่สร้าง",
    recommendedRoutes: [
      {
        name: "เส้นทางเลี่ยง: ถ.ประชาอุทิศ - คู่สร้าง (เข้าพระราม 2 / สุขสวัสดิ์ตอนบน)",
        description: "ใช้เส้นทางประชาอุทิศตัดออก ถ.กาญจนาภิเษกด้านใต้ ผิวทางสูงกว่าระดับน้ำหนุน",
        suitableFor: "รถทุกชนิด",
        safetyRating: "ปลอดภัย เลี่ยงน้ำเค็มหนุน"
      }
    ],
    googleMapsSearchQuery: "ถนนประชาอุทิศ คู่สร้าง สมุทรปราการ"
  },
  {
    id: "detour-kingkaew",
    keywords: ["กิ่งแก้ว", "คลองชวดลากข้าว", "บางพลีใหญ่"],
    district: "บางพลี",
    bottleneckRoad: "ถ.กิ่งแก้ว (ช่วงจุดกลับรถใต้สะพานคลองชวดลากข้าว)",
    detourSummary: "เลี่ยงจุดกลับรถใต้สะพานที่มีแอ่งน้ำขัง ให้ตรงไปใช้จุดกลับรถบนสะพานเกือกม้าหรือสี่แยก",
    recommendedRoutes: [
      {
        name: "เส้นทางเลี่ยง: จุดกลับรถระดับราบ / สี่แยกคลองขุด",
        description: "หลีกเลี่ยงการลงอุโมงค์กลับรถใต้สะพาน ให้ใช้จุดกลับรถเกือกม้าถัดไป 1.5 กม.",
        suitableFor: "รถเก๋ง / มอเตอร์ไซค์",
        safetyRating: "ปลอดภัยสูง"
      }
    ],
    googleMapsSearchQuery: "สะพานกลับรถ ถนนกิ่งแก้ว สมุทรปราการ"
  }
];

/**
 * ค้นหาข้อมูลเส้นทางเลี่ยงสำหรับจุดน้ำท่วมที่กำหนด
 */
export function findDetourForPoint(point) {
  if (!point) return null;

  const pointName = (point.name || '').toLowerCase();
  const districtName = (point.district || '').toLowerCase();
  const desc = (point.description || point.details || '').toLowerCase();
  const searchCorpus = `${pointName} ${districtName} ${desc}`;

  for (const detour of DETOUR_CATALOG) {
    const isKeywordMatch = detour.keywords.some(kw => searchCorpus.includes(kw.toLowerCase()));
    if (isKeywordMatch) {
      return detour;
    }
  }

  // Fallback ตามอำเภอ ถ้าเป็นจุดที่มีน้ำท่วมระดับ 2-3
  const level = Number(point.level) || (Number(point.depthCm) > 50 ? 3 : Number(point.depthCm) > 20 ? 2 : 1);
  if (level >= 2) {
    if (districtName.includes('เมือง')) {
      return DETOUR_CATALOG[0]; // ปากน้ำ/สายลวด/ศรีนครินทร์
    }
    if (districtName.includes('บางพลี') || districtName.includes('บางเสาธง')) {
      return DETOUR_CATALOG[2]; // เทพารักษ์/บางนา-ตราด
    }
    if (districtName.includes('พระสมุทร')) {
      return DETOUR_CATALOG[3]; // ป้อมพระจุล/ประชาอุทิศ
    }
  }

  return null;
}
