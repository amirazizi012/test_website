import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

// === Real user persistence (JSON file) ===
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  role: "Citizen";
  createdAt: string;
}

function loadUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) {
    console.error("خطا در خواندن users.json:", e);
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// کد تایید هر شماره موبایل: phone -> { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// نشست‌های فعال شهروندان: token -> userId
const sessions = new Map<string, string>();

// === پنل مدیریت (کاملاً مجزا از سیستم OTP شهروندان) ===
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const LAWS_FILE = path.join(DATA_DIR, "laws.json");

interface AdminConfig {
  passwordHash: string;
  isDefault: boolean;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored ?? "").split(":");
  if (!salt || !hash) return false;
  const hashVerify = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(hashVerify, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function loadAdminConfig(): AdminConfig {
  try {
    if (!fs.existsSync(ADMIN_FILE)) {
      const config: AdminConfig = { passwordHash: hashPassword("admin"), isDefault: true };
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(ADMIN_FILE, JSON.stringify(config, null, 2), "utf-8");
      return config;
    }
    return JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
  } catch (e) {
    console.error("خطا در خواندن admin.json:", e);
    return { passwordHash: hashPassword("admin"), isDefault: true };
  }
}

function saveAdminConfig(config: AdminConfig) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(config, null, 2), "utf-8");
}

interface CrisisLawEntry {
  id: string;
  title: string;
  category: string;
  description: string;
}

function loadLaws(): CrisisLawEntry[] {
  try {
    if (!fs.existsSync(LAWS_FILE)) {
      const defaults: CrisisLawEntry[] = [
        { id: "1", title: "قانون مدیریت بحران کشور", category: "مدیریت بحران", description: "مصوب ۱۳۹۸، جهت سازماندهی و انسجام تیم‌های امدادی" },
        { id: "2", title: "قانون بیمه همگانی", category: "حمایتی", description: "پوشش بیمه ای در برابر حوادث طبیعی مانند زلزله و سیل" },
      ];
      saveLaws(defaults);
      return defaults;
    }
    return JSON.parse(fs.readFileSync(LAWS_FILE, "utf-8"));
  } catch (e) {
    console.error("خطا در خواندن laws.json:", e);
    return [];
  }
}

function saveLaws(laws: CrisisLawEntry[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LAWS_FILE, JSON.stringify(laws, null, 2), "utf-8");
}

// نشست‌های پنل مدیریت — کاملاً جدا از sessions شهروندان
const adminSessions = new Map<string, boolean>();

// جلوگیری ساده از حدس‌زدن رمز مدیر: بعد از ۵ تلاش ناموفق، ۵ دقیقه قفل
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: "دسترسی غیرمجاز. لطفاً وارد پنل مدیریت شوید." });
  }
  next();
}

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

async function startServer() {
  const app = express();

  // Render (مثل هر PaaS دیگه) اپ شما را پشت یک reverse proxy اجرا می‌کند.
  app.set("trust proxy", 1);

  app.use(express.json());

  // === Mock DB (فقط برای پرسش/پاسخ‌ها؛ قوانین حالا واقعی و پایدار است) ===
  const questions: any[] = [];
  const responses: any[] = [];

  // === API ROUTES ===

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // === Real Auth (شهروندان) — بدون هیچ تغییری ===

  app.post("/api/auth/register", (req, res) => {
    const { firstName, lastName, nationalCode, phone } = req.body ?? {};

    if (!firstName?.trim() || !lastName?.trim() || !nationalCode?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: "تکمیل تمام فیلدها الزامی است." });
    }
    if (!/^\d{10}$/.test(nationalCode)) {
      return res.status(400).json({ error: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    }
    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)." });
    }

    const users = loadUsers();
    if (users.some((u) => u.phone === phone)) {
      return res.status(409).json({ error: "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است." });
    }
    if (users.some((u) => u.nationalCode === nationalCode)) {
      return res.status(409).json({ error: "کاربری با این کد ملی قبلاً ثبت‌نام کرده است." });
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      nationalCode,
      phone,
      role: "Citizen",
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);

    const token = crypto.randomUUID();
    sessions.set(token, user.id);

    res.status(201).json({ token, user });
  });

  app.post("/api/auth/otp/send", (req, res) => {
    const { phone } = req.body ?? {};
    if (!/^09\d{9}$/.test(phone ?? "")) {
      return res.status(400).json({ error: "شماره موبایل معتبر نیست." });
    }

    const users = loadUsers();
    const user = users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد. ابتدا ثبت‌نام کنید." });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phone, { code, expiresAt: Date.now() + 2 * 60 * 1000 });

    // TODO: این بخش باید در نسخه واقعی با یک سرویس پیامک (کاوه‌نگار، ملی‌پیامک و ...) جایگزین شود.
    console.log(`[OTP] کد ورود برای ${phone}: ${code}`);

    res.json({
      ok: true,
      devCode: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  });

  app.post("/api/auth/otp/verify", (req, res) => {
    const { phone, otp } = req.body ?? {};
    const entry = otpStore.get(phone);

    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(400).json({ error: "کد منقضی شده است. دوباره درخواست دهید." });
    }
    if (entry.code !== otp) {
      return res.status(400).json({ error: "کد وارد شده صحیح نیست." });
    }
    otpStore.delete(phone);

    const users = loadUsers();
    const user = users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد." });
    }

    const token = crypto.randomUUID();
    sessions.set(token, user.id);
    res.json({ token, user });
  });

  // === پنل مدیریت (جدید) ===

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body ?? {};
    const ip = req.ip || "unknown";
    const attempt = adminLoginAttempts.get(ip);

    if (attempt && attempt.lockedUntil > Date.now()) {
      const waitMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `تعداد تلاش‌های ناموفق بیش از حد است. ${waitMin} دقیقه دیگر دوباره امتحان کنید.` });
    }

    if (!password) {
      return res.status(400).json({ error: "رمز عبور الزامی است." });
    }

    const config = loadAdminConfig();
    if (!verifyPassword(password, config.passwordHash)) {
      const current = adminLoginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = Date.now() + 5 * 60 * 1000;
        current.count = 0;
      }
      adminLoginAttempts.set(ip, current);
      return res.status(401).json({ error: "رمز عبور نادرست است." });
    }

    adminLoginAttempts.delete(ip);
    const token = crypto.randomUUID();
    adminSessions.set(token, true);
    res.json({ token, isDefault: config.isDefault });
  });

  app.post("/api/admin/change-password", authenticateAdmin, (req, res) => {
    const { oldPassword, newPassword } = req.body ?? {};
    const config = loadAdminConfig();

    if (!verifyPassword(oldPassword ?? "", config.passwordHash)) {
      return res.status(401).json({ error: "رمز عبور فعلی نادرست است." });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." });
    }

    saveAdminConfig({ passwordHash: hashPassword(newPassword), isDefault: false });
    res.json({ ok: true });
  });

  app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
    res.json({
      usersCount: loadUsers().length,
      questionsCount: questions.length,
      lawsCount: loadLaws().length,
    });
  });

  app.get("/api/admin/users", authenticateAdmin, (req, res) => {
    res.json(loadUsers());
  });

  app.get("/api/admin/laws", authenticateAdmin, (req, res) => {
    res.json(loadLaws());
  });

  app.post("/api/admin/laws", authenticateAdmin, (req, res) => {
    const { title, category, description } = req.body ?? {};
    if (!title?.trim() || !category?.trim() || !description?.trim()) {
      return res.status(400).json({ error: "تکمیل تمام فیلدها الزامی است." });
    }
    const laws = loadLaws();
    const newLaw: CrisisLawEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
    };
    laws.push(newLaw);
    saveLaws(laws);
    res.status(201).json(newLaw);
  });

  app.put("/api/admin/laws/:id", authenticateAdmin, (req, res) => {
    const { title, category, description } = req.body ?? {};
    const laws = loadLaws();
    const law = laws.find((l) => l.id === req.params.id);
    if (!law) return res.status(404).json({ error: "قانون یافت نشد." });
    if (title?.trim()) law.title = title.trim();
    if (category?.trim()) law.category = category.trim();
    if (description?.trim()) law.description = description.trim();
    saveLaws(laws);
    res.json(law);
  });

  app.delete("/api/admin/laws/:id", authenticateAdmin, (req, res) => {
    const laws = loadLaws();
    const filtered = laws.filter((l) => l.id !== req.params.id);
    if (filtered.length === laws.length) return res.status(404).json({ error: "قانون یافت نشد." });
    saveLaws(filtered);
    res.json({ ok: true });
  });

  // Ask AI Question (Streaming SSE)
  app.post("/api/ai/stream", async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required" });

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

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

      const qId = Date.now().toString();
      questions.push({ id: qId, title, description, createdAt: new Date().toISOString() });
      responses.push({ id: `resp_${qId}`, questionId: qId, content: fullText, createdAt: new Date().toISOString() });

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (e: any) {
      console.error(e);
      res.write(`data: ${JSON.stringify({ error: "Internal AI error", details: e.message })}\n\n`);
      res.end();
    }
  });

  // Laws API (عمومی) — حالا از فایل واقعی و قابل مدیریت می‌خواند
  app.get("/api/laws", (req, res) => {
    res.json(loadLaws());
  });

  // === VITE MIDDLEWARE ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
