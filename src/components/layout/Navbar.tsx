import { Link } from "react-router-dom";
import { Shield, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">CrisisLaw</h1>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard/citizen" className="text-[18px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">داشبورد</Link>
            <a href="#services" className="text-[18px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">مشاوره حقوقی</a>
            <a href="#laws" className="text-[18px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">سازمان‌ها</a>
            <a href="#laws" className="text-[18px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">قوانین بحران</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth/login" className="text-[17px] font-bold text-[#0F172A] hover:text-[#0D9488] transition-colors px-4 py-2">
              تایید شماره موبایل
            </Link>
            <Link to="/auth/register" className="h-12 px-6 rounded-[16px] bg-[#0F172A] hover:bg-[#1e293b] text-white font-bold flex items-center justify-center transition-all shadow-sm">
              ثبت نام جدید
            </Link>
            <Link
              to="/admin/login"
              className={cn(
                "flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors font-medium")}
                >
                <ShieldAlert className="w-4 h-4" />
                               پنل مدیریت
              </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
