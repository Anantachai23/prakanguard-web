import React, { useState } from 'react';
import { ANALYTICS_DATA } from '../data/analyticsData';
import { useToast } from '../context/ToastContext';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target, 
  Lightbulb, 
  Award, 
  ArrowUpRight, 
  DollarSign, 
  Percent,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AnalyticsView = () => {
  const { addToast } = useToast();
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'monthly' | 'yearly'

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
    const label = tf === 'daily' ? 'รายวัน (7 วันล่าสุด)' : tf === 'monthly' ? 'รายเดือน (12 เดือน)' : 'รายปี (2024-2027)';
    addToast(`แสดงข้อมูลแนวโน้ม: ${label}`, 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-3xl p-6 sm:p-8 text-white border border-[#C5A880]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> MARKETING & OCCUPANCY INTELLIGENCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            วิเคราะห์แนวโน้มผู้เข้าพักเพื่อการบริหารการตลาด
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            ระบบวิเคราะห์สถิติความหนาแน่นของผู้เข้าพักต่อวัน / ต่อเดือน / ต่อปี พร้อมจำแนกพฤติกรรมตามขนาดห้องพัก เพื่อนำไปวางแผนกลยุทธ์การตลาดและจัดโปรโมชั่นอย่างตรงจุด
          </p>
        </div>

        {/* Timeframe Switcher Tabs */}
        <div className="flex bg-[#0B132B] p-1.5 rounded-2xl border border-white/15 shrink-0">
          <button
            onClick={() => handleTimeframeChange('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              timeframe === 'daily'
                ? 'bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            รายวัน (Daily)
          </button>
          <button
            onClick={() => handleTimeframeChange('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              timeframe === 'monthly'
                ? 'bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            รายเดือน (Monthly)
          </button>
          <button
            onClick={() => handleTimeframeChange('yearly')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              timeframe === 'yearly'
                ? 'bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            รายปี (Yearly)
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>อัตราการเข้าพักเฉลี่ย (Occupancy)</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{ANALYTICS_DATA.summary.averageOccupancyRate}%</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% เทียบกับไตรมาสก่อน
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>จำนวนผู้เข้าพักสะสม (YTD)</span>
            <Users className="w-4 h-4 text-[#9A7B4F]" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{ANALYTICS_DATA.summary.totalGuestsYearToDate.toLocaleString()} ท่าน</div>
          <div className="text-[11px] text-[#9A7B4F] font-medium">
            เฉลี่ย 2.4 คืน / การเข้าพัก
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>การเติบโตของรายได้ (YoY)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">+{ANALYTICS_DATA.summary.revenueGrowthYearOverYear}%</div>
          <div className="text-[11px] text-emerald-600 font-medium">
            สูงกว่าเป้าหมายการตลาด 15%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ประเภทห้องยอดนิยมสูงสุด</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-[#0B132B] truncate leading-snug">
            {ANALYTICS_DATA.summary.bestSellingCategory}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            อัตราการเข้าพักสุดสัปดาห์ 98.4%
          </div>
        </div>
      </div>

      {/* CHART & VISUALIZATION AREA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-slate-900">
              {timeframe === 'daily' && 'แนวโน้มผู้เข้าพักและรายได้รายวัน (Daily Occupancy Pattern)'}
              {timeframe === 'monthly' && 'แนวโน้มผู้เข้าพักและฤดูกาลท่องเที่ยวรายเดือน (Monthly Seasonality)'}
              {timeframe === 'yearly' && 'แนวโน้มการเติบโตระยะยาวรายปี (Long-Term Growth Trend)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              วิเคราะห์ความผันผวนของจำนวนแขก เพื่อกำหนดกลยุทธ์ Dynamic Pricing และแคมเปญส่งเสริมการขาย
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#C5A880]"></span>
              <span className="text-slate-600">อัตราเข้าพัก (%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0B132B]"></span>
              <span className="text-slate-600">ผู้เข้าพัก (ท่าน)</span>
            </span>
          </div>
        </div>

        {/* 1. DAILY VISUALIZATION */}
        {timeframe === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-8 pb-4 h-64 border-b border-slate-100">
              {ANALYTICS_DATA.daily.map((item, idx) => {
                const heightPercent = item.occupancy;
                const isWeekend = item.day === 'ศุกร์' || item.day === 'เสาร์';
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0B132B] text-white text-[10px] p-2 rounded-lg pointer-events-none shadow-lg whitespace-nowrap z-10">
                      <div>ผู้เข้าพัก: {item.guests} ท่าน</div>
                      <div>เข้าพัก: {item.occupancy}%</div>
                      <div>รายได้: ฿{(item.revenue / 1000).toFixed(0)}k</div>
                    </div>

                    <div className="w-full max-w-[48px] flex items-end justify-center h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 relative flex items-center justify-center ${
                          isWeekend
                            ? 'bg-gradient-to-t from-[#9A7B4F] to-[#C5A880] shadow-md'
                            : 'bg-gradient-to-t from-slate-700 to-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-white mb-1.5 select-none hidden sm:block">
                          {item.occupancy}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <div className={`text-xs font-semibold ${isWeekend ? 'text-[#9A7B4F]' : 'text-slate-700'}`}>
                        {item.day}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.guests} คน</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>บทวิเคราะห์การตลาดรายวัน:</strong> วันศุกร์และเสาร์มีอัตราผู้เข้าพักเกือบเต็ม 100% (High Weekend Surge) โดยห้องใหญ่ (6 คนขึ้นไป) ถูกจองหมดเร็วที่สุด ส่วนวันจันทร์-อังคารอัตราเข้าพักลดลงเหลือ 62-65% ควรใช้กลยุทธ์ <strong>Weekday Staycation</strong> หรือโปรโมชั่นฟรีอาหารเช้าเพื่อดึงดูดลูกค้าวันธรรมดา
              </div>
            </div>
          </div>
        )}

        {/* 2. MONTHLY VISUALIZATION */}
        {timeframe === 'monthly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end pt-8 pb-4 h-64 border-b border-slate-100">
              {ANALYTICS_DATA.monthly.map((item, idx) => {
                const heightPercent = item.occupancy;
                const isPeak = item.occupancy >= 90;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0B132B] text-white text-[10px] p-2 rounded-lg pointer-events-none shadow-lg whitespace-nowrap z-10">
                      <div className="font-bold">{item.month} • {item.season}</div>
                      <div>ผู้เข้าพัก: {item.guests} ท่าน ({item.occupancy}%)</div>
                      <div>รายได้: {item.revenueM} ล้านบาท</div>
                    </div>

                    <div className="w-full max-w-[28px] sm:max-w-[40px] flex items-end justify-center h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 relative flex items-center justify-center ${
                          isPeak
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : item.occupancy < 70
                            ? 'bg-gradient-to-t from-slate-400 to-slate-300'
                            : 'bg-gradient-to-t from-[#9A7B4F] to-[#C5A880]'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-white mb-1 select-none hidden sm:block">
                          {item.occupancy}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <div className="text-[11px] font-semibold text-slate-800">{item.month}</div>
                      <div className="text-[9px] text-slate-400">{item.revenueM}M฿</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 leading-relaxed flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong>บทวิเคราะห์การตลาดรายเดือน:</strong> จุดสูงสุด (Peak) อยู่ที่เดือน <strong>เมษายน (สงกรานต์)</strong> และ <strong>ธันวาคม (ปีใหม่)</strong> อัตราเข้าพัก 98-99% ควรเปิดรับจองแบบ Early Bird ล่วงหน้า 60 วันพร้อม non-refundable rate เพื่อล็อครายได้ ส่วนช่วง <strong>พ.ค. - ก.ย. (Green Season)</strong> ควรเน้นแพ็กเกจในร่มและโปรโมชั่นสปา
              </div>
            </div>
          </div>
        )}

        {/* 3. YEARLY VISUALIZATION */}
        {timeframe === 'yearly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {ANALYTICS_DATA.yearly.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{item.year}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.growth}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">ผู้เข้าพักทั้งปี</div>
                    <div className="text-xl font-bold text-slate-900">{item.totalGuests.toLocaleString()} ท่าน</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-500">รายได้รวม:</span>
                    <span className="font-bold text-[#9A7B4F]">{item.totalRevenueM} ล้านบาท</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Occupancy เฉลี่ย:</span>
                    <span className="font-semibold text-slate-800">{item.avgOccupancy}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>บทวิเคราะห์การเติบโตรายปี:</strong> โรงแรมมีอัตราการเติบโตของรายได้สม่ำเสมอเฉลี่ย +17.5% ต่อปี โดยมีแนวโน้มขยายตัวอย่างต่อเนื่องในปี 2026-2027 จากการเปิดเส้นทางบินตรงและการร่วมมือกับแพลตฟอร์มท่องเที่ยวระดับนานาชาติ
              </div>
            </div>
          </div>
        )}

      </div>

      {/* DEMOGRAPHICS & ROOM LEVEL BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Guest Segmentation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">สัดส่วนกลุ่มผู้เข้าพัก (Demographic Segments)</h3>
              <p className="text-xs text-slate-500">ข้อมูลกลุ่มลูกค้าเป้าหมายสำหรับทำแคมเปญโฆษณา</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {ANALYTICS_DATA.demographics.map((seg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{seg.segment}</span>
                  <span className="font-bold text-[#9A7B4F]">{seg.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${seg.percentage}%` }}
                    className="h-full bg-gradient-to-r from-[#9A7B4F] to-[#C5A880] rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>ห้องที่นิยม: {seg.preferredCategory}</span>
                  <span>กำลังซื้อ: {seg.spendingScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Marketing Strategies */}
        <div className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 border border-[#C5A880]/30 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C2541] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">กลยุทธ์การตลาดแนะนำ (Marketing Action Plan)</h3>
              <p className="text-xs text-slate-400">มาตรการขับเคลื่อนยอดขายจากผลวิเคราะห์ข้อมูลจริง</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {ANALYTICS_DATA.marketingStrategies.map((strat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#1C2541]/70 border border-white/10 space-y-1.5 text-xs"
              >
                <div className="font-bold text-[#C5A880] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{strat.title}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong>การปฏิบัติ:</strong> {strat.action}
                </p>
                <div className="text-[11px] text-emerald-400 font-medium pt-0.5">
                  ผลลัพธ์คาดหวัง: {strat.expectedImpact}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
