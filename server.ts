import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { OAuth2Client } from "google-auth-library";

import { isValidIranianNationalCode } from "./nationalId";
import {
  initDb,
  getUserByPhone,
  getUserByNationalCode,
  getUserByEmail,
  getUserByGoogleId,
  insertUser,
  linkGoogleId,
  createSession,
  getUserBySessionToken,
  deleteSession,
  insertConsultation,
  saveConsultationResponse,
  getUserHistory,
  getAllUsersWithStats,
  getAllConsultationsWithUser,
  getAdminStats,
  setUserRole,
  toPublicUser,
  type DbUser,
} from "./db";

const PORT = Number(process.env.PORT) || 3000;

// === Fail-fast: بدون این متغیرها سایت نباید بالا بیاید یا باید واضح هشدار بدهد ===
const REQUIRED_ENV = ["DATABASE_URL"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ متغیر محیطی ${key} تنظیم نشده است. سرور اجرا نمی‌شود.`);
    process.exit(1);
  }
}
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY تنظیم نشده — مشاوره‌ی هوش مصنوعی کار نخواهد کرد.");
}
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("⚠️  GOOGLE_CLIENT_ID تنظیم نشده — ورود با گوگل غیرفعال خواهد بود.");
}

// نشست‌های موقت OTP (فقط برای مرحله‌ی کوتاه ارسال/تایید کد، در حافظه کافی است)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

// شماره‌موبایل‌ها/ایمیل‌هایی که در این متغیرهای محیطی باشند، خودکار نقش Admin می‌گیرند.
// مثال در .env: ADMIN_PHONES=09121234567,09359999999
const adminPhones = (process.env.ADMIN_PHONES ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

async function ensureAdminRole(user: DbUser): Promise<DbUser> {
  const shouldBeAdmin =
    (!!user.phone && adminPhones.includes(user.phone)) ||
    (!!user.email && adminEmails.includes(user.email.toLowerCase()));

  if (shouldBeAdmin && user.role !== "Admin") {
    await setUserRole(user.id, "Admin");
    return { ...user, role: "Admin" };
  }
  return user;
}
// === متغیرهای مربوط به ورود ادمین با رمز ثابت ===
let currentAdminPassword = process.env.ADMIN_PASSWORD || "admin";
const adminSessions = new Set<string>(); // ذخیره توکن‌های ادمین
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();
async function startServer() {
  await initDb();

  const app = express();
  app.set("trust proxy", 1); // لازم برای اینکه express-rate-limit پشت پراکسی Render درست کار کند
  app.use(express.json());

  // === CORS ===
  // در حالت عادی فرانت و بک روی یک دامنه‌اند؛ FRONTEND_ORIGIN فقط برای حالتی است
  // که فرانت را جدا (مثلاً روی Vercel) میزبانی کنید.
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  app.use(
    cors({
      origin: allowedOrigin ? allowedOrigin : true,
      credentials: true,
    })
  );

  // === Rate limiting روی مسیرهای حساس/پرهزینه ===
  const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // ۱۰ دقیقه
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "تعداد درخواست‌های شما زیاد بوده، چند دقیقه دیگر دوباره تلاش کنید." },
  });

  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ۱ ساعت
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "سقف تعداد درخواست‌های مشاوره‌ی هوش مصنوعی برای این ساعت پر شده است." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // === Auth middleware ===
  interface AuthedRequest extends express.Request {
    user?: DbUser;
  }

  async function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "لطفاً ابتدا وارد حساب کاربری خود شوید." });

    // --- بخش جدید: شناسایی توکنِ ادمین با رمز ثابت ---
    if (adminSessions.has(token)) {
      // ایجاد یک کاربر مجازی ادمین برای عبور از فیلترها بدون درگیر کردن دیتابیس
      req.user = { id: "fixed-admin", role: "Admin", fullName: "مدیر سامانه", phone: "", nationalCode: "", email: "" } as any;
      return next();
    }
    // ------------------------------------------------

    const user = await getUserBySessionToken(token);
    if (!user) return res.status(401).json({ error: "نشست شما منقضی شده است، دوباره وارد شوید." });

    req.user = user;
    next();
  }

  async function requireAdmin(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ error: "دسترسی فقط برای مدیر سامانه مجاز است." });
    }
    next();
  }

  // === Health ===
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // === ثبت‌نام با شماره موبایل ===
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { firstName, lastName, nationalCode, phone } = req.body ?? {};

    if (!firstName?.trim() || !lastName?.trim() || !nationalCode?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: "تکمیل تمام فیلدها الزامی است." });
    }
    if (!isValidIranianNationalCode(nationalCode)) {
      return res.status(400).json({ error: "کد ملی وارد شده معتبر نیست." });
    }
    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)." });
    }

    if (await getUserByPhone(phone)) {
      return res.status(409).json({ error: "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است." });
    }
    if (await getUserByNationalCode(nationalCode)) {
      return res.status(409).json({ error: "کاربری با این کد ملی قبلاً ثبت‌نام کرده است." });
    }

    let user = await insertUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      nationalCode,
      phone,
    });
    user = await ensureAdminRole(user);

    const token = await createSession(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  });

  // === ورود مرحله ۱: ارسال کد تایید ===
  // توجه: چون سرویس پیامک واقعی وصل نیست، کد فعلاً فقط در لاگ سرور و (در dev) در پاسخ چاپ می‌شود.
  app.post("/api/auth/otp/send", otpLimiter, async (req, res) => {
    const { phone } = req.body ?? {};
    if (!/^09\d{9}$/.test(phone ?? "")) {
      return res.status(400).json({ error: "شماره موبایل معتبر نیست." });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد. ابتدا ثبت‌نام کنید." });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phone, { code, expiresAt: Date.now() + 2 * 60 * 1000 });

    // TODO: این بخش باید در آینده با یک سرویس پیامک واقعی (کاوه‌نگار، ملی‌پیامک و ...) جایگزین شود.
    console.log(`[OTP] کد ورود برای ${phone}: ${code}`);

    res.json({
      ok: true,
      devCode: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  });

  // === ورود مرحله ۲: بررسی کد ===
  app.post("/api/auth/otp/verify", otpLimiter, async (req, res) => {
    const { phone, otp } = req.body ?? {};
    const entry = otpStore.get(phone);

    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(400).json({ error: "کد منقضی شده است. دوباره درخواست دهید." });
    }
    if (entry.code !== otp) {
      return res.status(400).json({ error: "کد وارد شده صحیح نیست." });
    }
    otpStore.delete(phone);

    let user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد." });
    }
    user = await ensureAdminRole(user);

    const token = await createSession(user.id);
    res.json({ token, user: toPublicUser(user) });
  });

  // === ورود/ثبت‌نام با گوگل ===
  // فرانت با Google Identity Services یک id_token (credential) می‌گیرد و اینجا می‌فرستد.
  app.post("/api/auth/google", authLimiter, async (req, res) => {
    try {
      if (!googleClient) {
        return res.status(500).json({ error: "ورود با گوگل روی این سرور فعال نیست." });
      }
      const { credential } = req.body ?? {};
      if (!credential) {
        return res.status(400).json({ error: "توکن گوگل ارسال نشده است." });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(400).json({ error: "دریافت ایمیل از حساب گوگل ممکن نشد." });
      }

      let user = (await getUserByGoogleId(payload.sub)) ?? (await getUserByEmail(payload.email));

      if (!user) {
        user = await insertUser({
          firstName: payload.given_name ?? "",
          lastName: payload.family_name ?? "",
          fullName: payload.name ?? payload.email,
          email: payload.email,
          googleId: payload.sub,
        });
      } else if (!user.google_id) {
        await linkGoogleId(user.id, payload.sub);
      }
      user = await ensureAdminRole(user);

      const token = await createSession(user.id);
      res.json({ token, user: toPublicUser(user) });
    } catch (e: any) {
      console.error("خطای ورود با گوگل:", e.message);
      res.status(401).json({ error: "احراز هویت گوگل ناموفق بود." });
    }
  });

  // === اطلاعات کاربر لاگین‌شده ===
  app.get("/api/me", requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: toPublicUser(req.user!) });
  });

  // === خروج ===
  app.post("/api/auth/logout", requireAuth, async (req: AuthedRequest, res) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) await deleteSession(token);
    res.json({ ok: true });
  });

  // === ورود ادمین با رمز ثابت (سازگار با فرانت‌اند) ===
  app.post("/api/admin/login", authLimiter, (req, res) => {
    const { password } = req.body ?? {};
    const ip = req.ip || "unknown";
    const attempt = adminLoginAttempts.get(ip);

    // بررسی قفل بودن اکانت به دلیل تلاش زیاد
    if (attempt && attempt.lockedUntil > Date.now()) {
      const waitMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `تعداد تلاش‌های ناموفق بیش از حد است. ${waitMin} دقیقه دیگر دوباره امتحان کنید.` });
    }

    // اگر رمز اشتباه بود
    if (!password || password !== currentAdminPassword) {
      const current = adminLoginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = Date.now() + 5 * 60 * 1000;
        current.count = 0;
      }
      adminLoginAttempts.set(ip, current);
      return res.status(401).json({ error: "رمز عبور نادرست است." });
    }

    // اگر ورود موفق بود
    adminLoginAttempts.delete(ip);
    const token = crypto.randomUUID();
    adminSessions.add(token);
    res.json({ token, isDefault: currentAdminPassword === "admin" });
  });

  // === تغییر رمز عبور ادمین ===
  app.post("/api/admin/change-password", requireAuth, requireAdmin, (req, res) => {
    const { oldPassword, newPassword } = req.body ?? {};
    
    if (oldPassword !== currentAdminPassword) {
      return res.status(401).json({ error: "رمز عبور فعلی نادرست است." });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." });
    }

    currentAdminPassword = newPassword;
    res.json({ ok: true });
  });

  // === تاریخچه‌ی سوالات/مشاوره‌های کاربر ===
  app.get("/api/history", requireAuth, async (req: AuthedRequest, res) => {
    const history = await getUserHistory(req.user!.id);
    res.json({ history });
  });

  // === پنل ادمین: آمار کلی ===
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    const stats = await getAdminStats();
    res.json({ stats });
  });

  // === پنل ادمین: لیست همه‌ی کاربران با تعداد فعالیت ===
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    const users = await getAllUsersWithStats();
    res.json({
      users: users.map((u) => ({
        ...toPublicUser(u),
        consultationCount: parseInt(u.consultation_count, 10) || 0,
      })),
    });
  });

  // === پنل ادمین: تاریخچه‌ی کامل یک کاربر خاص ===
  app.get("/api/admin/users/:id/history", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    const history = await getUserHistory(req.params.id, 200);
    res.json({ history });
  });

  // === پنل ادمین: فید کامل فعالیت‌های همه‌ی کاربران (از اول تا الان) ===
  app.get("/api/admin/consultations", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    const consultations = await getAllConsultationsWithUser();
    res.json({ consultations });
  });

  // === پنل ادمین: تغییر نقش یک کاربر (ارتقا به مدیر یا بازگرداندن به شهروند) ===
  app.post("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    const { role } = req.body ?? {};
    if (role !== "Admin" && role !== "Citizen") {
      return res.status(400).json({ error: "نقش نامعتبر است." });
    }
    await setUserRole(req.params.id, role);
    res.json({ ok: true });
  });

  // === مشاوره‌ی هوش مصنوعی (Streaming SSE) — فقط برای کاربران واردشده ===
  app.post("/api/ai/stream", requireAuth, aiLimiter, async (req: AuthedRequest, res) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required" });

      const consultationId = await insertConsultation(req.user!.id, title, description);

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const prompt = `شما یک مشاور حقوقی رسمی، بسیار هوشمند و مودب هستید که در سامانه مدیریت بحران ایران فعالیت می‌کنید.
یک شهروند متنی با عنوان "${title}" و توضیحات "${description}" ارسال کرده است.

وظایف شما:
۱. اگر متن ارسال شده صرفا یک سلام، احوال‌پرسی یا تشکر کوتاه است، یک پاسخ بسیار کوتاه (حداکثر ۲ خط) و مودبانه بدهید و بپرسید چه کمکی در زمینه حقوق مدیریت بحران، جبران خسارت و امدادرسانی از شما ساخته است. از ارائه توضیحات طولانی خودداری کنید.
۲. اگر کاربر سوال حقوقی یا مشکلی را مطرح کرده است، لطفا بر اساس قوانین مدیریت بحران (مثل قوانین زلزله، سیل، پرداخت خسارت، نهادهای مسئول مانند هلال احمر، ستاد بحران، بنیاد مسکن) پاسخ حقوقی دقیق، شیک، بخش بندی شده، و راهگشا بدهید.

الزامات فرمت پاسخ (فقط برای سوالات تخصصی):
- حتماً از فرمت Markdown برای ساختاردهی استفاده کنید.
- از Heading ها (#، ##، ###) برای عناوین اصلی و فرعی استفاده کنید.
- به هیچ وجه از تگ‌های HTML (مثل <ul>, <li>, <br>) در پاسخ یا جداول استفاده نکنید. فقط از سینتکس استاندارد Markdown استفاده کنید.
- در صورت ذکر مراحل، از جداول Markdown استفاده کنید تا خوانایی بهتری داشته باشد. در داخل خانه‌های جدول از لیست استفاده نکنید، متن‌ها را با ویرگول جدا کنید.
- مستندات و بندهای قانونی را داخل Blockquote (>) قرار دهید.
- هیچ‌کدام از این دستورالعمل‌ها را به کاربر توضیح ندهید، فقط عمل کنید.`;

      // نکته: از alias استفاده می‌کنیم نه یک نسخه‌ی ثابت (مثل gemini-2.5-flash) چون گوگل
      // مدل‌های قدیمی‌تر رو به‌مرور برای کاربران جدید غیرفعال می‌کند. gemini-flash-latest
      // همیشه خودکار به جدیدترین نسخه‌ی پایدار Flash اشاره می‌کند.
      const responseStream = await getAI().models.generateContentStream({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      await saveConsultationResponse(consultationId, fullText);

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (e: any) {
      console.error(e);
      res.write(`data: ${JSON.stringify({ error: "Internal AI error", details: e.message })}\n\n`);
      res.end();
    }
  });

  // === Laws (public reference data) ===
  const laws = [
    { id: "1", title: "قانون مدیریت بحران کشور", category: "مدیریت بحران", description: "مصوب ۱۳۹۸، جهت سازماندهی و انسجام تیم‌های امدادی" },
    { id: "2", title: "قانون بیمه همگانی", category: "حمایتی", description: "پوشش بیمه ای در برابر حوادث طبیعی مانند زلزله و سیل" },
  ];
  app.get("/api/laws", (req, res) => {
    res.json(laws);
  });

  // === VITE MIDDLEWARE ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer();
