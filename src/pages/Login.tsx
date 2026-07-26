import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { saveSession } from "../lib/auth";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در ارسال کد. دوباره تلاش کنید.");
        return;
      }
      setDevCode(data.devCode ?? null);
      setStep(2);
    } catch (e) {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "کد وارد شده صحیح نیست.");
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
    <div className="min-h-screen bg-gradient-to-br from-[#fdfdfd] to-[#f0f4f2] flex flex-col items-center justify-center relative px-4 text-[#1A2E35] font-sans">
      <Link to="/" className="absolute top-8 right-8 text-[#64748B] hover:text-[#0F172A] flex items-center gap-2 transition-colors font-medium">
        <ArrowRight className="w-5 h-5" />
        بازگشت به سایت
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-black/5 rounded-[32px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative z-10 overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[#0D9488] rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-teal-900/20">
            {step === 1 ? <Shield className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
          </div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">ورود به سامانه</h1>
          <p className="text-[16px] text-[#64748B]">
            {step === 1 ? "برای ورود، شماره موبایل خود را وارد کنید." : "کد پیامک‌شده را وارد کنید."}
          </p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] font-medium rounded-xl px-4 py-3 text-center mb-6">
            {error}
          </div>
        )}

        {step === 2 && devCode && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[13px] font-medium rounded-xl px-4 py-3 text-center mb-6">
            کد تست (فقط محیط توسعه، جایگزین پیامک واقعی): <span dir="ltr" className="font-bold">{devCode}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendCode} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-[#0F172A] pr-1">شماره موبایل</label>
                <Input 
                  type="tel" 
                  required 
                  placeholder="09123456789"
                  maxLength={11}
                  className="text-center text-lg tracking-widest"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <Button type="submit" size="lg" className="w-full mt-4" disabled={isLoading || phone.length < 10}>
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "دریافت کد تایید"}
              </Button>

              <div className="pt-2">
                <GoogleSignInButton
                  onSuccess={() => navigate("/dashboard/citizen")}
                  onError={(msg) => setError(msg)}
                />
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp} 
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <label className="text-[15px] font-semibold text-[#0F172A]">کد تایید</label>
                <Input 
                  type="text" 
                  required 
                  placeholder="- - - -"
                  maxLength={4}
                  className="text-center text-2xl tracking-[1em]"
                  dir="ltr"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button type="button" onClick={() => { setStep(1); setError(""); setDevCode(null); }} className="text-[13px] text-[#0D9488] mt-2 font-medium">ویرایش شماره موبایل</button>
              </div>
              
              <Button type="submit" size="lg" className="w-full mt-4" disabled={isLoading || otp.length < 4}>
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تایید و ورود به داشبورد"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center border-t border-black/5 pt-6">
          <p className="text-[15px] text-[#64748B]">
            حساب کاربری ندارید؟ <Link to="/auth/register" className="text-[#0D9488] font-bold hover:underline">ثبت نام کنید</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
