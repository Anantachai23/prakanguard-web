import React from 'react';

/**
 * PRAKANGUARD BESPOKE CIVIC ICON SUITE
 * ออกแบบไอคอนเวกเตอร์เฉพาะ (Bespoke SVG) สำหรับศูนย์ปฏิบัติการข้อมูลภาครัฐ
 * ดีไซน์แบบ Minimalist, Geometric Precision, Duo-tone ไม่ใช้ไอคอนสำเร็จรูปทั่วไป
 */

// 1. ตราสัญลักษณ์ศูนย์ข้อมูลพระสมุทรเจดีย์และเกลียวคลื่น (Provincial Crest)
export function CivicCrest({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14.5" stroke={color} strokeWidth="1.25" strokeDasharray="1 1.5" opacity="0.4" />
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" />
      {/* Phra Samut Chedi Spire */}
      <path d="M16 5V8M16 8L13 13H19L16 8Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M12 13H20V16H12V13Z" stroke={color} strokeWidth="1.25" />
      <path d="M10 16H22V19H10V16Z" stroke={color} strokeWidth="1.25" />
      {/* Hydro Wave */}
      <path d="M7 23C9 21.5 11 21.5 13 23C15 24.5 17 24.5 19 23C21 21.5 23 21.5 25 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 25.5C10 24.5 12 24.5 14 25.5C16 26.5 18 26.5 20 25.5C22 24.5 24 24.5 26 25.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 2. กล้องวงจรปิด CCTV ตรวจการณ์จริง (Surveillance Turret Camera)
export function CivicCctv({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ceiling / Pole Mount */}
      <path d="M3 5H11M7 5V8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* Camera Chassis (Precision Hex Angle) */}
      <path d="M6 8.5L16.5 5.5C17.3 5.3 18.2 5.7 18.5 6.5L20 11C20.3 11.8 19.8 12.7 19 13L8.5 16C7.7 16.2 6.8 15.8 6.5 15L5.5 10C5.3 9.3 5.5 8.7 6 8.5Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      {/* Optical Lens Elements */}
      <circle cx="17.5" cy="9.5" r="2.2" stroke={color} strokeWidth="1.4" />
      <circle cx="17.5" cy="9.5" r="0.8" fill={color} />
      {/* Live Signal Wave */}
      <path d="M19.5 4C21 5.5 22 7 22 9" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M21 2.5C23 4.5 24 6.5 24 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 3. เรดาร์ตรวจจับกลุ่มฝนและสภาพอากาศ (Meteorological Doppler Radar)
export function CivicRadar({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base Mount */}
      <path d="M12 18V21M9 21H15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* Concentric Signal Arcs */}
      <path d="M5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {/* Radar Dish */}
      <path d="M7 15C8.5 13.5 15.5 13.5 17 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Center Transceiver & Sweep Line */}
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <line x1="12" y1="12" x2="16.5" y2="7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 4. มาตรวัดระดับน้ำอุทกวิทยา (Telemetry Hydro Gauge)
export function CivicGauge({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="3" width="10" height="18" rx="2" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.08" />
      {/* Graduation Ticks */}
      <line x1="10" y1="6" x2="14" y2="6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="9" x2="14" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="10" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="15" x2="14" y2="15" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Water Fill */}
      <path d="M8 14C9.5 13.5 11.5 14.5 13 14C14.5 13.5 15.5 14 16 14.5V19C16 19.5 15.5 20 15 20H9C8.5 20 8 19.5 8 19V14Z" 
            fill={color} fillOpacity="0.35" />
    </svg>
  );
}

// 5. กล้องแจ้งเหตุภาคประชาชน (Citizen Incident Camera)
export function CivicReportCamera({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8C4 6.9 4.9 6 6 6H8.5L9.8 4.2C10.1 3.8 10.6 3.5 11.2 3.5H12.8C13.4 3.5 13.9 3.8 14.2 4.2L15.5 6H18C19.1 6 20 6.9 20 8V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V8Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.1" />
      {/* Precision Lens & Crosshair Ring */}
      <circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12.5" r="1.2" fill={color} />
      {/* Flash Sensor */}
      <circle cx="17.5" cy="8.5" r="1" fill={color} />
    </svg>
  );
}

// 6. ข้อเสนอแนะประชาชน (Civic Dialogue)
export function CivicFeedback({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12C20 7.6 16.4 4 12 4C7.6 4 4 7.6 4 12C4 13.6 4.5 15 5.3 16.2L4 20L8 18.8C9.2 19.6 10.5 20 12 20C16.4 20 20 16.4 20 12Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.1" />
      {/* Three Precision Communication Dots */}
      <circle cx="8.5" cy="12" r="1.2" fill={color} />
      <circle cx="12" cy="12" r="1.2" fill={color} />
      <circle cx="15.5" cy="12" r="1.2" fill={color} />
    </svg>
  );
}

// 7. ฐานข้อมูลคลาวด์ Supabase (Telemetry Database Stack)
export function CivicDatabase({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Disk */}
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.15" />
      {/* Middle Disk */}
      <path d="M4 6V12C4 13.7 7.6 15 12 15C16.4 15 20 13.7 20 12V6" stroke={color} strokeWidth="1.6" />
      {/* Bottom Disk */}
      <path d="M4 12V18C4 19.7 7.6 21 12 21C16.4 21 20 19.7 20 18V12" stroke={color} strokeWidth="1.6" />
      {/* Telemetry Status Dots */}
      <circle cx="16.5" cy="12" r="0.9" fill={color} />
      <circle cx="16.5" cy="18" r="0.9" fill={color} />
    </svg>
  );
}

// 8. โล่ความมั่นคงและตรวจสอบสิทธิ์ (Civic Authority Shield)
export function CivicShield({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 6V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V6L12 3Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.12" />
      <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 9. ประกาศเตือนภัยและแจ้งข่าวสาร (Civic Broadcast Siren/Megaphone)
export function CivicBroadcast({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 11V13C4 14.1 4.9 15 6 15H7L12 19V5L7 9H6C4.9 9 4 9.9 4 11Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <path d="M15 9C16 10 16.5 11 16.5 12C16.5 13 16 14 15 15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18 6.5C19.8 8 20.5 10 20.5 12C20.5 14 19.8 16 18 17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 10. เข็มทิศนำทางและพิกัดภูมิศาสตร์ (GIS Compass Reticle)
export function CivicCompass({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      {/* 4 Cardinal Marks */}
      <line x1="12" y1="3.5" x2="12" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="18.5" x2="12" y2="20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.5" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Compass Needle */}
      <polygon points="12,7 14,12 12,11 10,12" fill={color} />
      <polygon points="12,17 14,12 12,13 10,12" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.3" />
    </svg>
  );
}

// 11. สภาพอากาศตรวจวัด ปภ. (Civic Weather Meteorology)
export function CivicWeather({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun Core */}
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.15" />
      <line x1="9" y1="2.5" x2="9" y2="3.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="5.5" x2="5.5" y2="6.3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13.5" y1="5.5" x2="12.5" y2="6.3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Cloud Formation */}
      <path d="M7 17C5.3 17 4 15.7 4 14C4 12.5 5.1 11.2 6.5 11C7.1 9.3 8.7 8 10.6 8C12.7 8 14.4 9.4 14.8 11.3C15.2 11.1 15.6 11 16 11C17.7 11 19 12.3 19 14C19 15.7 17.7 17 16 17H7Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      {/* Rain Drops */}
      <line x1="8" y1="19" x2="7" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12" y1="19" x2="11" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="19" x2="15" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 12. สายด่วนฉุกเฉินสาธารณภัย (Emergency Hotline Dispatch)
export function CivicEmergencyPhone({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="3" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.1" />
      <line x1="10" y1="6" x2="14" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="1.2" fill={color} />
      {/* Emergency Signal Ring */}
      <path d="M2 9C1 11 1 13 2 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 9C23 11 23 13 22 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 13. เกณฑ์วัดระดับน้ำและคู่มือสัญจร (Standards Document)
export function CivicStandards({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3H15L19 7V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V4C5 3.4 5.4 3 6 3Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.08" />
      <path d="M14 3V8H19" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="14" x2="14" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 14. ตัวเลือกเปิด/ปิดแผง GIS (Architectural Drawer Toggle)
export function CivicDrawerToggle({ className = "w-5 h-5", color = "currentColor", isOpen = true }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.08" />
      <line x1="9" y1="4" x2="9" y2="20" stroke={color} strokeWidth="1.6" />
      {/* Arrow Indicator */}
      {isOpen ? (
        <path d="M6.5 12L5 10.5M5 13.5L6.5 12" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 12L6.5 10.5M6.5 13.5L5 12" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// 15. หมุดสถานีตรวจวัดพร้อมสัญญาณกระจาย (Station Pin Beacon)
export function CivicStationPin({ className = "w-5 h-5", color = "currentColor", level = 1 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.7 2 6 4.7 6 8C6 12.5 12 21 12 21C12 21 18 12.5 18 8C18 4.7 15.3 2 12 2Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <circle cx="12" cy="8" r="2.8" fill={color} />
      <circle cx="12" cy="8" r="1" fill="#ffffff" />
    </svg>
  );
}

