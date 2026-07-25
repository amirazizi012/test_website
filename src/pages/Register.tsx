import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { saveSession } from "../lib/auth";

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, nationalCode, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در ثبت‌نام. دوباره تلاش کنید.");
        return;
      }

      saveSession(data.token, data.user);
      navigate("/dashboard/citizen");
    } catch (e) {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfdfd] to-[#f0f4f2] flex flex-col items-center justify-center relative px-4 py-12 text-[#1A2E35] font-sans">
      <Link to="/" className="absolute top-8 right-8 text-[#64748B] hover:text-[#0F172A] flex items-center gap-2 transition-colors font-medium">
        <ArrowRight className="w-5 h-5" />
        بازگشت به سایت
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-black/5 rounded-[32px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[#0D9488] rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-teal-900/20">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">ثبت نام در سامانه</h1>
          <p className="text-[16px] text-[#64748B]">جهت استفاده از خدمات، اطلاعات هویتی خود را وارد نمایید.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] font-medium rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-[#0F172A] pr-1">نام</label>
              <Input type="text" required placeholder="مثال: علی" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[15px] font-semibold text-[#0F172A] pr-1">نام خانوادگی</label>
              <Input type="text" required placeholder="مثال: محمدی" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-[#0F172A] pr-1">کد ملی</label>
            <Input type="text" required placeholder="مثال: 0012345678" maxLength={10} className="text-left" dir="ltr" value={nationalCode} onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, ""))} />
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-[#0F172A] pr-1">شماره موبایل</label>
            <Input type="tel" required placeholder="09123456789" maxLength={11} className="text-left" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
          </div>

          <Button type="submit" size="lg" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تکمیل ثبت نام"}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-black/5 pt-6">
          <p className="text-[15px] text-[#64748B]">
            قبلاً ثبت نام کرده‌اید؟ <Link to="/auth/login" className="text-[#0D9488] font-bold hover:underline">وارد شوید</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
