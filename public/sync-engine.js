/**
 * Autonomous Real-Time Flood & Weather Sync Engine (Zero UI Changes)
 * File: sync-engine.js
 * 
 * Functions:
 * 1. Background Poller: Automatically fetches /api/sync every 30 seconds
 * 2. Leaflet Map Diffing Engine: Adds new flood pins, removes dry/resolved pins, keeps existing pins untouched
 * 3. Weather Injector: Injects live temperatures & rain probabilities for 6 districts into existing UI
 * 
 * Usage:
 * <script src="/sync-engine.js"></script>
 */

(function () {
  'use strict';

  // Configuration
  const SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds
  const API_ENDPOINT = '/api/sync';

  // State
  const activeMarkers = {}; // { [pointId]: L.Marker }
  let isSyncing = false;
  let syncTimer = null;
  let lastSyncTime = null;

  /**
   * Safe Leaflet Map Instance Resolver
   * Multi-strategy lookup: window.__pgMap, window.map, or DOM container inspection
   */
  function getLeafletMap() {
    if (typeof window === 'undefined' || typeof window.L === 'undefined') return null;

    // Strategy 1: Explicit global pointer
    if (window.__pgMap && typeof window.__pgMap.hasLayer === 'function') {
      return window.__pgMap;
    }
    if (window.map && typeof window.map.hasLayer === 'function') {
      return window.map;
    }

    // Strategy 2: Inspect existing Leaflet DOM containers
    const containers = document.querySelectorAll('.leaflet-container');
    for (const container of containers) {
      if (container._leaflet_map) return container._leaflet_map;
      // Search Leaflet internal id registry
      for (const key in container) {
        if (key.startsWith('_leaflet_id') && container[key]) {
          const mapId = container[key];
          if (window.L && window.L.map) {
            // Find map instance matching id
            for (const mapProp in window) {
              const obj = window[mapProp];
              if (obj && typeof obj === 'object' && obj._leaflet_id === mapId && typeof obj.hasLayer === 'function') {
                return obj;
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Create an optimized red pulse marker icon for new flood events
   */
  function createFloodIcon(ticketId) {
    if (!window.L) return null;
    return window.L.divIcon({
      className: 'pg-traffy-flood-marker',
      html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(239,68,68,0.4);animation:pgTraffyPing 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:#ef4444;border:2.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:12px;font-weight:900;">
            🌊
          </div>
        </div>
        <style>
          @keyframes pgTraffyPing { 0%{transform:scale(0.8);opacity:0.9;} 100%{transform:scale(2.4);opacity:0;} }
        </style>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  /**
   * Leaflet Map Marker Diffing Engine
   * - Adds newly flooded points
   * - Removes resolved points immediately
   * - Retains unchanged points without re-rendering
   */
  function syncMapMarkers(floodPoints = []) {
    const map = getLeafletMap();
    if (!map) return; // Map not yet initialized, will sync next round

    const currentPointsMap = new Map();
    floodPoints.forEach(p => {
      if (p && p.id && typeof p.lat === 'number' && typeof p.lng === 'number') {
        currentPointsMap.set(String(p.id), p);
      }
    });

    // 1. ADD / RETAIN POINTS
    currentPointsMap.forEach((point, id) => {
      // If already on map: keep untouched for 100% fluid map navigation
      if (activeMarkers[id]) {
        return;
      }

      // New flood point detected: Create marker
      const icon = createFloodIcon(point.ticketId);
      const markerOptions = icon ? { icon } : {};
      const marker = window.L.marker([point.lat, point.lng], markerOptions);

      // Bind rich information popup
      const photoHtml = point.photo 
        ? `<div style="margin:6px 0;border-radius:8px;overflow:hidden;border:1px solid #cbd5e1;"><img src="${point.photo}" style="width:100%;max-height:120px;object-fit:cover;display:block;" alt="ภาพน้ำท่วม" /></div>` 
        : '';
      const addressHtml = point.address ? `<div style="font-size:11px;color:#64748b;margin-bottom:3px;">📍 ${point.address}</div>` : '';

      const popupContent = `
        <div style="font-family:'Prompt',sans-serif;padding:4px;min-width:210px;max-width:260px;color:#0f172a;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:10px;font-weight:800;background:#fee2e2;color:#dc2626;padding:2px 7px;border-radius:6px;border:1px solid #fca5a5;">
              🔴 จุดน้ำท่วมใหม่ (Traffy)
            </span>
            <span style="font-size:9.5px;color:#94a3b8;font-family:monospace;">${point.ticketId ? point.ticketId.slice(0, 10) : ''}</span>
          </div>
          <div style="font-size:12.5px;font-weight:700;line-height:1.4;margin:4px 0;">
            ${point.description || 'รายงานน้ำท่วมขังรอการระบาย'}
          </div>
          ${addressHtml}
          ${photoHtml}
          <div style="font-size:9.5px;color:#2563eb;font-weight:600;margin-top:4px;border-top:1px dashed #e2e8f0;padding-top:4px;">
            📡 แหล่งข้อมูล: ${point.source || 'Traffy Fondue Open API'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        autoPan: true
      });

      marker.addTo(map);
      activeMarkers[id] = marker;
    });

    // 2. REMOVE RESOLVED POINTS (Points not in current update)
    Object.keys(activeMarkers).forEach(id => {
      if (!currentPointsMap.has(id)) {
        const markerToRemove = activeMarkers[id];
        if (markerToRemove && map.hasLayer(markerToRemove)) {
          map.removeLayer(markerToRemove);
        }
        delete activeMarkers[id];
      }
    });
  }

  /**
   * Weather Data Injection Engine (Zero UI Alteration)
   * Safely injects live temperature & rain forecast into corresponding elements
   */
  function injectWeatherData(weather) {
    if (!weather || !weather.districts) return;

    // 1. Dispatch custom event for reactive frontends (React / Vue / Svelte)
    window.dispatchEvent(new CustomEvent('prakanguard:weather-sync', { detail: weather }));
    window.__pgLiveWeather = weather;

    const districts = weather.districts;

    // 2. Text Content Injections (Non-destructive DOM text replacement)
    Object.keys(districts).forEach(districtName => {
      const data = districts[districtName];
      if (!data) return;

      // Selectors matching district data attributes or class names
      const districtSelectors = [
        `[data-district="${districtName}"]`,
        `[data-weather-district="${districtName}"]`,
        `#weather-${districtName}`
      ];

      districtSelectors.forEach(sel => {
        try {
          const container = document.querySelector(sel);
          if (container) {
            const tempEl = container.querySelector('.temp, .temperature, [data-temp]');
            if (tempEl) tempEl.textContent = data.tempFormatted;

            const rainEl = container.querySelector('.rain, .precipitation, [data-rain]');
            if (rainEl) rainEl.textContent = data.rainProbabilityFormatted;
          }
        } catch (_) {}
      });
    });

    // 3. Summary Weather Box Injection (if matching containers exist)
    if (weather.summary) {
      try {
        const avgTempEl = document.querySelector('[data-weather-avg-temp], #avg-temperature');
        if (avgTempEl) avgTempEl.textContent = weather.summary.averageTemp;

        const maxRainEl = document.querySelector('[data-weather-max-rain], #max-rain-prob');
        if (maxRainEl) maxRainEl.textContent = weather.summary.maxRainProbability;
      } catch (_) {}
    }
  }

  /**
   * Core Autonomous Sync Cycle (Every 30 Seconds)
   */
  async function executeSyncCycle() {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const res = await fetch(`${API_ENDPOINT}?_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.status === 'success') {
          // 1. Sync Flood Points on Leaflet Map
          syncMapMarkers(payload.floodPoints || []);

          // 2. Inject Weather & Rain Predictions
          injectWeatherData(payload.weather);

          lastSyncTime = new Date().toLocaleTimeString('th-TH');
        }
      }
    } catch (err) {
      // Fail silently to avoid interfering with user interface
    } finally {
      isSyncing = false;
    }
  }

  /**
   * Start Autonomous Engine
   */
  function startEngine() {
    if (syncTimer) clearInterval(syncTimer);

    // Initial Sync run
    executeSyncCycle();

    // Auto-sync every 30 seconds
    syncTimer = setInterval(executeSyncCycle, SYNC_INTERVAL_MS);

    // Re-sync when document becomes visible or device regains network
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') executeSyncCycle();
    });
    window.addEventListener('online', executeSyncCycle);
  }

  // Self-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEngine);
  } else {
    startEngine();
  }

  // Developer / System Diagnostics Hook
  window.__pgSyncEngine = {
    syncNow: executeSyncCycle,
    getStatus: () => ({
      activeFloodMarkers: Object.keys(activeMarkers).length,
      lastSyncTime,
      isSyncing,
      intervalSeconds: SYNC_INTERVAL_MS / 1000
    }),
    getActiveMarkers: () => activeMarkers
  };

})();
