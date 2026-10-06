/**
 * PrakanGuard Automated Official Flood & Weather Sync Engine — Backend Proxy & Cache
 * Endpoint: /api/official-flood
 * 
 * Features:
 * 1. 180s In-Memory Cache (3 Minutes TTL) to avoid API rate limits and throttling
 * 2. SHA-256 Version Stamp / Hash generation for O(1) Client-side Change Detection
 * 3. Traffy Fondue Open API for Live Samut Prakan Flood Points (with automatic search fallback)
 * 4. Open-Meteo Multi-Coordinate API for 6 Districts Weather (temp, rain prob, weather code)
 * 5. Strict Zero UI Impact data formatting
 */

import crypto from 'crypto';
import { isPointInSamutPrakan, detectDistrictForCoordinates } from '../src/data/samutPrakanBoundary.js';

// In-Memory Cache Storage (180 seconds TTL)
const CACHE_TTL_MS = 180 * 1000;
let cacheStore = {
  timestamp: 0,
  data: null
};

// 6 Districts Configuration in Samut Prakan
const DISTRICTS_CONFIG = [
  { key: 'เมือง', name: 'เมืองสมุทรปราการ', lat: 13.5991, lng: 100.5998 },
  { key: 'บางพลี', name: 'บางพลี', lat: 13.6052, lng: 100.7088 },
  { key: 'บางบ่อ', name: 'บางบ่อ', lat: 13.5843, lng: 100.8492 },
  { key: 'บางเสาธง', name: 'บางเสาธง', lat: 13.6046, lng: 100.8187 },
  { key: 'พระประแดง', name: 'พระประแดง', lat: 13.6586, lng: 100.5332 },
  { key: 'พระสมุทรเจดีย์', name: 'พระสมุทรเจดีย์', lat: 13.5516, lng: 100.5845 }
];

// Helper: Translate WMO Weather Codes to Thai
function decodeWeatherCode(code) {
  if (code === 0) return 'ท้องฟ้าแจ่มใส';
  if (code === 1 || code === 2) return 'ท้องฟ้าโปร่ง มีเมฆบางส่วน';
  if (code === 3) return 'มีเมฆมาก';
  if (code >= 45 && code <= 48) return 'มีหมอกหนา';
  if (code >= 51 && code <= 55) return 'ฝนละอองโปรยปราย';
  if (code >= 61 && code <= 65) return 'ฝนตกปานกลาง';
  if (code >= 80 && code <= 82) return 'ฝนซู่กระจาย';
  if (code >= 95) return 'ฝนฟ้าคะนอง';
  return 'มีเมฆเป็นส่วนมาก';
}

/**
 * Fetch Live Flood Points from Traffy Fondue Open API
 * Primary: team/complaint endpoint
 * Fallback: search endpoint for #น้ำท่วม
 */
async function fetchOfficialFloodPoints() {
  const primaryUrl = `https://publicapi.traffy.in.th/share/team/complaint?province=${encodeURIComponent('สมุทรปราการ')}&type=${encodeURIComponent('น้ำท่วม')}&state=start,doing`;
  const fallbackUrl = `https://publicapi.traffy.in.th/share/search?hashtag=${encodeURIComponent('น้ำท่วม')}&keyword=${encodeURIComponent('สมุทรปราการ')}`;

  let rawList = [];

  // 1. Try Primary Endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(primaryUrl, {
      headers: { 'User-Agent': 'PrakanGuard-OfficialSync/2.0', 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      rawList = json.results || json.data || (Array.isArray(json) ? json : []);
    }
  } catch (err) {
    // Primary failed or timed out, will proceed to fallback
  }

  // 2. Try Fallback Endpoint if primary returned empty or failed
  if (!rawList || rawList.length === 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'PrakanGuard-OfficialSync/2.0', 'Accept': 'application/json' },
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

  // Standardize output format
  const floodPoints = [];
  if (Array.isArray(rawList)) {
    rawList.forEach((item, index) => {
      let lat = null;
      let lng = null;

      if (Array.isArray(item.coord) && item.coord.length >= 2) {
        // [lon, lat] format
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

      // Reject any reports containing Bangkok / non-Samut Prakan text
      const fullText = `${item.address || ''} ${item.description || ''} ${item.comment || ''}`.toLowerCase();
      if (
        fullText.includes('กรุงเทพ') || fullText.includes('bangkok') || 
        fullText.includes('นนทบุรี') || fullText.includes('ดินแดง') || 
        fullText.includes('ตลิ่งชัน') || fullText.includes('คลองเตย') || 
        fullText.includes('พระนคร') || fullText.includes('จตุจักร') || 
        fullText.includes('พญาไท') || fullText.includes('ราชเทวี') ||
        fullText.includes('สยาม') || fullText.includes('บางกอก')
      ) {
        return;
      }

      // Realign Preng if mentioned
      if (fullText.includes('เปร็ง') || fullText.includes('สี่แยกเปร็ง') || fullText.includes('แยกเปร็ง')) {
        lat = 13.6650;
        lng = 100.8850;
        item.district = 'บางบ่อ';
      }

      // Geo-boundary validation strictly for Samut Prakan (No Bangkok/external points allowed!)
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && isPointInSamutPrakan(lat, lng)) {
        const detectedDistrict = detectDistrictForCoordinates(lat, lng) || 'สมุทรปราการ';
        const ticketId = item.ticket_id || item.id || `traffy-${lat.toFixed(4)}-${lng.toFixed(4)}-${index}`;
        floodPoints.push({
          id: String(ticketId),
          ticket_id: String(ticketId),
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          description: item.description || item.comment || 'รายงานน้ำท่วมขังรอการระบาย (Traffy Fondue)',
          district: detectedDistrict,
          address: item.address || '',
          state: item.state || 'doing',
          photo: item.photo || item.photo_url || null,
          timestamp: item.timestamp || new Date().toISOString(),
          source: 'Traffy Fondue Open API'
        });
      }
    });
  }

  return floodPoints;
}

/**
 * Fetch Live Weather for 6 Districts from Open-Meteo API
 */
async function fetchOfficialWeather() {
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
        const cfg = DISTRICTS_CONFIG[index];
        if (!cfg) return;

        const temp = item.current ? Math.round(item.current.temperature_2m * 10) / 10 : 31.0;
        const weatherCode = item.current ? item.current.weather_code : 2;

        let rainProb = 35;
        if (item.hourly && Array.isArray(item.hourly.precipitation_probability)) {
          const probs = item.hourly.precipitation_probability.slice(0, 24).filter(v => v !== null && !isNaN(v));
          if (probs.length > 0) {
            rainProb = Math.max(...probs);
          }
        }

        totalTemp += temp;
        if (rainProb > maxRainProb) maxRainProb = rainProb;

        const info = {
          key: cfg.key,
          name: cfg.name,
          lat: cfg.lat,
          lng: cfg.lng,
          temp,
          tempFormatted: `${temp.toFixed(1)}°C`,
          rain_prob: rainProb,
          rain_prob_formatted: `${rainProb}%`,
          weather_code: weatherCode,
          weather_description: decodeWeatherCode(weatherCode)
        };

        districtsResult[cfg.key] = info;
        districtsResult[cfg.name] = info;
      });
    }
  } catch (err) {
    // Fallback safe estimates if Open-Meteo is temporarily unreachable
    DISTRICTS_CONFIG.forEach(cfg => {
      const info = {
        key: cfg.key,
        name: cfg.name,
        lat: cfg.lat,
        lng: cfg.lng,
        temp: 31.0,
        tempFormatted: '31.0°C',
        rain_prob: 35,
        rain_prob_formatted: '35%',
        weather_code: 2,
        weather_description: 'ท้องฟ้าโปร่ง มีเมฆบางส่วน'
      };
      districtsResult[cfg.key] = info;
      districtsResult[cfg.name] = info;
    });
    totalTemp = 31.0 * DISTRICTS_CONFIG.length;
    maxRainProb = 35;
  }

  const avgTemp = DISTRICTS_CONFIG.length > 0 ? (totalTemp / DISTRICTS_CONFIG.length).toFixed(1) : '31.0';

  return {
    province: 'สมุทรปราการ',
    temperature_2m: parseFloat(avgTemp),
    precipitation_probability: maxRainProb,
    weather_code: maxRainProb >= 60 ? 80 : 2,
    weather_description: decodeWeatherCode(maxRainProb >= 60 ? 80 : 2),
    districts: districtsResult
  };
}

/**
 * Compute Deterministic Version Stamp for Change Detection
 */
function computeVersionStamp(floodPoints, weather) {
  const sortedPoints = [...floodPoints].sort((a, b) => String(a.ticket_id).localeCompare(String(b.ticket_id)));
  const pointsDigest = sortedPoints.map(p => `${p.ticket_id}:${p.lat}:${p.lng}:${p.state || ''}`).join('|');
  
  const weatherDistricts = weather?.districts || {};
  const weatherDigest = DISTRICTS_CONFIG.map(cfg => {
    const d = weatherDistricts[cfg.key] || {};
    return `${cfg.key}:${d.temp || 0}:${d.rain_prob || 0}`;
  }).join(';');

  const raw = `${pointsDigest}###${weatherDigest}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

/**
 * Main API Route Handler
 */
export default async function handler(req, res) {
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
  const cacheAgeMs = now - cacheStore.timestamp;

  // 1. Return from In-Memory Cache if valid (< 180s)
  if (cacheStore.data && cacheAgeMs < CACHE_TTL_MS) {
    const payload = {
      ...cacheStore.data,
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

  // 2. Refresh from Open APIs
  try {
    const [floodPoints, weather] = await Promise.all([
      fetchOfficialFloodPoints(),
      fetchOfficialWeather()
    ]);

    const version = computeVersionStamp(floodPoints, weather);

    const payload = {
      status: 'success',
      version,
      timestamp: now,
      fromCache: false,
      cacheTtlSeconds: 180,
      totalFloodPoints: floodPoints.length,
      floodPoints,
      weather
    };

    // Store in In-Memory Cache
    cacheStore = {
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
    const fallbackPayload = cacheStore.data || {
      status: 'error',
      version: 'fallback-0000',
      message: error.message || 'Official feed unavailable',
      floodPoints: [],
      weather: { districts: {} }
    };

    if (res && res.setHeader) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(200).json(fallbackPayload);
    }
    return new Response(JSON.stringify(fallbackPayload), { status: 200, headers });
  }
}
