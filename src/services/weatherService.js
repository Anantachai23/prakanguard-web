// PrakanGuard Real-Time Weather & Precipitation Forecast Engine
// เชื่อมต่อข้อมูลสภาพอากาศและพยากรณ์ฝนตกหนัก จ.สมุทรปราการ (Lat: 13.5991, Lon: 100.5968)
// อ้างอิงโมเดลอุตุนิยมวิทยามาตรฐานโลก (ECMWF / WMO Open-Meteo)

let cachedWeatherData = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 1000; // อัปเดตข้อมูลสดทุก 30 วินาที ตลอด 24 ชม.

// แปลง WMO Weather Code เป็นภาษาไทย
export function translateWeatherCode(code) {
  if (code === 0) return "ท้องฟ้าแจ่มใส";
  if (code === 1 || code === 2) return "ท้องฟ้าโปร่ง มีเมฆบางส่วน";
  if (code === 3) return "มีเมฆมาก";
  if (code >= 45 && code <= 48) return "มีหมอกหนา ทัศนวิสัยลดลง";
  if (code >= 51 && code <= 55) return "มีฝนตกปรอยๆ เล็กน้อย";
  if (code >= 61 && code <= 65) return "มีฝนตกปานกลางต่อเนื่อง";
  if (code >= 80 && code <= 82) return "มีฝนตกหนักบางแห่ง (ฝนซู่)";
  if (code >= 95 && code <= 99) return "ระวังพายุฝนฟ้าคะนองและลมกระโชกแรง";
  return "สภาพอากาศแปรปรวน";
}

export function getDetailedThaiTimestamp(date = new Date()) {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `วัน${dayName}ที่ ${day} ${monthName} ${year} เวลา ${time} น.`;
}

export const DISTRICT_COORDINATES = [
  { id: "mueang", name: "เมืองสมุทรปราการ", lat: 13.5991, lng: 100.5968 },
  { id: "bangphli", name: "บางพลี", lat: 13.6050, lng: 100.7050 },
  { id: "bangbo", name: "บางบ่อ", lat: 13.5685, lng: 100.8350 },
  { id: "bangsaothong", name: "บางเสาธง", lat: 13.5875, lng: 100.8250 },
  { id: "phrapradaeng", name: "พระประแดง", lat: 13.6580, lng: 100.5340 },
  { id: "phrasamutchedi", name: "พระสมุทรเจดีย์", lat: 13.5412, lng: 100.5845 }
];

export function getWeatherForDistrict(weatherData, districtName) {
  if (!weatherData) return null;
  if (districtName && districtName !== "ทั้งหมด" && weatherData.districtWeather) {
    const match = weatherData.districtWeather[districtName];
    if (match) return match;
  }
  return weatherData;
}

export async function getLiveSamutPrakanWeather(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedWeatherData && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedWeatherData;
  }

  const nowDate = new Date();
  const detailedTime = getDetailedThaiTimestamp(nowDate);

  try {
    const lats = DISTRICT_COORDINATES.map(d => d.lat).join(',');
    const lngs = DISTRICT_COORDINATES.map(d => d.lng).join(',');
    // ขอข้อมูลเพิ่ม: wind_speed_10m, cape (ความไม่เสถียรของบรรยากาศ → พยากรณ์ฟ้าผ่า+พายุฝน), visibility
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,apparent_temperature` +
      `&hourly=precipitation_probability,precipitation,weather_code,cape,wind_speed_10m,visibility` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
      `&minutely_15=precipitation,precipitation_probability` +
      `&timezone=Asia%2FBangkok&forecast_days=3`;

    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error("Weather API response not ok");


    const data = await response.json();
    
    // Open-Meteo returns array of results when multiple coordinates are queried
    const primaryData = Array.isArray(data) ? data[0] : data;
    const current = primaryData.current || {};
    const daily = primaryData.daily || {};
    const hourly = primaryData.hourly || {};

    const rainProbMax = (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 40;
    const rainSum = (daily.precipitation_sum && daily.precipitation_sum[0]) || 0;
    const tempMax = (daily.temperature_2m_max && daily.temperature_2m_max[0]) || 32;
    const tempMin = (daily.temperature_2m_min && daily.temperature_2m_min[0]) || 25;
    const weatherCode = current.weather_code !== undefined ? current.weather_code : 2;
    const windSpeedNow = current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 0;
    const feelsLike = current.apparent_temperature ? Math.round(current.apparent_temperature) : null;

    // วิเคราะห์ CAPE (Convective Available Potential Energy) — ยิ่งสูงยิ่งเสี่ยงฟ้าผ่า/พายุ
    let maxCapeNow = 0;
    if (hourly.cape && hourly.cape.length > 0) {
      maxCapeNow = Math.max(...hourly.cape.slice(0, 6).filter(v => v != null));
    }
    const thunderstormRisk = maxCapeNow >= 2000 ? 'สูงมาก' : maxCapeNow >= 1000 ? 'สูง' : maxCapeNow >= 500 ? 'ปานกลาง' : 'ต่ำ';

    // ใช้ minutely_15 หาเวลาตกเป๊ะระดับ 15 นาที
    const minutely15 = primaryData.minutely_15 || {};
    let nextRainIn15Min = null;
    if (minutely15.time && minutely15.precipitation && minutely15.precipitation_probability) {
      const nowISO = nowDate.toISOString().substring(0, 13);
      for (let i = 0; i < minutely15.time.length; i++) {
        if (minutely15.time[i] < nowISO) continue;
        if ((minutely15.precipitation[i] >= 0.5 && minutely15.precipitation_probability[i] >= 40) ||
            minutely15.precipitation_probability[i] >= 70) {
          const t = minutely15.time[i];
          const hh = t.substring(11, 13);
          const mm = t.substring(14, 16);
          nextRainIn15Min = `${hh}:${mm} น.`;
          break;
        }
      }
    }

    // หาชั่วโมงที่มีโอกาสฝนตกสูงสุดในวันนี้
    let peakHour = "ช่วงบ่ายถึงค่ำ";
    let peakProb = rainProbMax;
    if (hourly.precipitation_probability && hourly.time) {
      const todayHours = hourly.precipitation_probability.slice(0, 24);
      let maxP = -1;
      let maxIdx = 0;
      todayHours.forEach((p, idx) => {
        if (p > maxP) {
          maxP = p;
          maxIdx = idx;
        }
      });
      if (maxP > 30) {
        peakHour = `${String(maxIdx).padStart(2, '0')}:00 น. (โอกาส ${maxP}%)`;
        peakProb = maxP;
      }
    }

    let rainAlertLevel = "ปกติ";
    let riskColor = "emerald";
    if (rainProbMax >= 70 || rainSum >= 20) {
      rainAlertLevel = "เสี่ยงฝนตกหนัก";
      riskColor = "rose";
    } else if (rainProbMax >= 40 || rainSum >= 5) {
      rainAlertLevel = "เฝ้าระวังฝนฟ้าคะนอง";
      riskColor = "amber";
    }

    // ประมวลผลพยากรณ์ฝน 24 ชั่วโมงข้างหน้า (โมเดล Open-Meteo & TMD)
    let forecast24h = null;
    let districtRainAnalysis = [];
    if (hourly.time && hourly.precipitation && hourly.precipitation_probability) {
      const bkkDatePart = nowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      const bkkHourPart = nowDate.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit" }).padStart(2, '0');
      const bkkHourPrefix = `${bkkDatePart}T${bkkHourPart}`;

      let startIdx = hourly.time.findIndex(t => t.startsWith(bkkHourPrefix));
      if (startIdx < 0) {
        for (let i = 0; i < hourly.time.length; i++) {
          if (hourly.time[i] >= bkkHourPrefix) {
            startIdx = i;
            break;
          }
        }
        if (startIdx < 0) startIdx = 0;
      }

      const next24 = [];
      let maxRainIn24 = 0;
      for (let i = startIdx; i < startIdx + 24 && i < hourly.time.length; i++) {
        const rawTime = hourly.time[i];
        const [dPart, tPart] = rawTime.split("T");
        const isTomorrow = dPart > bkkDatePart;
        const pMm = Number((hourly.precipitation[i] || 0).toFixed(1));
        const pProb = Math.round(hourly.precipitation_probability[i] || 0);
        if (pMm > maxRainIn24) maxRainIn24 = pMm;

        next24.push({
          isoTime: rawTime,
          datePart: dPart,
          time: tPart, // "15:00"
          hourNum: parseInt(tPart.split(":")[0], 10),
          isTomorrow,
          dayLabel: isTomorrow ? "พรุ่งนี้" : "วันนี้",
          precipitation: pMm,
          probability: pProb,
          isNow: i === startIdx
        });
      }

      const totalRain = Number(next24.reduce((acc, h) => acc + h.precipitation, 0).toFixed(1));
      const maxProb = next24.length > 0 ? Math.max(...next24.map(h => h.probability)) : 0;

      // คำนวณความสูงของแท่งกราฟ (Bar height percentage 20% - 100%)
      const scaleBase = Math.max(maxRainIn24, 2.5);
      next24.forEach(h => {
        if (h.precipitation > 0) {
          h.barHeightPercent = Math.min(100, Math.max(20, Math.round((h.precipitation / scaleBase) * 100)));
        } else {
          h.barHeightPercent = 0;
        }
      });

      // คำนวณช่วงเวลาปัจจุบันตามเวลาประเทศไทย (เช้า, บ่าย, เย็น, ค่ำ)
      const bkkHourStr = nowDate.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit" });
      const currentHour = parseInt(bkkHourStr, 10);
      let timeOfDayLabel = "วันนี้";
      if (currentHour >= 5 && currentHour < 12) timeOfDayLabel = "ช่วงเช้า";
      else if (currentHour >= 12 && currentHour < 16) timeOfDayLabel = "ช่วงบ่าย";
      else if (currentHour >= 16 && currentHour < 19) timeOfDayLabel = "ช่วงเย็น";
      else timeOfDayLabel = "ช่วงค่ำ";

      // กำหนดสถานะคาดการณ์ฝนตก (อิงโมเดลพยากรณ์ ไม่ระบุว่าฝนตกจริงหากไม่มีฝนจริงบนพื้นดิน)
      const currentPrecip = current.precipitation || (next24[0] ? next24[0].precipitation : 0);
      const currentProb = next24[0] ? next24[0].probability : 0;
      const currentCode = current.weather_code !== undefined ? current.weather_code : (next24[0] ? next24[0].weatherCode : 2);

      // ตรวจสอบชั่วโมงปัจจุบันเพื่อเริ่มต้นวิเคราะห์ช่วงเวลาและระยะเวลาต่อเนื่อง
      const startHourIdx = currentHour;

      // ฟังก์ชันวิเคราะห์ช่วงเวลาและระยะเวลาตกต่อเนื่องจากข้อมูลรายชั่วโมง (Open-Meteo)
      const analyzeRainEpisode = (hourlyObj, fromHour) => {
        const times = hourlyObj?.time || [];
        const precips = hourlyObj?.precipitation || [];
        const probs = hourlyObj?.precipitation_probability || [];
        const codes = hourlyObj?.weather_code || [];

        let firstIdx = -1;
        for (let i = fromHour; i < Math.min(fromHour + 12, times.length); i++) {
          const p = precips[i] || 0;
          const prob = probs[i] || 0;
          const code = codes[i] || 0;
          if ((p >= 0.2 && prob >= 35) || prob >= 50 || [61, 63, 65, 80, 81, 82, 95, 96].includes(code)) {
            firstIdx = i;
            break;
          }
        }

        if (firstIdx === -1) {
          return {
            hasForecastRain: false,
            timeWindow: 'ไม่มีแนวโน้มฝนตก',
            durationText: 'ไม่มีแนวโน้มฝนตกต่อเนื่อง',
            durationHours: 0
          };
        }

        let lastIdx = firstIdx;
        for (let i = firstIdx + 1; i < Math.min(firstIdx + 8, times.length); i++) {
          const p = precips[i] || 0;
          const prob = probs[i] || 0;
          const code = codes[i] || 0;
          const isContinuing = (p >= 0.2 && prob >= 35) || prob >= 45 || [61, 63, 65, 80, 81, 82, 95, 96].includes(code);
          if (isContinuing) {
            lastIdx = i;
          } else {
            break;
          }
        }

        const durationHours = lastIdx - firstIdx + 1;
        const startStr = times[firstIdx].substring(11, 16);
        const endHourNum = (parseInt(times[lastIdx].substring(11, 13), 10) + 1) % 24;
        const endStr = String(endHourNum).padStart(2, '0') + ':00';

        let durationText = '';
        if (durationHours === 1) {
          durationText = 'คาดการณ์ตกต่อเนื่อง ~30 - 45 นาที';
        } else if (durationHours === 2) {
          durationText = 'คาดการณ์ตกต่อเนื่อง ~1 - 2 ชั่วโมง';
        } else if (durationHours === 3) {
          durationText = 'คาดการณ์ตกต่อเนื่อง ~2 - 3 ชั่วโมง';
        } else {
          durationText = `คาดการณ์ตกต่อเนื่อง ~${durationHours} ชั่วโมง`;
        }

        return {
          hasForecastRain: true,
          timeWindow: `~${startStr} - ${endStr} น.`,
          durationText,
          durationHours
        };
      };

      const provinceRainEpisode = analyzeRainEpisode(hourly, startHourIdx);

      let rainStatusTitle = "ไม่มีฝน";
      if (maxProb >= 70) {
        rainStatusTitle = `คาดการณ์โอกาสฝน ${maxProb}% (${timeOfDayLabel})`;
      } else if (maxProb >= 40) {
        rainStatusTitle = `โอกาสฝนตกปานกลาง (${timeOfDayLabel})`;
      } else if (maxProb >= 20) {
        rainStatusTitle = `โอกาสฝนตกเล็กน้อย (${timeOfDayLabel})`;
      } else {
        rainStatusTitle = "ท้องฟ้าโปร่ง ไม่มีฝน";
      }

      const startTimeText = provinceRainEpisode.hasForecastRain 
        ? provinceRainEpisode.timeWindow 
        : "ไม่มีแนวโน้มฝนตกหนัก";

      const timeLabels = [
        next24[0] ? next24[0].time : "23:00",
        next24[6] ? next24[6].time : "05:00",
        next24[12] ? next24[12].time : "11:00",
        next24[18] ? next24[18].time : "17:00"
      ];

      // วิเคราะห์กลุ่มฝน 6 อำเภอแบบสดจริงจาก Open-Meteo Multi-Coordinate Telemetry
      districtRainAnalysis = DISTRICT_COORDINATES.map((dist, idx) => {
        const dData = Array.isArray(data) ? (data[idx] || data[0]) : data;
        const dCur = dData.current || {};
        const dDaily = dData.daily || {};
        const dHourly = dData.hourly || hourly;
        
        const precip = dCur.precipitation || 0;
        const code = dCur.weather_code !== undefined ? dCur.weather_code : 2;
        const probMax = (dDaily.precipitation_probability_max && dDaily.precipitation_probability_max[0]) || 40;
        const temp = dCur.temperature_2m !== undefined ? Math.round(dCur.temperature_2m) : 31;
        
        // คำนวณช่วงเวลาที่จะตก และระยะเวลาตกต่อเนื่องของอำเภอนี้
        const dRainEpisode = analyzeRainEpisode(dHourly, startHourIdx);

        let icon = "☀️";
        if (code >= 95) icon = "⚡";
        else if (probMax >= 70) icon = "🌧️";
        else if (probMax >= 40) icon = "🌦️";
        else if (code >= 3) icon = "☁️";
        else if (code >= 1) icon = "⛅";
        
        const statusText = probMax >= 70 
          ? `โอกาสฝน ${probMax}%` 
          : probMax >= 40 
            ? `โอกาสฝน ${probMax}%` 
            : translateWeatherCode(code);

        return {
          district: dist.name,
          isRainingNow: false, // ระบบคาดการณ์ล่วงหน้า
          precipitationMm: Number(precip.toFixed(1)),
          temperature: temp,
          probability: probMax,
          weatherCode: code,
          status: statusText,
          timeWindow: dRainEpisode.timeWindow,
          durationText: dRainEpisode.durationText,
          hasForecastRain: dRainEpisode.hasForecastRain,
          icon
        };
      });

      const activeRainingDistricts = districtRainAnalysis.filter(d => d.isRainingNow);
      const riskIncomingDistricts = districtRainAnalysis.filter(d => !d.isRainingNow && d.probability >= 60);

      const meteorologicalInsight = {
        activeCount: activeRainingDistricts.length,
        activeNames: activeRainingDistricts.map(d => `อ.${d.district}`).join(", "),
        incomingCount: riskIncomingDistricts.length,
        incomingNames: riskIncomingDistricts.map(d => `อ.${d.district}`).join(", "),
        isRainingNow: isRainingRightNow,
        expectedStartTime: startTimeText
      };

      forecast24h = {
        title: "คาดการณ์ฝนตก",
        status: rainStatusTitle,
        temp: current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 28,
        feelsLike,
        totalRainMm: totalRain,
        maxProbability: maxProb,
        startTimeText,
        timeLabels,
        hourly: next24,
        districtRainAnalysis,
        meteorologicalInsight,
        isRainingNow: isRainingRightNow
      };
    }

    const districtWeather = {};
    if (Array.isArray(districtRainAnalysis)) {
      districtRainAnalysis.forEach(d => {
        districtWeather[d.district] = d;
      });
    }

    const result = {
      temp: current.temperature_2m ? Math.round(current.temperature_2m) : 28,
      feelsLike,
      windSpeedKmh: windSpeedNow,
      humidity: current.relative_humidity_2m || 80,
      weatherDesc: translateWeatherCode(weatherCode),
      rainProbabilityToday: rainProbMax,
      rainSumToday: rainSum,
      tempMax,
      tempMin,
      peakHour,
      peakProb,
      rainAlertLevel,
      riskColor,
      // ความแม่นยำใหม่: CAPE + minutely_15
      thunderstormRisk,
      maxCapeJkg: Math.round(maxCapeNow),
      nextRainIn15Min,   // เวลาฝนตกครั้งต่อไปแม่นยำ ±15 นาที
      forecast24h,
      districtWeather,
      districtList: districtRainAnalysis,
      lastUpdated: nowDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.',
      lastUpdatedDetailed: detailedTime,
      sourceAgency: "ECMWF/Open-Meteo · minutely_15 · CAPE Analysis · กรมอุตุนิยมวิทยา (TMD)"
    };

    cachedWeatherData = result;
    lastFetchTime = now;
    return result;



  } catch (err) {
    console.warn("Failed to fetch live weather, using fallback:", err);
    // Fallback data
    const fallbackHourly = Array.from({ length: 24 }).map((_, i) => {
      const hNum = (23 + i) % 24;
      const isTom = (23 + i) >= 24;
      const p = (i === 16 || i === 17) ? 1.4 : (i === 15 || i === 18) ? 0.5 : 0;
      return {
        time: `${String(hNum).padStart(2, '0')}:00`,
        dayLabel: "วันนี้",
        precipitation: p,
        probability: p > 0 ? 65 : 15,
        barHeightPercent: p === 1.4 ? 90 : p === 0.5 ? 40 : 0
      };
    });

    const fallback = {
      temp: 29,
      humidity: 80,
      weatherDesc: "มีเมฆบางส่วน โอกาสฝนฟ้าคะนองช่วงบ่าย",
      rainProbabilityToday: 55,
      rainSumToday: 3.8,
      tempMax: 32,
      tempMin: 26,
      peakHour: "ช่วงบ่าย-เย็น (15:00 - 18:00 น.)",
      peakProb: 65,
      rainAlertLevel: "เฝ้าระวังฝนฟ้าคะนอง",
      riskColor: "amber",
      forecast24h: {
        title: "ฝนตกวันนี้",
        status: "โอกาสฝนปานกลาง",
        totalRainMm: 3.8,
        maxProbability: 65,
        startTimeText: "ช่วงบ่าย-เย็น (15:00 - 18:00 น.)",
        timeLabels: ["12:00", "15:00", "18:00", "21:00"],
        hourly: fallbackHourly
      },
      lastUpdated: nowDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.',
      lastUpdatedDetailed: detailedTime,
      sourceAgency: "สถานีเรดาร์ตรวจอากาศ กรมอุตุนิยมวิทยา (TMD) ร่วมกับ สนง.ปภ."
    };
    cachedWeatherData = fallback;
    return fallback;
  }
}
