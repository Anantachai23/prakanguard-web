/**
 * PrakanGuard Automated Official Flood Sync Engine with Change Detection
 * File: official-sync-engine.js (Client Engine)
 * 
 * CORE PRINCIPLES:
 * 1. Citizen Reports: 100% untouched (require admin approval before appearing on map)
 * 2. Automated Official Feed: Polls /api/official-flood every 30 seconds
 * 3. Change Detection: If data.version is unchanged -> IDLE immediately (Zero DOM/Map overhead)
 * 4. Diffing Algorithm:
 *    - New flooded points: create and place marker on Leaflet map
 *    - Resolved points: remove marker from map immediately
 *    - Existing unchanged points: keep untouched (Zero map flicker/stutter)
 * 5. Strict Zero UI Impact: Updates only numbers and marker layers without touching HTML/CSS
 */

(function () {
  'use strict';

  // Constants & State
  const SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds
  const API_ENDPOINT = '/api/official-flood';

  // State
  let lastKnownVersion = null;
  let isFetching = false;
  let syncTimer = null;
  let lastSyncTimestamp = null;

  // Track official markers on the Leaflet map: Map<ticket_id, L.Marker>
  const currentOfficialMarkers = new Map();

  /**
   * Safe Leaflet Map Instance Lookup
   * Detects global map reference or inspects existing Leaflet containers
   */
  function resolveLeafletMap() {
    if (typeof window === 'undefined') return null;

    // 1. Direct exposed window references
    if (window.leafletMap && typeof window.leafletMap.addLayer === 'function') {
      return window.leafletMap;
    }
    if (window.__leaflet_map && typeof window.__leaflet_map.addLayer === 'function') {
      return window.__leaflet_map;
    }
    if (window.__pgMap && typeof window.__pgMap.addLayer === 'function') {
      return window.__pgMap;
    }
    if (window.map && typeof window.map.addLayer === 'function') {
      return window.map;
    }

    // 2. DOM inspection for Leaflet container instance
    try {
      const container = document.querySelector('.leaflet-container');
      if (container && container._leaflet_map) {
        return container._leaflet_map;
      }
      if (container && window.L) {
        for (const k in container) {
          if (k.startsWith('_leaflet_id') && container[k]) {
            const id = container[k];
            for (const prop in window) {
              const obj = window[prop];
              if (obj && typeof obj === 'object' && obj._leaflet_id === id && typeof obj.addLayer === 'function') {
                return obj;
              }
            }
          }
        }
      }
    } catch (_) {}

    return null;
  }

  /**
   * Create an official flood marker icon (Custom Red Pin with subtle ping)
   */
  function createOfficialFloodIcon() {
    if (!window.L) return null;
    return window.L.divIcon({
      className: 'pg-official-flood-marker',
      html: `
        <div style="position:relative;width:34px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transform-origin:bottom center;">
          <div style="position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:28px;height:28px;border-radius:50%;background:rgba(220,38,38,0.35);animation:pgPinPulse 1.8s ease-out infinite;pointer-events:none;"></div>
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:2;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.38));">
            <defs>
              <linearGradient id="pgOfficialRed" x1="17" y1="2" x2="17" y2="43" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#b91c1c" />
              </linearGradient>
            </defs>
            <path d="M17 43C17 43 32 27 32 17C32 8.71573 25.2843 2 17 2C8.71573 2 2 8.71573 2 17C2 27 17 43 17 43Z" fill="url(#pgOfficialRed)" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
            <circle cx="17" cy="17" r="9.5" fill="#ffffff" />
            <path d="M17 10C17 10 13.5 14.5 13.5 17C13.5 18.93 15.07 20.5 17 20.5C18.93 20.5 20.5 18.93 20.5 17C20.5 14.5 17 10 17 10Z" fill="#dc2626"/>
          </svg>
        </div>
      `,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -42]
    });
  }

  /**
   * Leaflet Map Diffing Algorithm
   * - Identifies differences between current markers and fresh points
   * - Adds only new points
   * - Removes only resolved/dry points
   * - Preserves unchanged points with zero flicker
   */
  function applyMapDiffing(floodPoints = []) {
    const map = resolveLeafletMap();
    if (!map) return; // Map not initialized yet; will retry next cycle

    const incomingIds = new Set();
    const incomingPoints = new Map();

    floodPoints.forEach(p => {
      const id = String(p.ticket_id || p.id || '');
      if (id && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)) {
        // Strictly filter out any point outside Samut Prakan (No Bangkok/external points!)
        if (typeof window !== 'undefined' && typeof window.isPointInSamutPrakan === 'function') {
          if (!window.isPointInSamutPrakan(p.lat, p.lng)) return;
        }
        incomingIds.add(id);
        incomingPoints.set(id, p);
      }
    });

    // 1. ADD NEW FLOOD POINTS (Points not present on map)
    incomingPoints.forEach((point, id) => {
      if (currentOfficialMarkers.has(id)) {
        // Point already active on map -> Do nothing to keep 100% fluid map UX
        return;
      }

      const icon = createOfficialFloodIcon();
      const markerOptions = icon ? { icon } : {};
      const marker = window.L.marker([point.lat, point.lng], markerOptions);

      // Popup Content
      const photoHtml = point.photo 
        ? `<div style="margin:6px 0;border-radius:8px;overflow:hidden;border:1px solid #cbd5e1;"><img src="${point.photo}" style="width:100%;max-height:120px;object-fit:cover;display:block;" alt="ภาพน้ำท่วม" /></div>` 
        : '';
      const addressHtml = point.address ? `<div style="font-size:11px;color:#64748b;margin-bottom:3px;">📍 ${point.address}</div>` : '';

      const popupHtml = `
        <div style="font-family:'Prompt',sans-serif;padding:4px;min-width:210px;max-width:260px;color:#0f172a;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:10px;font-weight:800;background:#fee2e2;color:#dc2626;padding:2px 7px;border-radius:6px;border:1px solid #fca5a5;">
              🔴 จุดน้ำท่วมใหม่ (ทางการ)
            </span>
            <span style="font-size:9.5px;color:#94a3b8;font-family:monospace;">${id.slice(0, 10)}</span>
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

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        autoPan: true
      });

      marker.addTo(map);
      currentOfficialMarkers.set(id, marker);
    });

    // 2. REMOVE DRIED/RESOLVED POINTS (Points removed from feed)
    currentOfficialMarkers.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
        currentOfficialMarkers.delete(id);
      }
    });
  }

  /**
   * Update Weather Numbers (Strict Zero UI Impact)
   * Modifies textContent only on existing elements
   */
  function updateWeatherDisplay(weather) {
    if (!weather) return;

    // Dispatch custom event for reactive framework components
    window.dispatchEvent(new CustomEvent('prakanguard:official-sync', { detail: weather }));

    const districts = weather.districts || {};

    // Update 6 districts text values
    Object.keys(districts).forEach(distKey => {
      const data = districts[distKey];
      if (!data) return;

      const selectors = [
        `[data-district="${distKey}"]`,
        `[data-weather-district="${distKey}"]`,
        `#weather-${distKey}`
      ];

      selectors.forEach(sel => {
        try {
          const container = document.querySelector(sel);
          if (container) {
            const tempEl = container.querySelector('.temp, .temperature, [data-temp]');
            if (tempEl && data.tempFormatted) tempEl.textContent = data.tempFormatted;

            const rainEl = container.querySelector('.rain, .precipitation, [data-rain]');
            if (rainEl && data.rain_prob_formatted) rainEl.textContent = data.rain_prob_formatted;
          }
        } catch (_) {}
      });
    });

    // Update overall summary text values
    try {
      if (weather.temperature_2m !== undefined) {
        const avgTempEl = document.querySelector('[data-weather-avg-temp], #avg-temperature');
        if (avgTempEl) avgTempEl.textContent = `${weather.temperature_2m}°C`;
      }
      if (weather.precipitation_probability !== undefined) {
        const maxRainEl = document.querySelector('[data-weather-max-rain], #max-rain-prob');
        if (maxRainEl) maxRainEl.textContent = `${weather.precipitation_probability}%`;
      }
    } catch (_) {}
  }

  /**
   * Main Autonomous Execution Loop (Every 30 Seconds)
   */
  async function runSyncCycle() {
    if (isFetching) return;
    isFetching = true;

    try {
      const res = await fetch(`${API_ENDPOINT}?_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();

        // 1. CHANGE DETECTION VIA VERSION HASH
        // If data is identical to previous cycle -> IDLE IMMEDIATELY (no DOM or Map modification)
        if (data.version && data.version === lastKnownVersion) {
          // Exactly identical: IDLE
          isFetching = false;
          return;
        }

        // Change detected: Record new version
        lastKnownVersion = data.version;
        lastSyncTimestamp = new Date().toLocaleTimeString('th-TH');

        // 2. Map Diffing: Add new flood points & remove resolved points
        if (Array.isArray(data.floodPoints)) {
          applyMapDiffing(data.floodPoints);
          try {
            window.dispatchEvent(new CustomEvent('prakanguard:official-flood-points', { detail: { floodPoints: data.floodPoints } }));
          } catch (_) {}
        }

        // 3. Weather Data Updates
        if (data.weather) {
          updateWeatherDisplay(data.weather);
        }
      }
    } catch (err) {
      // Fail silently to prevent user interface interruptions
    } finally {
      isFetching = false;
    }
  }

  /**
   * Lifecycle Initialization
   */
  function initEngine() {
    if (syncTimer) clearInterval(syncTimer);

    // Initial check
    runSyncCycle();

    // Polling every 30 seconds
    syncTimer = setInterval(runSyncCycle, SYNC_INTERVAL_MS);

    // Re-check on tab visibility change or network reconnect
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') runSyncCycle();
    });
    window.addEventListener('online', runSyncCycle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

  // Debug Diagnostics Hook
  window.__officialSyncEngine = {
    syncNow: runSyncCycle,
    getStatus: () => ({
      version: lastKnownVersion,
      activeMarkersCount: currentOfficialMarkers.size,
      lastSyncTime: lastSyncTimestamp,
      intervalSeconds: SYNC_INTERVAL_MS / 1000
    }),
    getMarkersMap: () => currentOfficialMarkers
  };

})();
