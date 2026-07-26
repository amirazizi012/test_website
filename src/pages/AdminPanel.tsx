import { useState, useEffect, useMemo } from "react";
import { Shield, Users, MessageSquare, Download, LogOut, Search, TrendingUp } from "lucide-react";

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  consultationCount: number;
  createdAt: string;
}

interface AdminActivity {
  id: string;
  fullName: string;
  phone: string | null;
  nationalCode: string | null;
  title: string;
  description: string;
  response: string | null;
  createdAt: string;
}

interface AdminStats {
  totalUsers: string;
  totalConsultations: string;
  usersLast7Days: string;
  consultationsLast7Days: string;
}

const TOKEN_KEY = "crisislaw_admin_token";

async function adminFetch(path: string, token: string) {
  const res = await fetch(path, { headers: { "x-admin-token": token } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `خطای ${res.status}`);
  }
  return res.json();
}

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  const [tab, setTab] = useState<"users" | "activities">("users");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function tryLogin(t: string) {
    setChecking(true);
    setAuthError("");
    try {
      await adminFetch("/api/admin/stats", t);
      sessionStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    } catch (e: any) {
      setAuthError("توکن اشتباه است.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    Promise.all([
      adminFetch("/api/admin/stats", token),
      adminFetch("/api/admin/users", token),
      adminFetch("/api/admin/activities", token),
    ])
      .then(([s, u, a]) => {
        setStats(s);
        setUsers(u);
        setActivities(a);
      })
      .catch((e) => setError(e.message || "خطا در دریافت اطلاعات"))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredUsers = useMemo(() => {
    const q = search.trim();
    if (!q) return users;
    return users.filter((u) => u.fullName.includes(q) || u.phone?.includes(q) || u.nationalCode?.includes(q));
  }, [users, search]);

  const filteredActivities = useMemo(() => {
    const q = search.trim();
    if (!q) return activities;
    return activities.filter((a) => a.fullName.includes(q) || a.phone?.includes(q) || a.title.includes(q));
  }, [activities, search]);

  const fmtDate = (iso: string) => new Date(iso).toLocaleString("fa-IR");

  if (!token) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            tryLogin(tokenInput);
          }}
          className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5 shadow-xl"
        >
          <div className="flex items-center gap-2 justify-center text-[#0F172A]">
            <Shield className="w-6 h-6" />
            <h1 className="text-[18px] font-bold">ورود به پنل ادمین</h1>
          </div>
          {authError && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[13px] rounded-xl px-4 py-2 text-center">
              {authError}
            </div>
          )}
          <input
            type="password"
            autoFocus
            placeholder="توکن ادمین (ADMIN_EXPORT_TOKEN)"
            dir="ltr"
            className="w-full text-left border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#0D9488]"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={checking || !tokenInput}
            className="w-full bg-[#0D9488] text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {checking ? "در حال بررسی..." : "ورود"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F7F5] text-[#1A2E35]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0D9488]" />
            <h1 className="text-[20px] font-bold text-[#0F172A]">پنل ادمین — CrisisLaw</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem(TOKEN_KEY);
              setToken(null);
            }}
            className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#EF4444]"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="کل کاربران" value={stats?.totalUsers} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="کاربران ۷ روز اخیر" value={stats?.usersLast7Days} />
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="کل مشاوره‌ها" value={stats?.totalConsultations} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="مشاوره‌های ۷ روز اخیر" value={stats?.consultationsLast7Days} />
        </div>

        {/* Tabs + search + export */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-2 bg-white rounded-xl p-1 border border-[#E2E8F0]">
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold ${tab === "users" ? "bg-[#0D9488] text-white" : "text-[#64748B]"}`}
            >
              کاربران ({users.length})
            </button>
            <button
              onClick={() => setTab("activities")}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold ${tab === "activities" ? "bg-[#0D9488] text-white" : "text-[#64748B]"}`}
            >
              فعالیت‌ها ({activities.length})
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="جستجو بر اساس نام، موبایل یا کد ملی..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl pr-9 pl-3 py-2 text-[13px] outline-none focus:border-[#0D9488] bg-white"
              />
            </div>
          </div>

          <a
            href={`/api/admin/export/${tab === "users" ? "users" : "activities"}.csv?token=${encodeURIComponent(token)}`}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#0D9488] border border-[#0D9488] rounded-xl px-4 py-2 hover:bg-[#0D9488] hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            دانلود CSV
          </a>
        </div>

        {loading ? (
          <div className="text-center text-[#64748B] py-12">در حال بارگذاری...</div>
        ) : tab === "users" ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-right">
                  <th className="p-3 font-semibold">نام</th>
                  <th className="p-3 font-semibold">کد ملی</th>
                  <th className="p-3 font-semibold">موبایل</th>
                  <th className="p-3 font-semibold">ایمیل</th>
                  <th className="p-3 font-semibold">نقش</th>
                  <th className="p-3 font-semibold">تعداد مشاوره</th>
                  <th className="p-3 font-semibold">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="p-3 font-medium">{u.fullName}</td>
                    <td className="p-3" dir="ltr">{u.nationalCode || "—"}</td>
                    <td className="p-3" dir="ltr">{u.phone || "—"}</td>
                    <td className="p-3">{u.email || "—"}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.consultationCount}</td>
                    <td className="p-3 text-[#64748B]">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#94A3B8]">موردی یافت نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2">
                <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">{a.fullName}</span>
                  <span>{fmtDate(a.createdAt)}</span>
                </div>
                <div className="text-[13px] text-[#64748B]" dir="ltr">{a.phone}</div>
                <div className="text-[14px] font-semibold">{a.title}</div>
                <div className="text-[13px] text-[#475569] whitespace-pre-wrap">{a.description}</div>
                {a.response && (
                  <details className="text-[13px] text-[#0D9488]">
                    <summary className="cursor-pointer font-medium">مشاهده پاسخ سامانه</summary>
                    <div className="mt-2 text-[#475569] whitespace-pre-wrap">{a.response}</div>
                  </details>
                )}
              </div>
            ))}
            {filteredActivities.length === 0 && (
              <div className="text-center text-[#94A3B8] py-12">موردی یافت نشد.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[20px] font-bold text-[#0F172A]">{value ?? "—"}</div>
        <div className="text-[12px] text-[#64748B]">{label}</div>
      </div>
    </div>
  );
}
