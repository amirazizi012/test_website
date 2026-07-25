import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ChevronLeft, Search, Bot, Home, Scale, AlertTriangle, LogOut, Loader2, Target,
  BookOpen, FileText, CheckCircle, Copy, Download, Bookmark, Clock, ArrowLeft, Gavel, FileCheck
} from "lucide-react";
import { Button } from "../components/ui/Button";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "داشبورد", active: false, path: "/dashboard/citizen" },
  { icon: Bot, label: "مشاوره هوشمند AI", active: false, path: "/dashboard/citizen" },
  { icon: Building2, label: "سامانه ارجاع حمایتی", active: false, path: "/dashboard/support" },
  { icon: Target, label: "مسیر مطالبه خسارت", active: false, path: "/dashboard/damage-claim" },
  { icon: Scale, label: "پایگاه هوشمند قوانین", active: true, path: "/dashboard/laws" },
  { icon: AlertTriangle, label: "ثبت و پیگیری گزارش", active: false, path: "/dashboard/reports" },
];

const CATEGORIES = [
  "قوانین جنگ", "قوانین سیل", "قوانین زلزله", "بازسازی و مسکن",
  "خدمات حمایتی", "بیمه و خسارت", "حقوق شهروندی"
];

export default function CrisisLaws() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeCategory, setActiveCategory] = useState("همه");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowResults(false);
    
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 2500);
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText("مستند به ماده ۴ قانون مدیریت بحران کشور (مصوب ۱۳۹۸) و آیین‌نامه اجرایی ماده ۱۴...");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#1A2E35] font-sans rtl">
      {/* SIDEBAR */}
      <aside className="w-[300px] bg-white border-l border-black/5 flex-shrink-0 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)] hidden lg:flex">
        <div className="h-[100px] flex items-center px-8 border-b border-black/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-bold">C</div>
            <span className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">CrisisLaw</span>
          </Link>
        </div>
        
        <div className="p-6 flex-1 space-y-2 overflow-y-auto hidden-scrollbar">
          <p className="px-4 text-[14px] font-bold text-[#94A3B8] mb-6 tracking-wide">منوی شهروند</p>
          {SIDEBAR_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-[16px] transition-all text-[16px] font-semibold ${
                item.active 
                  ? "bg-[#F0FDF4] text-[#0D9488]" 
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <item.icon className={`w-[22px] h-[22px] ${item.active ? "text-[#0D9488]" : ""}`} />
              {item.label}
              {item.active && <ChevronLeft className="w-5 h-5 mr-auto opacity-70" />}
            </Link>
          ))}
        </div>

        <div className="p-6 border-t border-black/5">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all text-[16px] font-semibold">
            <LogOut className="w-[22px] h-[22px]" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-[100px] shrink-0 flex items-center justify-between px-6 sm:px-10 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[16px] bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
               <Scale className="w-6 h-6" />
             </div>
             <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0F172A]">موتور هوشمند قوانین بحران</h2>
          </div>
        </header>

        <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full pb-32">
          
          <div className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0] mb-8">
            <h3 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] mb-4 text-center">از حقوق خود بپرسید</h3>
            <p className="text-[#64748B] text-[16px] text-center mb-8 font-medium">قوانین و آیین‌نامه‌های مرتبط با بلایای طبیعی، جنگ و خدمات حمایتی را با زبان ساده جستجو کنید.</p>
            
            <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
              <input
                type="text"
                className="w-full h-16 sm:h-20 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[24px] px-6 sm:px-8 text-[16px] sm:text-[18px] font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none transition-colors"
                placeholder="مثال: حقوق مستاجر در زلزله چیست؟ یا خسارت ناشی از جنگ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-3 bottom-3">
                <Button type="submit" disabled={!searchQuery.trim() || isSearching} className="h-full rounded-[16px] px-6 bg-[#4F46E5] hover:bg-[#4338ca]">
                  {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </Button>
              </div>
            </form>

            {!showResults && !isSearching && (
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setActiveCategory("همه")}
                  className={`px-6 py-3 rounded-full font-bold text-[14px] transition-colors border ${activeCategory === "همه" ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}
                >
                  همه قوانین
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-3 rounded-full font-bold text-[14px] transition-colors border ${activeCategory === cat ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isSearching && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-[#EEF2FF] rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-[#4F46E5] animate-pulse" />
                </div>
                <h4 className="text-[20px] font-bold text-[#0F172A] mb-2">در حال تحلیل هوشمند سوال شما...</h4>
                <p className="text-[#64748B] font-medium">استخراج آراء وحدت رویه، آیین‌نامه‌ها و قوانین مرتبط</p>
              </motion.div>
            )}

            {showResults && !isSearching && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[32px] p-8 shadow-lg text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-6 h-6 text-[#38BDF8]" />
                    <h3 className="text-[20px] font-bold">خلاصه تحلیل حقوقی</h3>
                  </div>
                  <p className="text-[#CBD5E1] text-[16px] leading-[2] font-medium mb-6">
                    بر اساس قوانین موجود در خصوص خسارات ناشی از بحران، در صورتی که خسارت به ملک استیجاری وارد شده باشد، مالک موظف به بازسازی اساسی بنا می‌باشد مگر اینکه قرارداد بیمه‌ای منعقد شده باشد که در آن صورت بیمه متعهد به پرداخت است. مستاجر تعهدی در قبال خسارات ناشی از بلایای طبیعی ندارد. همچنین دولت تسهیلاتی تحت عنوان وام بازسازی مسکن با کارمزد پایین به متضررین اختصاص می‌دهد.
                  </p>
                  
                  <div className="bg-white/10 rounded-[20px] p-6 border border-white/10 backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-[#34D399]" /> متن استناد حقوقی (جهت استفاده در نامه‌نگاری)
                      </h4>
                      <Button onClick={handleCopyCitation} variant="outline" className="h-10 px-4 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-[12px]">
                        {copiedLink ? <><CheckCircle className="w-4 h-4 mr-2 text-[#34D399]" /> کپی شد</> : <><Copy className="w-4 h-4 mr-2" /> کپی استناد</>}
                      </Button>
                    </div>
                    <p className="font-mono text-[14px] leading-[2] text-[#94A3B8] text-justify bg-black/20 p-4 rounded-[12px]">
                      "مستند به ماده ۴ قانون مدیریت بحران کشور (مصوب ۱۳۹۸) و آیین‌نامه اجرایی ماده ۱۴ قانون ساماندهی و حمایت از تولید و عرضه مسکن در زمینه بازسازی مناطق آسیب‌دیده، جبران خسارت‌های اساسی وارد شده به عین مستاجره بر عهده موجر و همچنین صندوق بیمه حوادث طبیعی ساختمان می‌باشد."
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[22px] font-bold text-[#0F172A]">مواد قانونی مرتبط با این موضوع</h3>
                  <div className="flex gap-2 text-[#64748B]">
                    <span>۳ مورد یافت شد</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Law Card 1 */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#EEF2FF] text-[#4F46E5] font-bold text-[12px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></div> میزان ارتباط: ۹۸٪
                      </div>
                      <div className="text-[#94A3B8] text-[13px] font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> مصوب ۱۳۹۸/۰۶/۰۲
                      </div>
                    </div>
                    <h4 className="text-[18px] font-bold text-[#0F172A] mb-2 leading-[1.6]">ماده ۴ قانون مدیریت بحران کشور</h4>
                    <p className="text-[#64748B] text-[14px] leading-[1.8] font-medium line-clamp-3 mb-6">
                      دولت موظف است ضمن پیش‌بینی اعتبار لازم در بودجه سالانه، در صورت وقوع حوادث غیرمترقبه و بحران‌ها، نسبت به جبران بخشی از خسارات وارده به اشخاص حقیقی و حقوقی اقدام نماید.
                    </p>
                    <div className="flex gap-3">
                      <Button className="flex-1 rounded-[14px] bg-[#0F172A] hover:bg-[#1E293B]">مشاهده کامل ماده <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                      <Button variant="outline" className="px-4 rounded-[14px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Download className="w-5 h-5 text-[#64748B]" /></Button>
                      <Button variant="outline" className="px-4 rounded-[14px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Bookmark className="w-5 h-5 text-[#64748B]" /></Button>
                    </div>
                  </div>

                  {/* Law Card 2 */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#F0FDF4] text-[#0D9488] font-bold text-[12px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></div> میزان ارتباط: ۸۵٪
                      </div>
                      <div className="text-[#94A3B8] text-[13px] font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> مصوب ۱۳۹۹/۰۸/۱۱
                      </div>
                    </div>
                    <h4 className="text-[18px] font-bold text-[#0F172A] mb-2 leading-[1.6]">ماده ۱ قانون تاسیس صندوق بیمه حوادث طبیعی</h4>
                    <p className="text-[#64748B] text-[14px] leading-[1.8] font-medium line-clamp-3 mb-6">
                      به منظور جبران بخشی از خسارت‌های مالی ناشی از حوادث طبیعی از جمله زلزله، سیل، طوفان، صاعقه، برف سنگین و... تمام ساختمان‌های مسکونی تحت پوشش بیمه پایه حوادث طبیعی ساختمان قرار می‌گیرند.
                    </p>
                    <div className="flex gap-3">
                      <Button className="flex-1 rounded-[14px] bg-[#0F172A] hover:bg-[#1E293B]">مشاهده کامل ماده <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                      <Button variant="outline" className="px-4 rounded-[14px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Download className="w-5 h-5 text-[#64748B]" /></Button>
                      <Button variant="outline" className="px-4 rounded-[14px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"><Bookmark className="w-5 h-5 text-[#64748B]" /></Button>
                    </div>
                  </div>
                  
                  {/* Law Card 3 */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#F8FAFC] text-[#64748B] font-bold text-[12px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></div> میزان ارتباط: ۶۵٪
                      </div>
                      <div className="text-[#94A3B8] text-[13px] font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> مصوب ۱۳۳۹/۰۶/۰۶
                      </div>
                    </div>
                    <h4 className="text-[18px] font-bold text-[#0F172A] mb-2 leading-[1.6]">ماده ۴۸۶ قانون مدنی مجازات</h4>
                    <p className="text-[#64748B] text-[14px] leading-[1.8] font-medium mb-6">
                      تعمیرات و کلیه مخارجی که در عین مستاجره برای امکان انتفاع از آن لازم است به عهده مالک است مگر آنکه شرط خلاف شده یا عرف بلد بر خلاف آن جاری باشد. (قانون عام در خصوص تعمیرات ملک استیجاری)
                    </p>
                    <div className="flex gap-3 md:w-1/2">
                      <Button className="flex-1 rounded-[14px] bg-[#0F172A] hover:bg-[#1E293B]">مشاهده کامل ماده <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
