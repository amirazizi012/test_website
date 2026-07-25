import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ChevronLeft, MapPin, Search, Send, FileText, Bot, Shield, Home, Scale, AlertTriangle, LogOut, Loader2, Phone, Map, CheckCircle, Target
} from "lucide-react";
import { Button } from "../components/ui/Button";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "داشبورد", active: false, path: "/dashboard/citizen" },
  { icon: Bot, label: "مشاوره هوشمند AI", active: false, path: "/dashboard/citizen" },
  { icon: Building2, label: "سامانه ارجاع حمایتی", active: true, path: "/dashboard/support" },
  { icon: Target, label: "مسیر مطالبه خسارت", active: false, path: "/dashboard/damage-claim" },
  { icon: Scale, label: "پایگاه هوشمند قوانین", active: false, path: "/dashboard/laws" },
  { icon: AlertTriangle, label: "ثبت و پیگیری گزارش", active: false, path: "/dashboard/reports" },
];

const PROBLEM_TYPES = [
  "خسارت ناشی از جنگ", "تخریب یا آسیب به منزل", "نیاز به اسکان موقت", 
  "نیاز درمانی", "گم شدن مدارک هویتی", "مشکلات حقوقی پس از بحران", 
  "دریافت کمک معیشتی", "سایر موارد"
];

export default function SupportCenters() {
  const [step, setStep] = useState(1);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({ province: "", city: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
      setStep(4);
    }, 2500);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex text-[#1A2E35] font-sans">
      {/* SIDEBAR */}
      <aside className="w-[300px] bg-white border-l border-black/5 flex-shrink-0 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)] hidden lg:flex">
        <div className="h-[100px] flex items-center px-8 border-b border-black/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-bold">C</div>
            <span className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">CrisisLaw</span>
          </Link>
        </div>
        
        <div className="p-6 flex-1 space-y-2">
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
        <header className="h-[100px] shrink-0 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[16px] bg-[#F0FDF4] text-[#0D9488] flex items-center justify-center">
               <Building2 className="w-6 h-6" />
             </div>
             <h2 className="text-[24px] font-bold text-[#0F172A]">سامانه ارجاع هوشمند خدمات حمایتی</h2>
          </div>
        </header>

        <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full pb-32">
           {!showResult && (
             <div className="mb-10">
               <div className="flex justify-between items-center mb-4">
                 {[1, 2, 3].map(s => (
                   <div key={s} className="flex flex-col items-center flex-1 relative">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] z-10 transition-colors ${step >= s ? 'bg-[#0D9488] text-white shadow-lg' : 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'}`}>
                       {s}
                     </div>
                     <p className={`mt-3 text-[13px] font-bold ${step >= s ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                       {s === 1 ? 'نوع مشکل' : s === 2 ? 'شرح مشکل' : 'موقعیت مکانی'}
                     </p>
                     {s < 3 && (
                       <div className={`absolute top-5 right-[50%] w-full h-[3px] -z-0 transition-colors ${step > s ? 'bg-[#0D9488]' : 'bg-[#E2E8F0]'}`}></div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}

           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <h3 className="text-[22px] font-bold text-[#0F172A] mb-8 text-center">نوع مشکل یا نیازمندی خود را مشخص کنید</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {PROBLEM_TYPES.map(type => (
                     <button
                       key={type}
                       onClick={() => setSelectedProblem(type)}
                       className={`p-6 text-right rounded-[20px] font-bold text-[16px] transition-all border-2 ${selectedProblem === type ? 'border-[#0D9488] bg-[#F0FDF4] text-[#0D9488]' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#475569]'}`}
                     >
                       {type}
                     </button>
                   ))}
                 </div>
                 <div className="mt-10 flex justify-end">
                   <Button onClick={nextStep} disabled={!selectedProblem} size="lg" className="h-14 px-10 text-[18px]">مرحله بعد <ChevronLeft className="mr-2" /></Button>
                 </div>
               </motion.div>
             )}

             {step === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <h3 className="text-[22px] font-bold text-[#0F172A] mb-4">جزئیات مشکل خود را بنویسید</h3>
                 <p className="text-[#64748B] mb-8 font-medium">هرچه توضیحات شما دقیق‌تر باشد، هوش مصنوعی مسیر هدایت بهتری را پیشنهاد می‌دهد.</p>
                 <textarea
                   className="w-full h-[200px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-[24px] p-6 text-[16px] font-medium text-[#0F172A] focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 resize-none"
                   placeholder="لطفاً مشکل خود را به طور کامل شرح دهید..."
                   value={description}
                   onChange={e => setDescription(e.target.value)}
                 />
                 <div className="mt-10 flex justify-between">
                   <Button onClick={prevStep} variant="outline" size="lg" className="h-14 px-8">مرحله قبل</Button>
                   <Button onClick={nextStep} disabled={!description.trim()} size="lg" className="h-14 px-10">مرحله بعد <ChevronLeft className="mr-2" /></Button>
                 </div>
               </motion.div>
             )}

             {step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                     <MapPin className="w-6 h-6" />
                   </div>
                   <h3 className="text-[22px] font-bold text-[#0F172A]">موقعیت مکانی شما کجاست؟</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[15px] font-bold text-[#334155] mb-2">استان</label>
                      <select className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 text-[16px] font-medium text-[#0F172A] focus:border-[#0D9488] focus:outline-none" value={location.province} onChange={e => setLocation({...location, province: e.target.value})}>
                        <option value="">انتخاب استان...</option>
                        <option value="تهران">تهران</option>
                        <option value="خوزستان">خوزستان</option>
                        <option value="سیستان و بلوچستان">سیستان و بلوچستان</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[15px] font-bold text-[#334155] mb-2">شهرستان</label>
                      <input 
                        type="text" 
                        placeholder="نام شهر خود را وارد کنید" 
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 text-[16px] font-medium text-[#0F172A] focus:border-[#0D9488] focus:outline-none" 
                        value={location.city} 
                        onChange={e => setLocation({...location, city: e.target.value})} 
                      />
                    </div>
                 </div>

                 <div className="mt-10 flex justify-between">
                   <Button onClick={prevStep} variant="outline" size="lg" className="h-14 px-8" disabled={isAnalyzing}>مرحله قبل</Button>
                   <Button onClick={handleAnalysis} disabled={!location.province || isAnalyzing} size="lg" className="h-14 px-10">
                     {isAnalyzing ? <><Loader2 className="mr-2 animate-spin w-5 h-5" /> در حال تحلیل هوشمند...</> : <><Search className="mr-2 w-5 h-5"/> بررسی و یافتن مراکز</>}
                   </Button>
                 </div>
               </motion.div>
             )}

             {showResult && !showRequestForm && !isSubmitted && (
               <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 {/* Summary Card */}
                 <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E2E8F0] relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-32 h-32 bg-gradient-to-br from-[#0D9488]/10 to-transparent rounded-br-full pointer-events-none"></div>
                    <h3 className="text-[20px] font-bold text-[#0F172A] mb-6 flex items-center gap-3">
                      <div className="w-2 h-8 bg-[#0D9488] rounded-full"></div> خلاصه گزارش شما
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#F8FAFC] p-5 rounded-[20px]">
                        <p className="text-[#64748B] text-[13px] font-bold mb-1">نوع مشکل</p>
                        <p className="text-[#0F172A] font-bold">{selectedProblem}</p>
                      </div>
                      <div className="bg-[#F8FAFC] p-5 rounded-[20px]">
                        <p className="text-[#64748B] text-[13px] font-bold mb-1">موقعیت</p>
                        <p className="text-[#0F172A] font-bold">{location.province}، {location.city || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-6 bg-[#F8FAFC] p-5 rounded-[20px]">
                       <p className="text-[#64748B] text-[13px] font-bold mb-2">شرح کامل وضعیت</p>
                       <p className="text-[#0F172A] font-medium leading-[1.8]">{description}</p>
                    </div>
                 </div>

                 <h3 className="text-[22px] font-bold text-[#0F172A] mr-2">مراکز و سازمان‌های متولی پیشنهادی</h3>

                 {/* Org Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                     <div className="flex items-start gap-4 mb-4">
                       <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] text-[#0D9488] flex items-center justify-center shrink-0">
                         <Building2 className="w-7 h-7" />
                       </div>
                       <div>
                         <h4 className="text-[18px] font-bold text-[#0F172A]">بنیاد مسکن انقلاب اسلامی</h4>
                         <p className="text-[#64748B] text-[14px] font-medium mt-1 leading-[1.6]">متولی اصلی بازسازی مناطق آسیب‌دیده، ارزیابی خسارت و پرداخت وام‌های بلاعوض مسکن.</p>
                       </div>
                     </div>
                     <div className="space-y-3 mb-6 mt-6 border-t border-[#E2E8F0] pt-6">
                       <div className="flex justify-between items-center text-[14px]">
                         <span className="text-[#64748B] font-bold flex items-center gap-2"><Phone className="w-4 h-4"/> تلفن پاسخگویی</span>
                         <span className="text-[#0F172A] font-bold" dir="ltr">021 - 88998899</span>
                       </div>
                       <div className="flex justify-between items-center text-[14px]">
                         <span className="text-[#64748B] font-bold flex items-center gap-2"><Map className="w-4 h-4"/> ساعات کاری</span>
                         <span className="text-[#0F172A]">شنبه تا چهارشنبه (ویژه بحران 24 ساعته)</span>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <Button onClick={() => setShowRequestForm(true)} className="flex-1 rounded-[14px]">ثبت درخواست رسمی</Button>
                       <Button variant="outline" className="px-4 rounded-[14px]"><MapPin className="w-5 h-5 text-[#64748B]" /></Button>
                     </div>
                   </div>

                   <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow group">
                     <div className="flex items-start gap-4 mb-4">
                       <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                         <Shield className="w-7 h-7" />
                       </div>
                       <div>
                         <h4 className="text-[18px] font-bold text-[#0F172A]">جمعیت هلال احمر</h4>
                         <p className="text-[#64748B] text-[14px] font-medium mt-1 leading-[1.6]">توزیع اقلام امدادی پایه، اسکان اضطراری چادری و جستجوی مفقودین.</p>
                       </div>
                     </div>
                     <div className="space-y-3 mb-6 mt-6 border-t border-[#E2E8F0] pt-6">
                       <div className="flex justify-between items-center text-[14px]">
                         <span className="text-[#64748B] font-bold flex items-center gap-2"><Phone className="w-4 h-4"/> شماره امداد اضطراری</span>
                         <span className="text-[#0F172A] font-bold font-mono text-[16px]" dir="ltr">112</span>
                       </div>
                       <div className="flex justify-between items-center text-[14px]">
                         <span className="text-[#64748B] font-bold flex items-center gap-2"><Map className="w-4 h-4"/> ساعات کاری</span>
                         <span className="text-[#0F172A]">24 ساعته آنلاین</span>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <Button onClick={() => setShowRequestForm(true)} className="flex-1 rounded-[14px]">ثبت درخواست کمک</Button>
                       <Button variant="outline" className="px-4 rounded-[14px]"><MapPin className="w-5 h-5 text-[#64748B]" /></Button>
                     </div>
                   </div>
                 </div>
               </motion.div>
             )}

             {showRequestForm && !isSubmitted && (
               <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E2E8F0]">
                   <h3 className="text-[22px] font-bold text-[#0F172A]">ثبت درخواست رسمی به سازمان</h3>
                   <button onClick={() => setShowRequestForm(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold">بازگشت</button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-[15px] font-bold text-[#334155] mb-2">نام و نام خانوادگی</label>
                      <input type="text" className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-medium" defaultValue="" />
                    </div>
                    <div>
                       <label className="block text-[15px] font-bold text-[#334155] mb-2">شماره تماس (جهت پیگیری)</label>
                       <input type="tel" className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-bold" dir="ltr" defaultValue="09" />
                    </div>
                 </div>
                 <div className="mb-6">
                    <label className="block text-[15px] font-bold text-[#334155] mb-2">کد ملی (اختیاری)</label>
                    <input type="text" className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] h-14 px-4 font-bold" dir="ltr" />
                 </div>
                 <div className="mb-8">
                    <label className="block text-[15px] font-bold text-[#334155] mb-2">مدارک و مستندات (تصویر خرابی، نامه شورا)</label>
                    <div className="w-full h-32 border-2 border-dashed border-[#CBD5E1] rounded-[20px] flex flex-col items-center justify-center text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <span className="font-medium text-[14px]">برای بارگذاری فایل کلیک کنید یا فایل را اینجا رها کنید</span>
                    </div>
                 </div>

                 <Button onClick={() => setIsSubmitted(true)} size="lg" className="w-full h-14 text-[18px]">ارسال نهایی درخواست</Button>
               </motion.div>
             )}

             {isSubmitted && (
               <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] p-8 sm:p-16 shadow-sm border border-[#E2E8F0] text-center">
                 <div className="w-24 h-24 rounded-full bg-[#F0FDF4] text-[#0D9488] flex items-center justify-center mx-auto mb-6">
                   <CheckCircle className="w-12 h-12" />
                 </div>
                 <h3 className="text-[28px] font-extrabold text-[#0F172A] mb-4">درخواست شما با موفقیت ثبت شد</h3>
                 <p className="text-[#64748B] text-[18px] font-medium leading-[1.8] max-w-lg mx-auto mb-8">
                   درخواست شما جهت بررسی به سازمان متولی ارجاع داده شد. کارشناسان سازمان در اسرع وقت با شما تماس خواهند گرفت.
                 </p>
                 <div className="inline-block bg-[#F8FAFC] border border-[#CBD5E1] rounded-[20px] px-8 py-4 mb-10">
                   <p className="text-[14px] text-[#64748B] font-bold mb-1">کد پیگیری شما</p>
                   <p className="text-[24px] text-[#0F172A] font-extrabold font-mono tracking-widest" dir="ltr">CR-882049</p>
                 </div>
                 <div>
                   <Button onClick={() => { setIsSubmitted(false); setShowResult(false); setStep(1); setDescription(""); }} size="lg" variant="outline" className="px-10 h-14">بازگشت به منوی ارجاع</Button>
                 </div>
               </motion.div>
             )}

           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
