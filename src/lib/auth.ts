import type { User } from "../types";

const TOKEN_KEY = "crisislaw_token";
const USER_KEY = "crisislaw_user";

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export async function logout() {
  const token = getToken();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // اگر درخواست خروج به سرور نرسید هم مهم نیست، سشن محلی همین الان پاک شده
    }
  }
}

/**
 * ورود/ثبت‌نام با گوگل: credential همان id_token است که Google Identity Services
 * بعد از کلیک روی دکمه‌ی «ورود با گوگل» در اختیار می‌گذارد.
 */
export async function loginWithGoogle(credential: string): Promise<{ token: string; user: User }> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "ورود با گوگل ناموفق بود.");
  }
  saveSession(data.token, data.user);
  return data;
}

/**
 * fetch با اضافه‌شدن خودکار Authorization header — برای همه‌ی درخواست‌های محافظت‌شده
 * (مثل /api/ai/stream و /api/history) به‌جای fetch معمولی از این استفاده کنید.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
