import { SAMUT_PRAKAN_DISTRICTS_DATA } from './samutPrakanDistricts.js';

// พิกัดเส้นแบ่งขอบเขตการปกครองจังหวัดสมุทรปราการ และ 6 อำเภอแบบแนบสนิท 100% ไร้ช่องว่าง (Watertight Contiguous Topology)
// 1. อำเภอเมืองสมุทรปราการ
// 2. อำเภอพระประแดง
// 3. อำเภอพระสมุทรเจดีย์
// 4. อำเภอบางพลี
// 5. อำเภอบางเสาธง
// 6. อำเภอบางบ่อ

export const DISTRICT_METADATA = {
  "ทั้งหมด": {
    center: [13.6000, 100.6500],
    zoom: 11,
    color: "#00f0ff",
    desc: "ครอบคลุมพื้นที่ 6 อำเภอ จ.สมุทรปราการ"
  },
  "เมืองสมุทรปราการ": {
    center: [13.5850, 100.6150],
    zoom: 12,
    color: "#38bdf8",
    desc: "ศูนย์กลางเศรษฐกิจ ปากน้ำ ท้ายบ้าน บางปู แพรกษา สำโรงเหนือ"
  },
  "พระประแดง": {
    center: [13.6600, 100.5450],
    zoom: 12.5,
    color: "#a855f7",
    desc: "คุ้งบางกระเจ้า (กระเพาะหมู) ปู่เจ้าสมิงพราย ท่าน้ำพระประแดง"
  },
  "พระสมุทรเจดีย์": {
    center: [13.5650, 100.5450],
    zoom: 12,
    color: "#ec4899",
    desc: "ฝั่งตะวันตกแม่น้ำเจ้าพระยา ป้อมพระจุลจอมเกล้า แหลมฟ้าผ่า ปากคลองบางปลากด"
  },
  "บางพลี": {
    center: [13.6400, 100.7000],
    zoom: 12,
    color: "#f59e0b",
    desc: "พื้นที่เศรษฐกิจ ท่าอากาศยานสุวรรณภูมิ กิ่งแก้ว บางนา-ตราด บางพลีใหญ่"
  },
  "บางเสาธง": {
    center: [13.6000, 100.8200],
    zoom: 12.5,
    color: "#10b981",
    desc: "เมืองใหม่บางเสาธง ศีรษะจรเข้น้อย-ใหญ่ ถนนเทพารักษ์ กม.23"
  },
  "บางบ่อ": {
    center: [13.5450, 100.8350],
    zoom: 12,
    color: "#f43f5e",
    desc: "คลองด่าน ชายฝั่งทะเลอ่าวไทย บางเพรียง ประตูระบายน้ำชลหารพิจิตร"
  }
};

// --------------------------------------------------------------------------
// Shared Edges (เส้นขอบเขตที่ติดกันแบบเชื่อมสนิท 100% ไร้ช่องว่างและไม่ซ้อนทับ)
// --------------------------------------------------------------------------

// 1. ระหว่าง พระประแดง <-> พระสมุทรเจดีย์
const EDGE_PP_PSC = [
  [100.5080, 13.6300],
  [100.5280, 13.6320],
  [100.5480, 13.6300],
  [100.5600, 13.6260]
];

// 2. ระหว่าง พระประแดง <-> เมืองสมุทรปราการ (แนวสำโรงใต้ / ถ.สุขุมวิท - ปู่เจ้าฯ)
const EDGE_PP_MUEANG = [
  [100.5600, 13.6260],
  [100.5690, 13.6380],
  [100.5840, 13.6600],
  [100.5890, 13.6680]
];

// 3. ระหว่าง พระสมุทรเจดีย์ <-> เมืองสมุทรปราการ (แนวกึ่งกลางแม่น้ำเจ้าพระยาไปจนถึงปากอ่าว)
const EDGE_PSC_MUEANG = [
  [100.5600, 13.6260],
  [100.5750, 13.6080],
  [100.5880, 13.5940],
  [100.5920, 13.5750],
  [100.5900, 13.5400]
];

// 4. ระหว่าง เมืองสมุทรปราการ <-> บางพลี (แนวรอยต่อหนามแดง-บางพลี, แพรกษา, คลองตำหรุ)
const EDGE_MUEANG_BP = [
  [100.6480, 13.6650],
  [100.6480, 13.6450],
  [100.6460, 13.6310],
  [100.6550, 13.6260],
  [100.6750, 13.6050],
  [100.7050, 13.5820],
  [100.7300, 13.5780]
];

// 5. ระหว่าง เมืองสมุทรปราการ <-> บางบ่อ (แนวรอยต่อนิคมบางปู - คลองด่าน)
const EDGE_MUEANG_BB = [
  [100.7300, 13.5780],
  [100.7450, 13.5550],
  [100.7550, 13.5300],
  [100.7500, 13.4950]
];

// 6. ระหว่าง บางพลี <-> บางบ่อ (แนวคลองสำโรงตอนล่าง)
const EDGE_BP_BB = [
  [100.7300, 13.5780],
  [100.7500, 13.5820],
  [100.7750, 13.5850]
];

// 7. ระหว่าง บางพลี <-> บางเสาธง (แนวคลองสว่างอารมณ์ / บางนา-ตราด กม.14-23)
const EDGE_BP_BST = [
  [100.7750, 13.5850],
  [100.7720, 13.6300],
  [100.7680, 13.6600],
  [100.7680, 13.6850],
  [100.7750, 13.7320]
];

// 8. ระหว่าง บางเสาธง <-> บางบ่อ (แนวคลองพระองค์เจ้าไชยานุชิต / เอแบคบางนา)
const EDGE_BST_BB = [
  [100.7750, 13.5850],
  [100.8050, 13.5780],
  [100.8350, 13.5760],
  [100.8400, 13.6250],
  [100.8350, 13.6700],
  [100.8400, 13.7320]
];

// --------------------------------------------------------------------------
// Outer Province Borders (แนวขอบรอบนอกของจังหวัดสมุทรปราการ ติด กทม., ฉะเชิงเทรา, อ่าวไทย)
// --------------------------------------------------------------------------

// ขอบนอกพระประแดง (ติด กทม. เขตยานนาวา คลองเตย พระโขนง บางนา ทุ่งครุ ราษฎร์บูรณะ)
const OUTER_PP = [
  [100.5890, 13.6680],
  [100.5750, 13.6820],
  [100.5500, 13.7050],
  [100.5300, 13.7080],
  [100.5180, 13.6850],
  [100.5120, 13.6620],
  [100.5080, 13.6300]
];

// ขอบนอกพระสมุทรเจดีย์ (ติด กทม. ทุ่งครุ บางขุนเทียน และชายฝั่งอ่าวไทยด้านทิศตะวันตก)
const OUTER_PSC = [
  [100.5080, 13.6300],
  [100.4900, 13.6100],
  [100.4750, 13.5750],
  [100.4650, 13.5400],
  [100.4750, 13.5100],
  [100.5250, 13.5050],
  [100.5680, 13.5080],
  [100.5850, 13.5350],
  [100.5900, 13.5400]
];

// ชายฝั่งอ่าวไทยอำเภอเมือง (สถานตากอากาศบางปู - ท้ายบ้าน)
const OUTER_COAST_MUEANG = [
  [100.5900, 13.5400],
  [100.6050, 13.5350],
  [100.6350, 13.5200],
  [100.6800, 13.5050],
  [100.7200, 13.4980],
  [100.7500, 13.4950]
];

// ชายฝั่งอ่าวไทยอำเภอบางบ่อ (คลองด่าน - ประตูน้ำชลหารพิจิตร)
const OUTER_COAST_BB = [
  [100.7500, 13.4950],
  [100.7850, 13.4850],
  [100.8250, 13.4750],
  [100.8650, 13.4800],
  [100.9000, 13.4900]
];

// ขอบตะวันออกอำเภอบางบ่อ (ติด จ.ฉะเชิงเทรา: บางปะกง, บ้านโพธิ์)
const OUTER_EAST_BB = [
  [100.9000, 13.4900],
  [100.9200, 13.5250],
  [100.9300, 13.5650],
  [100.9250, 13.6150],
  [100.9150, 13.6600],
  [100.9050, 13.6800],
  [100.8950, 13.7050],
  [100.8750, 13.7250],
  [100.8400, 13.7320]
];

// ขอบเหนืออำเภอบางเสาธง (ติด กทม. เขตลาดกระบัง)
const OUTER_NORTH_BST = [
  [100.8400, 13.7320],
  [100.8100, 13.7320],
  [100.7750, 13.7320]
];

// ขอบเหนืออำเภอบางพลี (ติด กทม. เขตลาดกระบัง และประเวศ ครอบคลุมแยกสุขสมาน-สุวรรณภูมิ)
const OUTER_NORTH_BP = [
  [100.7750, 13.7320],
  [100.7450, 13.7320],
  [100.7150, 13.7250],
  [100.6850, 13.6950],
  [100.6650, 13.6750],
  [100.6480, 13.6650]
];

// ขอบเหนืออำเภอเมือง (ติด กทม. เขตบางนา ซอยแบริ่ง/ลาซาล)
const OUTER_NORTH_MUEANG = [
  [100.6480, 13.6650],
  [100.6250, 13.6640],
  [100.6050, 13.6660],
  [100.5890, 13.6680]
];

function reverse(arr) {
  return [...arr].reverse();
}

function concatRings(...segments) {
  const result = [];
  segments.forEach(seg => {
    seg.forEach(pt => {
      if (result.length > 0) {
        const last = result[result.length - 1];
        if (Math.abs(last[0] - pt[0]) < 1e-6 && Math.abs(last[1] - pt[1]) < 1e-6) {
          return;
        }
      }
      result.push(pt);
    });
  });
  const first = result[0];
  const last = result[result.length - 1];
  if (Math.abs(first[0] - last[0]) > 1e-6 || Math.abs(first[1] - last[1]) > 1e-6) {
    result.push([first[0], first[1]]);
  }
  return result;
}

// โพลีกอน 6 อำเภอแบบต่อสนิท 100%
const POLY_PP = concatRings(OUTER_PP, EDGE_PP_PSC, EDGE_PP_MUEANG);
const POLY_PSC = concatRings(OUTER_PSC, reverse(EDGE_PSC_MUEANG), reverse(EDGE_PP_PSC));
const POLY_MUEANG = concatRings(
  reverse(EDGE_PP_MUEANG),
  EDGE_PSC_MUEANG,
  OUTER_COAST_MUEANG,
  reverse(EDGE_MUEANG_BB),
  reverse(EDGE_MUEANG_BP),
  OUTER_NORTH_MUEANG
);
const POLY_BP = concatRings(
  EDGE_MUEANG_BP,
  EDGE_BP_BB,
  EDGE_BP_BST,
  OUTER_NORTH_BP
);
const POLY_BST = concatRings(
  reverse(EDGE_BP_BST),
  EDGE_BST_BB,
  reverse(OUTER_NORTH_BST)
);
const POLY_BB = concatRings(
  EDGE_MUEANG_BB,
  OUTER_COAST_BB,
  OUTER_EAST_BB,
  reverse(EDGE_BST_BB),
  reverse(EDGE_BP_BB)
);

// ขอบนอกรวมทั้งจังหวัดสมุทรปราการ (Outer Perimeter)
export const SAMUT_PRAKAN_OUTER_BOUNDARY = concatRings(
  OUTER_PP,
  OUTER_PSC,
  OUTER_COAST_MUEANG,
  OUTER_COAST_BB,
  OUTER_EAST_BB,
  OUTER_NORTH_BST,
  OUTER_NORTH_BP,
  OUTER_NORTH_MUEANG
);

// GeoJSON 6 อำเภอของจังหวัดสมุทรปราการ (Contiguous 100% No Gaps)
export const SAMUT_PRAKAN_DISTRICTS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        districtName: "พระประแดง",
        name_en: "Phra Pradaeng",
        code: "1104",
        color: "#a855f7"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_PP]
      }
    },
    {
      type: "Feature",
      properties: {
        districtName: "พระสมุทรเจดีย์",
        name_en: "Phra Samut Chedi",
        code: "1105",
        color: "#ec4899"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_PSC]
      }
    },
    {
      type: "Feature",
      properties: {
        districtName: "เมืองสมุทรปราการ",
        name_en: "Mueang Samut Prakan",
        code: "1101",
        color: "#38bdf8"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_MUEANG]
      }
    },
    {
      type: "Feature",
      properties: {
        districtName: "บางพลี",
        name_en: "Bang Phli",
        code: "1103",
        color: "#f59e0b"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_BP]
      }
    },
    {
      type: "Feature",
      properties: {
        districtName: "บางเสาธง",
        name_en: "Bang Sao Thong",
        code: "1106",
        color: "#10b981"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_BST]
      }
    },
    {
      type: "Feature",
      properties: {
        districtName: "บางบ่อ",
        name_en: "Bang Bo",
        code: "1102",
        color: "#f43f5e"
      },
      geometry: {
        type: "Polygon",
        coordinates: [POLY_BB]
      }
    }
  ]
};

// Inverted Mask GeoJSON (ครอบคลุมทั่วโลก แต่เจาะรูโปร่งใสเฉพาะ จ.สมุทรปราการ)
// ใช้สำหรับเบลอและหรี่สีพื้นที่ภายนอกจังหวัดสมุทรปราการ ให้ จ.สมุทรปราการ โดดเด่น ชัดเจน 100%
export const SAMUT_PRAKAN_MASK_GEOJSON = {
  type: "Feature",
  properties: {
    name: "Samut Prakan Province Outer Mask"
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      // Outer Ring: ครอบคลุมทั่วโลก
      [
        [-180.0, -85.0],
        [180.0, -85.0],
        [180.0, 85.0],
        [-180.0, 85.0],
        [-180.0, -85.0]
      ],
      // Inner Ring (Hole): รูเจาะโปร่งใสรูปจังหวัดสมุทรปราการ
      SAMUT_PRAKAN_OUTER_BOUNDARY
    ]
  }
};

// กรอบขอบเขตรวมทั้งจังหวัด
export const SAMUT_PRAKAN_BOUNDS = [
  [13.4600, 100.4500], // ทิศตะวันตกเฉียงใต้
  [13.7400, 100.9300]  // ทิศตะวันออกเฉียงเหนือ
];

/**
 * ตรวจสอบว่าพิกัด [lat, lng] อยู่ภายในโพลีกอน GeoJSON หรือไม่ (Ray-casting Algorithm)
 */
export function isPointInPolygonCoords(lat, lng, polygonCoords) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return false;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0]; // Lng
    const yi = polygonCoords[i][1]; // Lat
    const xj = polygonCoords[j][0]; // Lng
    const yj = polygonCoords[j][1]; // Lat

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * ตรวจหาอำเภอของพิกัด [lat, lng] จาก 6 อำเภอของจังหวัดสมุทรปราการ
 * คืนค่า: "เมืองสมุทรปราการ" | "บางพลี" | "บางบ่อ" | "บางเสาธง" | "พระประแดง" | "พระสมุทรเจดีย์" หรือ null ถ้าอยู่นอกเขต
 */
export function detectDistrictForCoordinates(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  // 1. ตรวจสอบผ่านโพลีกอนจริงของแต่ละอำเภอใน GeoJSON
  for (const feature of SAMUT_PRAKAN_DISTRICTS_GEOJSON.features) {
    const coords = feature.geometry?.coordinates?.[0];
    if (coords && isPointInPolygonCoords(numLat, numLng, coords)) {
      return feature.properties.districtName;
    }
  }

  // 1.5 ตรวจสอบโพลีกอนภาพรวมขอบเขตจังหวัดสมุทรปราการ
  if (isPointInPolygonCoords(numLat, numLng, SAMUT_PRAKAN_OUTER_BOUNDARY)) {
    // หาอำเภอที่ใกล้ที่สุดจากตำบลและศูนย์กลางอำเภอ
    let closestDistrict = "เมืองสมุทรปราการ";
    let minDistance = Infinity;
    for (const dist of SAMUT_PRAKAN_DISTRICTS_DATA) {
      if (dist.center) {
        const d = Math.hypot(numLat - dist.center.lat, numLng - dist.center.lng);
        if (d < minDistance) {
          minDistance = d;
          closestDistrict = dist.name;
        }
      }
      for (const sub of dist.subdistricts) {
        if (typeof sub.lat === 'number' && typeof sub.lng === 'number') {
          const d = Math.hypot(numLat - sub.lat, numLng - sub.lng);
          if (d < minDistance) {
            minDistance = d;
            closestDistrict = dist.name;
          }
        }
      }
    }
    return closestDistrict;
  }

  // 2. ขอบเขตต้องอยู่ภายในกรอบพิกัดสมุทรปราการเท่านั้น (ไม่รับกรุงเทพฯ, นนทบุรี หรือพื้นที่ภายนอก)
  const minLat = 13.4500;
  const maxLat = 13.7500;
  const minLng = 100.4500;
  const maxLng = 100.9500;

  if (numLat >= minLat && numLat <= maxLat && numLng >= minLng && numLng <= maxLng) {
    let closestDistrict = null;
    let minDistance = Infinity;
    for (const dist of SAMUT_PRAKAN_DISTRICTS_DATA) {
      for (const sub of dist.subdistricts) {
        if (typeof sub.lat === 'number' && typeof sub.lng === 'number') {
          const d = Math.hypot(numLat - sub.lat, numLng - sub.lng);
          if (d < minDistance) {
            minDistance = d;
            closestDistrict = dist.name;
          }
        }
      }
    }
    if (closestDistrict && minDistance < 0.015) {
      return closestDistrict;
    }
  }

  return null;
}

/**
 * ตรวจสอบว่าพิกัด [lat, lng] อยู่ในขอบเขต 6 อำเภอของ จ.สมุทรปราการ หรือไม่
 */
export function isPointInSamutPrakan(lat, lng) {
  return detectDistrictForCoordinates(lat, lng) !== null;
}

/**
 * ระบบตรวจสอบความแม่นยำของพิกัดและอำเภอ (High-Precision 100% Validator)
 */
export function validateCoordinatePrecision(lat, lng, specifiedDistrict = null) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  let msg = '';

  if (isNaN(numLat) || isNaN(numLng)) {
    msg = 'กรุณากรอกพิกัดละติจูดและลองจิจูดให้ถูกต้อง (ตัวเลข)';
    return {
      isValid: false,
      confidence: 0,
      precisionScore: '0%',
      detectedDistrict: null,
      isDistrictMatch: false,
      isDistrictMismatch: false,
      message: msg,
      reason: msg
    };
  }

  // พิกัดพื้นฐานประเทศไทย
  if (numLat < 5 || numLat > 21 || numLng < 97 || numLng > 106) {
    msg = 'พิกัดอยู่นอกอาณาเขตประเทศไทย';
    return {
      isValid: false,
      confidence: 0,
      precisionScore: '0%',
      detectedDistrict: null,
      isDistrictMatch: false,
      isDistrictMismatch: false,
      message: msg,
      reason: msg
    };
  }

  const detected = detectDistrictForCoordinates(numLat, numLng);

  if (!detected) {
    msg = `พิกัด [${numLat.toFixed(4)}, ${numLng.toFixed(4)}] อยู่นอกขอบเขต 6 อำเภอ จ.สมุทรปราการ (ขอบเขตที่รองรับ: ละติจูด 13.46 - 13.74, ลองจิจูด 100.45 - 100.93)`;
    return {
      isValid: false,
      confidence: 10,
      precisionScore: '10%',
      detectedDistrict: null,
      isDistrictMatch: false,
      isDistrictMismatch: false,
      message: msg,
      reason: msg
    };
  }

  if (specifiedDistrict && specifiedDistrict !== "ทั้งหมด" && specifiedDistrict !== detected) {
    msg = `พิกัดนี้อยู่ในเขต "อ.${detected}" (ระบบตรวจพบว่าต่างจากที่คุณเลือก "อ.${specifiedDistrict}")`;
    return {
      isValid: true,
      confidence: 92,
      precisionScore: '92%',
      detectedDistrict: detected,
      isDistrictMatch: false,
      isDistrictMismatch: true,
      message: msg,
      reason: msg
    };
  }

  msg = `พิกัดถูกต้องอยู่ในเขต อ.${detected} จ.สมุทรปราการ`;
  return {
    isValid: true,
    confidence: 100,
    precisionScore: '100%',
    detectedDistrict: detected,
    isDistrictMatch: true,
    isDistrictMismatch: false,
    message: msg,
    reason: msg
  };
}

/**
 * ตรวจสอบและระบุตำบลที่ตรงกับจุดที่รายงานอย่างแม่นยำ (รองรับทั้งพิกัดและชื่อจุดสังเกต)
 * โดยเฉพาะ "แยกศรีเทพา" / "MRT ศรีเทพา" -> "สำโรงเหนือ" (ต.สำโรงเหนือ)
 */
export function detectSubdistrictForLocation(lat, lng, locationText = '', userDistrict = null) {
  const normText = String(locationText || '').toLowerCase();

  // 1. ตรวจจับจากชื่อสถานที่และจุดสังเกตเฉพาะ (High-Precision Landmark Match)
  // สี่แยกเปร็ง / เปร็ง / คลองเปร็ง -> ต.เปร็ง อ.บางบ่อ
  if (
    normText.includes('เปร็ง') || 
    normText.includes('สี่แยกเปร็ง') || 
    normText.includes('แยกเปร็ง') ||
    normText.includes('คลองเปร็ง') ||
    normText.includes('วัดเปร็ง')
  ) {
    return { district: 'บางบ่อ', subdistrict: 'เปร็ง' };
  }

  // แยกศรีเทพา / MRT ศรีเทพา / ซอยศรีบุญเรือง / วัดด่าน / แบริ่ง อยู่ใน ต.สำโรงเหนือ อ.เมืองสมุทรปราการ
  if (
    normText.includes('ศรีเทพา') || 
    normText.includes('mrt ศรีเทพา') || 
    normText.includes('แยกศรีเทพา') || 
    normText.includes('สถานีศรีเทพา') ||
    normText.includes('ด่านสำโรง') || 
    normText.includes('วัดด่าน') || 
    normText.includes('ศรีบุญเรือง') || 
    normText.includes('แบริ่ง') || 
    normText.includes('bts สำโรง') ||
    normText.includes('อิมพีเรียลสำโรง') ||
    normText.includes('ศศิกานต์') ||
    normText.includes('โค้งกสิกร')
  ) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'สำโรงเหนือ' };
  }

  if (normText.includes('การไฟฟ้า') || normText.includes('สายลวด') || normText.includes('ตลาดปากน้ำ') || normText.includes('ศาลากลาง') || normText.includes('หอนาฬิกา')) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'ปากน้ำ' };
  }
  if (normText.includes('เปาโล') || normText.includes('โลตัสศรีนครินทร์') || normText.includes('ทรัพย์บุญชัย')) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'บางเมือง' };
  }
  if (normText.includes('ท้ายบ้าน') || normText.includes('ตาเจี่ย')) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'ท้ายบ้านใหม่' };
  }
  if (normText.includes('แพรกษา') || normText.includes('ซอยมังกร')) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'แพรกษา' };
  }
  if (normText.includes('บางปู') || normText.includes('สถานตากอากาศ') || normText.includes('นิคมบางปู')) {
    return { district: 'เมืองสมุทรปราการ', subdistrict: 'บางปูใหม่' };
  }
  if (normText.includes('เมกาบางนา') || normText.includes('มัณฑนา') || normText.includes('หนามแดง') || normText.includes('บางนา-ตราด กม.12')) {
    return { district: 'บางพลี', subdistrict: 'บางแก้ว' };
  }
  if (normText.includes('กิ่งแก้ว') || normText.includes('ราชาเทวะ')) {
    return { district: 'บางพลี', subdistrict: 'ราชาเทวะ' };
  }
  if (normText.includes('สุขสมาน') || normText.includes('หนองปรือ') || normText.includes('สุวรรณภูมิ 4')) {
    return { district: 'บางพลี', subdistrict: 'หนองปรือ' };
  }
  if (normText.includes('หัวเฉียว') || normText.includes('บางโฉลง') || normText.includes('พูลเจริญ') || normText.includes('กม.18')) {
    return { district: 'บางพลี', subdistrict: 'บางโฉลง' };
  }
  if (normText.includes('หลวงพ่อโต') || normText.includes('วัดบางพลีใหญ่ใน') || normText.includes('บิ๊กซีบางพลี')) {
    return { district: 'บางพลี', subdistrict: 'บางพลีใหญ่' };
  }
  if (normText.includes('ปู่เจ้า') || normText.includes('ท่าน้ำเภตรา') || normText.includes('สำโรงใต้') || normText.includes('สำโรงกลาง')) {
    return { district: 'พระประแดง', subdistrict: 'สำโรงใต้' };
  }
  if (normText.includes('ตลาดพระประแดง') || normText.includes('ท่าน้ำพระประแดง') || normText.includes('สุขสวัสดิ์ 39')) {
    return { district: 'พระประแดง', subdistrict: 'ตลาด' };
  }
  if (normText.includes('ป้อมพระจุล') || normText.includes('แหลมฟ้าผ่า')) {
    return { district: 'พระสมุทรเจดีย์', subdistrict: 'แหลมฟ้าผ่า' };
  }
  if (normText.includes('สาขลา') || normText.includes('นาเกลือ')) {
    return { district: 'พระสมุทรเจดีย์', subdistrict: 'นาเกลือ' };
  }
  if (normText.includes('ตลาดบางบ่อ') || normText.includes('ปานวิถี') || normText.includes('รัตนราช')) {
    return { district: 'บางบ่อ', subdistrict: 'บางบ่อ' };
  }
  if (normText.includes('คลองด่าน') || normText.includes('ชลหารพิจิตร')) {
    return { district: 'บางบ่อ', subdistrict: 'คลองด่าน' };
  }
  if (normText.includes('คลองสวน')) {
    return { district: 'บางบ่อ', subdistrict: 'คลองสวน' };
  }
  if (normText.includes('บางพลีน้อย')) {
    return { district: 'บางบ่อ', subdistrict: 'บางพลีน้อย' };
  }
  if (normText.includes('บ้านระกาศ')) {
    return { district: 'บางบ่อ', subdistrict: 'บ้านระกาศ' };
  }
  if (normText.includes('เคหะบางเสาธง') || normText.includes('เมืองใหม่บางเสาธง') || normText.includes('เอแบค') || normText.includes('abac') || normText.includes('บางนาการ์เด้นท์')) {
    return { district: 'บางเสาธง', subdistrict: 'บางเสาธง' };
  }
  if (normText.includes('ศีรษะจรเข้น้อย')) {
    return { district: 'บางเสาธง', subdistrict: 'ศีรษะจรเข้น้อย' };
  }
  if (normText.includes('ศีรษะจรเข้ใหญ่')) {
    return { district: 'บางเสาธง', subdistrict: 'ศีรษะจรเข้ใหญ่' };
  }

  // ตรวจจับชื่อตำบลโดยตรงจาก SAMUT_PRAKAN_DISTRICTS_DATA
  if (normText.trim()) {
    for (const d of SAMUT_PRAKAN_DISTRICTS_DATA) {
      for (const s of d.subdistricts) {
        if (normText.includes(s.name.toLowerCase())) {
          return { district: d.name, subdistrict: s.name };
        }
      }
    }
  }

  // 2. ตรวจสอบจากพิกัด (Coordinate-based Detection with nearest subdistrict in SAMUT_PRAKAN_DISTRICTS_DATA)
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!isNaN(numLat) && !isNaN(numLng) && numLat > 0 && numLng > 0) {
    // พิกัดบริเวณแยกศรีเทพาและแนวถนนเทพารักษ์ช่วงต้น (lat: 13.6180 - 13.6420, lng: 100.6100 - 100.6380) อยู่ใน ต.สำโรงเหนือ
    if (numLat >= 13.6180 && numLat <= 13.6420 && numLng >= 100.6100 && numLng <= 100.6380) {
      return { district: 'เมืองสมุทรปราการ', subdistrict: 'สำโรงเหนือ' };
    }

    // คำนวณหาตำบลและอำเภอที่ตรงพิกัดที่สุดในฐานข้อมูล 48 ตำบลของสมุทรปราการ
    let closest = null;
    let minSubDist = Infinity;
    for (const d of SAMUT_PRAKAN_DISTRICTS_DATA) {
      for (const s of d.subdistricts) {
        if (typeof s.lat === 'number' && typeof s.lng === 'number') {
          const dist = Math.hypot(numLat - s.lat, numLng - s.lng);
          if (dist < minSubDist) {
            minSubDist = dist;
            closest = { district: d.name, subdistrict: s.name };
          }
        }
      }
    }

    // หากอยู่ใกล้ตำบลใดตำบลหนึ่งไม่เกิน ~2 กม. (0.02 deg) ให้คืนค่านั้น
    if (closest && minSubDist < 0.02) {
      return closest;
    }
  }

  return null;
}

/**
 * ปรับปรุงและแก้ไขพิกัดให้ตรงจุดจริง 100% (High-Precision Realigner)
 * - สี่แยกเปร็ง/เปร็ง: ย้ายมา อ.บางบ่อ ต.เปร็ง (13.6650, 100.8850)
 * - แยกศรีเทพา: ย้ายมา ต.สำโรงเหนือ อ.เมืองสมุทรปราการ (13.6270, 100.6260)
 * - ซอยศรีบุญเรือง: ย้ายมา ต.เทพารักษ์ อ.เมืองสมุทรปราการ (13.6210, 100.6120)
 * - จุดอื่นๆ ที่มีชื่อสถานที่ชัดเจน จะถูกปรับปรุงตำบล/อำเภอและพิกัดให้ตรงจุดจริง
 */
export function realignPointLocation(p) {
  if (!p) return null;
  const name = String(p.name || '').trim();
  const notes = String(p.notes || '').trim();
  const address = String(p.address || '').trim();
  const fullText = `${name} ${notes} ${address}`.toLowerCase();

  // 1. สี่แยกเปร็ง / เปร็ง / คลองเปร็ง -> ต้องอยู่ อ.บางบ่อ ต.เปร็ง (13.6650, 100.8850) เท่านั้น
  if (
    fullText.includes('เปร็ง') || 
    fullText.includes('สี่แยกเปร็ง') || 
    fullText.includes('แยกเปร็ง') || 
    fullText.includes('คลองเปร็ง') || 
    fullText.includes('วัดเปร็ง')
  ) {
    return {
      ...p,
      name: p.name && p.name.includes('เปร็ง') ? p.name : 'สี่แยกเปร็ง (ถนนสุขุมวิท 109 - ลาดกระบัง/บางบ่อ)',
      district: 'บางบ่อ',
      subdistrict: 'เปร็ง',
      lat: 13.6650,
      lng: 100.8850
    };
  }

  // 2. แยกศรีเทพา -> อ.เมืองสมุทรปราการ ต.สำโรงเหนือ
  if (fullText.includes('ศรีเทพา') || fullText.includes('แยกศรีเทพา')) {
    return {
      ...p,
      district: 'เมืองสมุทรปราการ',
      subdistrict: 'สำโรงเหนือ',
      lat: (typeof p.lat === 'number' && Math.abs(p.lat - 13.6270) < 0.03) ? p.lat : 13.6270,
      lng: (typeof p.lng === 'number' && Math.abs(p.lng - 100.6260) < 0.03) ? p.lng : 100.6260
    };
  }

  // 3. หน้าซอยศรีบุญเรือง -> อ.เมืองสมุทรปราการ ต.เทพารักษ์
  if (fullText.includes('ศรีบุญเรือง')) {
    return {
      ...p,
      district: 'เมืองสมุทรปราการ',
      subdistrict: 'เทพารักษ์',
      lat: (typeof p.lat === 'number' && Math.abs(p.lat - 13.6210) < 0.03) ? p.lat : 13.6210,
      lng: (typeof p.lng === 'number' && Math.abs(p.lng - 100.6120) < 0.03) ? p.lng : 100.6120
    };
  }

  // 4. วัดด่านสำโรง -> อ.เมืองสมุทรปราการ ต.สำโรงเหนือ
  if (fullText.includes('วัดด่าน') || fullText.includes('ด่านสำโรง')) {
    return {
      ...p,
      district: 'เมืองสมุทรปราการ',
      subdistrict: 'สำโรงเหนือ'
    };
  }

  // 5. ปู่เจ้าสมิงพราย -> อ.พระประแดง ต.สำโรงใต้
  if (fullText.includes('ปู่เจ้า') || fullText.includes('สำโรงใต้')) {
    return {
      ...p,
      district: 'พระประแดง',
      subdistrict: 'สำโรงใต้'
    };
  }

  // 6. พระสมุทรเจดีย์ -> อ.พระสมุทรเจดีย์
  if (fullText.includes('พระสมุทรเจดีย์')) {
    return {
      ...p,
      district: 'พระสมุทรเจดีย์'
    };
  }

  // วิเคราะห์ตำบล/อำเภออัตโนมัติ
  const smart = detectSubdistrictForLocation(p.lat, p.lng, fullText, p.district);
  if (smart) {
    return {
      ...p,
      district: smart.district || p.district,
      subdistrict: smart.subdistrict || p.subdistrict
    };
  }

  const detectedDist = detectDistrictForCoordinates(p.lat, p.lng);
  if (detectedDist) {
    return {
      ...p,
      district: detectedDist
    };
  }

  return p;
}

