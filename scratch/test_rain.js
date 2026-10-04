async function test() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=13.5991&longitude=100.5968&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=3";
  const res = await fetch(url);
  const data = await res.json();
  const hourly = data.hourly;
  const now = new Date();
  
  // Format current hour in Asia/Bangkok
  const bkkDatePart = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD
  const bkkHourPart = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit" }).padStart(2, '0');
  const bkkHourPrefix = `${bkkDatePart}T${bkkHourPart}`;
  
  let startIdx = hourly.time.findIndex(t => t.startsWith(bkkHourPrefix));
  if (startIdx < 0) {
    // find nearest
    const nowTimeStr = now.toISOString();
    startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i] >= bkkHourPrefix) {
        startIdx = i;
        break;
      }
    }
  }

  const next24 = [];
  for (let i = startIdx; i < startIdx + 24 && i < hourly.time.length; i++) {
    const rawTime = hourly.time[i]; // "2026-10-01T23:00"
    const [dPart, tPart] = rawTime.split("T");
    const isTomorrow = dPart > bkkDatePart;
    next24.push({
      isoTime: rawTime,
      datePart: dPart,
      time: tPart, // "23:00"
      hourNum: parseInt(tPart.split(":")[0], 10),
      isTomorrow,
      precipitation: hourly.precipitation ? hourly.precipitation[i] : 0,
      probability: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
    });
  }

  const totalRain = next24.reduce((acc, h) => acc + (h.precipitation || 0), 0);
  const maxProb = Math.max(...next24.map(h => h.probability || 0));

  // Determine Rain Status Header
  let rainStatus = "ไม่มีฝน";
  if (totalRain >= 30 || maxProb >= 90 && totalRain >= 15) {
    rainStatus = "ฝนตกหนัก";
  } else if (totalRain >= 10 || maxProb >= 70 && totalRain >= 5) {
    rainStatus = "ฝนตกปานกลาง";
  } else if (totalRain >= 0.5 || maxProb >= 40) {
    rainStatus = "ฝนเล็กน้อย";
  }

  // Determine Start Time
  let rainStartDesc = "ไม่มีแนวโน้มฝนตกหนัก";
  const firstRainIdx = next24.findIndex(h => h.precipitation >= 0.1 || h.probability >= 40);
  if (firstRainIdx === 0 && (next24[0].precipitation > 0 || next24[0].probability >= 50)) {
    rainStartDesc = "มีฝนตกอยู่ในขณะนี้";
  } else if (firstRainIdx >= 0) {
    const target = next24[firstRainIdx];
    const dayLabel = target.isTomorrow ? "พรุ่งนี้" : "วันนี้";
    rainStartDesc = `เริ่มราว ${dayLabel} ${target.time} น.`;
  }

  console.log("Status:", rainStatus);
  console.log("Summary:", `รวมประมาณ ${totalRain.toFixed(1)} มม. · โอกาสสูงสุด ${maxProb}% · ${rainStartDesc}`);
  console.log("Next 24 Count:", next24.length);
  console.log("Hours preview:", next24.map(h => `${h.time}: ${h.precipitation}mm (${h.probability}%)`).slice(0, 8));
}

test();
