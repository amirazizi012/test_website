import { Shield, Mail, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="pt-12 pb-12 px-4 sm:px-6 lg:px-12 relative z-10 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-[48px] p-10 lg:p-16 relative overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.04)] border border-white">
          
          {/* Ambient Soft Mesh Backgrounds */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#0D9488]/10 to-transparent blur-[120px] rounded-full mix-blend-multiply pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#4F46E5]/10 to-transparent blur-[100px] rounded-full mix-blend-multiply pointer-events-none -translate-x-1/3 translate-y-1/4"></div>
          
          {/* White glossy overly for an elegant premium feel */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16">
              
              {/* Brand & About */}
              <div className="col-span-1 md:col-span-5 space-y-8">
                <Link to="/" className="flex items-center gap-4 w-fit group">
                  <div className="w-14 h-14 rounded-[20px] bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#0D9488] font-bold group-hover:scale-105 transition-transform duration-300">
                    <Shield className="w-8 h-8" />
                  </div>
                  <span className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">CrisisLaw</span>
                </Link>
                <p className="text-[#475569] text-[17px] leading-[2.2] font-medium max-w-sm text-justify">
                  سامانه جامع هوشمند مشاوره حقوقی مدیریت بحران. یاری‌رسان شما در احقاق حقوق شهروندی در زمان بلایای طبیعی، حوادث پیش‌بینی‌نشده و بحران‌های اجتماعی با بهره‌گیری از هوش مصنوعی.
                </p>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#CBD5E1] flex items-center justify-center hover:bg-white hover:border-white hover:shadow-md transition-all text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                    <span className="font-bold">IN</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-[#CBD5E1] flex items-center justify-center hover:bg-white hover:border-white hover:shadow-md transition-all text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                    <span className="font-bold">TW</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="col-span-1 md:col-span-3 space-y-8 lg:pr-8">
                <h4 className="text-[20px] font-extrabold text-[#0F172A]">دسترسی سریع</h4>
                <ul className="space-y-5">
                  <li>
                     <Link to="/auth/login" className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition-colors font-bold group text-[16px]">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] group-hover:bg-[#0D9488] transition-colors"></span> ورود به پنل
                     </Link>
                  </li>
                  <li>
                     <Link to="/auth/register" className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition-colors font-bold group text-[16px]">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] group-hover:bg-[#0D9488] transition-colors"></span> ثبت نام شهروند
                     </Link>
                  </li>
                  <li>
                     <a href="#services" className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition-colors font-bold group text-[16px]">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] group-hover:bg-[#0D9488] transition-colors"></span> خدمات سامانه
                     </a>
                  </li>
                  <li>
                     <Link to="/dashboard/laws" className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition-colors font-bold group text-[16px]">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] group-hover:bg-[#0D9488] transition-colors"></span> پایگاه دانش قوانین
                     </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="col-span-1 md:col-span-4 space-y-8">
                <h4 className="text-[20px] font-extrabold text-[#0F172A]">ارتباط با پشتیبانی</h4>
                <div className="bg-white/60 p-6 rounded-[24px] border border-white backdrop-blur-md shadow-sm space-y-5">
                  <div className="flex items-start gap-4 text-[#475569] font-medium">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#0D9488]" />
                    </div>
                    <span className="leading-relaxed text-[15px] pt-2">قم، شهرک قدس، ولیعصر 50، شرکت نوآفرینان عصر دانایی</span>
                  </div>
                  <div className="flex items-center gap-4 text-[#475569] font-medium">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#0D9488]" />
                    </div>
                    <span dir="ltr" className="text-[16px] font-bold tracking-wide">025 - 32851111</span>
                  </div>
                  <div className="flex items-center gap-4 text-[#475569] font-medium">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#0D9488]" />
                    </div>
                    <span dir="ltr" className="text-[16px] font-bold">NFD128@crisislaw.ir</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[#E2E8F0]/80 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[15px] text-[#64748B] font-bold text-center md:text-right">
                © ۲۰۲۶ تمامی حقوق برای سامانه مدیریت حقوقی <span className="text-[#0F172A]">CrisisLaw</span> محفوظ است.
              </p>
              <div className="flex items-center gap-8">
                <a href="#" className="text-[#64748B] hover:text-[#0D9488] transition-colors text-[15px] font-bold">حریم خصوصی</a>
                <a href="#" className="text-[#64748B] hover:text-[#0D9488] transition-colors text-[15px] font-bold">شرایط استفاده</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
