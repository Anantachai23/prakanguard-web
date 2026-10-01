import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation, BookOpen } from 'lucide-react';
import { 
  SAMUT_PRAKAN_DISTRICTS_GEOJSON, 
  DISTRICT_METADATA 
} from '../data/samutPrakanBoundary';
import { getFloodLevel } from '../data/floodStandards';

export default function MapView({ 
  points, 
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
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const districtLayersRef = useRef([]);
  const markersRef = useRef([]);
  const citizenMarkersRef = useRef([]);
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

  // Robust Tile Config Helper with Fallbacks
  const getTileConfig = (style) => {
    if (style === 'google-satellite') {
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=y&hl=th&x={x}&y={y}&z={z}',
        fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '&copy; ภาพถ่ายดาวเทียม Google / Esri'
        }
      };
    }
    if (style === 'google-terrain') {
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=p&hl=th&x={x}&y={y}&z={z}',
        fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '&copy; แผนที่ภูมิประเทศ Google / Esri'
        }
      };
    }
    // Default: Google Roadmap (ภาษาไทย คมชัดสูง ชัดเจนในเวลากลางวัน)
    return {
      url: 'https://mt{s}.google.com/vt/lyrs=m&hl=th&x={x}&y={y}&z={z}',
      fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps / Esri ประเทศไทย'
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

    const map = L.map(mapContainerRef.current, {
      center: [13.6000, 100.6500], // Samut Prakan Center
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const config = getTileConfig('google-roadmap');
    tileLayerRef.current = createTileLayer(config).addTo(map);
    mapInstanceRef.current = map;

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
    };
  }, []);

  // Update map cursor when in location-picking mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (isPickingLocation) {
      mapContainerRef.current.style.cursor = 'crosshair';
    } else {
      mapContainerRef.current.style.cursor = '';
    }
  }, [isPickingLocation]);

  // 2. Render Exact 6-District Polygons (Google Maps Standard)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing district layers
    districtLayersRef.current.forEach(layer => map.removeLayer(layer));
    districtLayersRef.current = [];

    // Add each district polygon
    SAMUT_PRAKAN_DISTRICTS_GEOJSON.features.forEach(feature => {
      const isSelected = selectedDistrict === feature.properties.districtName;
      const districtColor = feature.properties.color || '#0284c7';

      const layer = L.geoJSON(feature, {
        style: {
          color: isSelected ? '#1d4ed8' : districtColor,
          weight: isSelected ? 3.5 : 2,
          opacity: isSelected ? 1 : 0.8,
          dashArray: isSelected ? '8, 5' : '5, 5',
          fillColor: districtColor,
          fillOpacity: isSelected ? 0.15 : 0.04
        }
      }).addTo(map);

      // District Label Tooltip
      layer.bindTooltip(`อำเภอ${feature.properties.districtName}`, {
        permanent: true,
        direction: 'center',
        className: 'bg-white/95 text-slate-800 font-prompt text-xs border border-slate-300 px-2.5 py-1 rounded-xl shadow-md font-semibold'
      });

      // Click district polygon to filter
      layer.on('click', () => {
        if (onSelectDistrict) {
          onSelectDistrict(feature.properties.districtName);
        }
      });

      districtLayersRef.current.push(layer);
    });
  }, [selectedDistrict, onSelectDistrict]);

  // 3. Pan & Zoom Smoothly when selectedDistrict changes (Skip if point flyTo just occurred)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // If an explicit location flyTo was requested with this update, DO NOT fly to district center!
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

  // 4. Switch Tile Layer Smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = getTileConfig(mapStyle);
    tileLayerRef.current = createTileLayer(config).addTo(map);

    // Bring district layers to front
    districtLayersRef.current.forEach(layer => layer.bringToFront());

    map.invalidateSize();
  }, [mapStyle]);

  // 5. Render Vulnerability Point Markers with Smooth Leaflet Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    points.forEach(point => {
      if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number' || isNaN(point.lat) || isNaN(point.lng)) {
        return;
      }
      // 100% strictly adhere to the 3-Tier standard:
      // Level 1: 5 - 20 cm
      // Level 2: 21 - 50 cm
      // Level 3: > 50 cm
      const effectiveLevel = (point.depthCm !== undefined && point.depthCm !== null) 
        ? getFloodLevel(point.depthCm) 
        : (point.level || 1);
      const isL3 = effectiveLevel === 3;
      const isL2 = effectiveLevel === 2;
      const levelClass = isL3 ? 'beacon-level-3' : (isL2 ? 'beacon-level-2' : 'beacon-level-1');
      const pulseClass = isL3 ? 'pulse-l3' : (isL2 ? 'pulse-l2' : 'pulse-l1');
      const levelBadgeName = isL3 ? '🔴 วิกฤต' : (isL2 ? '🟠 เสี่ยงสูง' : '🟢 ปกติ');
      const depthBadgeText = point.depthCm ? `${point.depthCm} ซม.` : point.depthRange;

      // Clean, ultra-readable marker showing depth in cm or water droplet
      const markerHtml = `
        <div class="telemetry-pin" title="${point.name} (${depthBadgeText})">
          <div class="beacon-pulse ${pulseClass}"></div>
          <div class="beacon-core ${levelClass}">
            <span style="font-size:10px;font-weight:800;color:#ffffff;line-height:1;font-family:'Prompt',sans-serif;">${point.depthCm || ''}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-telemetry-marker',
        html: markerHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);

      // Clean Daylight Micro-Popup without clutter
      const levelBg = isL3 ? '#ffe4e6' : (isL2 ? '#fef3c7' : '#d1fae5');
      const levelText = isL3 ? '#9f1239' : (isL2 ? '#92400e' : '#065f46');
      const levelBorder = isL3 ? '#f43f5e' : (isL2 ? '#f59e0b' : '#10b981');
      const levelStyle = `background:${levelBg};color:${levelText};border:1px solid ${levelBorder};`;

      const popupContent = `
        <div style="font-family:'Prompt',sans-serif;padding:6px 4px 4px 4px;min-width:180px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
            <div style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;${levelStyle}">
              ${levelBadgeName} (${point.depthRange})
            </div>
            <span style="font-size:10px;color:#64748b;font-weight:600;">อ.${point.district}</span>
          </div>
          <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:4px;">
            ${point.name}
          </div>
          <div style="font-size:11px;color:${isL3 ? '#e11d48' : isL2 ? '#d97706' : '#059669'};font-weight:700;margin-bottom:8px;">
            ระดับน้ำ: ${depthBadgeText}
          </div>
          <button id="popup-btn-${point.id}" style="width:100%;padding:6px 10px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span>ดูรายละเอียด &rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        autoPan: true
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${point.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectPoint(point);
            map.closePopup();
          };
        }
      });

      marker.on('click', () => {
        lastFlyToTimeRef.current = Date.now();
        onSelectPoint(point);
      });

      markersRef.current.push(marker);
      markersByIdRef.current[point.id] = marker;
    });
  }, [points, onSelectPoint]);

  // 5b. Render Citizen Reports (Crowdsourced Flood Hotspots)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    citizenMarkersRef.current.forEach(m => map.removeLayer(m));
    citizenMarkersRef.current = [];

    citizenReports.forEach(report => {
      if (!report || typeof report.lat !== 'number' || typeof report.lng !== 'number' || isNaN(report.lat) || isNaN(report.lng)) {
        return;
      }
      const isHail = report.hazardType === 'hail';
      const emojiMap = {
        ankle: '🦶',
        knee: '🦵',
        waist: '🩳',
        chest: '👕',
        neck: '🧣'
      };
      const emoji = isHail ? (report.level === 3 ? '💥' : '🧊') : (emojiMap[report.bodyLevel] || '📢');

      const citizenMarkerHtml = `
        <div class="telemetry-pin" title="${isHail ? 'รายงานลูกเห็บตก' : 'รายงานน้ำท่วม'}: ${report.name}">
          <div class="${isHail ? 'hail-pulse-ring' : 'citizen-pulse-ring'}" style="${isHail ? 'border-color:#06b6d4;background:rgba(6,182,212,0.2);' : ''}"></div>
          <div class="citizen-beacon-core" style="${isHail ? 'background:linear-gradient(135deg, #06b6d4, #0284c7);box-shadow:0 0 14px rgba(6,182,212,0.6);' : ''}">
            <span>${emoji}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-citizen-marker',
        html: citizenMarkerHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon }).addTo(map);

      const photoHtml = report.photoUrl ? `
        <div style="margin:6px 0;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;max-height:110px;">
          <img src="${report.photoUrl}" style="width:100%;height:100px;object-fit:cover;" alt="ภาพสถานการณ์จริง" />
        </div>
      ` : '';

      const popupContent = `
        <div style="font-family:'Prompt',sans-serif;padding:6px 4px 4px 4px;min-width:200px;max-width:240px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
            <div style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;${isHail ? 'background:#ecfeff;color:#0891b2;border:1px solid #a5f3fc;' : 'background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;'}">
              ${isHail ? '🧊 ลูกเห็บตก' : '📢 รายงานโดยประชาชน'}
            </div>
            <span style="font-size:10px;color:#64748b;font-weight:600;">อ.${report.district}</span>
          </div>
          <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:4px;">
            ${report.name}
          </div>
          <div style="font-size:11px;color:${isHail ? '#0284c7' : '#7c3aed'};font-weight:700;margin-bottom:4px;">
            ${emoji} ${isHail ? (report.statusLabel || `ลูกเห็บ: ${report.hailSizeLabel}`) : `${report.statusLabel || report.bodyLevelLabel} (${report.depthRange})`}
          </div>
          ${photoHtml}
          <div style="font-size:10px;color:#475569;margin-bottom:6px;line-height:1.4;">
            ${report.trafficStatus || ''}
          </div>
          <div style="font-size:9px;color:#94a3b8;margin-bottom:6px;">
            แจ้งเมื่อ: ${report.reportedAt || 'วันนี้'}
          </div>
          <button id="citizen-popup-btn-${report.id}" style="width:100%;padding:6px 10px;background:${isHail ? 'linear-gradient(135deg, #06b6d4, #0284c7)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)'};color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span>ดูรายละเอียด &rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        autoPan: true
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`citizen-popup-btn-${report.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectPoint(report);
            map.closePopup();
          };
        }
      });

      marker.on('click', () => {
        lastFlyToTimeRef.current = Date.now();
        onSelectPoint(report);
      });

      citizenMarkersRef.current.push(marker);
      markersByIdRef.current[report.id] = marker;
    });
  }, [citizenReports, onSelectPoint]);

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
      className: 'user-gps-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl z-10"></div>
          <div class="absolute w-10 h-10 rounded-full bg-blue-400/40 animate-ping"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    userMarker.bindTooltip("ตำแหน่งปัจจุบันของคุณ", { permanent: false, direction: 'top' });
    userMarkerRef.current = userMarker;

    map.setView([userLocation.lat, userLocation.lng], 13.5, { animate: true });
  }, [userLocation, locationAccuracy]);

  // Smooth FlyTo explicit coordinates and zoom directly to point (e.g. from Search selection)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToLocation || typeof flyToLocation.lat !== 'number' || typeof flyToLocation.lng !== 'number' || isNaN(flyToLocation.lat) || isNaN(flyToLocation.lng)) return;

    lastFlyToTimeRef.current = Date.now();
    const targetZoom = flyToLocation.zoom || 16.5;

    // Immediately stop any running transition to prevent collision
    map.stop();

    map.flyTo([flyToLocation.lat, flyToLocation.lng], targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    const targetId = flyToLocation.pointId || selectedPoint?.id;
    if (targetId) {
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
  }, [flyToLocation]);

  // Zoom to selected point if not already handled by flyToLocation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPoint || typeof selectedPoint.lat !== 'number' || typeof selectedPoint.lng !== 'number' || isNaN(selectedPoint.lat) || isNaN(selectedPoint.lng)) return;

    // If flyToLocation is already active, skip duplicate flyTo
    if (flyToLocation && flyToLocation.ts && Date.now() - flyToLocation.ts < 3000) {
      return;
    }
    if (Date.now() - lastFlyToTimeRef.current < 2000) {
      const marker = markersByIdRef.current[selectedPoint.id];
      if (marker && map.hasLayer(marker)) {
        setTimeout(() => marker.openPopup(), 400);
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
    setTimeout(openPopupOnSelected, 650);
    setTimeout(openPopupOnSelected, 1300);
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

      {/* FLOATING MAP CONTROLS (TOP RIGHT - FULLY RESPONSIVE FOR ALL SCREENS) */}
      <div className={`absolute ${isTopPanelCollapsed ? 'top-3 sm:top-4' : 'top-[140px] sm:top-4'} right-2 sm:right-4 z-20 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto transition-all duration-300`}>
        
        {/* Map Tile Switcher (Theme-aware container with Roadmap, Satellite, Terrain) */}
        <div className={`p-1 rounded-2xl flex items-center gap-0.5 sm:gap-1 border shadow-md text-xs sm:text-sm backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-700 shadow-xl' : 'bg-white/95 border-slate-200 shadow-md'
        }`}>
          <button
            onClick={() => setMapStyle('google-roadmap')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 ${
              mapStyle === 'google-roadmap'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🗺️</span>
            <span className="hidden sm:inline">ทางหลวง</span>
          </button>
          <button
            onClick={() => setMapStyle('google-satellite')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 ${
              mapStyle === 'google-satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🛰️</span>
            <span className="hidden sm:inline">ดาวเทียม</span>
          </button>
          <button
            onClick={() => setMapStyle('google-terrain')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 ${
              mapStyle === 'google-terrain'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>⛰️</span>
            <span className="hidden sm:inline">ภูมิประเทศ</span>
          </button>
        </div>

        {/* GPS & Reset Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button 
            onClick={onLocateMe}
            title="ค้นหาพิกัดตำแหน่งปัจจุบันของคุณ"
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-md border transition-all flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer backdrop-blur-md font-semibold ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">พิกัดของฉัน</span>
          </button>
          
          <button 
            onClick={resetView}
            title="รีเซ็ตมุมมองขอบเขตจังหวัดสมุทรปราการ"
            className={`p-1.5 sm:p-2.5 rounded-xl shadow-md border transition-all cursor-pointer backdrop-blur-md ${
              isDark 
                ? 'bg-slate-900/95 text-slate-200 hover:text-cyan-400 hover:bg-slate-800 border-slate-700 shadow-xl' 
                : 'bg-white/95 text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>

      {/* FLOATING MAP LEGEND & STANDARDS BUTTON (BOTTOM LEFT - FULLY RESPONSIVE) */}
      <div className="absolute bottom-4 left-3 sm:left-4 z-20 flex flex-col gap-1.5 max-w-[90vw]">
        
        {/* District Active Indicator */}
        <div className={`px-3 sm:px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 shadow-md backdrop-blur-md font-semibold ${
          isDark 
            ? 'bg-slate-900/95 border-blue-900 text-blue-300 shadow-xl' 
            : 'bg-white/95 border-blue-200 text-blue-800'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
          <span className="truncate">
            {selectedDistrict === "ทั้งหมด" 
              ? "ขอบเขต 6 อำเภอ จ.สมุทรปราการ (อิง Google Maps)" 
              : `ขอบเขตอำเภอ${selectedDistrict} (อิง Google Maps)`}
          </span>
        </div>

        {/* Standard Levels Legend Bar */}
        <div className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm hidden sm:flex items-center gap-3.5 shadow-md backdrop-blur-md ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700 text-slate-300 shadow-xl' 
            : 'bg-white/95 border-slate-200 text-slate-700'
        }`}>
          <button
            onClick={onOpenStandards}
            className={`font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-blue-600'
            }`}
            title="คลิกเพื่อดูเกณฑ์มาตรฐาน ปภ./กรมทางหลวง แบบละเอียด"
          >
            <BookOpen className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>เกณฑ์ ปภ.:</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ปกติ (8-20 ซม.)</span>
          </div>

          <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>เสี่ยงสูง (21-60 ซม.)</span>
          </div>

          <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-rose-500 font-bold">วิกฤต (&gt;60 ซม.)</span>
          </div>

          {citizenReports.length > 0 && (
            <>
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                <span className={`font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                  ประชาชนแจ้ง ({citizenReports.length})
                </span>
              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
