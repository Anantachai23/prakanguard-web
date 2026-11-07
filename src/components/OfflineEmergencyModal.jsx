import React from 'react';
import { 
  X, 
  PhoneCall, 
  WifiOff, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/emergencyContacts';
import { playCloseSound, playEmergencySound } from '../services/soundEffects';

export default function OfflineEmergencyModal({
  isOpen,
  onClose,
  theme = 'light'
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleClose = () => {
    try { playCloseSound(); } catch (_) {}
    onClose();
  };

  const handleCall = (tel) => {
    try { playEmergencySound(); } catch (_) {}
    window.location.href = `tel:${tel.replace(/[^0-9]/g, '')}`;
  };

  return (
    <div 
      className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8 overflow-y-auto overscroll-contain select-none bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[480px] sm:max-w-lg my-auto m-auto border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-rose-950/20' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-rose-600 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">สายด่วนฉุกเฉิน จ.สมุทรปราการ (24 ชม.)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                สามารถโทรออกได้ทันทีแม้ไม่มีสัญญาณอินเทอร์เน็ต
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar-thin text-xs">
          
          {/* Quick Notice */}
          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
            isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>โหมดทำงานสำรอง:</strong> ข้อมูลเบอร์โทรหน่วยกู้ชีพและสถานีตำรวจถูกแคชไว้ในเครื่อง สามารถแตะเพื่อโทรออกได้ทันที
            </p>
          </div>

          {EMERGENCY_CONTACTS.map((cat, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {cat.category}
              </span>

              <div className={`rounded-2xl border divide-y overflow-hidden ${
                isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-150 bg-slate-50/50'
              }`}>
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={() => handleCall(item.tel)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-slate-800/60' : 'hover:bg-white'
                    } ${item.isPrimary ? (isDark ? 'bg-rose-950/30' : 'bg-rose-50/50') : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600 text-white shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {item.shortDesc}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(item.tel);
                      }}
                      className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-xs"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{item.tel}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Footer */}
        <div className={`px-4 py-2.5 sm:px-5 flex items-center justify-between gap-2 shrink-0 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <span className="text-[11px] text-slate-400">
            บริการสาธารณภัย จ.สมุทรปราการ
          </span>
          <button
            type="button"
            onClick={handleClose}
            className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
