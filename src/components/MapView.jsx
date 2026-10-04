import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation, BookOpen } from 'lucide-react';
import { 
  SAMUT_PRAKAN_DISTRICTS_GEOJSON, 
  SAMUT_PRAKAN_MASK_GEOJSON,
  DISTRICT_METADATA 
} from '../data/samutPrakanBoundary';
import { getFloodLevel } from '../data/floodStandards';

// Helper to determine effective level (1: 5-20cm Green, 2: 21-50cm Yellow, 3: >50cm Red)
export function resolveLevel(item) {
  if (item && item.depthCm !== undefined && item.depthCm !== null && !isNaN(Number(item.depthCm))) {
    return getFloodLevel(Number(item.depthCm));
  }
  return Number(item?.level) || 1;
}

// Check if a point is dried up or resolved
export function isPointDry(item) {
  if (!item) return true;
  if (item.isResolved === true || item.isActive === false) return true;
  if (item.depthCm !== undefined && item.depthCm !== null && Number(item.depthCm) <= 0) return true;
  if (item.waterTrend === 'dry' || item.status === 'dry' || item.status === 'resolved' || item.isDry) return true;
  return false;
}

// Unified Official Flood Pin Icon Generator for ALL points and citizen reports
function createOfficialFloodPin({ level, depthCm, hasPhoto, isSelected, isFalling, name }) {
  // Colors strictly conforming to standard:
  // Level 1: Green #16a34a (5-20 cm)
  // Level 2: Amber/Yellow #eab308 (21-50 cm)
  // Level 3: Red #dc2626 (>50 cm)
  let primaryColor = '#16a34a';
  let gradientStart = '#22c55e';
  let gradientEnd = '#15803d';
  let levelClass = 'pg-pin-l1';

  if (level === 2) {
    primaryColor = '#eab308';
    gradientStart = '#facc15';
    gradientEnd = '#ca8a04';
    levelClass = 'pg-pin-l2';
  } else if (level === 3) {
    primaryColor = '#dc2626';
    gradientStart = '#ef4444';
    gradientEnd = '#b91c1c';
    levelClass = 'pg-pin-l3';
  }

  const depthText = (depthCm !== undefined && depthCm !== null && !isNaN(Number(depthCm)) && Number(depthCm) > 0)
    ? `${depthCm}`
    : '';

  const isL3 = level === 3;
  const pulseHtml = isL3 
    ? `<div style="position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:28px;height:28px;border-radius:50%;background:rgba(220,38,38,0.35);animation:pgPinPulse 1.8s ease-out infinite;pointer-events:none;z-index:0;"></div>`
    : '';

  const photoBadgeHtml = hasPhoto
    ? `<div style="position:absolute;top:-4px;right:-4px;width:17px;height:17px;background:#ffffff;border:1.5px solid ${primaryColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:10;" title="มีภาพถ่ายสถานการณ์จริง">📷</div>`
    : '';

  const fallingBadgeHtml = isFalling
    ? `<div style="position:absolute;top:-4px;left:-4px;width:17px;height:17px;background:#0d9488;border:1.5px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:10;" title="น้ำกำลังลด">📉</div>`
    : '';

  const selectedRingHtml = isSelected
    ? `<div style="position:absolute;inset:-6px;border-radius:24px;border:2.5px solid #0284c7;box-shadow:0 0 12px rgba(2,132,199,0.8);animation:pgSelectedGlow 1.5s ease-in-out infinite alternate;pointer-events:none;z-index:1;"></div>`
    : '';

  const fontSize = depthText.length >= 3 ? '8' : (depthText.length === 2 ? '9.5' : '11');
  const svgInnerContent = depthText
    ? `<text x="17" y="17.2" font-family="'Prompt', -apple-system, sans-serif" font-size="${fontSize}" font-weight="900" fill="${primaryColor}" text-anchor="middle" dominant-baseline="central">${depthText}</text>`
    : `<path d="M17 10C17 10 13.5 14.5 13.5 17C13.5 18.93 15.07 20.5 17 20.5C18.93 20.5 20.5 18.93 20.5 17C20.5 14.5 17 10 17 10Z" fill="${primaryColor}"/>`;

  const html = `
    <div class="pg-flood-pin-container ${levelClass} ${isSelected ? 'pg-pin-selected' : ''}" style="position:relative;width:34px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transform-origin:bottom center;transition:transform 0.2s ease;">
      ${pulseHtml}
      ${selectedRingHtml}
      ${photoBadgeHtml}
      ${fallingBadgeHtml}
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:2;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.38));">
        <defs>
          <linearGradient id="pgGrad-${level}" x1="17" y1="2" x2="17" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${gradientStart}" />
            <stop offset="100%" stop-color="${gradientEnd}" />
          </linearGradient>
        </defs>
        <!-- Teardrop Pin Path -->
        <path d="M17 43C17 43 32 27 32 17C32 8.71573 25.2843 2 17 2C8.71573 2 2 8.71573 2 17C2 27 17 43 17 43Z" fill="url(#pgGrad-${level})" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Inner White Disc -->
        <circle cx="17" cy="17" r="9.5" fill="#ffffff" />
        ${svgInnerContent}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'pg-unified-flood-marker',
    html: html,
    iconSize: [34, 44],
    iconAnchor: [17, 43],
    popupAnchor: [0, -44]
  });
}

// Function to merge duplicate points & declutter dense points
// Eliminates duplicate pins at the same location (e.g. Hua Chiew / Manthana) and retains the one with photos
export function deduplicateAndDeclutterPoints(citizenList = [], officialList = [], isMobileView = false) {
  const thresholdKm = isMobileView ? 0.35 : 0.08; // ~350m on mobile, ~80m on desktop

  // Normalize and combine: citizen reports come first so user reports & photos take precedence
  const combined = [
    ...citizenList.map(r => ({
      ...r,
      isCitizen: true,
      photoUrl: r.photoUrl || r.photo_url || r.photo || null
    })),
    ...officialList.map(p => ({
      ...p,
      isCitizen: false,
      photoUrl: p.photoUrl || p.photo_url || p.photo || null
    }))
  ];

  // Filter out dry/resolved
  const activeOnly = combined.filter(pt => !isPointDry(pt));

  // Sort: photo first, active first, higher severity first
  activeOnly.sort((a, b) => {
    const aPhoto = !!(a.photoUrl || a.photo_url || a.photo);
    const bPhoto = !!(b.photoUrl || b.photo_url || b.photo);
    if (aPhoto && !bPhoto) return -1;
    if (!aPhoto && bPhoto) return 1;

    if (a.isCitizen && !b.isCitizen) return -1;
    if (!a.isCitizen && b.isCitizen) return 1;

    const lvlA = resolveLevel(a);
    const lvlB = resolveLevel(b);
    if (lvlB !== lvlA) return lvlB - lvlA;
    return (Number(b.depthCm) || 0) - (Number(a.depthCm) || 0);
  });

  const retained = [];
  for (const pt of activeOnly) {
    if (!pt || typeof pt.lat !== 'number' || typeof pt.lng !== 'number' || isNaN(pt.lat) || isNaN(pt.lng)) continue;

    let isDuplicate = false;
    for (const r of retained) {
      const dLat = (pt.lat - r.lat) * 111;
      const dLng = (pt.lng - r.lng) * 111 * Math.cos(pt.lat * Math.PI / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

      const sameName = pt.name && r.name && (
        pt.name.trim().toLowerCase() === r.name.trim().toLowerCase() ||
        (pt.name.includes('มัณฑนา') && r.name.includes('มัณฑนา')) ||
        (pt.name.includes('หัวเฉียว') && r.name.includes('หัวเฉียว'))
      );

      // Same location or matching name within 1.2km
      if (distKm < thresholdKm || (sameName && distKm < 1.2)) {
        isDuplicate = true;
        // Merge photo from pt to r if r doesn't have one
        const ptPhoto = pt.photoUrl || pt.photo_url || pt.photo;
        if (!(r.photoUrl || r.photo_url || r.photo) && ptPhoto) {
          r.photoUrl = ptPhoto;
        }
        break;
      }
    }

    if (!isDuplicate) {
      retained.push(pt);
    }
  }

  return retained;
}

export default function MapView({ 
  points = [], 
  citizenReports = [],
  onSelectPoint, 
  selectedPoint,
  selectedDistrict,
  onSelectDistrict,
  userLocation,
  onLocateMe,
  locationAccuracy,
  onOpenStandards,
  isPickingLocation = false,
  onMapLocationPicked,
  flyToLocation,
  theme = 'light',
  isTopPanelCollapsed = false
}) {
  const isDark = theme === 'dark';
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const maskLayerRef = useRef(null);
  const districtLayersRef = useRef([]);
  const markersRef = useRef([]);
  const citizenMarkersRef = useRef([]);
  const radarCircleLayersRef = useRef([]);
  const markersByIdRef = useRef({});
  const lastFlyToTimeRef = useRef(0);
  const temporaryPickMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);

  const isPickingLocationRef = useRef(isPickingLocation);
  isPickingLocationRef.current = isPickingLocation;
  const onMapLocationPickedRef = useRef(onMapLocationPicked);
  onMapLocationPickedRef.current = onMapLocationPicked;

  // Map Tile Style: 'google-roadmap' | 'google-satellite' | 'google-terrain'
  const [mapStyle, setMapStyle] = useState('google-roadmap');

  // Inject CSS animations for pin pulsing once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('pg-pin-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'pg-pin-styles';
      styleEl.innerHTML = `
        @keyframes pgPinPulse {
          0% { transform: translateX(-50%) scale(0.6); opacity: 0.9; }
          100% { transform: translateX(-50%) scale(2.4); opacity: 0; }
        }
        @keyframes pgSelectedGlow {
          0% { box-shadow: 0 0 6px rgba(2,132,199,0.5); }
          100% { box-shadow: 0 0 16px rgba(2,132,199,0.95); }
        }
        .pg-flood-pin-container:hover {
          transform: scale(1.18);
        }
        .pg-pin-selected {
          transform: scale(1.22) !important;
          z-index: 9999 !important;
        }
        .outside-province-mask {
          filter: drop-shadow(0 0 24px rgba(2, 6, 23, 0.98));
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Robust Tile Config Helper with Fallbacks
  const getTileConfig = (style) => {
    if (style === 'google-satellite') {
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=y&hl=th&x={x}&y={y}&z={z}',
        fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          keepBuffer: 12,
          updateWhenZooming: false,
          updateWhenIdle: false,
          crossOrigin: true,
          attribution: '&copy; ภาพถ่ายดาวเทียม Google / Esri'
        }
      };
    }
    // Default: Google Roadmap (คมชัด โหลดไว)
    return {
      url: 'https://mt{s}.google.com/vt/lyrs=m&hl=th&x={x}&y={y}&z={z}',
      fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        keepBuffer: 12,
        updateWhenZooming: false,
        updateWhenIdle: false,
        crossOrigin: true,
        attribution: '&copy; Google Maps / Esri'
      }
    };
  };

  const createTileLayer = (config) => {
    const layer = L.tileLayer(config.url, config.options);
    if (config.fallbackUrl) {
      layer.on('tileerror', (e) => {
        if (e.tile && !e.tile._hasFallenBack) {
          e.tile._hasFallenBack = true;
          const { x, y, z } = e.coords;
          e.tile.src = config.fallbackUrl
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y);
        }
      });
    }
    return layer;
  };

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    // Set seamless background color to avoid grey flashing when zooming
    mapContainerRef.current.style.backgroundColor = isDark ? '#0b132b' : '#e6ecf2';

    // Samut Prakan Boundary Bounds: locks pan & zoom strictly to Samut Prakan
    const SAMUT_PRAKAN_BOUNDS_RESTRICT = [
      [13.4100, 100.3800], // Southwest
      [13.7800, 100.9800]  // Northeast
    ];

    const map = L.map(mapContainerRef.current, {
      center: [13.5850, 100.6500], // Samut Prakan Center
      zoom: 10.3, // Wider overview for cinematic welcome entrance zoom
      minZoom: 10,
      maxZoom: 19,
      maxBounds: SAMUT_PRAKAN_BOUNDS_RESTRICT,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    });

    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Dedicated Pane for Outside-Province Blur & Dimming Mask
    if (!map.getPane('provinceMaskPane')) {
      const maskPane = map.createPane('provinceMaskPane');
      maskPane.style.zIndex = 250; // Above tilePane (200), below overlayPane (400)
      maskPane.style.pointerEvents = 'none';
    }

    // Initial Tile Layer
    const config = getTileConfig('google-roadmap');
    tileLayerRef.current = createTileLayer(config).addTo(map);
    mapInstanceRef.current = map;

    // Expose map reference for external background sync engines
    if (typeof window !== 'undefined') {
      window.leafletMap = map;
      window.__leaflet_map = map;
      window.__pgMap = map;
    }

    // Handle Map Clicks for Picking Citizen Location
    map.on('click', (e) => {
      if (isPickingLocationRef.current && onMapLocationPickedRef.current) {
        if (temporaryPickMarkerRef.current) {
          temporaryPickMarkerRef.current.setLatLng([e.latlng.lat, e.latlng.lng]);
        } else {
          const pinIcon = L.divIcon({
            className: 'picked-pin',
            html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4));">📍</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          temporaryPickMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng], { icon: pinIcon }).addTo(map);
        }
        onMapLocationPickedRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Invalidate size on load
    const timer1 = setTimeout(() => map.invalidateSize(), 200);
    const timer2 = setTimeout(() => map.invalidateSize(), 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapInstanceRef.current = null;
      if (typeof window !== 'undefined') {
        if (window.leafletMap === map) window.leafletMap = null;
        if (window.__leaflet_map === map) window.__leaflet_map = null;
        if (window.__pgMap === map) window.__pgMap = null;
      }
    };
  }, []);

  // Update map cursor when in location-picking mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.style.cursor = isPickingLocation ? 'crosshair' : '';
  }, [isPickingLocation]);

  // Render Outside Samut Prakan Mask
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (maskLayerRef.current) {
      map.removeLayer(maskLayerRef.current);
      maskLayerRef.current = null;
    }

    const maskFillColor = '#020617';
    const maskFillOpacity = (isDark || mapStyle === 'google-satellite') ? 0.90 : 0.84;

    maskLayerRef.current = L.geoJSON(SAMUT_PRAKAN_MASK_GEOJSON, {
      pane: 'provinceMaskPane',
      style: {
        fillColor: maskFillColor,
        fillOpacity: maskFillOpacity,
        color: '#38bdf8',
        weight: 2.5,
        opacity: 0.95,
        className: 'outside-province-mask'
      },
      interactive: false
    }).addTo(map);

    return () => {
      if (maskLayerRef.current && map) {
        map.removeLayer(maskLayerRef.current);
        maskLayerRef.current = null;
      }
    };
  }, [isDark, mapStyle]);

  // Render Exact 6-District Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    districtLayersRef.current.forEach(layer => map.removeLayer(layer));
    districtLayersRef.current = [];

    SAMUT_PRAKAN_DISTRICTS_GEOJSON.features.forEach(feature => {
      const isSelected = selectedDistrict === feature.properties.districtName;
      const districtColor = feature.properties.color || '#0284c7';

      const layer = L.geoJSON(feature, {
        style: {
          color: isSelected ? '#1d4ed8' : districtColor,
          weight: isSelected ? 4.5 : 2.5,
          opacity: 0.9,
          fillColor: districtColor,
          fillOpacity: isSelected ? 0.20 : 0.06
        }
      }).addTo(map);

      // Clean, small district label tooltip
      layer.bindTooltip(`${feature.properties.districtName}`, {
        permanent: true,
        direction: 'center',
        className: 'bg-white/95 text-slate-800 font-prompt text-[11px] border border-slate-300 px-2 py-0.5 rounded-lg shadow-sm font-bold'
      });



      districtLayersRef.current.push(layer);
    });
  }, [selectedDistrict, onSelectDistrict]);

  // Pan & Zoom Smoothly when selectedDistrict changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (flyToLocation && flyToLocation.ts && Date.now() - flyToLocation.ts < 3500) {
      return;
    }
    if (Date.now() - lastFlyToTimeRef.current < 2000) {
      return;
    }

    const meta = DISTRICT_METADATA[selectedDistrict] || DISTRICT_METADATA["ทั้งหมด"];
    if (meta && meta.center) {
      map.flyTo(meta.center, meta.zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [selectedDistrict]);

  // Switch Tile Layer Smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = getTileConfig(mapStyle);
    tileLayerRef.current = createTileLayer(config).addTo(map);

    if (maskLayerRef.current && maskLayerRef.current.bringToFront) {
      maskLayerRef.current.bringToFront();
    }
    districtLayersRef.current.forEach(layer => layer.bringToFront());

    map.invalidateSize();
  }, [mapStyle]);

  // Helper to build unified popup HTML
  const buildPopupHtml = (item, isCitizen) => {
    const photo = item.photoUrl || item.photo_url || item.photo;
    if (item && photo && typeof window !== 'undefined') {
      window.__pgPhotos = window.__pgPhotos || {};
      window.__pgPhotos[item.id] = {
        url: photo,
        title: item.name,
        time: item.reportedAt || item.updatedAt || item.time || ''
      };
    }

    const level = resolveLevel(item);
    const isL3 = level === 3;
    const isL2 = level === 2;
    const levelBadgeName = isL3 ? '🔴 น้ำท่วมวิกฤต' : (isL2 ? '🟡 น้ำท่วมปานกลาง' : '🟢 น้ำท่วมปกติ');
    const levelBg = isL3 ? '#fef2f2' : (isL2 ? '#fffbeb' : '#f0fdf4');
    const levelText = isL3 ? '#991b1b' : (isL2 ? '#92400e' : '#166534');
    const levelBorder = isL3 ? '#f87171' : (isL2 ? '#fbbf24' : '#4ade80');
    const depthBadgeText = item.depthCm ? `${item.depthCm} ซม.` : (item.depthRange || 'เฝ้าระวัง');

    const photoHtml = photo ? `
      <div 
        onclick="if(window.pgOpenLightboxById){window.pgOpenLightboxById('${item.id}');}else if(window.pgOpenLightbox){window.pgOpenLightbox('${photo}','${(item.name||'').replace(/'/g, "\\'")}','${item.reportedAt||''}');}"
        style="margin:8px 0;border-radius:12px;overflow:hidden;border:1.5px solid #0284c7;position:relative;background:#0f172a;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.2);"
        title="แตะเพื่อดูภาพขนาดใหญ่"
      >
        <img src="${photo}" style="width:100%;height:130px;object-fit:cover;display:block;" alt="รูปภาพสถานการณ์น้ำท่วมจริง" />
        <div style="position:absolute;bottom:6px;right:6px;background:rgba(15,23,42,0.88);color:#38bdf8;font-size:10px;padding:3px 9px;border-radius:9999px;font-weight:700;display:flex;align-items:center;gap:4px;border:1px solid rgba(56,189,248,0.6);box-shadow:0 2px 4px rgba(0,0,0,0.3);">
          <span>🔍</span> <span>แตะเพื่อดูภาพใหญ่</span>
        </div>
      </div>
    ` : '';

    const trendHtml = item.waterTrend === 'falling' ? `
      <div style="display:inline-flex;align-items:center;gap:4px;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;margin-bottom:6px;">
        <span>📉</span> <span>ระดับน้ำกำลังลดลง</span>
      </div>
    ` : (item.waterTrend === 'rising' ? `
      <div style="display:inline-flex;align-items:center;gap:4px;background:#fff1f2;color:#be123c;border:1px solid #fecdd3;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;margin-bottom:6px;">
        <span>📈</span> <span>เฝ้าระวังระดับน้ำเพิ่ม</span>
      </div>
    ` : '');

    const sourceHtml = isCitizen 
      ? `<div style="font-size:9.5px;color:#2563eb;font-weight:700;margin-bottom:4px;">👤 รายงานจากประชาชน (ยืนยันแล้ว)</div>`
      : `<div style="font-size:9.5px;color:#64748b;font-weight:600;margin-bottom:4px;">📍 จุดเฝ้าระวัง จ.สมุทรปราการ</div>`;

    return `
      <div style="font-family:'Prompt',sans-serif;padding:6px 4px 4px 4px;min-width:210px;max-width:260px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
          <div style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;background:${levelBg};color:${levelText};border:1px solid ${levelBorder};">
            ${levelBadgeName}
          </div>
          <span style="font-size:10.5px;color:#64748b;font-weight:700;">${(item.district || '').replace(/^อ\./, '')}</span>
        </div>
        <div style="font-size:13px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:4px;">
          ${item.name}
        </div>
        <div style="font-size:12px;color:${isL3 ? '#dc2626' : (isL2 ? '#d97706' : '#16a34a')};font-weight:800;margin-bottom:4px;">
          ระดับน้ำ: ${depthBadgeText}
        </div>
        ${photoHtml}
        ${trendHtml}
        ${sourceHtml}
      </div>
    `;
  };

  // 5. Render Unified Vulnerability & Citizen Points (Auto-deduplicated, mobile-optimized)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    citizenMarkersRef.current.forEach(m => map.removeLayer(m));
    citizenMarkersRef.current = [];
    markersByIdRef.current = {};

    const displayPoints = deduplicateAndDeclutterPoints(citizenReports, points, isMobile);

    displayPoints.forEach(point => {
      if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number' || isNaN(point.lat) || isNaN(point.lng)) {
        return;
      }

      const pointPhoto = point.photoUrl || point.photo_url || point.photo;
      const level = resolveLevel(point);
      const isSelected = selectedPoint && (
        selectedPoint.id === point.id || 
        (selectedPoint.name === point.name && Math.abs(selectedPoint.lat - point.lat) < 0.005)
      );

      const customIcon = createOfficialFloodPin({
        level,
        depthCm: point.depthCm,
        hasPhoto: !!pointPhoto,
        isFalling: point.waterTrend === 'falling',
        isSelected,
        name: point.name
      });

      const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);

      // On desktop: bind popup bubble.
      // On mobile: do NOT bind popup bubble so it doesn't clash with or get hidden behind the bottom detail card!
      if (!isMobile) {
        marker.bindPopup(buildPopupHtml(point, point.isCitizen), {
          className: 'custom-leaflet-popup',
          closeButton: true,
          autoPan: true
        });
      }

      marker.on('click', () => {
        lastFlyToTimeRef.current = Date.now();
        onSelectPoint(point);
      });

      markersRef.current.push(marker);
      markersByIdRef.current[point.id] = marker;
    });
  }, [points, citizenReports, selectedPoint, onSelectPoint, isMobile]);

  // 5.5 Render Calm Radar Flood Coverage Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    radarCircleLayersRef.current.forEach(layer => map.removeLayer(layer));
    radarCircleLayersRef.current = [];

    const allActiveItems = [
      ...points.map(p => ({ ...p, isCitizen: false })),
      ...citizenReports.map(c => ({ ...c, isCitizen: true }))
    ];

    allActiveItems.forEach(item => {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number' || isNaN(item.lat) || isNaN(item.lng)) {
        return;
      }
      // Strictly skip dry or resolved points
      if (isPointDry(item)) {
        return;
      }

      // Filter by district if selected
      if (selectedDistrict && selectedDistrict !== "ทั้งหมด" && item.district !== selectedDistrict) {
        return;
      }

      const level = resolveLevel(item);
      const isL3 = level === 3;
      const isL2 = level === 2;
      const isSelected = selectedPoint && selectedPoint.id === item.id;

      // Radius: L3: 300m, L2: 220m, L1: 150m
      const radius = isL3 ? 300 : (isL2 ? 220 : 150);
      const color = isL3 ? '#dc2626' : (isL2 ? '#eab308' : '#16a34a');
      const baseFillOpacity = isDark ? 0.16 : 0.12;

      const circle = L.circle([item.lat, item.lng], {
        radius: radius,
        color: color,
        weight: isSelected ? 2 : 1,
        opacity: isSelected ? 0.85 : 0.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.25 : baseFillOpacity,
        interactive: true
      }).addTo(map);

      const levelLabel = isL3 ? 'วิกฤต' : (isL2 ? 'ปานกลาง' : 'ปกติ');
      const depthText = item.depthCm ? `${item.depthCm} ซม.` : (item.depthRange || 'เฝ้าระวัง');

      circle.bindTooltip(`📡 รัศมีน้ำท่วม ~${radius}ม. • ${item.name} (${levelLabel} ${depthText})`, {
        sticky: true,
        direction: 'top',
        className: 'bg-slate-900/95 text-white font-prompt text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 shadow-md'
      });

      circle.on('click', () => {
        onSelectPoint(item);
        const marker = markersByIdRef.current[item.id];
        if (marker) marker.openPopup();
      });

      radarCircleLayersRef.current.push(circle);
    });
  }, [points, citizenReports, selectedDistrict, selectedPoint, onSelectPoint, isDark]);

  // 6. User GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number' || isNaN(userLocation.lat) || isNaN(userLocation.lng)) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userCircleRef.current) map.removeLayer(userCircleRef.current);

    if (locationAccuracy && locationAccuracy > 10) {
      userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: locationAccuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1.5
      }).addTo(map);
    }

    const userIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(37,99,235,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;top:-9px;left:-9px;"></div>
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(59,130,246,0.18);border:1.5px solid rgba(37,99,235,0.4);top:-3px;left:-3px;"></div>
          <div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(37,99,235,0.7);position:relative;z-index:2;"></div>
          <div style="position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;z-index:3;"></div>
        </div>
        <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    userMarker.bindTooltip("📍 ตำแหน่งปัจจุบันของคุณ", { permanent: false, direction: 'top', className: 'font-bold text-xs' });
    userMarkerRef.current = userMarker;

    map.setView([userLocation.lat, userLocation.lng], 13.5, { animate: true });
  }, [userLocation, locationAccuracy]);

  // Smooth FlyTo explicit coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToLocation || typeof flyToLocation.lat !== 'number' || typeof flyToLocation.lng !== 'number' || isNaN(flyToLocation.lat) || isNaN(flyToLocation.lng)) return;

    lastFlyToTimeRef.current = Date.now();
    const targetZoom = flyToLocation.zoom || 16.5;

    map.stop();
    map.flyTo([flyToLocation.lat, flyToLocation.lng], targetZoom, {
      duration: flyToLocation.duration || 1.2,
      easeLinearity: flyToLocation.easeLinearity || 0.25
    });

    const targetId = flyToLocation.pointId || selectedPoint?.id;
    if (targetId && !isMobile) {
      const openTargetPopup = () => {
        const marker = markersByIdRef.current[targetId];
        if (marker && map.hasLayer(marker)) {
          marker.openPopup();
        }
      };
      map.once('moveend', openTargetPopup);
      setTimeout(openTargetPopup, 650);
      setTimeout(openTargetPopup, 1300);
    }
  }, [flyToLocation, isMobile]);

  // Zoom to selected point
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPoint || typeof selectedPoint.lat !== 'number' || typeof selectedPoint.lng !== 'number' || isNaN(selectedPoint.lat) || isNaN(selectedPoint.lng)) return;

    if (flyToLocation && flyToLocation.ts && Date.now() - flyToLocation.ts < 3000) {
      return;
    }
    if (Date.now() - lastFlyToTimeRef.current < 2000) {
      if (!isMobile) {
        const marker = markersByIdRef.current[selectedPoint.id];
        if (marker && map.hasLayer(marker)) {
          setTimeout(() => marker.openPopup(), 400);
        }
      }
      return;
    }

    lastFlyToTimeRef.current = Date.now();
    map.stop();
    map.flyTo([selectedPoint.lat, selectedPoint.lng], 16.5, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    if (!isMobile) {
      const openPopupOnSelected = () => {
        const marker = markersByIdRef.current[selectedPoint.id];
        if (marker && map.hasLayer(marker)) {
          marker.openPopup();
        }
      };
      map.once('moveend', openPopupOnSelected);
      setTimeout(openPopupOnSelected, 650);
      setTimeout(openPopupOnSelected, 1300);
    }
  }, [selectedPoint, isMobile]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([13.6000, 100.6500], 11, { duration: 1 });
      if (onSelectDistrict) onSelectDistrict("ทั้งหมด");
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-100">
      
      {/* Leaflet Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%', background: '#f8fafc' }}
      ></div>

      {/* FLOATING MAP CONTROLS (TOP RIGHT - CLEAN, UNCLUTTERED, COMPACT) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        
        {/* Map Tile Switcher */}
        <div className={`p-1 rounded-2xl flex items-center gap-1 border shadow-md text-xs backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-700 shadow-xl' : 'bg-white/95 border-slate-200 shadow-md'
        }`}>
          {[
            { style: 'google-roadmap',    emoji: '🗺️', label: 'ถนน' },
            { style: 'google-satellite',  emoji: '🛰️', label: 'ดาวเทียม' },
          ].map(({ style, emoji, label }) => (
            <button
              key={style}
              onClick={() => setMapStyle(style)}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs ${
                mapStyle === style
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={`สลับเป็นแผนที่ ${label}`}
            >
              <span>{emoji}</span>
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* GPS & Reset Buttons */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onLocateMe}
            title="ค้นหาพิกัดตำแหน่งปัจจุบันของคุณ"
            className={`px-3 py-2 rounded-xl shadow-md border transition-all flex items-center gap-1.5 text-xs cursor-pointer backdrop-blur-md font-bold ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">พิกัดฉัน</span>
          </button>
          
          <button 
            onClick={resetView}
            title="รีเซ็ตมุมมองขอบเขตจังหวัดสมุทรปราการ"
            className={`p-2 rounded-xl shadow-md border transition-all cursor-pointer backdrop-blur-md ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* DESKTOP/IPAD FLOATING LEGEND CARD (BOTTOM LEFT - CLEAN OFFICIAL LOOK, HIDDEN ON MOBILE) */}
      <div className="hidden sm:flex absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className={`px-4 py-2.5 rounded-2xl border text-xs flex items-center gap-3.5 shadow-lg backdrop-blur-md ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700 text-slate-300 shadow-xl' 
            : 'bg-white/95 border-slate-200 text-slate-700'
        }`}>
          <button
            onClick={onOpenStandards}
            className={`font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-blue-600'
            }`}
            title="คลิกเพื่อดูเกณฑ์ระดับน้ำมาตรฐาน"
          >
            <BookOpen className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>เกณฑ์ระดับน้ำ:</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">ปกติ 5-20 ซม.</span>
          </div>

          <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">ปานกลาง 21-50 ซม.</span>
          </div>

          <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">วิกฤต &gt;50 ซม.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
