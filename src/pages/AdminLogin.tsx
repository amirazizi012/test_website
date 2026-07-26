import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { saveAdminSession } from "../lib/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ورود ناموفق بود.");
        return;
      }
      saveAdminSession(data.token, data.isDefault);
      navigate("/admin/dashboard");
    } catch {
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
        className="w-full max-w-md bg-white border border-black/5 rounded-[32px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">ورود به پنل مدیریت</h1>
          <p className="text-[16px] text-[#64748B]">این بخش فقط برای مدیران سامانه است.</p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] font-medium rounded-xl px-4 py-3 text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-[#0F172A] pr-1">رمز عبور مدیر</label>
            <Input
              type="password"
              required
              placeholder="رمز عبور را وارد کنید"
              dir="ltr"
              className="text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-4" disabled={isLoading || !password}>
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "ورود"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
