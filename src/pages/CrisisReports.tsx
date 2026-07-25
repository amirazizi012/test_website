import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ChevronLeft, Search, Bot, Home, Scale, AlertTriangle, LogOut, Loader2, Target,
  MapPin, UploadCloud, FileText, CheckCircle, Activity, Camera, Film, Send, ShieldAlert,
  ShieldCheck, ArrowLeft, Clock, Info
} from "lucide-react";
import { Button } from "../components/ui/Button";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "داشبورد", active: false, path: "/dashboard/citizen" },
  { icon: Bot, label: "مشاوره هوشمند AI", active: false, path: "/dashboard/citizen" },
  { icon: Building2, label: "سامانه ارجاع حمایتی", active: false, path: "/dashboard/support" },
  { icon: Target, label: "مسیر مطالبه خسارت", active: false, path: "/dashboard/damage-claim" },
  { icon: Scale, label: "پایگاه هوشمند قوانین", active: false, path: "/dashboard/laws" },
  { icon: AlertTriangle, label: "ثبت و پیگیری گزارش", active: true, path: "/dashboard/reports" },
];

const REPORT_TYPES = [
  "درخواست امداد", "گزارش خسارت", "گزارش تخلف", 
  "گزارش ناایمن بودن منطقه", "درخواست خدمات حمایتی", "گزارش کمبود امکانات", "سایر موارد"
];

export default function CrisisReports() {
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");
  
  // Submit State
  const [step, setStep] = useState(1);
  const [reportType, setReportType] = useState("");
  const [reportData, setReportData] = useState({ title: "", description: "", province: "", city: "", address: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
      setTrackingCode("CR-593-8102");
      setStep(4);
    }, 2500);
  };

  const [trackCodeInput, setTrackCodeInput] = useState("");
  const [showTrackingResult, setShowTrackingResult] = useState(false);

  const handleTrack = () => {
    if (!trackCodeInput.trim()) return;
    setShowTrackingResult(true);
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
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="h-[100px] shrink-0 flex items-center px-6 sm:px-10 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[16px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0F172A]">مرکز ثبت و پیگیری گزارش بحران</h2>
             </div>
          </div>
        </header>

        <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full pb-32">
          
          <div className="flex bg-white rounded-full p-1 mb-8 shadow-sm border border-[#E2E8F0] max-w-sm mx-auto">
             <button 
               onClick={() => { setActiveTab("submit"); setStep(1); setShowResult(false); }}
               className={`flex-1 py-3 rounded-full text-[15px] font-bold transition-colors ${activeTab === "submit" ? 'bg-[#0F172A] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
             >
               ثبت گزارش جدید
             </button>
             <button 
               onClick={() => { setActiveTab("track"); setShowTrackingResult(false); setTrackCodeInput(""); }}
               className={`flex-1 py-3 rounded-full text-[15px] font-bold transition-colors ${activeTab === "track" ? 'bg-[#0F172A] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
             >
               پیگیری گزارش
             </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "submit" && (
              <motion.div key="submit">
                {!showResult && (
                  <div className="mb-10 lg:px-12">
                    <div className="flex justify-between items-center mb-4 relative">
                      <div className="absolute top-5 left-[15%] right-[15%] h-[3px] bg-[#E2E8F0] -z-0"></div>
                      {[1, 2, 3].map(s => (
                        <div key={s} className="flex flex-col items-center flex-1 relative z-10 bg-transparent">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors ${step >= s ? 'bg-[#D97706] text-white shadow-lg' : 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'}`}>
                            {s}
                          </div>
                          <p className={`mt-3 text-[12px] sm:text-[13px] font-bold hidden sm:block ${step >= s ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                            {s === 1 ? 'نوع گزارش' : s === 2 ? 'اطلاعات' : 'تحلیل و ارجاع'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E2E8F0]">
                    <h3 className="text-[24px] font-bold text-[#0F172A] mb-8 text-center">موضوع گزارش شما چیست؟</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {REPORT_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setReportType(type)}
                          className={`p-6 text-center rounded-[20px] font-bold text-[15px] transition-all border-2 ${reportType === type ? 'border-[#D97706] bg-[#FFFBEB] text-[#D97706] shadow-sm' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#475569]'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="mt-10 flex justify-end">
                      <Button onClick={() => setStep(2)} disabled={!reportType} size="lg" className="h-14 px-10 text-[16px] bg-[#D97706] hover:bg-[#b45309]">مرحله بعد <ChevronLeft className="mr-2" /></Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E2E8F0]">
                    <h3 className="text-[24px] font-bold text-[#0F172A] mb-8">اطلاعات تکمیلی گزارش</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[15px] font-bold text-[#334155] mb-2">عنوان گزارش</label>
                        <input type="text" className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-medium focus:border-[#D97706] focus:outline-none" placeholder="خلاصه‌ای از مشکل (مثال: ریزش دیوار حائل محله)" value={reportData.title} onChange={e => setReportData({...reportData, title: e.target.value})} />
                      </div>
                      
                      <div>
                        <label className="block text-[15px] font-bold text-[#334155] mb-2">شرح کامل</label>
                        <textarea className="w-full h-[150px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-[24px] p-6 font-medium focus:border-[#D97706] focus:outline-none resize-none" placeholder="توضیحات دقیق..." value={reportData.description} onChange={e => setReportData({...reportData, description: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[15px] font-bold text-[#334155] mb-2">استان</label>
                          <select className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-medium focus:border-[#D97706] focus:outline-none" value={reportData.province} onChange={e => setReportData({...reportData, province: e.target.value})}>
                            <option value="">انتخاب...</option><option value="تهران">تهران</option><option value="کرمانشاه">کرمانشاه</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[15px] font-bold text-[#334155] mb-2">شهرستان</label>
                          <input type="text" className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-medium focus:border-[#D97706] focus:outline-none" value={reportData.city} onChange={e => setReportData({...reportData, city: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[15px] font-bold text-[#334155] mb-2">مدارک پیوست (عکس / ویدئو)</label>
                        <div className="w-full h-32 border-2 border-dashed border-[#CBD5E1] rounded-[20px] flex gap-6 items-center justify-center text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                          <div className="flex flex-col items-center gap-2"><Camera className="w-6 h-6" /><span className="text-[13px] font-bold">انتخاب عکس</span></div>
                          <div className="flex flex-col items-center gap-2"><Film className="w-6 h-6" /><span className="text-[13px] font-bold">انتخاب ویدئو</span></div>
                          <div className="flex flex-col items-center gap-2"><FileText className="w-6 h-6" /><span className="text-[13px] font-bold">سایر فایل‌ها</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex justify-between">
                      <Button onClick={() => setStep(1)} variant="outline" size="lg" className="h-14 px-8 text-[#64748B]" disabled={isAnalyzing}>مرحله قبل</Button>
                      <Button onClick={handleAnalysis} disabled={!reportData.title || !reportData.province || isAnalyzing} size="lg" className="h-14 px-10 text-[16px] bg-[#D97706] hover:bg-[#b45309]">
                        {isAnalyzing ? <><Loader2 className="mr-2 animate-spin w-5 h-5" /> تحلیل هوشمند...</> : <><Send className="mr-2 w-5 h-5"/> ثبت و جستجوی متولی</>}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {showResult && step === 4 && (
                  <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-[#0F172A] rounded-[32px] p-8 sm:p-12 shadow-sm text-center text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <div className="relative z-10">
                        <div className="w-20 h-20 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-[28px] font-extrabold mb-4">گزارش شما با موفقیت ثبت شد</h3>
                        <p className="text-[#94A3B8] text-[16px] font-medium max-w-xl mx-auto mb-8">
                          هوش مصنوعی بحران‌نگار گزارش شما را تحلیل کرد و به سازمان‌های مربوطه ارجاع داد. می‌توانید وضعیت را پیگیری کنید.
                        </p>
                        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-[24px] px-10 py-6">
                          <p className="text-[14px] text-[#CBD5E1] font-bold mb-2">کد پیگیری گزارش</p>
                          <p className="text-[32px] text-white font-extrabold font-mono tracking-[0.2em]" dir="ltr">{trackingCode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E2E8F0] md:col-span-1">
                         <h4 className="text-[18px] font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#EF4444]"/> خلاصه تحلیل هوشمند</h4>
                         <ul className="space-y-4">
                           <li className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                             <span className="text-[#64748B] text-[14px] font-bold">دسته‌بندی موضوع</span>
                             <span className="text-[#0F172A] font-bold">{reportType}</span>
                           </li>
                           <li className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                             <span className="text-[#64748B] text-[14px] font-bold">سطح اهمیت</span>
                             <span className="bg-[#FEF2F2] text-[#EF4444] px-3 py-1 rounded-full text-[12px] font-bold">بحرانی - فوری</span>
                           </li>
                           <li className="flex justify-between items-center pt-1">
                             <span className="text-[#64748B] text-[14px] font-bold">ارجاع به</span>
                             <span className="text-[#0D9488] font-bold">۲ سازمان مجزا</span>
                           </li>
                         </ul>
                       </div>

                       <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E2E8F0] md:col-span-2">
                         <h4 className="text-[18px] font-bold text-[#0F172A] mb-4">ارجاع هوشمند به سازمان‌های مسئول</h4>
                         <div className="space-y-4">
                           <div className="border border-[#E2E8F0] rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F8FAFC]">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border text-[#EF4444] shrink-0">
                                <ShieldAlert className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-[#0F172A]">سازمان مدیریت بحران کشور (کارگروه ویژه)</p>
                                <p className="text-[#64748B] text-[13px] font-medium mt-1">جهت بررسی ایمنی ساختاری و اعزام تیم ارزیاب.</p>
                              </div>
                              <div className="bg-[#F0FDF4] text-[#0D9488] px-4 py-2 rounded-full text-[12px] font-bold shrink-0 text-center">
                                ارجاع شد (در صف بررسی)
                              </div>
                           </div>
                           <div className="border border-[#E2E8F0] rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F8FAFC]">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border text-[#0D9488] shrink-0">
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-[#0F172A]">شهرداری منطقه متبوع</p>
                                <p className="text-[#64748B] text-[13px] font-medium mt-1">جهت رفع خطر و رفع سد معبر احتمالی.</p>
                              </div>
                              <div className="bg-[#F0FDF4] text-[#0D9488] px-4 py-2 rounded-full text-[12px] font-bold shrink-0 text-center">
                                ارجاع شد (در صف بررسی)
                              </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "track" && (
              <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
                 <div className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0] mb-8 text-center">
                   <h3 className="text-[24px] font-bold text-[#0F172A] mb-4">پیگیری وضعیت گزارش</h3>
                   <p className="text-[#64748B] text-[16px] mb-8 font-medium">کد پیگیری دریافتی هنگام ثبت گزارش را وارد کنید.</p>
                   
                   <div className="relative max-w-md mx-auto">
                     <input 
                       type="text" 
                       className="w-full h-16 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[20px] px-6 text-center text-[20px] font-bold font-mono text-[#0F172A] tracking-[0.2em] focus:border-[#D97706] focus:outline-none" 
                       placeholder="CR-XXXX-XXXX" 
                       value={trackCodeInput}
                       onChange={e => setTrackCodeInput(e.target.value)}
                       dir="ltr"
                     />
                     <Button onClick={handleTrack} disabled={trackCodeInput.length < 5} className="w-full h-14 mt-4 rounded-[16px] text-[16px] bg-[#0F172A] hover:bg-[#1E293B]">جستجو وضعیت</Button>
                   </div>
                 </div>

                 {showTrackingResult && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E2E8F0]">
                     <div className="flex justify-between items-start pb-6 border-b border-[#E2E8F0] mb-8">
                       <div>
                         <span className="bg-[#FEF2F2] text-[#EF4444] px-3 py-1 rounded-full text-[12px] font-bold mb-2 inline-block">بحرانی</span>
                         <h4 className="text-[20px] font-bold text-[#0F172A]">ریزش دیوار حائل محله</h4>
                         <p className="text-[#64748B] text-[14px] mt-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> تهران، تجریش</p>
                       </div>
                       <div className="text-left">
                         <span className="text-[#94A3B8] text-[12px] font-bold">کد پیگیری:</span>
                         <p className="text-[#0F172A] font-bold font-mono text-[18px]" dir="ltr">{trackCodeInput}</p>
                       </div>
                     </div>

                     <div className="space-y-0 relative before:absolute before:inset-0 before:mr-[19px] before:h-full before:w-[2px] before:bg-[#E2E8F0]">
                        <div className="relative flex items-start gap-6 pb-8">
                          <div className="w-10 h-10 rounded-full bg-[#0D9488] border-4 border-white flex items-center justify-center text-white z-10 shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] text-[16px]">ثبت گزارش</p>
                            <p className="text-[#64748B] text-[13px] font-bold mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> امروز، ساعت ۱۰:۳۲</p>
                          </div>
                        </div>
                        <div className="relative flex items-start gap-6 pb-8">
                          <div className="w-10 h-10 rounded-full bg-[#0D9488] border-4 border-white flex items-center justify-center text-white z-10 shrink-0">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] text-[16px]">تحلیل هوشمند و ارجاع</p>
                            <p className="text-[#64748B] text-[13px] font-bold mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> امروز، ساعت ۱۰:۳۵</p>
                            <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[12px] text-[13px] text-[#475569]">
                              ارجاع شده به: سازمان مدیریت بحران و شهرداری منطقه ۱
                            </div>
                          </div>
                        </div>
                        <div className="relative flex items-start gap-6">
                          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border-4 border-white flex items-center justify-center text-[#EF4444] z-10 shrink-0">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                          <div>
                            <p className="font-bold text-[#EF4444] text-[16px]">در حال بررسی توسط سازمان</p>
                            <p className="text-[#64748B] text-[13px] font-bold mt-1">منتظر پاسخ متولی</p>
                          </div>
                        </div>
                     </div>
                   </motion.div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
