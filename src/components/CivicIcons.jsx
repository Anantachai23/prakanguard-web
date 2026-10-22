import React from 'react';

/**
 * PRAKANGUARD BESPOKE CIVIC ICON SUITE
 * ชุดไอคอนเวกเตอร์ออกแบบเฉพาะ (Bespoke Architectural & Hydro-Telemetry SVGs)
 * สำหรับศูนย์บัญชาการข้อมูลอุทกภัยจังหวัดสมุทรปราการ
 * ดีไซน์แบบ Minimalist, Geometric Precision, Duo-tone ไม่ใช้ไอคอนสำเร็จรูปทั่วไป
 */

// 1. ตราสัญลักษณ์ศูนย์ข้อมูลพระสมุทรเจดีย์และเกลียวคลื่น (Provincial Crest)
export function CivicCrest({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14.5" stroke={color} strokeWidth="1.25" strokeDasharray="1 1.5" opacity="0.4" />
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" />
      <path d="M16 5V8M16 8L13 13H19L16 8Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M12 13H20V16H12V13Z" stroke={color} strokeWidth="1.25" />
      <path d="M10 16H22V19H10V16Z" stroke={color} strokeWidth="1.25" />
      <path d="M7 23C9 21.5 11 21.5 13 23C15 24.5 17 24.5 19 23C21 21.5 23 21.5 25 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 25.5C10 24.5 12 24.5 14 25.5C16 26.5 18 26.5 20 25.5C22 24.5 24 24.5 26 25.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 2. กล้องวงจรปิด CCTV ตรวจการณ์จริง (Surveillance Turret Camera)
export function CivicCctv({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5H11M7 5V8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 8.5L16.5 5.5C17.3 5.3 18.2 5.7 18.5 6.5L20 11C20.3 11.8 19.8 12.7 19 13L8.5 16C7.7 16.2 6.8 15.8 6.5 15L5.5 10C5.3 9.3 5.5 8.7 6 8.5Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <circle cx="17.5" cy="9.5" r="2.2" stroke={color} strokeWidth="1.4" />
      <circle cx="17.5" cy="9.5" r="0.8" fill={color} />
      <path d="M19.5 4C21 5.5 22 7 22 9" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M21 2.5C23 4.5 24 6.5 24 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 3. เรดาร์ตรวจจับกลุ่มฝนและสภาพอากาศ (Meteorological Doppler Radar)
export function CivicRadar({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 18V21M9 21H15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M7 15C8.5 13.5 15.5 13.5 17 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
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
      <line x1="10" y1="6" x2="14" y2="6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="9" x2="14" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="10" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="15" x2="14" y2="15" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
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
      <circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12.5" r="1.2" fill={color} />
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
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.15" />
      <path d="M4 6V12C4 13.7 7.6 15 12 15C16.4 15 20 13.7 20 12V6" stroke={color} strokeWidth="1.6" />
      <path d="M4 12V18C4 19.7 7.6 21 12 21C16.4 21 20 19.7 20 18V12" stroke={color} strokeWidth="1.6" />
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
      <line x1="12" y1="3.5" x2="12" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="18.5" x2="12" y2="20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.5" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="12,7 14,12 12,11 10,12" fill={color} />
      <polygon points="12,17 14,12 12,13 10,12" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.3" />
    </svg>
  );
}

// 11. สภาพอากาศตรวจวัด ปภ. (Civic Weather Meteorology)
export function CivicWeather({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.15" />
      <line x1="9" y1="2.5" x2="9" y2="3.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="5.5" x2="5.5" y2="6.3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13.5" y1="5.5" x2="12.5" y2="6.3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 17C5.3 17 4 15.7 4 14C4 12.5 5.1 11.2 6.5 11C7.1 9.3 8.7 8 10.6 8C12.7 8 14.4 9.4 14.8 11.3C15.2 11.1 15.6 11 16 11C17.7 11 19 12.3 19 14C19 15.7 17.7 17 16 17H7Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
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
      {isOpen ? (
        <path d="M6.5 12L5 10.5M5 13.5L6.5 12" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 12L6.5 10.5M6.5 13.5L5 12" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// 15. หมุดสถานีตรวจวัดพร้อมสัญญาณกระจาย (Station Pin Beacon)
export function CivicStationPin({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.7 2 6 4.7 6 8C6 12.5 12 21 12 21C12 21 18 12.5 18 8C18 4.7 15.3 2 12 2Z" 
            stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <circle cx="12" cy="8" r="2.8" fill={color} />
      <circle cx="12" cy="8" r="1" fill="#ffffff" />
    </svg>
  );
}

// 16. รถยนต์นั่งส่วนบุคคล / รถเก๋ง (Passenger Sedan Silhouette)
export function CivicVehicleSedan({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14L5 9.5C5.4 8.6 6.3 8 7.3 8H14.5C15.6 8 16.5 8.6 17 9.5L19.5 13L21 13.5V16.5H3V14Z"
            stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.12" />
      <circle cx="7" cy="16.5" r="2" stroke={color} strokeWidth="1.5" fill="#0f172a" />
      <circle cx="17" cy="16.5" r="2" stroke={color} strokeWidth="1.5" fill="#0f172a" />
    </svg>
  );
}

// 17. รถจักรยานยนต์ (Motorcycle Silhouette)
export function CivicVehicleMoto({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6.5" cy="16.5" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="17.5" cy="16.5" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M6.5 16.5L10 11H14L15.5 14H11.5L9.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8.5H16L17.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 18. รถกระบะ / SUV ยกสูง (High-Clearance Pickup / SUV Silhouette)
export function CivicVehicleSuv({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 15V10.5L4.5 7H13.5L15.5 10.5H21.5V15H2.5Z"
            stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.12" />
      <circle cx="6.5" cy="16" r="2.3" stroke={color} strokeWidth="1.5" fill="#0f172a" />
      <circle cx="17.5" cy="16" r="2.3" stroke={color} strokeWidth="1.5" fill="#0f172a" />
    </svg>
  );
}

// 19. รถบรรทุกขนาดใหญ่ (Heavy Transport Truck Silhouette)
export function CivicVehicleTruck({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="12.5" height="9" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12" />
      <path d="M14.5 9.5H18.5L21 12.5V15H14.5V9.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="6" cy="16.5" r="2" stroke={color} strokeWidth="1.5" fill="#0f172a" />
      <circle cx="11" cy="16.5" r="2" stroke={color} strokeWidth="1.5" fill="#0f172a" />
      <circle cx="18" cy="16.5" r="2" stroke={color} strokeWidth="1.5" fill="#0f172a" />
    </svg>
  );
}

// 20. โครงข่ายถนนและเส้นทางหลัก (Highway Corridor Vector)
export function CivicRouteCorridor({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20L8.5 4M20 20L15.5 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="5" x2="12" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="11" x2="12" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 21. นำทางพิกัดดาวเทียม (Precision Navigation Vector)
export function CivicNavigationArrow({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,3 20,20 12,16 4,20" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <line x1="12" y1="3" x2="12" y2="16" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

// 22. แนวโน้มระดับน้ำลดลง / เพิ่มขึ้น (Hydro Trend Indicator)
export function CivicWaterTrend({ className = "w-4 h-4", direction = "down", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {direction === "down" ? (
        <>
          <path d="M3 6L8.5 11.5L12 8L17 13" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 13H17V9" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M3 14L8.5 8.5L12 12L17 7" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 7H17V11" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

// 23. ผลึกน้ำแข็ง / ลูกเห็บ (Meteorological Hail Crystal)
export function CivicHailCrystal({ className = "w-4 h-4", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <line x1="4" y1="7" x2="20" y2="17" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <line x1="20" y1="7" x2="4" y2="17" stroke={color} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}
