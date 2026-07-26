import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ارسال درخواست به روت جدیدی که در سرور ساختیم
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "رمز عبور اشتباه است یا مشکلی پیش آمده.");
        setLoading(false);
        return;
      }

      // ۱. ذخیره توکن ادمین در مرورگر
      localStorage.setItem("token", data.token);

      // ۲. ساخت یک کاربر مجازی در فرانت‌اند تا بقیه کامپوننت‌ها بفهمند ادمین لاگین کرده
      const adminUser = {
        id: "fixed-admin",
        role: "Admin",
        fullName: "مدیر سامانه",
      };
      localStorage.setItem("user", JSON.stringify(adminUser));

      // ۳. انتقال مستقیم به داشبورد مدیریت
      // نکته: اگر مسیر داشبورد شما چیز دیگری است (مثلا /admin/dashboard) آن را اینجا تغییر دهید
      navigate("/admin"); 
      
      // اگر فرانت‌اند شما از Context خاصی برای لاگین استفاده می‌کند، 
      // رفرش کردن صفحه باعث می‌شود Context اطلاعات جدید را از LocalStorage بخواند
      window.location.reload(); 

    } catch (err) {
      setError("خطا در ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center", fontFamily: "Tahoma, sans-serif" }}>
      <h2>ورود به پنل مدیریت</h2>
      
      {error && (
        <div style={{ backgroundColor: "#ffcccc", color: "#cc0000", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="password"
          placeholder="رمز عبور مدیر را وارد کنید..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center" }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: "10px", 
            fontSize: "16px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: loading ? "not-allowed" : "pointer" 
          }}
        >
          {loading ? "در حال بررسی..." : "ورود"}
        </button>
      </form>
    </div>
  );
}