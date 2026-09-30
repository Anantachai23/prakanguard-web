import React from 'react';
import { Waves, UtensilsCrossed, Sparkles, Dumbbell, Coffee, Car, Shield, Wifi } from 'lucide-react';

export const FacilitiesView = ({ setCurrentView }) => {
  const facilities = [
    {
      title: 'Horizon Infinity Pool & Sunken Lounge',
      category: 'สระว่ายน้ำและโซนพักผ่อน',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
      description: 'สระว่ายน้ำระบบเกลือทอดยาวกว่า 50 เมตร มองเห็นเส้นขอบฟ้าและวิวทะเลแบบพาโนรามา พร้อม Sunken Lounge และจากุซซี่นวดผ่อนคลาย',
      hours: 'เปิดให้บริการ: 06:00 - 22:00 น. ทุกวัน'
    },
    {
      title: 'The Royal Feast & Michelin Star Dining',
      category: 'ห้องอาหารระดับเวิลด์คลาส',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
      description: 'บริการบุฟเฟต์นานาชาติระดับพรีเมียม และคอร์สอาหารพิเศษจากเชฟผู้มีประสบการณ์ระดับมิชลิน รังสรรค์จากวัตถุดิบนำเข้าชั้นยอด',
      hours: 'อาหารเช้า: 06:00 - 10:30 น. | ดินเนอร์: 18:00 - 23:00 น.'
    },
    {
      title: 'Serenity Aromatherapy & Thai Spa Sanctuary',
      category: 'สปาและศาสตร์การบำบัดสุขภาพ',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      description: 'สัมผัสการผ่อนคลายอย่างลึกซึ้งด้วยสมุนไพรไทยแท้และน้ำมันหอมระเหยธรรมชาติ ห้องทรีตเมนต์ส่วนตัวพร้อมอ่างอาบน้ำหินอ่อน',
      hours: 'เปิดให้บริการ: 10:00 - 21:00 น.'
    },
    {
      title: 'FitPulse Fitness Center & Yoga Studio',
      category: 'ศูนย์ออกกำลังกายเพื่อสุขภาพ',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
      description: 'อุปกรณ์ออกกำลังกายแบรนด์ Technogym ทันสมัยที่สุด มีเทรนเนอร์มืออาชีพคอยดูแล พร้อมห้องฝึกโยคะชมวิวสวนธรรมชาติ',
      hours: 'เปิดให้บริการ: 24 ชั่วโมง'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold tracking-widest text-[#9A7B4F] uppercase">
          EXCLUSIVE EXPERIENCES
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          สิ่งอำนวยความสะดวกระดับ 5 ดาว
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          สรรค์สร้างทุกช่วงเวลาของการพักผ่อนให้เป็นความทรงจำอันทรงคุณค่า
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {facilities.map((fac, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={fac.image}
                alt={fac.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#0B132B]/80 backdrop-blur-md text-[#C5A880] text-xs font-semibold px-3 py-1 rounded-full border border-[#C5A880]/30">
                {fac.category}
              </div>
            </div>

            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-[#9A7B4F] transition-colors">
                  {fac.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {fac.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>🕒 {fac.hours}</span>
                <span className="text-emerald-600 font-medium">✓ สำหรับแขกทุกท่าน</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-3xl bg-[#0B132B] text-white border border-[#C5A880]/30 text-center space-y-4">
        <h3 className="text-2xl font-serif font-bold text-white">
          พร้อมสัมผัสประสบการณ์แห่งความสุขกับเราแล้วหรือยัง?
        </h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          เลือกห้องพักที่ท่านชื่นชอบทั้งห้องขนาดใหญ่ กลาง หรือเล็ก พร้อมรับสิทธิ์เข้าใช้สิ่งอำนวยความสะดวกทั้งหมดได้ฟรี
        </p>
        <button
          onClick={() => setCurrentView('rooms')}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-lg active:scale-95"
        >
          เลือกจองห้องพักทันที &rarr;
        </button>
      </div>

    </div>
  );
};
