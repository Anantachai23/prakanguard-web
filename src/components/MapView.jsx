import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation } from 'lucide-react';
import { playClickSound, playPinClickSound, playToggleSound, playGpsSound } from '../services/soundEffects';
import { 
  SAMUT_PRAKAN_DISTRICTS_GEOJSON, 
  SAMUT_PRAKAN_MASK_GEOJSON,
  DISTRICT_METADATA,
  isPointInSamutPrakan
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

// Helper to check if water is receding / falling from any data source field
export function isWaterReceding(item) {
  if (!item) return false;
  if (item.waterTrend === 'falling' || item.water_trend === 'falling' || item.status === 'falling' || item.trend === 'falling') {
    return true;
  }
  const statusLabel = String(item.statusLabel || '');
  if (statusLabel.includes('ลด') || statusLabel.includes('ระบาย')) return true;
  const notes = String(item.notes || '');
  if (notes.includes('น้ำลด') || notes.includes('ระดับลด') || notes.includes('ลดลง') || notes.includes('แห้งลง')) return true;
  const waterSituation = String(item.waterSituation || '');
  if (waterSituation.includes('ลด') || waterSituation.includes('ระบาย')) return true;
  const trendText = String(item.trendText || '');
  if (trendText.includes('ลด') || trendText.includes('ระบาย')) return true;
  const trafficStatus = String(item.trafficStatus || '');
  if (trafficStatus.includes('น้ำลด') || trafficStatus.includes('ลดลง')) return true;
  return false;
}

// Unified Official Flood Pin Icon Generator for ALL points and citizen reports
function createOfficialFloodPin({ level, depthCm, hasPhoto, isSelected, isFalling, name, id }) {
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

  // สัญลักษณ์น้ำลดที่เห็นได้ชัดเจนบนแผนที่ตามที่ระบุ
  const fallingBadgeHtml = isFalling
    ? `
      <div class="pg-pin-falling-tag" style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg, #0d9488 0%, #059669 100%);color:#ffffff;font-size:9.5px;font-weight:900;font-family:'Prompt',-apple-system,sans-serif;padding:1px 6px;border-radius:12px;border:1.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);white-space:nowrap;display:flex;align-items:center;gap:2px;pointer-events:none;z-index:30;">
        <span style="font-size:10px;line-height:1;">📉</span>
        <span>น้ำลด</span>
      </div>
      <div style="position:absolute;bottom:0px;right:-5px;width:17px;height:17px;background:#0d9488;border:1.5px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:15;pointer-events:none;" title="น้ำกำลังลด">💧↓</div>
    `
    : '';

  // สัญลักษณ์รูปกล้อง 📷 สำหรับจุดที่มีรูปภาพจากประชาชนรายงานหรือเจ้าหน้าที่
  const photoBadgeHtml = hasPhoto
    ? `
      <div class="pg-pin-photo-tag" style="position:absolute;top:-8px;right:-9px;background:#1d4ed8;color:#ffffff;font-size:10px;line-height:1;width:20px;height:20px;border-radius:50%;border:1.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:25;pointer-events:none;" title="มีรูปภาพสถานที่จริง">
        📷
      </div>
    `
    : '';

  const selectedRingHtml = isSelected
    ? `<div style="position:absolute;inset:-6px;border-radius:24px;border:2.5px solid #0284c7;box-shadow:0 0 12px rgba(2,132,199,0.8);animation:pgSelectedGlow 1.5s ease-in-out infinite alternate;pointer-events:none;z-index:1;"></div>`
    : '';

  const fontSize = depthText.length >= 3 ? '8' : (depthText.length === 2 ? '9.5' : '11');
  const svgInnerContent = depthText
    ? `<text x="17" y="17.2" font-family="'Prompt', -apple-system, sans-serif" font-size="${fontSize}" font-weight="900" fill="${primaryColor}" text-anchor="middle" dominant-baseline="central">${depthText}</text>`
    : `<path d="M17 10C17 10 13.5 14.5 13.5 17C13.5 18.93 15.07 20.5 17 20.5C18.93 20.5 20.5 18.93 20.5 17C20.5 14.5 17 10 17 10Z" fill="${primaryColor}"/>`;

  const html = `
    <div class="pg-flood-pin-container ${levelClass} ${isSelected ? 'pg-pin-selected' : ''}" 
         data-point-id="${id || ''}"
         onclick="window.__pgSelectPointById && window.__pgSelectPointById('${id}', event)"
         style="position:relative;width:34px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transform-origin:bottom center;touch-action:none;user-select:none;-webkit-user-select:none;">
      ${pulseHtml}
      ${selectedRingHtml}
      ${fallingBadgeHtml}
      ${photoBadgeHtml}
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:2;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.38));pointer-events:none;">
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

  // Filter out dry/resolved and strictly enforce Samut Prakan boundary
  const activeOnly = combined.filter(pt => !isPointDry(pt) && isPointInSamutPrakan(pt.lat, pt.lng));

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
  isTopPanelCollapsed = false,
  refreshCountdown = 300
}) {
  const isDark = theme === 'dark';
  const formatCountdown = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };
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
  const radarCirclesByIdRef = useRef({});
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
        .pg-unified-flood-marker {
          cursor: pointer !important;
          pointer-events: auto !important;
          touch-action: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .pg-flood-pin-container {
          position: relative;
          touch-action: none !important;
          -webkit-tap-highlight-color: transparent;
          cursor: pointer !important;
          pointer-events: auto !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        /* Expanded touch hitbox (64x74px) for effortless mobile & desktop clicking */
        .pg-flood-pin-container::before {
          content: '';
          position: absolute;
          top: -15px;
          bottom: -15px;
          left: -15px;
          right: -15px;
          border-radius: 50%;
          z-index: 10;
          cursor: pointer !important;
          pointer-events: auto !important;
          touch-action: none !important;
          background: transparent;
        }
        @media (hover: hover) {
          .pg-flood-pin-container:hover {
            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)) brightness(1.1);
          }
        }
        .pg-flood-pin-container:active {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)) brightness(0.95);
        }
        .pg-pin-selected {
          filter: drop-shadow(0 0 8px rgba(2, 132, 225, 0.95)) !important;
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
        interactive: false,
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

  // Expose global point selection for pin taps & external triggers
  useEffect(() => {
    let lastSelectTime = 0;
    window.__pgSelectPointById = (id, e) => {
      const now = Date.now();
      if (now - lastSelectTime < 180) return; // Prevent duplicate rapid touch+click
      lastSelectTime = now;

      if (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }

      // Check current points map first
      let found = window.__pgPointsMap ? window.__pgPointsMap.get(String(id)) : null;
      if (!found) {
        const all = [...(citizenReports || []), ...(points || [])];
        found = all.find(p => String(p.id) === String(id) || (p.name && String(p.name) === String(id)));
      }

      if (found && onSelectPoint) {
        lastFlyToTimeRef.current = Date.now();
        playPinClickSound();
        onSelectPoint(found, { fromMapPin: true });
      }
    };
    return () => {
      delete window.__pgSelectPointById;
    };
  }, [points, citizenReports, onSelectPoint]);

  // Synchronize pin and radar circle selection styling smoothly without remounting
  useEffect(() => {
    const baseFillOpacity = isDark ? 0.16 : 0.12;

    if (!selectedPoint) {
      Object.values(markersByIdRef.current).forEach(m => {
        const el = m?.getElement && m.getElement();
        if (el) el.querySelector('.pg-flood-pin-container')?.classList.remove('pg-pin-selected');
      });
      Object.values(radarCirclesByIdRef.current).forEach(c => {
        if (c && c.setStyle) {
          c.setStyle({ weight: 1.2, opacity: 0.5, fillOpacity: baseFillOpacity });
        }
      });
      return;
    }

    Object.entries(markersByIdRef.current).forEach(([id, m]) => {
      const el = m?.getElement && m.getElement();
      if (el) {
        const container = el.querySelector('.pg-flood-pin-container');
        if (container) {
          if (String(id) === String(selectedPoint.id)) {
            container.classList.add('pg-pin-selected');
          } else {
            container.classList.remove('pg-pin-selected');
          }
        }
      }
    });

    Object.entries(radarCirclesByIdRef.current).forEach(([id, c]) => {
      if (c && c.setStyle) {
        const isSelected = String(id) === String(selectedPoint.id);
        c.setStyle({
          weight: isSelected ? 2.5 : 1.2,
          opacity: isSelected ? 0.9 : 0.5,
          fillOpacity: isSelected ? 0.25 : baseFillOpacity
        });
      }
    });
  }, [selectedPoint, isDark]);

  // 5. Render Unified Vulnerability & Citizen Points + 100% Concentric Radar Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    citizenMarkersRef.current.forEach(m => map.removeLayer(m));
    citizenMarkersRef.current = [];
    markersByIdRef.current = {};

    radarCircleLayersRef.current.forEach(layer => map.removeLayer(layer));
    radarCircleLayersRef.current = [];
    radarCirclesByIdRef.current = {};

    const displayPoints = deduplicateAndDeclutterPoints(citizenReports, points, isMobile);
    window.__pgPointsMap = new Map();

    displayPoints.forEach(point => {
      if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number' || isNaN(point.lat) || isNaN(point.lng)) {
        return;
      }
      if (!isPointInSamutPrakan(point.lat, point.lng)) {
        return;
      }
      if (isPointDry(point)) {
        return;
      }

      // Filter by district if selected
      if (selectedDistrict && selectedDistrict !== "ทั้งหมด" && point.district && point.district !== selectedDistrict) {
        return;
      }

      // 1. Resolve photo from point itself OR from any matching citizen report
      const directPhoto = point.photoUrl || point.photo_url || point.photo || point.image || point.imageUrl;
      let matchedCitizenPhoto = null;
      if (!directPhoto && Array.isArray(citizenReports)) {
        const matched = citizenReports.find(c => 
          (c.id && point.id && String(c.id) === String(point.id)) ||
          (c.name && point.name && c.name.trim().toLowerCase() === point.name.trim().toLowerCase()) ||
          (typeof c.lat === 'number' && typeof point.lat === 'number' && Math.abs(c.lat - point.lat) < 0.0035 && Math.abs(c.lng - point.lng) < 0.0035)
        );
        matchedCitizenPhoto = matched?.photoUrl || matched?.photo_url || matched?.photo || null;
      }
      const effectivePhoto = directPhoto || matchedCitizenPhoto;
      const hasPhoto = !!(effectivePhoto && typeof effectivePhoto === 'string' && effectivePhoto.trim() && effectivePhoto !== 'null' && effectivePhoto !== 'undefined');

      if (effectivePhoto && !point.photoUrl) {
        point.photoUrl = effectivePhoto;
      }

      // Register point in global quick-access lookup
      window.__pgPointsMap.set(String(point.id), point);
      if (point.name) {
        window.__pgPointsMap.set(String(point.name), point);
      }

      const level = resolveLevel(point);
      const isSelected = selectedPoint && (
        selectedPoint.id === point.id || 
        (selectedPoint.name === point.name && Math.abs(selectedPoint.lat - point.lat) < 0.005)
      );

      const isFalling = isWaterReceding(point);
      const isL3 = level === 3;
      const isL2 = level === 2;

      // Concentric Radar Flood Coverage Circle (100% dead-centered on the pin coordinate)
      const radius = isL3 ? 300 : (isL2 ? 220 : 150);
      const circleColor = isFalling ? '#0d9488' : (isL3 ? '#dc2626' : (isL2 ? '#eab308' : '#16a34a'));
      const baseFillOpacity = isDark ? 0.16 : 0.12;

      const circle = L.circle([point.lat, point.lng], {
        radius: radius,
        color: circleColor,
        weight: isSelected ? 2.5 : 1.2,
        opacity: isSelected ? 0.9 : 0.5,
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.25 : baseFillOpacity,
        dashArray: isFalling ? '5, 5' : undefined,
        interactive: true,
        bubblingMouseEvents: false
      }).addTo(map);

      const levelLabel = isL3 ? 'วิกฤต' : (isL2 ? 'ปานกลาง' : 'ปกติ');
      const depthText = point.depthCm ? `${point.depthCm} ซม.` : (point.depthRange || 'เฝ้าระวัง');

      circle.bindTooltip(`📡 รัศมีน้ำท่วม ~${radius}ม. • ${point.name} (${levelLabel} ${depthText})`, {
        sticky: true,
        direction: 'top',
        className: 'bg-slate-900/95 text-white font-prompt text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 shadow-md'
      });

      // 2. Official Pin Marker
      const customIcon = createOfficialFloodPin({
        level,
        depthCm: point.depthCm,
        hasPhoto,
        isFalling,
        isSelected,
        name: point.name,
        id: point.id
      });

      const marker = L.marker([point.lat, point.lng], { 
        icon: customIcon,
        riseOnHover: true,
        interactive: true,
        bubblingMouseEvents: false
      }).addTo(map);

      // Direct select handler: guaranteed responsive on mobile touch and desktop click
      let lastMarkerTap = 0;
      const handleMarkerSelect = (e) => {
        const now = Date.now();
        if (now - lastMarkerTap < 160) return;
        lastMarkerTap = now;

        if (e) {
          if (e.originalEvent) {
            if (e.originalEvent.stopPropagation) e.originalEvent.stopPropagation();
            if (e.originalEvent.preventDefault && e.originalEvent.type === 'click') e.originalEvent.preventDefault();
          } else if (e.stopPropagation) {
            e.stopPropagation();
          }
        }
        lastFlyToTimeRef.current = Date.now();
        playPinClickSound();
        if (onSelectPoint) {
          onSelectPoint(point, { fromMapPin: true });
        }
      };

      // Both Circle and Marker trigger selection reliably
      circle.on('click', handleMarkerSelect);
      circle.on('touchend', handleMarkerSelect);

      marker.on('click', handleMarkerSelect);

      // Direct DOM event hooks on marker icon for instant touch / click response
      const markerEl = marker.getElement();
      if (markerEl) {
        markerEl.style.cursor = 'pointer';
        markerEl.style.pointerEvents = 'auto';
        markerEl.style.touchAction = 'none';

        markerEl.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          handleMarkerSelect(e);
        }, { capture: true });

        markerEl.addEventListener('touchend', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          handleMarkerSelect(e);
        }, { capture: true, passive: true });
      }

      markersRef.current.push(marker);
      markersByIdRef.current[point.id] = marker;
      radarCircleLayersRef.current.push(circle);
      radarCirclesByIdRef.current[point.id] = circle;
    });
  }, [points, citizenReports, selectedDistrict, onSelectPoint, isMobile, isDark]);

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

    // Center map on explicitly selected external search / list items
  }, [flyToLocation]);

  // Zoom to selected point (from search list or external card, NOT when tapped from map pin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPoint || typeof selectedPoint.lat !== 'number' || typeof selectedPoint.lng !== 'number' || isNaN(selectedPoint.lat) || isNaN(selectedPoint.lng)) return;

    // If selected directly from map pin or circle, KEEP MAP STEADY! Do not fly away!
    if (selectedPoint._fromMapPin) {
      return;
    }

    if (flyToLocation && flyToLocation.ts && Date.now() - flyToLocation.ts < 3000) {
      return;
    }
    if (Date.now() - lastFlyToTimeRef.current < 2000) {
      const marker = markersByIdRef.current[selectedPoint.id];
      if (marker && map.hasLayer(marker)) {
        setTimeout(() => marker.openPopup(), 300);
      }
      return;
    }

    lastFlyToTimeRef.current = Date.now();
    map.stop();
    map.flyTo([selectedPoint.lat, selectedPoint.lng], 16.5, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    const openPopupOnSelected = () => {
      const marker = markersByIdRef.current[selectedPoint.id];
      if (marker && map.hasLayer(marker)) {
        marker.openPopup();
      }
    };
    map.once('moveend', openPopupOnSelected);
    setTimeout(openPopupOnSelected, 600);
    setTimeout(openPopupOnSelected, 1200);
  }, [selectedPoint]);

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

      {/* 5-MIN AUTO-REFRESH READ-ONLY BADGE (TOP CENTER OF MAP - STRICTLY NON-CLICKABLE AS REQUESTED) */}
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none max-w-[90vw]">
        <div className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full border shadow-md backdrop-blur-md flex items-center gap-1 sm:gap-2 text-[9.5px] sm:text-xs font-semibold transition-colors ${
          isDark 
            ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-black/40' 
            : 'bg-white/95 border-slate-200 text-slate-700 shadow-slate-300/50'
        }`}>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
          <span>รีเฟรชอัตโนมัติใน</span>
          <span className="font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
            {formatCountdown(refreshCountdown)}
          </span>
        </div>
      </div>

      {/* FLOATING MAP CONTROLS (TOP RIGHT - CLEAN, UNCLUTTERED, COMPACT) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
        
        {/* Map Tile Switcher */}
        <div className={`p-0.5 sm:p-1 rounded-xl sm:rounded-2xl flex items-center gap-0.5 sm:gap-1 border shadow-md text-[11px] sm:text-xs backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-700 shadow-xl' : 'bg-white/95 border-slate-200 shadow-md'
        }`}>
          {[
            { style: 'google-roadmap',    emoji: '🗺️', label: 'ถนน' },
            { style: 'google-satellite',  emoji: '🛰️', label: 'ดาวเทียม' },
          ].map(({ style, emoji, label }) => (
            <button
              key={style}
              onClick={() => {
                playToggleSound(style === 'google-satellite');
                setMapStyle(style);
              }}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs active:scale-95 ${
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
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button 
            onClick={() => {
              playGpsSound();
              if (onLocateMe) onLocateMe();
            }}
            title="ค้นหาพิกัดตำแหน่งปัจจุบันของคุณ"
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-md border transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs cursor-pointer backdrop-blur-md font-bold active:scale-95 ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Navigation className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">พิกัดฉัน</span>
          </button>
          
          <button 
            onClick={() => {
              playClickSound();
              resetView();
            }}
            title="รีเซ็ตมุมมองขอบเขตจังหวัดสมุทรปราการ"
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>



    </div>
  );
}
