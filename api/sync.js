/**
 * Autonomous Real-Time Flood & Weather Sync Engine — Backend Cache Layer
 * Endpoint: /api/sync
 * 
 * Features:
 * - 180s In-Memory Cache (Rate-Limit Safe & Zero API Throttling)
 * - Traffy Fondue Open API for Live Samut Prakan Flood Complaints
 * - Open-Meteo Multi-Coordinate API for 6 Districts Weather & Rain Probability
 * - Compatible with Vercel Serverless Functions & Standalone Node.js HTTP servers
 */

// 1. In-Memory Cache Store (180 seconds TTL)
const CACHE_TTL_MS = 180 * 1000;
let memoryCache = {
  timestamp: 0,
  data: null
};

// 2. Samut Prakan 6 Districts Coordinates (Open-Meteo)
const DISTRICTS_CONFIG = [
  { name: 'เมืองสมุทรปราการ', lat: 13.5991, lng: 100.5998 },
  { name: 'บางพลี', lat: 13.6052, lng: 100.7088 },
  { name: 'บางบ่อ', lat: 13.5843, lng: 100.8492 },
  { name: 'บางเสาธง', lat: 13.6046, lng: 100.8187 },
  { name: 'พระประแดง', lat: 13.6586, lng: 100.5332 },
  { name: 'พระสมุทรเจดีย์', lat: 13.5516, lng: 100.5845 }
];

// Helper to translate WMO weather codes to Thai descriptions
function getWeatherDescription(code) {
  if (code === 0) return 'ท้องฟ้าแจ่มใส';
  if (code === 1 || code === 2) return 'ท้องฟ้าโปร่ง มีเมฆบางส่วน';
  if (code === 3) return 'มีเมฆมาก';
  if (code >= 45 && code <= 48) return 'มีหมอกหนา';
  if (code >= 51 && code <= 55) return 'ฝนละอองโปรยปราย';
  if (code >= 61 && code <= 65) return 'ฝนตกต่อเนื่อง';
  if (code >= 80 && code <= 82) return 'ฝนซู่กระจาย';
  if (code >= 95) return 'ฝนฟ้าคะนอง';
  return 'สภาพอากาศแปรปรวน';
}

/**
 * Fetch Live Flood Complaints from Traffy Fondue Open API
 */
async function fetchTraffyFloodPoints() {
  const primaryUrl = `https://publicapi.traffy.in.th/share/team/complaint?province=${encodeURIComponent('สมุทรปราการ')}&type=${encodeURIComponent('น้ำท่วม')}&state=start,doing`;
  const fallbackUrl = `https://publicapi.traffy.in.th/share/search?hashtag=${encodeURIComponent('น้ำท่วม')}&keyword=${encodeURIComponent('สมุทรปราการ')}`;

  let rawList = [];

  // Try Primary Endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(primaryUrl, {
      headers: { 'User-Agent': 'PrakanGuard-SyncEngine/1.0', 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      rawList = json.results || json.data || (Array.isArray(json) ? json : []);
    }
  } catch (err) {
    // Primary failed, continue to fallback
  }

  // If Primary empty or unavailable, try fallback search
  if (!rawList || rawList.length === 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'PrakanGuard-SyncEngine/1.0', 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        rawList = json.results || json.data || [];
      }
    } catch (err) {
      // Fallback failed
    }
  }

  // Standardize Flood Point Schema
  const floodPoints = [];
  if (Array.isArray(rawList)) {
    rawList.forEach((item, index) => {
      let lat = null;
      let lng = null;

      // Extract coords: can be [lon, lat], [lat, lon], string "lat,lon", or coords object
      if (Array.isArray(item.coord) && item.coord.length >= 2) {
        // Traffy share/search format: [lon, lat]
        const v1 = parseFloat(item.coord[0]);
        const v2 = parseFloat(item.coord[1]);
        if (v1 > 50 && v2 < 30) {
          lng = v1; lat = v2;
        } else {
          lat = v1; lng = v2;
        }
      } else if (Array.isArray(item.coords) && item.coords.length >= 2) {
        const v1 = parseFloat(item.coords[0]);
        const v2 = parseFloat(item.coords[1]);
        if (v1 > 50 && v2 < 30) {
          lng = v1; lat = v2;
        } else {
          lat = v1; lng = v2;
        }
      } else if (typeof item.coords === 'string' && item.coords.includes(',')) {
        const parts = item.coords.split(',').map(s => parseFloat(s.trim()));
        lat = parts[0]; lng = parts[1];
      } else if (item.latitude && item.longitude) {
        lat = parseFloat(item.latitude);
        lng = parseFloat(item.longitude);
      }

      // Filter: Validate within Samut Prakan general bounds (13.3 - 13.8 N, 100.4 - 101.0 E)
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat >= 13.3 && lat <= 13.85 && lng >= 100.4 && lng <= 101.05) {
        const ticketId = item.ticket_id || item.id || `traffy-${lat.toFixed(4)}-${lng.toFixed(4)}-${index}`;
        floodPoints.push({
          id: String(ticketId),
          ticketId: String(ticketId),
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          description: item.description || item.comment || 'รายงานน้ำท่วมขังรอการระบาย (Traffy Fondue)',
          address: item.address || '',
          state: item.state || 'doing',
          photo: item.photo || item.photo_url || null,
          source: 'Traffy Fondue Open API',
          timestamp: item.timestamp || new Date().toISOString()
        });
      }
    });
  }

  return floodPoints;
}

/**
 * Fetch Live Weather & Rain Forecast for 6 Districts from Open-Meteo API
 */
async function fetchDistrictsWeather() {
  const lats = DISTRICTS_CONFIG.map(d => d.lat).join(',');
  const lngs = DISTRICTS_CONFIG.map(d => d.lng).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,precipitation,weather_code&hourly=precipitation_probability&forecast_days=1&timezone=Asia%2FBangkok`;

  const districtsResult = {};
  let totalTemp = 0;
  let maxRainProb = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : [data];

      list.forEach((item, index) => {
        const distCfg = DISTRICTS_CONFIG[index];
        if (!distCfg) return;

        const temp = item.current ? Math.round(item.current.temperature_2m * 10) / 10 : 31.0;
        const weatherCode = item.current ? item.current.weather_code : 2;
        
        // Extract max rain probability from hourly forecast today
        let rainProb = 30;
        if (item.hourly && Array.isArray(item.hourly.precipitation_probability)) {
          const probs = item.hourly.precipitation_probability.slice(0, 24);
          if (probs.length > 0) {
            rainProb = Math.max(...probs);
          }
        }

        totalTemp += temp;
        if (rainProb > maxRainProb) maxRainProb = rainProb;

        districtsResult[distCfg.name] = {
          name: distCfg.name,
          lat: distCfg.lat,
          lng: distCfg.lng,
          temp,
          tempFormatted: `${temp.toFixed(1)}°C`,
          rainProbability: rainProb,
          rainProbabilityFormatted: `${rainProb}%`,
          weatherCode,
          weatherDescription: getWeatherDescription(weatherCode)
        };
      });
    }
  } catch (err) {
    // Fallback safe defaults if Open-Meteo times out
    DISTRICTS_CONFIG.forEach(d => {
      districtsResult[d.name] = {
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        temp: 31.0,
        tempFormatted: '31.0°C',
        rainProbability: 35,
        rainProbabilityFormatted: '35%',
        weatherCode: 2,
        weatherDescription: 'ท้องฟ้าโปร่ง มีเมฆบางส่วน'
      };
    });
    totalTemp = 31.0 * DISTRICTS_CONFIG.length;
    maxRainProb = 35;
  }

  const avgTemp = DISTRICTS_CONFIG.length > 0 ? (totalTemp / DISTRICTS_CONFIG.length).toFixed(1) : '31.0';
  let alertLevel = 'ปกติ';
  if (maxRainProb >= 70) alertLevel = 'วิกฤต (ฝนตกหนัก)';
  else if (maxRainProb >= 40) alertLevel = 'เฝ้าระวังฝนฟ้าคะนอง';

  return {
    districts: districtsResult,
    summary: {
      province: 'สมุทรปราการ',
      averageTemp: `${avgTemp}°C`,
      maxRainProbability: `${maxRainProb}%`,
      alertLevel,
      lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.'
    }
  };
}

/**
 * Main Controller Handler (Vercel Serverless Function & Standalone HTTP)
 */
export default async function handler(req, res) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (req.method === 'OPTIONS') {
    if (res && res.writeHead) {
      res.writeHead(204, headers);
      res.end();
      return;
    }
    return new Response(null, { status: 204, headers });
  }

  const now = Date.now();
  const cacheAgeMs = now - memoryCache.timestamp;

  // Serve from In-Memory Cache if fresh (< 180s)
  if (memoryCache.data && cacheAgeMs < CACHE_TTL_MS) {
    const payload = {
      ...memoryCache.data,
      fromCache: true,
      cacheAgeSeconds: Math.floor(cacheAgeMs / 1000),
      cacheTtlSeconds: Math.floor((CACHE_TTL_MS - cacheAgeMs) / 1000)
    };

    if (res && res.setHeader) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=60');
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...headers, 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60' }
    });
  }

  // Refresh data from Traffy Fondue & Open-Meteo in parallel
  try {
    const [floodPoints, weather] = await Promise.all([
      fetchTraffyFloodPoints(),
      fetchDistrictsWeather()
    ]);

    const payload = {
      status: 'success',
      timestamp: now,
      fromCache: false,
      cacheTtlSeconds: 180,
      floodPointsCount: floodPoints.length,
      floodPoints,
      weather
    };

    // Update in-memory cache
    memoryCache = {
      timestamp: now,
      data: payload
    };

    if (res && res.setHeader) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=60');
      return res.status(200).json(payload);
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...headers, 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60' }
    });
  } catch (error) {
    const fallbackPayload = memoryCache.data || {
      status: 'error',
      message: error.message || 'Sync error',
      floodPoints: [],
      weather: { districts: {}, summary: {} }
    };

    if (res && res.setHeader) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(200).json(fallbackPayload);
    }
    return new Response(JSON.stringify(fallbackPayload), { status: 200, headers });
  }
}
