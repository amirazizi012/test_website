import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldAlert, Plus, Minus, FileText, Phone, Award, Building, Locate, Globe, Crosshair, Users, Activity, Swords, Home as HomeIcon, MessageSquare, Building2, PenLine, FileSearch, Cpu, Send, HandHeart, Shield, ArrowUp } from "lucide-react";
import lawImage from "../assets/images/hero_legal_ai_1781036441976.png";
import smartSupportImage from "../assets/images/hero_smart_support_1781036457509.png";
import orgsImage from "../assets/images/hero_organizations_1781036471688.png";
import citizenRightsImg from "../assets/images/card_citizen_rights_1781036484220.png";
import supportCentersImg from "../assets/images/card_support_centers_1781036497010.png";
import damagesImg from "../assets/images/card_damages_1781036511402.png";
import crisisLawsImg from "../assets/images/card_crisis_laws_1781037483169.png";
import matrixOrgsImg from "../assets/images/card_organizations_1781037501171.png";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/Button";

const HERO_SLIDES = [
  {
    title: "حمایت هوشمند",
    subtitle: "مدیریت بحران با",
    desc: "سامانه جامع CrisisLaw با بهره‌گیری از هوش مصنوعی، حقوق قانونی و مسیر دریافت خدمات حمایتی را در زمان بحران برای شما شفاف می‌کند.",
    image: smartSupportImage,
  },
  {
    title: "مشاوره حقوقی",
    subtitle: "هوش مصنوعی و",
    desc: "دسترسی آنی به تحلیل‌های پیچیده حقوقی، استخراج قوانین و راهنمایی گام‌به‌گام برای مطالبه حقوق شهروندی.",
    image: lawImage,
  },
  {
    title: "سازمان‌های امدادی",
    subtitle: "دسترسی سریع به",
    desc: "ارتباط مستقیم و هوشمند با ساختار مدیریت بحران، هلال احمر، اورژانس و نهادهای پشتیبان در کوتاه‌ترین زمان ممکن.",
    image: orgsImage,
  }
];

const FAQ_ITEMS = [
  { 
    q: "آیا مشاوره هوش مصنوعی از نظر حقوقی معتبر است؟", 
    a: "پاسخ‌های ارائه شده بر اساس آخرین قوانین مصوب مدیریت بحران و مسئولیت مدنی کشور تنظیم می‌شوند و به عنوان راهنمای دقیق و مستند قابل استناد هستند، اما جایگزین وکیل رسمی در دادگاه نمی‌شوند."
  },
  {
    q: "چگونه می‌توانم خسارات ناشی از سیل را مطالبه کنم؟",
    a: "ابتدا در پنل شهروندی ثبت نام کنید. هوش مصنوعی سامانه، فرم‌ها و مدارک لازم جهت ارائه به ستاد بحران و بنیاد مسکن را به صورت گام‌به‌گام در اختیار شما قرار می‌دهد."
  },
  {
    q: "آیا استفاده از این سامانه هزینه‌ای دارد؟",
    a: "خیر، در شرایط بحرانی (اعلام وضعیت قرمز توسط سازمان مدیریت بحران)، تمامی خدمات مشاوره و مسیریابی حقوقی در این سامانه کاملاً رایگان است."
  },
  {
    q: "اطلاعات من چقدر در این سامانه امن است؟",
    a: "این سامانه مبتنی بر زیرساخت‌های امن ابری است و اطلاعات هویتی و حقوقی شما با رعایت کامل پروتکل‌های امنیتی ذخیره شده و در اختیار هیچ نهاد غیرمجازی قرار نمی‌گیرد."
  },
  {
    q: "آیا می‌توانم پیگیری درخواست خود را به وکیل بسپارم؟",
    a: "بله، در بخش پنل شهروندی شما می‌توانید گزارش‌های تولید شده توسط هوش مصنوعی را به صورت فایل منسجم حقوقی دریافت و مستقیماً به وکیل خود ارجاع دهید."
  }
];

const ORGS_LOGOS = [
  "سازمان مدیریت بحران کشور", "جمعیت هلال احمر", "راهنمایی و رانندگی", "سازمان اورژانس", "آتش‌نشانی و خدمات ایمنی",
  "بنیاد مسکن انقلاب اسلامی", "سازمان هواشناسی", "وزارت بهداشت", "پلیس فتا", "سازمان پزشکی قانونی",
  "وزارت کشور", "نیروی انتظامی", "سازمان امداد و نجات", "شهرداری کلان‌شهرها", "پدافند غیرعامل",
  "وزارت نیرو", "سازمان بهزیستی", "اداره مدیریت راه‌ها", "بیمه مرکزی", "صندوق تامین خسارت"
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfdfd] to-[#f0f4f2] flex flex-col font-sans text-[#1A2E35]">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 w-full mt-4">
          
          {/* Hero Text */}
          <div className="flex flex-col gap-6 lg:gap-8 text-center lg:text-right relative z-10 w-full mt-8 lg:mt-0">
            <div className="min-h-[380px] sm:min-h-[280px] lg:min-h-[240px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-[#0F172A] leading-[1.2] m-0">
                    {HERO_SLIDES[currentSlide].subtitle}<br/>
                    <span className="text-[#0D9488] relative inline-block mt-2">
                      {HERO_SLIDES[currentSlide].title}
                      <span className="absolute bottom-2 left-0 w-full h-[15px] bg-[#0D9488]/10 -z-10"></span>
                    </span>
                  </h1>
                  <p className="text-[20px] mt-6 text-[#475569] leading-[1.8] max-w-[540px] mx-auto lg:mx-0 font-medium whitespace-normal">
                    {HERO_SLIDES[currentSlide].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col flex-wrap sm:flex-row items-center gap-4 justify-center lg:justify-start lg:mt-6">
              <Link to="/auth/login" className="w-full sm:w-auto mt-12 sm:mt-0 lg:mt-0">
                <Button size="lg" className="w-full text-lg h-14 px-8">
                  شروع پرسش از هوش مصنوعی
                </Button>
              </Link>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8">
                جستجوی قوانین
              </Button>
            </div>

            <div className="flex gap-2 justify-center lg:justify-start mt-6">
              {HERO_SLIDES.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-[#0D9488] w-8' : 'bg-[#cbd5e1]'}`}
                />
              ))}
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="flex-1 relative hidden lg:block h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-[#E2E8F0] rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.1)] border-8 border-white"
              >
                <img src={HERO_SLIDES[currentSlide].image} alt="Hero illustration" className="w-full h-full object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* TIMELINE / PARTNERS MARQUEE */}
      <section className="py-8 border-t border-b border-black/5 bg-white overflow-hidden relative" dir="rtl">
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, i) => (
             <div key={i} className="flex gap-12 px-6 items-center shrink-0">
               {ORGS_LOGOS.map((org, idx) => (
                 <div key={`org-${i}-${idx}`} className="flex items-center gap-2 text-[#64748B] opacity-70 whitespace-nowrap font-bold text-[18px]">
                   <ShieldAlert className="w-5 h-5" />
                   {org}
                 </div>
               ))}
             </div>
          ))}
        </div>
      </section>

      {/* QUICK SERVICES */}
      <section className="py-24 relative bg-[#F8FAFC] border-b border-black/5">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#0F172A] mb-4">خدمات و راهنمایی‌های پرکاربرد</h2>
            <p className="text-[#64748B] text-[18px] font-medium">
              دسترسی سریع به پرمخاطب‌ترین سرفصل‌های حقوقی و خدماتی سامانه
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "راهنمای خسارت جنگ", desc: "راهنمای حقوقی و مراحل دریافت خسارت ناشی از جنگ و درگیری‌ها", icon: <Swords className="w-8 h-8" /> },
              { title: "خسارت مسکن", desc: "پیگیری حقوقی تخریب یا آسیب به منزل و املاک", icon: <HomeIcon className="w-8 h-8" /> },
              { title: "مشاوره حقوقی", desc: "دریافت پاسخ هوشمند برای سوالات حقوقی مرتبط با بحران", icon: <MessageSquare className="w-8 h-8" /> },
              { title: "سازمان‌های مسئول", desc: "معرفی نهادها، سازمان‌ها و مراکز ارائه‌دهنده خدمات حمایتی", icon: <Building2 className="w-8 h-8" /> },
            ].map((srv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to="/auth/login" className="group relative bg-white border border-[#E2E8F0] rounded-[24px] p-8 h-full transition-all duration-300 hover:shadow-[0_20px_40px_rgba(13,148,136,0.08)] hover:-translate-y-2 hover:border-[#0D9488]/30 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-[#0D9488] group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_10px_20px_rgba(13,148,136,0.2)]">
                    {srv.icon}
                  </div>
                  <h3 className="text-[20px] font-bold text-[#0F172A] mb-3 transition-colors group-hover:text-[#0D9488]">{srv.title}</h3>
                  <p className="text-[#64748B] text-[15px] leading-[1.8] font-medium">
                    {srv.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex justify-center"
          >
             <Link to="/auth/login">
                <Button size="lg" className="h-14 px-10 text-[18px]">شروع مشاوره هوشمند</Button>
             </Link>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE SECTION */}
      <section className="py-24 relative bg-white border-b border-black/5 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-[#0D9488]/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-[#0F172A]/5 blur-[80px] rounded-full mix-blend-screen pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#0F172A] mb-4">مسیر دریافت خدمات</h2>
            <p className="text-[#64748B] text-[18px] font-medium">
              نقشه راه شفاف و ساده برای رسیدن به پاسخ درست
            </p>
          </motion.div>

          <div className="relative">
            {/* Horizontal Line for Desktop */}
            <div className="hidden lg:block absolute top-[50px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent z-0"></div>
            
            {/* Vertical Line for Mobile */}
            <div className="lg:hidden absolute top-[5%] bottom-[5%] right-8 sm:right-12 w-1 bg-gradient-to-b from-transparent via-[#E2E8F0] to-transparent z-0"></div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-16 lg:gap-6 relative z-10 w-full">
              {[
                { step: 1, title: "ثبت درخواست یا پرسش حقوقی", icon: <PenLine className="w-6 h-6" /> },
                { step: 2, title: "بررسی اطلاعات و مدارک", icon: <FileSearch className="w-6 h-6" /> },
                { step: 3, title: "تحلیل سامانه هوشمند", icon: <Cpu className="w-6 h-6" /> },
                { step: 4, title: "ارجاع به نهاد مسئول", icon: <Send className="w-6 h-6" /> },
                { step: 5, title: "دریافت خدمات حمایتی", icon: <HandHeart className="w-6 h-6" /> },
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15, type: 'spring', bounce: 0.4 }}
                  key={i} 
                  className="flex flex-row lg:flex-col items-center gap-6 lg:gap-6 group relative w-full lg:w-1/5 pr-16 sm:pr-24 lg:pr-0"
                >
                  
                  {/* Main Icon Box */}
                  <div className="absolute lg:relative right-0 lg:right-auto w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] lg:w-[100px] lg:h-[100px] rounded-[24px] lg:rounded-[32px] bg-white/60 backdrop-blur-md border-2 border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-sm transition-all duration-300 group-hover:border-[#0D9488] group-hover:text-[#0D9488] group-hover:shadow-[0_15px_30px_rgba(13,148,136,0.15)] group-hover:-translate-y-3 z-10">
                    
                    {/* Step Number Badge */}
                    <div className="absolute -top-3 -right-3 lg:-top-4 lg:-right-4 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-[14px] lg:text-[16px] shadow-lg border-2 border-white transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#0D9488]">
                      {item.step}
                    </div>

                    <div className="scale-[1.2] lg:scale-[1.5] transition-transform duration-500 group-hover:scale-[1.4] lg:group-hover:scale-[1.8] group-hover:rotate-6">
                      {item.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-[16px] xl:text-[18px] font-bold text-[#0F172A] text-right lg:text-center leading-[1.6] transition-colors duration-300 group-hover:text-[#0D9488] px-2 flex-1 lg:flex-none">
                    {item.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RICH FEATURE CARDS */}
      <section id="services" className="py-24 relative z-10 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-[44px] font-extrabold text-[#0F172A] mb-6">خدمات جامع سامانه هوشمند</h2>
            <p className="text-[#64748B] max-w-2xl mx-auto text-[18px] font-medium leading-[1.8]">
              هر آنچه برای احقاق حق و دریافت خدمات در زمان بحران نیاز دارید، در یک پلتفرم یکپارچه با رابط کاربری هوشمند مهیا شده است.
            </p>
          </motion.div>

          <div className="space-y-12">
            {[
              { 
                id: "rights",
                title: "آگاهی کامل از حقوق شهروندی", 
                desc: "در شرایط بحرانی، قوانین مسئولیت مدنی دولت و حق و حقوق شما به عنوان یک شهروند آسیب‌دیده چیست؟ سامانه ما با دسترسی به هزاران ماده قانونی، تمام حقوق فراموش شده شما را استخراج و در قالب راهنمای ساده ارائه می‌دهد. دیگر نیازی به جستجوهای گیج‌کننده در اینترنت ندارید؛ هوش مصنوعی دقیقاً بندهای مرتبط با وضعیت شما را پیدا کرده و به زبان ساده تفسیر می‌کند.", 
                img: citizenRightsImg,
                reverse: false,
                targetPath: "/dashboard/citizen"
              },
              { 
                id: "organizations",
                title: "دسترسی آنی به مراکز حمایتی", 
                desc: "دریافت سریع اطلاعات موثق از سازمان‌های امدادرسان، محل توزیع اقلام، مراکز درمانی صحرایی و نهادهای پشتیبان دولتی و مردم‌نهاد. نقشه یکپارچه ما بر اساس موقعیت مکانی شما و نوع بحران، نزدیک‌ترین و مرتبط‌ترین سازمان‌ها را با ذکر تماس مستقیم و نام نهاد مسئول نمایش می‌دهد تا در وقت طلایی گمراه نشوید.", 
                img: supportCentersImg,
                reverse: true,
                targetPath: "/dashboard/support"
              },
              { 
                id: "damages",
                title: "مسیر هوشمند مطالبه خسارت", 
                desc: "آسیب به منزل، خودرو یا کسب‌وکار در اثر بلایای طبیعی؟ ما یک دستیار هوشمند طراحی کرده‌ایم که فرآیند پیچیده دریافت خسارت از بیمه، ثبت درخواست در سامانه بنیاد مسکن و اخذ وام‌های بلاعوض را تسریع می‌کند. بدانید دقیقاً چه فرم‌هایی نیاز است.", 
                img: damagesImg,
                reverse: false,
                targetPath: "/dashboard/damage-claim"
              },
              { 
                id: "laws",
                title: "منبع جامع قوانین بحران کشور", 
                desc: "پایگاه داده هوشمند و جستجوگر تطبیقی قوانین. تمامی مصوبات، آیین‌نامه‌های اجرایی و دستورالعمل‌های مدیریت بحران در کشور همراه با آرای وحدت رویه مرتبط در این قسمت طبقه‌بندی شده‌اند. سیستم قادر است برای هر سناریو، ماده قانونی متناسب با آن را با لحن حقوقی و قابل دفاع به شما ارائه کند.", 
                img: crisisLawsImg,
                reverse: true,
                targetPath: "/dashboard/laws"
              },
              { 
                id: "network",
                title: "شبکه هماهنگی سازمان‌ها", 
                desc: "ارتباط‌گیری یکپارچه با تیم‌های واکنش سریع، ساماندهی داوطلبان و اتصال الکترونیک به درگاه‌های ثبت گزارش دستگاه‌های متولی پدافند غیرعامل و سازمان‌های نظارتی مرتبط، برای پیگیری تخلفات یا درخواست‌های اضطراری در دوران حیاتی پسا-بحران.", 
                img: matrixOrgsImg,
                reverse: false,
                targetPath: "/dashboard/reports"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                id={feature.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 bg-[#F8FAFC] border border-[#E2E8F0] p-8 lg:p-12 rounded-[40px] scroll-mt-24 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-shadow duration-500 hover:border-[#0D9488]/30`}
              >
                <div className="flex-1 w-full relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0D9488]/10 to-transparent blur-3xl rounded-full"></div>
                  <img src={feature.img} alt={feature.title} className="w-full max-w-[400px] mx-auto rounded-[32px] shadow-xl border-4 border-white object-cover aspect-square bg-[#E2E8F0] relative z-10" />
                </div>
                <div className="flex-1 space-y-6">
                  <h3 className="text-3xl lg:text-4xl font-bold text-[#0F172A] leading-tight">{feature.title}</h3>
                  <p className="text-[18px] text-[#475569] leading-[2.2] text-justify font-medium">
                    {feature.desc}
                  </p>
                  <Link to={feature.targetPath || "/auth/login"} className="inline-block">
                    <Button variant="outline" size="lg" className="mt-4">
                      ورود به پنل کاربری و استفاده
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHT/BANNER SECTION */}
      <section className="pt-8 pb-12 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-gradient-to-br from-[#F0FDF4] to-[#EEF2FF] rounded-[48px] p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-[#E2E8F0]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0D9488]/5 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#4F46E5]/5 blur-[80px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="flex-1 text-[#0F172A] relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="text-[14px] font-bold text-[#64748B] tracking-wide">پاسخگویی در لحظه</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-[1.4] text-[#0F172A]">
                ما در سخت‌ترین لحظات، <br/>
                <span className="text-[#0D9488]">پشتوانه حقوقی شما</span> هستیم.
              </h2>
              <p className="text-[18px] md:text-[20px] text-[#64748B] leading-[2] font-medium max-w-2xl text-justify">
                سامانه هوشمند CrisisLaw با استفاده از پیشرفته‌ترین الگوریتم‌های هوش مصنوعی، تمام فرآیندهای پیچیده حقوقی، ارجاع حمایتی و مطالبه خسارت را برای شما ساده‌سازی کرده است. هدف ما کاهش دغدغه‌های شما در روزهای بحرانی است.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/auth/register">
                  <Button size="lg" className="h-16 px-10 text-[18px] bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-[20px] shadow-md">
                    همین حالا شروع کنید
                  </Button>
                </Link>
                <Link to="/dashboard/citizen">
                  <Button variant="outline" size="lg" className="h-16 px-10 text-[18px] bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] rounded-[20px]">
                    آشنایی با امکانات
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full relative z-10 hidden md:block">
              <div className="relative w-full aspect-[4/3] rounded-[32px] overflow-hidden border-8 border-white shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src={supportCentersImg} alt="Crisis Support" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-[24px]">۱۰۰٪</span>
                    <span className="text-[14px] font-medium text-white/80">رایگان و در دسترس</span>
                  </div>
                  <div className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RIBBON SEPARATOR */}
      <div className="w-full bg-[#0F172A] py-5 overflow-hidden relative rotate-1 scale-105 my-8 z-20 border-y-4 border-[#0D9488] shadow-lg">
         <div className="flex w-full whitespace-nowrap animate-marquee items-center text-white">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-8">
                <span className="flex items-center gap-3 text-[18px] font-extrabold tracking-wide"><Shield className="w-6 h-6 text-[#34D399]" /> ۱۰۰٪ رایگان و امن</span>
                <span className="w-2 h-2 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-3 text-[18px] font-extrabold tracking-wide"><Users className="w-6 h-6 text-[#38BDF8]" /> بیش از ۵۰,۰۰۰ مشاوره موفق</span>
                <span className="w-2 h-2 rounded-full bg-white/20"></span>
                <span className="flex items-center gap-3 text-[18px] font-extrabold tracking-wide"><Award className="w-6 h-6 text-[#FBBF24]" /> تایید شده توسط کارشناسان حقوقی</span>
                <span className="w-2 h-2 rounded-full bg-white/20"></span>
              </div>
            ))}
         </div>
      </div>

      {/* FAQ SECTION */}
      <section className="py-20 relative overflow-hidden bg-[#F8FAFC]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0D9488]/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-[-20%] w-[600px] h-[600px] bg-[#4F46E5]/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-[44px] font-extrabold mb-6 text-[#0F172A]">سوالات پرتکرار شهروندان</h2>
            <p className="text-[#64748B] text-[18px] font-medium leading-[1.8]">
              پاسخ به دغدغه‌های اصلی شما در خصوص کارکرد سامانه و اعتبار مشاوره‌های حقوقی.
            </p>
          </motion.div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-[#E2E8F0] rounded-[24px] overflow-hidden transition-all hover:shadow-md"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="flex items-center justify-between w-full p-6 text-right focus:outline-none"
                >
                  <span className="text-[20px] font-bold pr-2 text-[#0F172A]">{faq.q}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeFaq === i ? 'bg-[#0D9488] text-white' : 'bg-[#F8FAFC] text-[#94A3B8]'}`}>
                    {activeFaq === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-6 pt-0 text-[16px] text-[#64748B] leading-[2.2] font-medium text-justify border-t border-[#F1F5F9] mt-2">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SCROLL TO TOP */}
      <div className="relative z-20 flex justify-center -mt-8 pb-8 pointer-events-none">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-16 h-16 rounded-full bg-white border border-[#E2E8F0] shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#0D9488] hover:bg-[#F0FDF4] hover:border-[#0D9488]/30 hover:scale-110 transition-all duration-300 pointer-events-auto animate-bounce group"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      </div>

      <Footer />
    </div>
  );
}
