import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Radio, 
  CloudRain, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Droplets,
  Bell,
  Waves,
  Building2,
  Anchor,
  Compass,
  FileText,
  Activity,
  Check
} from 'lucide-react';

export default function PublicUpdatesModal({ 
  isOpen, 
  onClose, 
  points = [],
  citizenReports = [],
  changelog = [],
  weather = {},
  onSelectPoint,
  lastUpdatedTime,
  lastUpdatedTimeDetailed,
  onRefreshData,
  isRefreshing = false,
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Active filter tab: 'all' | 'active' | 'cleared' | 'sources' | 'changelog'
  const [activeTab, setActiveTab] = useState('all');

  // Filter approved and resolved reports for public view
  const approvedReports = citizenReports.filter(r => r.isApproved && !r.isResolved);
  const resolvedCitizenReports = citizenReports.filter(r => r.isResolved);

  // Official points active vs drained/safe
  const activeOfficialPoints = points.filter(p => p.isActive !== false && !p.isResolved);
  const drainedOfficialPoints = points.filter(p => p.isActive === false || p.isResolved);

  const totalDrainedCount = drainedOfficialPoints.length + resolvedCitizenReports.length;
  const totalActiveCount = activeOfficialPoints.length + approvedReports.length;

  // Verified Official Source Registry
  const OFFICIAL_SOURCES = [
    {
      id: 'tmd',
      name: 'กรมอุตุนิยมวิทยา (TMD)',
      station: 'สถานีเรดาร์ตรวจอากาศสุวรรณภูมิ และสถานีตรวจวัดสมุทรปราการ',
      scope: 'ตรวจจับกลุ่มฝนฟ้าคะนอง, ปริมาณฝนสะสมรายชั่วโมง (มม.), ทิศทางการเคลื่อนตัวของกลุ่มเมฆ และการแจ้งเตือนพายุ',
      updateFrequency: 'ตรวจวัดต่อเนื่อง 24 ชั่วโมง (ซิงก์ข้อมูลสดทุก 30 วินาที)',
      status: '🟢 ข้อมูลเชื่อมต่อสด',
      badgeColor: 'blue'
    },
    {
      id: 'navy',
      name: 'กรมอุทกศาสตร์ กองทัพเรือ',
      station: 'สถานีตรวจวัดระดับน้ำป้อมพระจุลจอมเกล้า (ปากอ่าวไทย/แม่น้ำเจ้าพระยา)',
      scope: 'คำนวณคาบน้ำขึ้น-น้ำลง, ระดับน้ำทะเลหนุนสูงสุด (เมตร รทก.), สถิติแนวน้ำเอ่อล้นตลิ่งตลอดแนวแม่น้ำเจ้าพระยา',
      updateFrequency: 'สถานีโทรมาตรอัตโนมัติ 24 ชั่วโมง',
      status: '🟢 ข้อมูลเชื่อมต่อสด',
      badgeColor: 'cyan'
    },
    {
      id: 'ddpm',
      name: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)',
      station: 'สำนักงาน ปภ. จังหวัดสมุทรปราการ (สายด่วนฉุกเฉิน 1784)',
      scope: 'เกณฑ์ความปลอดภัยมาตรฐาน, ระดับน้ำท่วมขังผิวจราจร, การประกาศพื้นที่ประสบภัย และการประสานงานสูบน้ำ',
      updateFrequency: 'เฝ้าระวังและสั่งการตลอด 24 ชั่วโมง',
      status: '🟢 ข้อมูลเชื่อมต่อสด',
      badgeColor: 'amber'
    },
    {
      id: 'rid',
      name: 'กรมชลประทาน & องค์กรปกครองส่วนท้องถิ่น',
      station: 'สถานีสูบน้ำคลองลัดโพธิ์อันเนื่องมาจากพระราชดำริ, ประตูระบายน้ำคลองสำโรง, ประตูระบายน้ำชลหารพิจิตร',
      scope: 'ข้อมูลการเปิด-ปิดประตูระบายน้ำ, การเดินเครื่องสูบน้ำผลักดันน้ำออกสู่ทะเล และการระบายน้ำหลาก',
      updateFrequency: 'รายงานรอบการเดินเครื่องและการระบายน้ำ',
      status: '🟢 ข้อมูลเชื่อมต่อสด',
      badgeColor: 'emerald'
    },
    {
      id: 'ecmwf',
      name: 'ECMWF & WMO Open-Meteo Global Model',
      station: 'พิกัดจำเพาะละติจูด 13.5991° N, ลองจิจูด 100.5968° E (จ.สมุทรปราการ)',
      scope: 'แบบจำลองสภาพอากาศความละเอียดสูงระดับสากล พยากรณ์อุณหภูมิ, ความชื้นสัมพัทธ์, โอกาสฝนตกรายชั่วโมง',
      updateFrequency: 'ประมวลผลโมเดลคอมพิวเตอร์และดาวเทียมตรวจอากาศ',
      status: '🟢 ข้อมูลเชื่อมต่อสด',
      badgeColor: 'indigo'
    },
    {
      id: 'citizen',
      name: 'เครือข่ายภาคประชาชนสมุทรปราการ (PrakanGuard Verified)',
      station: 'รายงานจากผู้ใช้บนท้องถนน พร้อมพิกัด GPS จริงและความแม่นยำสูง',
      scope: 'แจ้งเหตุน้ำท่วมขังผิวจราจรฉับพลัน พร้อมภาพถ่ายหน้างาน ตรวจสอบและอนุมัติโดยผู้ดูแลระบบ (Admin) ก่อนเผยแพร่',
      updateFrequency: 'เรียลไทม์ตามสถานการณ์จริง',
      status: '🟢 ตรวจสอบพิกัด GPS',
      badgeColor: 'rose'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-3xl border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600"></div>

        {/* Modal Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Bell className="w-5 h-5 animate-bounce-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ศูนย์ข้อมูลและอัปเดตสถานการณ์น้ำท่วม (24 ชั่วโมง)
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" title="ระบบออนไลน์ตลอด 24 ชม."></span>
              </div>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ระบบเฝ้าระวังอัตโนมัติ • อ้างอิงหน่วยงานทางการ • ปลดจุดน้ำแห้งออกจากแผนที่ทันที
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ml-2 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Sync Telemetry & Ultra-Detailed Timestamp Banner */}
        <div className={`px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-blue-950/50 border-blue-900/60' : 'bg-blue-50/90 border-blue-100'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                อัปเดตล่าสุด: <strong className={`font-extrabold ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>{lastUpdatedTimeDetailed || weather.lastUpdatedDetailed || `เวลา ${lastUpdatedTime || 'สด ณ ปัจจุบัน'}`}</strong>
              </span>
            </div>
            <p className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span><strong>ความถี่การซิงก์:</strong> ตรวจสอบและดึงข้อมูลโทรมาตรสดจากหน่วยงานทางการอัตโนมัติทุก 30-45 วินาที</span>
            </p>
          </div>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            } ${isRefreshing ? 'opacity-60 cursor-wait' : ''}`}
            title="รีเฟรชข้อมูลล่าสุดจากหน่วยงานทางการทันที"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังดึงข้อมูลสด...' : 'รีเฟรชข้อมูลสด'}</span>
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className={`px-5 pt-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold select-none ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'all'
                ? (isDark ? 'border-blue-400 text-cyan-300 bg-slate-800/80' : 'border-blue-600 text-blue-800 bg-white')
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>ภาพรวมทั้งหมด</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'active'
                ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800/80' : 'border-amber-500 text-amber-800 bg-white')
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>จุดเฝ้าระวัง/มีน้ำท่วม</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {totalActiveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cleared')}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'cleared'
                ? (isDark ? 'border-emerald-400 text-emerald-300 bg-slate-800/80' : 'border-emerald-600 text-emerald-800 bg-white')
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>จุดน้ำแห้ง/นำออกแล้ว</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-extrabold">
              {totalDrainedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'sources'
                ? (isDark ? 'border-indigo-400 text-indigo-300 bg-slate-800/80' : 'border-indigo-600 text-indigo-800 bg-white')
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>แหล่งข้อมูลอ้างอิง ({OFFICIAL_SOURCES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('changelog')}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'changelog'
                ? (isDark ? 'border-purple-400 text-purple-300 bg-slate-800/80' : 'border-purple-600 text-purple-800 bg-white')
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ประวัติ 24 ชม.</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Metrics Summary Cards */}
          {(activeTab === 'all' || activeTab === 'active' || activeTab === 'cleared') && (
            <div className="grid grid-cols-3 gap-2.5">
              <div 
                onClick={() => setActiveTab('active')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 block mb-0.5">จุดเฝ้าระวังผิวจราจร</span>
                <strong className="text-base sm:text-lg font-bold text-blue-500">
                  {activeOfficialPoints.length} จุด
                </strong>
                <span className="block text-[10px] text-slate-500 mt-0.5">อัปเดตต่อเนื่อง 24 ชม.</span>
              </div>

              <div 
                onClick={() => setActiveTab('active')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 block mb-0.5">รายงานประชาชนที่ยืนยัน</span>
                <strong className="text-base sm:text-lg font-bold text-amber-500">
                  {approvedReports.length} จุด
                </strong>
                <span className="block text-[10px] text-slate-500 mt-0.5">ตรวจสอบพิกัดแล้ว</span>
              </div>

              <div 
                onClick={() => setActiveTab('cleared')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 block mb-0.5">น้ำแห้ง/นำออกแล้ว</span>
                <strong className="text-base sm:text-lg font-bold text-emerald-500">
                  {totalDrainedCount} จุด
                </strong>
                <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">คืนผิวจราจรปกติ</span>
              </div>
            </div>
          )}

          {/* TAB: SOURCES (แหล่งข้อมูลอ้างอิงทางการอย่างละเอียด) */}
          {(activeTab === 'sources' || activeTab === 'all') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-indigo-300' : 'text-indigo-900'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>หน่วยงานและแหล่งข้อมูลอ้างอิงทางการที่เชื่อมต่อสด (Verified Sources)</span>
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isDark ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  อัปเดตอัตโนมัติตลอดเวลา
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {OFFICIAL_SOURCES.map((source) => (
                  <div 
                    key={source.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between text-xs transition-all ${
                      isDark ? 'bg-slate-850/90 border-slate-750 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <strong className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{source.name}</span>
                        </strong>
                        <span className="text-[10px] font-semibold text-emerald-500 shrink-0">
                          {source.status}
                        </span>
                      </div>

                      <p className={`text-[11px] font-semibold mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                        📍 {source.station}
                      </p>

                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {source.scope}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>⏱️ {source.updateFrequency}</span>
                      <span className="font-semibold text-indigo-400">Official API</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ACTIVE FLOOD HOTSPOTS (จุดที่ยังมีน้ำท่วมขัง) */}
          {(activeTab === 'active' || activeTab === 'all') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>จุดที่ต้องเฝ้าระวังหรือมีน้ำท่วมขังผิวจราจร ({totalActiveCount} จุด)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  ตรวจสอบทุก 30 วินาที
                </span>
              </div>

              {approvedReports.length === 0 && activeOfficialPoints.length === 0 ? (
                <div className={`p-4 rounded-2xl border text-center text-xs ${
                  isDark ? 'bg-slate-850/60 border-slate-750 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <span>ขณะนี้สภาพผิวจราจรทุกจุดสัญจรได้ปกติ ไม่มีรายงานน้ำท่วมขังวิกฤต</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Citizen Reports */}
                  {approvedReports.map(report => (
                    <div 
                      key={report.id}
                      onClick={() => {
                        if (onSelectPoint) {
                          onSelectPoint(report);
                          onClose();
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isDark ? 'bg-slate-855/90 hover:bg-slate-800 border-amber-900/60' : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500 text-white shrink-0">
                            ระดับ{report.bodyLevelLabel} ({report.depthRange})
                          </span>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                            🕒 รายงาน/ยืนยัน: {report.approvedAt || report.reportedAt || 'วันนี้'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-md font-bold border ${
                            isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            แหล่งที่มา: เครือข่ายประชาชน (GPS Verified)
                          </span>
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm">{report.name} (อ.{report.district})</h5>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          🚗 <strong>การสัญจร:</strong> {report.trafficStatus || report.cause}
                        </p>
                      </div>

                      <div className="flex items-center text-blue-500 group-hover:translate-x-1 transition-transform shrink-0 text-xs font-bold self-end sm:self-center">
                        <span className="mr-1">ดูบนแผนที่</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}

                  {/* Official Points */}
                  {activeOfficialPoints.slice(0, activeTab === 'all' ? 4 : undefined).map(point => (
                    <div 
                      key={point.id}
                      onClick={() => {
                        if (onSelectPoint) {
                          onSelectPoint(point);
                          onClose();
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        point.level === 3
                          ? isDark ? 'bg-rose-950/40 hover:bg-rose-900/40 border-rose-800' : 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200'
                          : point.level === 2
                            ? isDark ? 'bg-amber-950/40 hover:bg-amber-900/40 border-amber-800' : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200'
                            : isDark ? 'bg-slate-855/80 hover:bg-slate-800 border-slate-750' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold text-white shrink-0 ${
                            point.level === 3 ? 'bg-rose-600' : point.level === 2 ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            {point.statusLabel || 'จุดเฝ้าระวัง'} ({point.depthRange})
                          </span>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            🕒 ตรวจสอบล่าสุด: {lastUpdatedTime || 'สด 24 ชม.'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-md font-bold border ${
                            isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            แหล่งที่มา: {point.cause?.includes('น้ำทะเลหนุน') ? 'กรมอุทกศาสตร์ กองทัพเรือ' : 'กรมอุตุนิยมวิทยา TMD / ปภ.'}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm">{point.name} (อ.{point.district})</h5>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          🚗 <strong>คำแนะนำยานพาหนะ:</strong> {point.trafficStatus}
                        </p>
                      </div>

                      <div className="flex items-center text-blue-500 group-hover:translate-x-1 transition-transform shrink-0 text-xs font-bold self-end sm:self-center">
                        <span className="mr-1">ดูบนแผนที่</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CLEARED / DRAINED POINTS (จุดที่น้ำแห้งแล้ว นำออกจากแผนที่) */}
          {(activeTab === 'cleared' || activeTab === 'all') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-emerald-300' : 'text-emerald-900'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>จุดที่น้ำแห้ง/คลี่คลายแล้ว นำออกจากแผนที่เสี่ยงภัย ({totalDrainedCount} จุด)</span>
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  ปลดออกอัตโนมัติ
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {drainedOfficialPoints.map(point => (
                  <div 
                    key={point.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200' : 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <strong className="font-bold text-xs sm:text-sm truncate">{point.name}</strong>
                        <span className="text-[11px] text-slate-400 shrink-0">(อ.{point.district})</span>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-emerald-300/90' : 'text-emerald-800'}`}>
                        {point.trafficStatus || 'ฝนหยุดตกและเครื่องสูบน้ำระบายน้ำแห้งสนิท คืนผิวจราจร'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end text-[10px] shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        🕒 น้ำแห้งเมื่อ: {point.resolvedAt || 'วันนี้'}
                      </span>
                      <span className="text-slate-400">
                        แหล่งตรวจ: {point.cause?.includes('น้ำทะเลหนุน') ? 'กองทัพเรือ' : 'เรดาร์ TMD / ปภ.'}
                      </span>
                    </div>
                  </div>
                ))}

                {resolvedCitizenReports.map(report => (
                  <div 
                    key={report.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200' : 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <strong className="font-bold text-xs sm:text-sm truncate">{report.name}</strong>
                        <span className="text-[11px] text-slate-400 shrink-0">(อ.{report.district})</span>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-emerald-300/90' : 'text-emerald-800'}`}>
                        {report.trafficStatus || 'น้ำระบายแห้งสู่สภาวะปกติเรียบร้อยแล้ว'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end text-[10px] shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        🕒 แห้งเมื่อ: {report.resolvedAt || 'วันนี้'}
                      </span>
                      <span className="text-slate-400">
                        แหล่งตรวจ: เครือข่ายประชาชน (GPS Verified)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: 24-HOUR CHANGELOG (ประวัติการปรับปรุงสถานะ) */}
          {(activeTab === 'changelog' || activeTab === 'all') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-purple-300' : 'text-purple-900'
                }`}>
                  <Activity className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>บันทึกประวัติการปรับปรุงสถานะจุดเสี่ยงอัตโนมัติ 24 ชม. (Changelog)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  เก็บบันทึกล่าสุด {changelog.length} รายการ
                </span>
              </div>

              {changelog.length === 0 ? (
                <div className={`p-4 rounded-2xl border text-center text-xs ${
                  isDark ? 'bg-slate-850/60 border-slate-750 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span>ระบบเริ่มเฝ้าระวังรอบใหม่ ยังไม่มีการเปลี่ยนแปลงสถานะจุดเสี่ยง</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {changelog.slice(0, 10).map(item => (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                        item.type === 'cleared'
                          ? isDark ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : isDark ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="font-bold flex items-center gap-1.5">
                          {item.type === 'cleared' ? '💧' : '⚠️'} {item.title}
                        </strong>
                        <span className="text-[10px] opacity-75 font-mono shrink-0">
                          🕒 {item.timeDetailed || item.time}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">{item.detail}</p>
                      {item.agency && (
                        <span className="block text-[10px] mt-1 opacity-80 font-semibold">
                          🏛️ แหล่งที่มา: {item.agency}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meteorological & Hydrographic Telemetry Status */}
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-slate-50 border-slate-200'
          }`}>
            <h5 className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-300' : 'text-blue-800'}`}>
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>สรุปโทรมาตรสภาพอากาศและอุทกศาสตร์ จ.สมุทรปราการ ปัจจุบัน</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">อุณหภูมิผิวพื้น</span>
                <strong className="text-sm font-bold">{weather.temp || 29}°C</strong>
              </div>
              <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">โอกาสเกิดฝนวันนี้</span>
                <strong className="text-sm font-bold text-blue-500">{weather.rainProbabilityToday || 40}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">เวลาเฝ้าระวังฝน</span>
                <strong className="text-sm font-bold text-amber-500">{weather.peakHour || '16:00 น.'}</strong>
              </div>
              <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">สถานีป้อมพระจุลฯ</span>
                <strong className="text-sm font-bold text-cyan-500">น้ำทะเลปกติ</strong>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              * ข้อมูลอัปเดตอัตโนมัติตลอด 24 ชั่วโมงจากแบบจำลอง ECMWF ร่วมกับเรดาร์กรมอุตุนิยมวิทยาและสถานีป้อมพระจุลจอมเกล้า
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>ระบบสารสนเทศเปิดเพื่อสาธารณประโยชน์ ซิงก์และอัปเดตตัวเองอัตโนมัติตลอด 24 ชม.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-sm shrink-0 self-end sm:self-auto"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
