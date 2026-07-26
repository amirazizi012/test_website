import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, LogOut, ArrowRight, Loader2, X, MessageSquare, ShieldCheck, ShieldOff, Activity } from "lucide-react";
import { getCurrentUser, logout, apiFetch } from "../lib/auth";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  consultationCount: number;
}

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  response: string | null;
  created_at: string;
}

interface FeedItem {
  id: string;
  full_name: string;
  phone: string | null;
  national_code: string | null;
  title: string;
  description: string;
  response: string | null;
  created_at: string;
}

interface Stats {
  totalUsers: string;
  totalConsultations: string;
  usersLast7Days: string;
  consultationsLast7Days: string;
}

type Tab = "users" | "feed";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (user.role !== "Admin") {
      navigate("/dashboard/citizen");
      return;
    }
    loadAll();
  }, [user, navigate]);

  async function loadAll() {
    setIsLoading(true);
    setError("");
    try {
      const [statsRes, usersRes, feedRes] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/admin/users"),
        apiFetch("/api/admin/consultations"),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const feedData = await feedRes.json();

      if (!statsRes.ok || !usersRes.ok || !feedRes.ok) {
        setError(statsData.error || usersData.error || feedData.error || "خطا در دریافت اطلاعات.");
        return;
      }

      setStats(statsData.stats);
      setUsers(usersData.users);
      setFeed(feedData.consultations);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsLoading(false);
    }
  }

  async function openUserHistory(u: AdminUser) {
    setSelectedUser(u);
    setIsHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/history`);
      const data = await res.json();
      setHistory(res.ok ? data.history : []);
    } catch {
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function toggleRole(u: AdminUser) {
    const newRole = u.role === "Admin" ? "Citizen" : "Admin";
    if (!confirm(`آیا مطمئنید می‌خواهید نقش «${u.fullName}» را به «${newRole === "Admin" ? "مدیر" : "شهروند"}» تغییر دهید؟`)) return;

    const res = await apiFetch(`/api/admin/users/${u.id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#1A2E35] font-sans">
      <header className="h-[100px] flex items-center justify-between px-6 sm:px-10 bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-bold">C</div>
            <span className="text-[22px] font-extrabold text-[#0F172A] tracking-tight hidden sm:inline">CrisisLaw</span>
          </Link>
          <span className="text-[15px] text-[#64748B] border-r border-black/10 pr-3 mr-1">پنل مدیریت</span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/dashboard/citizen" className="text-[14px] font-medium text-[#64748B] hover:text-[#0F172A] flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            بازگشت به داشبورد
          </Link>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all text-[14px] font-semibold"
          >
            <LogOut className="w-[18px] h-[18px]" />
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] font-medium rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          </div>
        ) : (
          <>
            {/* آمار کلی */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="کل کاربران" value={stats.totalUsers} />
                <StatCard label="کل فعالیت‌ها" value={stats.totalConsultations} />
                <StatCard label="کاربران جدید (۷ روز)" value={stats.usersLast7Days} />
                <StatCard label="فعالیت‌های اخیر (۷ روز)" value={stats.consultationsLast7Days} />
              </div>
            )}

            {/* تب‌ها */}
            <div className="flex items-center gap-2 mb-6 bg-white border border-black/5 rounded-2xl p-1.5 w-fit">
              <button
                onClick={() => setTab("users")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${tab === "users" ? "bg-[#0D9488] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}
              >
                <Users className="w-4 h-4" />
                کاربران
              </button>
              <button
                onClick={() => setTab("feed")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${tab === "feed" ? "bg-[#0D9488] text-white" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}
              >
                <Activity className="w-4 h-4" />
                فعالیت‌های کامل (همه)
              </button>
            </div>

            {tab === "users" ? (
              <div className="bg-white border border-black/5 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-black/5 text-[#64748B] text-[13px]">
                        <th className="px-5 py-4 text-right font-semibold">نام</th>
                        <th className="px-5 py-4 text-right font-semibold">موبایل</th>
                        <th className="px-5 py-4 text-right font-semibold">ایمیل</th>
                        <th className="px-5 py-4 text-right font-semibold">کد ملی</th>
                        <th className="px-5 py-4 text-right font-semibold">نقش</th>
                        <th className="px-5 py-4 text-right font-semibold">تاریخ ثبت‌نام</th>
                        <th className="px-5 py-4 text-right font-semibold">تعداد فعالیت</th>
                        <th className="px-5 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-4 font-semibold text-[#0F172A]">{u.fullName}</td>
                          <td className="px-5 py-4 text-left" dir="ltr">{u.phone || "—"}</td>
                          <td className="px-5 py-4 text-left" dir="ltr">{u.email || "—"}</td>
                          <td className="px-5 py-4 text-left" dir="ltr">{u.nationalCode || "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${u.role === "Admin" ? "bg-[#0D9488]/10 text-[#0D9488]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                              {u.role === "Admin" ? "مدیر" : "شهروند"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[#64748B]">{formatDate(u.createdAt)}</td>
                          <td className="px-5 py-4 font-bold text-[#0F172A]">{u.consultationCount}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openUserHistory(u)}
                                disabled={u.consultationCount === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors text-[13px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <MessageSquare className="w-4 h-4" />
                                تاریخچه
                              </button>
                              <button
                                onClick={() => toggleRole(u)}
                                title={u.role === "Admin" ? "بازگرداندن به شهروند" : "ارتقا به مدیر"}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-[13px] font-semibold"
                              >
                                {u.role === "Admin" ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-[#64748B]">
                            هنوز هیچ کاربری ثبت‌نام نکرده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {feed.length === 0 && (
                  <p className="text-center text-[#64748B] py-16 bg-white rounded-[24px] border border-black/5">
                    هنوز هیچ فعالیتی ثبت نشده است.
                  </p>
                )}
                {feed.map((f) => (
                  <div key={f.id} className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F172A] text-[15px]">{f.full_name}</span>
                        <span className="text-[13px] text-[#94A3B8]" dir="ltr">{f.phone || f.national_code || ""}</span>
                      </div>
                      <span className="text-[12px] text-[#94A3B8]">{formatDate(f.created_at)}</span>
                    </div>
                    <p className="text-[13px] font-bold text-[#0D9488] mb-1">{f.title}</p>
                    <p className="text-[14px] text-[#334155] whitespace-pre-wrap mb-3">{f.description}</p>
                    {f.response && (
                      <div className="border-t border-black/5 pt-3 mt-3">
                        <p className="text-[12px] font-bold text-[#64748B] mb-1">پاسخ سامانه:</p>
                        <p className="text-[14px] text-[#475569] whitespace-pre-wrap">{f.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* پنل تاریخچه‌ی یک کاربر خاص */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 z-30 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-xl h-full bg-white overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#0F172A]">{selectedUser.fullName}</h2>
                <p className="text-[13px] text-[#64748B]" dir="ltr">{selectedUser.phone || selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl hover:bg-[#F1F5F9]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#0D9488]" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-[#64748B] text-center py-16">فعالیتی برای این کاربر ثبت نشده است.</p>
            ) : (
              <div className="space-y-5">
                {history.map((h) => (
                  <div key={h.id} className="border border-black/5 rounded-2xl p-5 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#0F172A] text-[15px]">{h.title}</span>
                      <span className="text-[12px] text-[#94A3B8]">{formatDate(h.created_at)}</span>
                    </div>
                    <p className="text-[14px] text-[#334155] whitespace-pre-wrap mb-3">{h.description}</p>
                    {h.response && (
                      <div className="border-t border-black/5 pt-3 mt-3">
                        <p className="text-[12px] font-bold text-[#0D9488] mb-1">پاسخ سامانه:</p>
                        <p className="text-[14px] text-[#475569] whitespace-pre-wrap">{h.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5">
      <p className="text-[13px] text-[#64748B] font-medium mb-1">{label}</p>
      <p className="text-[26px] font-extrabold text-[#0F172A]">{value}</p>
    </div>
  );
}
