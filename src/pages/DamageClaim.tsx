import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ChevronLeft, Search, Send, FileText, Bot, Shield, Home, Scale, AlertTriangle, LogOut, Loader2, Phone, Map, CheckCircle,
  Car, Home as HomeIcon, Briefcase, Trees, MonitorSmartphone, Target,
  Zap, CloudRain, Flame, Wind, HelpCircle, FileSearch, ShieldCheck, MapPin, 
  Download, History, ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/Button";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "داشبورد", active: false, path: "/dashboard/citizen" },
  { icon: Bot, label: "مشاوره هوشمند AI", active: false, path: "/dashboard/citizen" },
  { icon: Building2, label: "سامانه ارجاع حمایتی", active: false, path: "/dashboard/support" },
  { icon: Target, label: "مسیر مطالبه خسارت", active: true, path: "/dashboard/damage-claim" },
  { icon: Scale, label: "پایگاه هوشمند قوانین", active: false, path: "/dashboard/laws" },
  { icon: AlertTriangle, label: "ثبت و پیگیری گزارش", active: false, path: "/dashboard/reports" },
];

const DAMAGE_TYPES = [
  { id: "home", label: "منزل مسکونی", icon: HomeIcon },
  { id: "car", label: "خودرو", icon: Car },
  { id: "business", label: "کسب‌وکار", icon: Briefcase },
  { id: "farm", label: "زمین کشاورزی", icon: Trees },
  { id: "equipment", label: "تجهیزات و اموال", icon: MonitorSmartphone },
];

const CRISIS_TYPES = [
  { id: "war", label: "جنگ", icon: ShieldCheck },
  { id: "earthquake", label: "زلزله", icon: Zap },
  { id: "flood", label: "سیل", icon: CloudRain },
  { id: "fire", label: "آتش‌سوزی", icon: Flame },
  { id: "storm", label: "طوفان", icon: Wind },
  { id: "other", label: "سایر", icon: HelpCircle },
];

export default function DamageClaim() {
  const [step, setStep] = useState(1);
  const [damageType, setDamageType] = useState("");
  const [crisisType, setCrisisType] = useState("");
  
  // Assessment Form Form
  const [assessment, setAssessment] = useState({
    isInsured: null as boolean | null,
    hasReport: null as boolean | null,
    hasDocs: null as boolean | null,
    alreadyClaimed: null as boolean | null,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
      setStep(5);
    }, 2500);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    doc1: false, doc2: false, doc3: false, doc4: false, doc5: false,
  });

  const toggleDoc = (docId: string) => {
    setCheckedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const TIMELINE_STEPS = [
    "ثبت گزارش خسارت",
    "مراجعه به نهاد مسئول",
    "تکمیل مدارک",
    "ثبت درخواست رسمی",
    "پیگیری پرونده",
    "دریافت خدمات یا خسارت"
  ];

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
        <header className="h-[100px] shrink-0 flex items-center justify-between px-6 sm:px-10 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[16px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
               <Target className="w-6 h-6" />
             </div>
             <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0F172A]">دستیار هوشمند مطالبه خسارت</h2>
          </div>
        </header>

        <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full pb-32">
           {!showResult && (
             <div className="mb-10 lg:px-12">
               <div className="flex justify-between items-center mb-4 relative">
                 <div className="absolute top-5 left-[10%] right-[10%] h-[3px] bg-[#E2E8F0] -z-0"></div>
                 {[1, 2, 3, 4].map(s => (
                   <div key={s} className="flex flex-col items-center flex-1 relative z-10 bg-transparent">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors ${step >= s ? 'bg-[#4F46E5] text-white shadow-lg' : 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'}`}>
                       {s}
                     </div>
                     <p className={`mt-3 text-[12px] sm:text-[13px] font-bold hidden sm:block ${step >= s ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                       {s === 1 ? 'نوع خسارت' : s === 2 ? 'نوع بحران' : s === 3 ? 'ارزیابی' : 'تحلیل'}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
           )}

           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <h3 className="text-[24px] font-bold text-[#0F172A] mb-8 text-center">نوع خسارت شما چیست؟</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                   {DAMAGE_TYPES.map(type => (
                     <button
                       key={type.id}
                       onClick={() => setDamageType(type.id)}
                       className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-[24px] transition-all border-2 ${damageType === type.id ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] shadow-md -translate-y-1' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B] hover:shadow-sm'}`}
                     >
                       <type.icon className={`w-10 h-10 sm:w-12 sm:h-12 mb-4 ${damageType === type.id ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`} />
                       <span className="font-bold text-[15px] sm:text-[16px]">{type.label}</span>
                     </button>
                   ))}
                 </div>
                 <div className="mt-12 flex justify-end">
                   <Button onClick={nextStep} disabled={!damageType} size="lg" className="h-14 px-10 text-[16px] bg-[#4F46E5] hover:bg-[#4338ca]">مرحله بعد <ChevronLeft className="mr-2" /></Button>
                 </div>
               </motion.div>
             )}

             {step === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <h3 className="text-[24px] font-bold text-[#0F172A] mb-8 text-center">این خسارت در اثر چه بحرانی رخ داده است؟</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                   {CRISIS_TYPES.map(type => (
                     <button
                       key={type.id}
                       onClick={() => setCrisisType(type.id)}
                       className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-[24px] transition-all border-2 ${crisisType === type.id ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] shadow-md -translate-y-1' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B] hover:shadow-sm'}`}
                     >
                       <type.icon className={`w-10 h-10 sm:w-12 sm:h-12 mb-4 ${crisisType === type.id ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`} />
                       <span className="font-bold text-[15px] sm:text-[16px]">{type.label}</span>
                     </button>
                   ))}
                 </div>
                 <div className="mt-12 flex justify-between">
                   <Button onClick={prevStep} variant="outline" size="lg" className="h-14 px-8 text-[#64748B]">مرحله قبل</Button>
                   <Button onClick={nextStep} disabled={!crisisType} size="lg" className="h-14 px-10 text-[16px] bg-[#4F46E5] hover:bg-[#4338ca]">مرحله بعد <ChevronLeft className="mr-2" /></Button>
                 </div>
               </motion.div>
             )}

             {step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E2E8F0]">
                 <h3 className="text-[24px] font-bold text-[#0F172A] mb-4">ارزیابی اولیه مدارک</h3>
                 <p className="text-[#64748B] text-[16px] font-medium leading-[1.8] mb-10">
                   لطفاً به سوالات زیر پاسخ دهید تا سیستم درک بهتری از وضعیت پرونده شما داشته باشد. این اطلاعات فقط برای ارائه نقشه راه دقیق‌تر استفاده می‌شود.
                 </p>
                 
                 <div className="space-y-6">
                   {[
                     { field: 'isInsured', question: 'آیا ملک یا دارایی مورد نظر تحت پوشش بیمه (آتش‌سوزی، حوادث، ...) بوده است؟' },
                     { field: 'hasReport', question: 'آیا گزارش خسارت توسط مراجع ذی‌صلاح (آتش‌نشانی، پلیس، شورا، کارشناس) تهیه شده است؟' },
                     { field: 'hasDocs', question: 'آیا مدارک دال بر مالکیت (سند، قولنامه، مدارک خودرو) موجود و در دسترس است؟' },
                     { field: 'alreadyClaimed', question: 'آیا پیش از این درخواستی در سامانه بنیاد مسکن یا سازمان دیگری ثبت کرده‌اید؟' },
                   ].map((item: any, i) => (
                     <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <p className="text-[16px] font-bold text-[#0F172A] flex-1">
                         {item.question}
                       </p>
                       <div className="flex gap-3 shrink-0">
                         <button 
                           onClick={() => setAssessment({...assessment, [item.field]: true})} 
                           className={`px-8 py-3 rounded-full font-bold text-[14px] transition-all border-2 ${assessment[item.field as keyof typeof assessment] === true ? 'border-[#0D9488] bg-[#0D9488] text-white shadow-md' : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'}`}
                         >
                           بله
                         </button>
                         <button 
                           onClick={() => setAssessment({...assessment, [item.field]: false})} 
                           className={`px-8 py-3 rounded-full font-bold text-[14px] transition-all border-2 ${assessment[item.field as keyof typeof assessment] === false ? 'border-[#EF4444] bg-[#EF4444] text-white shadow-md' : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'}`}
                         >
                           خیر
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>

                 <div className="mt-12 flex justify-between">
                   <Button onClick={prevStep} variant="outline" size="lg" className="h-14 px-8 text-[#64748B]" disabled={isAnalyzing}>مرحله قبل</Button>
                   <Button 
                     onClick={handleAnalysis} 
                     disabled={Object.values(assessment).includes(null) || isAnalyzing} 
                     size="lg" 
                     className="h-14 px-10 text-[16px] bg-[#4F46E5] hover:bg-[#4338ca]"
                   >
                     {isAnalyzing ? <><Loader2 className="mr-2 animate-spin w-5 h-5" /> در حال تحلیل پرونده...</> : <><Search className="mr-2 w-5 h-5"/> ایجاد نقشه راه اختصاصی</>}
                   </Button>
                 </div>
               </motion.div>
             )}

             {showResult && step === 5 && (
               <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 
                 {/* Success Header */}
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white rounded-[32px] p-8 shadow-sm border border-[#E2E8F0]">
                    <div>
                      <h3 className="text-[24px] font-extrabold text-[#0F172A] mb-2 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-[#0D9488]" /> پرونده شما با موفقیت تحلیل شد.
                      </h3>
                      <p className="text-[#64748B] font-medium">نقشه راه زیر بر اساس قوانین موجود و وضعیت اعلام شده به صورت اختصاصی برای شما تولید شده است.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="h-12 rounded-[16px]"><Download className="w-4 h-4 mr-2"/> دانلود PDF</Button>
                      <Button variant="outline" className="h-12 rounded-[16px]"><History className="w-4 h-4 mr-2"/> ذخیره در سوابق</Button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   
                   {/* Column 1: Timeline (Takes up 2 cols on lg) */}
                   <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm border border-[#E2E8F0]">
                        <h4 className="text-[20px] font-bold text-[#0F172A] mb-8">نقشه راه پیگیری خسارت</h4>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:mr-[23px] before:-translate-x-px md:before:mr-[31px] md:before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-[#E2E8F0] before:via-[#E2E8F0] before:to-transparent">
                          {TIMELINE_STEPS.map((tStep, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * idx }}
                              key={idx} 
                              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group rtl"
                            >
                              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[#4F46E5] text-white font-bold text-[16px] z-10 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                {idx + 1}
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] pr-6 md:pr-0 md:pl-10 pb-6 text-right md:text-left rtl:md:text-right rtl:md:pr-10 rtl:md:pl-0">
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                                   <h5 className="font-bold text-[#0F172A] text-[16px]">{tStep}</h5>
                                   <p className="text-[#64748B] text-[13px] font-medium leading-[1.8] mt-2">
                                     {idx === 0 ? "دریافت مستندات اولیه از سازمان آتش‌نشانی یا دهیاری جهت ثبت رسمی وقوع حادثه." : 
                                      idx === 1 ? "مراجعه به بیمه یا بنیاد مسکن حسب مورد." :
                                      idx === 2 ? "تکمیل فرم‌های رسمی و تطبیق نقشه‌ها." : 
                                      "پیمایش مراحل اداری مرتبط با جبران خسارت."}
                                   </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Organizations */}
                      <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm border border-[#E2E8F0]">
                        <h4 className="text-[20px] font-bold text-[#0F172A] mb-8">سازمان‌های مسئول و متولی</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-[#E2E8F0] rounded-[20px] p-5 flex items-center gap-4 bg-[#F8FAFC]">
                            <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center shadow-sm text-[#0D9488]">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0F172A]">بنیاد مسکن انقلاب اسلامی</p>
                              <Link to="/dashboard/support" className="text-[#4F46E5] text-[13px] font-bold mt-1 flex items-center hover:underline">
                                ثبت درخواست <ChevronRight className="w-4 h-4 ml-1 rotate-180" />
                              </Link>
                            </div>
                          </div>
                          <div className="border border-[#E2E8F0] rounded-[20px] p-5 flex items-center gap-4 bg-[#F8FAFC]">
                            <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center shadow-sm text-[#3B82F6]">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0F172A]">صندوق بیمه حوادث طبیعی</p>
                              <Link to="/dashboard/support" className="text-[#4F46E5] text-[13px] font-bold mt-1 flex items-center hover:underline">
                                ثبت درخواست <ChevronRight className="w-4 h-4 ml-1 rotate-180" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                   </div>

                   {/* Column 2: Checklists */}
                   <div className="space-y-8">
                     
                     <div className="bg-[#0F172A] rounded-[32px] p-8 shadow-sm text-white">
                        <h4 className="text-[20px] font-bold mb-6">تخمین نوع حمایت</h4>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[15px]">وام بازسازی مسکن</p>
                              <p className="text-[#94A3B8] text-[13px] mt-1">با کارمزد ۴٪ (حسب مصوبات)</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[15px]">کمک بلاعوض معیشتی</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[15px]">خسارت بیمه پایه حوادث</p>
                            </div>
                          </li>
                        </ul>
                     </div>

                     <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E2E8F0]">
                        <h4 className="text-[20px] font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                          <FileSearch className="w-5 h-5 text-[#4F46E5]" /> چک‌لیست مدارک
                        </h4>
                        <div className="space-y-3">
                          {[
                            { id: "doc1", label: "کارت ملی هوشمند" },
                            { id: "doc2", label: "سند مالکیت یا قولنامه معتبر" },
                            { id: "doc3", label: "تصاویر واضح از خسارات" },
                            { id: "doc4", label: "گزارش کلانتری یا آتش‌نشانی" },
                            { id: "doc5", label: "فرم اولیه تکمیل شده بنیاد" },
                          ].map(doc => (
                            <label key={doc.id} className={`flex items-center gap-3 p-4 rounded-[16px] border cursor-pointer transition-colors ${checkedDocs[doc.id] ? 'bg-[#F0FDF4] border-[#0D9488]' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 transition-colors ${checkedDocs[doc.id] ? 'bg-[#0D9488] border-[#0D9488]' : 'bg-white border-[#CBD5E1]'}`}>
                                {checkedDocs[doc.id] && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <span className={`font-bold text-[14px] ${checkedDocs[doc.id] ? 'text-[#0D9488] line-through opacity-70' : 'text-[#334155]'}`}>{doc.label}</span>
                            </label>
                          ))}
                        </div>
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
