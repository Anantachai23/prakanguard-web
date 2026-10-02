import React, { useState } from 'react';
import { X, ShieldAlert, Car, Bike, Truck, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { FLOOD_STANDARDS, VEHICLE_TOLERANCES } from '../data/floodStandards';

export default function FloodStandardsModal({ isOpen, onClose, theme = 'light' }) {
  const [activeTab, setActiveTab] = useState(1);

  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const currentStandard = FLOOD_STANDARDS.find(s => s.level === activeTab) || FLOOD_STANDARDS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                <path d="M6 14c1.5-1 3.5-1 5 0s3.5 1 5 0" />
                <path d="M6 18c1.5-1 3.5-1 5 0s3.5 1 5 0" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold flex flex-wrap items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>เกณฑ์มาตรฐานระดับน้ำท่วมผิวจราจร</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                  isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  มาตรฐาน ปภ. / กรมทางหลวง
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                เกณฑ์ประเมินความปลอดภัยในการสัญจรและผลกระทบต่อยานพาหนะ
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level Switcher Tabs */}
        <div className={`p-3 border-b flex items-center gap-2 ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {FLOOD_STANDARDS.map(s => {
            const isActive = activeTab === s.level;
            let activeStyle = isDark 
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 shadow-sm"
              : "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm";
            if (s.level === 2) {
              activeStyle = isDark 
                ? "bg-amber-950/80 text-amber-300 border-amber-800 shadow-sm" 
                : "bg-amber-50 text-amber-800 border-amber-300 shadow-sm";
            }
            if (s.level === 3) {
              activeStyle = isDark 
                ? "bg-rose-950/80 text-rose-300 border-rose-800 shadow-sm" 
                : "bg-rose-50 text-rose-800 border-rose-300 shadow-sm";
            }

            return (
              <button
                key={s.level}
                onClick={() => setActiveTab(s.level)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isActive 
                    ? activeStyle
                    : isDark
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  s.level === 1 ? 'bg-emerald-500' : s.level === 2 ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                <span className="truncate">{s.shortName} ({s.depthRange})</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-4 text-xs ${
          isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'
        }`}>
          
          {/* Main Level Feature Card */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'border-slate-750 bg-slate-850/80' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                  เกณฑ์วัดระดับความลึก
                </span>
                <h4 className={`text-base sm:text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentStandard.name}
                </h4>
              </div>
              <div className="text-right">
                <span className={`text-[10px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ช่วงความลึกผิวน้ำ</span>
                <span className={`text-xl font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                  {currentStandard.depthRange}
                </span>
              </div>
            </div>

            <p className={`mt-2.5 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>ความสูงเทียบร่างกาย:</strong> {currentStandard.waterDepthVisual}
            </p>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>คำแนะนำทางการ:</strong> {currentStandard.trafficAdvice}
            </p>
          </div>

          {/* Vehicle Impact Grid */}
          <div>
            <h5 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <span>ผลกระทบและเกณฑ์สัญจรรายประเภทยานพาหนะ</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Sedan */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-xs ${
                isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'
                }`}>
                  <Car className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStandard.vehicleImpact.sedan.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentStandard.vehicleImpact.sedan.status === 'safe'
                        ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-300')
                        : currentStandard.vehicleImpact.sedan.status === 'warning'
                        ? (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-300')
                        : (isDark ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-800 border border-rose-300')
                    }`}>
                      {currentStandard.vehicleImpact.sedan.status === 'safe' ? 'ผ่านได้' : currentStandard.vehicleImpact.sedan.status === 'warning' ? 'เสี่ยงสูง' : 'ห้ามผ่าน'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentStandard.vehicleImpact.sedan.desc}
                  </p>
                </div>
              </div>

              {/* Motorcycle */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-xs ${
                isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'
                }`}>
                  <Bike className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStandard.vehicleImpact.motorcycle.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentStandard.vehicleImpact.motorcycle.status === 'safe'
                        ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-300')
                        : currentStandard.vehicleImpact.motorcycle.status === 'warning'
                        ? (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-300')
                        : (isDark ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-800 border border-rose-300')
                    }`}>
                      {currentStandard.vehicleImpact.motorcycle.status === 'safe' ? 'ผ่านได้' : currentStandard.vehicleImpact.motorcycle.status === 'warning' ? 'เสี่ยงดับ' : 'ห้ามผ่าน'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentStandard.vehicleImpact.motorcycle.desc}
                  </p>
                </div>
              </div>

              {/* SUV / Pickup */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-xs ${
                isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStandard.vehicleImpact.suv.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentStandard.vehicleImpact.suv.status === 'safe'
                        ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-300')
                        : (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-300')
                    }`}>
                      {currentStandard.vehicleImpact.suv.status === 'safe' ? 'ผ่านได้' : 'ระวังพิเศษ'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentStandard.vehicleImpact.suv.desc}
                  </p>
                </div>
              </div>

              {/* Truck */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-xs ${
                isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStandard.vehicleImpact.truck.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    }`}>
                      ผ่านได้
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentStandard.vehicleImpact.truck.desc}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Tolerance Table */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
          }`}>
            <h5 className={`text-xs font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>ตารางขีดจำกัดความลึกปลอดภัยของรถแต่ละรุ่น (Ground Clearance)</h5>
            <div className="space-y-1.5">
              {VEHICLE_TOLERANCES.map((v, i) => (
                <div key={i} className={`flex items-center justify-between text-[11px] py-1 border-b last:border-0 ${
                  isDark ? 'border-slate-750' : 'border-slate-200'
                }`}>
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{v.type}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{v.note}</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>ปลอดภัย &le; {v.limitCm} ซม.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OIC Insurance & Reference */}
          <div className={`p-3 rounded-xl border text-[11px] flex items-center justify-between ${
            isDark ? 'bg-blue-950/60 border-blue-900 text-blue-200' : 'bg-blue-50/60 border-blue-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <Info className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>เกณฑ์ความเสียหาย คปภ.: <strong className={isDark ? 'text-white' : 'text-slate-800'}>{currentStandard.oicDamageLevel}</strong></span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>อ้างอิง: {currentStandard.officialRef}</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span className="text-[11px]">
            ขับขี่ปลอดภัย เมื่อน้ำท่วมทาง: ปิดแอร์ทันที • ห้ามเร่งเครื่อง • ห้ามสตาร์ทรถซ้ำ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-sm"
          >
            เข้าใจแล้ว
          </button>
        </div>

      </div>
    </div>
  );
}
