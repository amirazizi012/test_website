import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut, Users, Scale, KeyRound, LayoutDashboard, Plus, Trash2, AlertTriangle, Loader2, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { getAdminToken, isAdminDefaultPassword, setAdminDefaultPassword, isAdminLoggedIn, adminLogout } from "../lib/adminAuth";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface AdminLaw {
  id: string;
  title: string;
  category: string;
  description: string;
}

type Tab = "overview" | "laws" | "users" | "password";
type AuthedFetch = (url: string, options?: RequestInit) => Promise<Response>;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(isAdminDefaultPassword() ? "password" : "overview");
  const [stats, setStats] = useState<{ usersCount: number; questionsCount: number; lawsCount: number } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [laws, setLaws] = useState<AdminLaw[]>([]);
  const [showDefaultWarning, setShowDefaultWarning] = useState(isAdminDefaultPassword());

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate("/admin/login");
  }, [navigate]);

  const authedFetch: AuthedFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${getAdminToken()}`,
      },
    });
    if (res.status === 401) {
      adminLogout();
      navigate("/admin/login");
      throw new Error("جلسه منقضی شده است.");
    }
    return res;
  };

  useEffect(() => {
    authedFetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
    authedFetch("/api/admin/laws").then((r) => r.json()).then(setLaws).catch(() => {});
    authedFetch("/api/admin/users").then((r) => r.json()).then(setUsers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfdfd] to-[#f0f4f2] flex text-[#1A2E35] font-sans">
      <aside className="w-72 bg-white border-l border-black/5 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-[#0F172A] text-lg">پنل مدیریت</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarButton icon={LayoutDashboard} label="نمای کلی" active={tab === "overview"} onClick={() => setTab("overview")} />
          <SidebarButton icon={Scale} label="مدیریت قوانین" active={tab === "laws"} onClick={() => setTab("laws")} />
          <SidebarButton icon={Users} label="کاربران" active={tab === "users"} onClick={() => setTab("users")} />
          <SidebarButton icon={KeyRound} label="تغییر رمز عبور" active={tab === "password"} onClick={() => setTab("password")} />
        </nav>

        <button
          onClick={() => { adminLogout(); navigate("/"); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all text-[15px] font-semibold"
        >
          <LogOut className="w-5 h-5" />
          خروج
        </button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {showDefaultWarning && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-2xl px-6 py-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-[15px] font-medium">
              شما هنوز از رمز عبور پیش‌فرض («admin») استفاده می‌کنید. لطفاً همین حالا از تب «تغییر رمز عبور» آن را عوض کنید.
            </p>
          </div>
        )}

        {tab === "overview" && (
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-8">نمای کلی سامانه</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard label="کاربران ثبت‌نام‌شده" value={stats?.usersCount ?? "—"} />
              <StatCard label="پرسش‌های ثبت‌شده" value={stats?.questionsCount ?? "—"} />
              <StatCard label="قوانین ثبت‌شده" value={stats?.lawsCount ?? "—"} />
            </div>
          </div>
        )}

        {tab === "laws" && <LawsPanel laws={laws} setLaws={setLaws} authedFetch={authedFetch} />}
        {tab === "users" && <UsersPanel users={users} />}
        {tab === "password" && (
          <PasswordPanel
            authedFetch={authedFetch}
            onChanged={() => { setAdminDefaultPassword(false); setShowDefaultWarning(false); }}
          />
        )}
      </main>
    </div>
  );
}

function SidebarButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-[15px] font-semibold transition-all ${
        active ? "bg-[#0D9488] text-white shadow-md" : "text-[#64748B] hover:bg-[#F1F5F9]"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
      <p className="text-[14px] text-[#64748B] mb-2">{label}</p>
      <p className="text-[32px] font-extrabold text-[#0F172A]">{value}</p>
    </div>
  );
}

function LawsPanel({ laws, setLaws, authedFetch }: { laws: AdminLaw[]; setLaws: (l: AdminLaw[]) => void; authedFetch: AuthedFetch }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const res = await authedFetch("/api/admin/laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در افزودن قانون.");
        return;
      }
      setLaws([...laws, data]);
      setTitle(""); setCategory(""); setDescription("");
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("از حذف این قانون مطمئن هستید؟")) return;
    try {
      await authedFetch(`/api/admin/laws/${id}`, { method: "DELETE" });
      setLaws(laws.filter((l) => l.id !== id));
    } catch {
      setError("خطا در حذف قانون.");
    }
  };

  return (
    <div>
      <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-8">مدیریت قوانین</h1>

      <form onSubmit={handleAdd} className="bg-white border border-black/5 rounded-2xl p-6 mb-8 space-y-4">
        <h2 className="font-bold text-[#0F172A]">افزودن قانون جدید</h2>
        {error && <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] rounded-xl px-4 py-3">{error}</div>}
        <Input placeholder="عنوان قانون" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder="دسته‌بندی" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <textarea
          placeholder="شرح قانون"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full rounded-xl border border-black/10 p-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Plus className="w-4 h-4 inline ml-1" /> افزودن</>)}
        </Button>
      </form>

      <div className="space-y-4">
        {laws.map((law) => (
          <div key={law.id} className="bg-white border border-black/5 rounded-2xl p-6 flex items-start justify-between gap-4">
            <div>
              <span className="text-[12px] font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-1 rounded-md">{law.category}</span>
              <h3 className="font-bold text-[#0F172A] mt-2">{law.title}</h3>
              <p className="text-[14px] text-[#64748B] mt-1">{law.description}</p>
            </div>
            <button onClick={() => handleDelete(law.id)} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors shrink-0">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {laws.length === 0 && <p className="text-[#64748B] text-center py-10">هنوز قانونی ثبت نشده است.</p>}
      </div>
    </div>
  );
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  return (
    <div>
      <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-8">کاربران ثبت‌نام‌شده</h1>
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="p-4 text-[14px] font-bold text-[#0F172A]">نام</th>
              <th className="p-4 text-[14px] font-bold text-[#0F172A]">موبایل</th>
              <th className="p-4 text-[14px] font-bold text-[#0F172A]">کد ملی</th>
              <th className="p-4 text-[14px] font-bold text-[#0F172A]">تاریخ ثبت‌نام</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="p-4 text-[14px]">{u.fullName}</td>
                <td className="p-4 text-[14px]" dir="ltr">{u.phone}</td>
                <td className="p-4 text-[14px]" dir="ltr">{u.nationalCode}</td>
                <td className="p-4 text-[14px]">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-[#64748B] text-center py-10">هنوز کاربری ثبت‌نام نکرده است.</p>}
      </div>
    </div>
  );
}

function PasswordPanel({ authedFetch, onChanged }: { authedFetch: AuthedFetch; onChanged: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await authedFetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در تغییر رمز عبور.");
        return;
      }
      setSuccess(true);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      onChanged();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-8">تغییر رمز عبور مدیر</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-black/5 rounded-2xl p-6 space-y-4">
        {error && <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] rounded-xl px-4 py-3">{error}</div>}
        {success && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[14px] rounded-xl px-4 py-3 flex items-center gap-2">
            <Check className="w-4 h-4" /> رمز عبور با موفقیت تغییر کرد.
          </div>
        )}
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-[#0F172A]">رمز عبور فعلی</label>
          <Input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-[#0F172A]">رمز عبور جدید</label>
          <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[14px] font-semibold text-[#0F172A]">تکرار رمز عبور جدید</label>
          <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "ذخیره رمز جدید"}
        </Button>
      </form>
    </div>
  );
}
