import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

import {
  initDb,
  findUserByPhone,
  findUserByNationalCode,
  findUserByEmailOrGoogleId,
  findUserById,
  insertUser,
  linkGoogleToUser,
  updateLastLogin,
  getAllUsers,
  countUsers,
  setUserStatus,
  hashPassword,
  verifyPassword,
  getAdminConfig,
  updateAdminConfig,
  getAllLaws,
  seedLawsIfEmpty,
  insertLaw,
  updateLaw,
  deleteLaw,
  countLaws,
  insertQuestion,
  insertResponse,
  countQuestions,
  logActivity,
  getRecentActivity,
  type CrisisLawEntry,
} from "./db";

import {
  createCitizenSession,
  getCitizenSessionUserId,
  createAdminSession,
  isAdminSessionValid,
} from "./redis";

import {
  issueCitizenToken,
  verifyCitizenToken,
  issueAdminToken,
  verifyAdminToken,
  verifyGoogleIdToken,
} from "./server-auth";

const PORT = 3000;

// کد تایید هر شماره موبایل: phone -> { code, expiresAt } — کوتاه‌مدت است، در حافظه کافی است
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// جلوگیری ساده از حدس‌زدن رمز مدیر: بعد از ۵ تلاش ناموفق، ۵ دقیقه قفل
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

// ==================== Middlewares ====================

async function authenticateCitizen(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "برای استفاده از مشاور هوشمند ابتدا باید ثبت‌نام یا وارد حساب کاربری خود شوید." });
    }

    const payload = verifyCitizenToken(token);
    if (!payload) {
      return res.status(401).json({ error: "نشست شما نامعتبر یا منقضی شده است. دوباره وارد شوید." });
    }

    const sessionUserId = await getCitizenSessionUserId(payload.jti);
    if (!sessionUserId || sessionUserId !== payload.sub) {
      return res.status(401).json({ error: "نشست شما منقضی شده است. دوباره وارد شوید." });
    }

    const user = await findUserById(payload.sub);
    if (!user || user.status !== "active") {
      return res.status(403).json({ error: "حساب کاربری شما غیرفعال یا حذف شده است." });
    }

    (req as any).userId = user.id;
    (req as any).currentUser = user;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطای داخلی سرور." });
  }
}

async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "دسترسی غیرمجاز. لطفاً وارد پنل مدیریت شوید." });

    const payload = verifyAdminToken(token);
    if (!payload) return res.status(401).json({ error: "نشست شما نامعتبر یا منقضی شده است." });

    const valid = await isAdminSessionValid(payload.jti);
    if (!valid) return res.status(401).json({ error: "نشست شما منقضی شده است. دوباره وارد شوید." });

    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطای داخلی سرور." });
  }
}

// ⚠️ فهرست شروع (starter) قوانین. عناوین واقعی‌اند، اما شرح‌ها خلاصه و کلی‌اند.
// پیش از تکیه‌ی واقعی شهروندان در شرایط بحران/جنگ، باید توسط یک وکیل بازبینی شود.
const DEFAULT_LAWS: CrisisLawEntry[] = [
  { id: "1", title: "قانون مدیریت بحران کشور", category: "مدیریت بحران", description: "چارچوب سازماندهی، فرماندهی واحد و هماهنگی دستگاه‌های اجرایی و امدادی کشور پیش، حین و پس از بحران‌های طبیعی و غیرطبیعی از جمله جنگ." },
  { id: "2", title: "قانون بیمه همگانی حوادث طبیعی", category: "حمایتی", description: "پوشش بیمه‌ای در برابر خسارات ناشی از حوادث طبیعی مانند زلزله و سیل برای اموال و مسکن شهروندان؛ نحوه‌ی مطالبه‌ی غرامت از صندوق بیمه." },
  { id: "3", title: "آیین‌نامه کمک‌های بلاعوض بازسازی مسکن", category: "مسکن", description: "شرایط دریافت وام قرض‌الحسنه و کمک بلاعوض از بنیاد مسکن انقلاب اسلامی برای بازسازی یا نوسازی منازل مسکونی آسیب‌دیده در اثر جنگ یا بلایای طبیعی." },
  { id: "4", title: "قانون مسئولیت مدنی", category: "مسئولیت مدنی", description: "اصول کلی جبران خسارت وارده به اشخاص یا اموال آن‌ها در نتیجه‌ی فعل یا ترک فعل دیگری، از جمله در مواردی که یک نهاد دولتی مسبب شناخته شود." },
  { id: "5", title: "قانون کار در شرایط اضطراری و تعطیلی اجباری", category: "کار و اشتغال", description: "حقوق کارگران و کارفرمایان هنگام تعطیلی اجباری کسب‌وکار به دلیل جنگ یا بحران، از جمله پرداخت حقوق ایام تعطیلی و بیمه بیکاری." },
  { id: "6", title: "دستورالعمل کمک‌رسانی هلال‌احمر و اورژانس", category: "امداد و نجات", description: "نحوه‌ی درخواست کمک فوری پزشکی، تخلیه‌ی اضطراری و اسکان موقت آسیب‌دیدگان جنگ و بلایای طبیعی." },
  { id: "7", title: "قانون حمایت از خانواده شهدا، جانبازان و ایثارگران", category: "حمایتی", description: "مزایا و خدمات حمایتی (درمانی، مسکن، اشتغال) قابل ارائه به خانواده‌های آسیب‌دیده از جنگ از طریق بنیاد شهید و امور ایثارگران." },
  { id: "8", title: "قانون بیمه اجتماعی رانندگان و بیمه شخص ثالث", category: "بیمه", description: "پوشش خسارات جانی و مالی ناشی از حوادث رانندگی در شرایط بحرانی، و نحوه‌ی مطالبه از شرکت بیمه یا صندوق تأمین خسارات بدنی." },
  { id: "9", title: "قانون تسهیلات اعطایی بانک‌ها به آسیب‌دیدگان بحران", category: "بانکی", description: "شرایط تنفس بازپرداخت اقساط، تسهیلات ارزان‌قیمت و بخشودگی جرائم دیرکرد برای وام‌گیرندگانی که در جنگ یا بلایای طبیعی آسیب دیده‌اند." },
  { id: "10", title: "قانون حمایت از کسب‌وکارهای آسیب‌دیده از بحران", category: "کسب‌وکار", description: "معافیت‌های مالیاتی موقت، تسهیلات بازسازی و مشوق‌های بیمه‌ای برای اصناف و کسب‌وکارهای کوچکی که در اثر جنگ یا بحران دچار خسارت شده‌اند." },
  { id: "11", title: "قانون خدمات درمانی رایگان در مناطق جنگی", category: "بهداشت و درمان", description: "الزام بیمارستان‌های دولتی و خصوصی به ارائه‌ی خدمات درمانی اضطراری رایگان یا با تعرفه‌ی کاهش‌یافته به آسیب‌دیدگان مناطق بحران‌زده." },
  { id: "12", title: "آیین‌نامه حمایت از کودکان بی‌سرپرست ناشی از بحران", category: "حقوق کودک", description: "روند سرپرستی موقت، ثبت هویت و دسترسی به آموزش رایگان برای کودکانی که در جنگ یا بلایای طبیعی سرپرست خود را از دست داده‌اند." },
  { id: "13", title: "قانون حمایت از سالمندان و معلولان در شرایط بحرانی", category: "حمایتی", description: "اولویت‌بندی در تخلیه‌ی اضطراری، اسکان موقت و دریافت خدمات پزشکی برای سالمندان و افراد دارای معلولیت." },
  { id: "14", title: "قانون معافیت مالیاتی اموال آسیب‌دیده از جنگ", category: "مالیات", description: "معافیت یا تخفیف مالیات بر اموال و املاکی که در اثر جنگ یا بلایای طبیعی تخریب یا نیمه‌تخریب شده‌اند." },
  { id: "15", title: "آیین‌نامه اسکان اضطراری و مدیریت کمپ‌های موقت", category: "امداد و نجات", description: "استانداردهای حداقلی برای اسکان موقت آسیب‌دیدگان جنگ، شامل امکانات بهداشتی، غذایی و ایمنی در کمپ‌های اضطراری." },
  { id: "16", title: "قانون حفاظت از اماکن آموزشی در شرایط جنگی", category: "آموزش", description: "الزامات ایمن‌سازی مدارس، جابه‌جایی موقت کلاس‌ها و ادامه‌ی روند تحصیل دانش‌آموزان در مناطق درگیر بحران." },
  { id: "17", title: "قانون نقل و انتقال و ترافیک در شرایط اضطراری", category: "حمل و نقل", description: "اختیارات ستاد بحران برای محدودسازی موقت تردد، اولویت‌دهی به خودروهای امدادی و مدیریت مسیرهای تخلیه‌ی اضطراری." },
  { id: "18", title: "قانون اطلاع‌رسانی و رسانه در شرایط بحران", category: "رسانه", description: "الزام رسانه‌های رسمی به اطلاع‌رسانی شفاف و به‌موقع درباره‌ی وضعیت بحران، و ممنوعیت انتشار اخبار نادرست که موجب هراس عمومی شود." },
  { id: "19", title: "قانون خدمت وظیفه عمومی در شرایط جنگی", category: "نظامی", description: "مقررات مربوط به فراخوان نیروهای ذخیره، معافیت‌های موقت خدمت و حقوق خانواده‌های افرادی که به خدمت اعزام می‌شوند." },
  { id: "20", title: "قانون حمایت از آسیب‌دیدگان محیط‌زیستی ناشی از بحران", category: "محیط زیست", description: "جبران خسارات زیست‌محیطی (مانند آلودگی آب و خاک) ناشی از حملات یا حوادث بحرانی، و الزام دستگاه‌های مسئول به پاک‌سازی و بازتوانی محیط." },
];

async function startServer() {
  await initDb();
  await seedLawsIfEmpty(DEFAULT_LAWS);

  const app = express();

  // Render اپ شما را پشت یک reverse proxy اجرا می‌کند.
  app.set("trust proxy", 1);
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // ==================== احراز هویت شهروندان با شماره موبایل (OTP) ====================

  app.post("/api/auth/register", async (req, res) => {
    try {
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
      if (await findUserByPhone(phone)) {
        return res.status(409).json({ error: "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است." });
      }
      if (await findUserByNationalCode(nationalCode)) {
        return res.status(409).json({ error: "کاربری با این کد ملی قبلاً ثبت‌نام کرده است." });
      }

      const user = await insertUser({
        id: crypto.randomUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        nationalCode,
        phone,
        role: "Citizen",
        status: "active",
      });

      const jti = crypto.randomUUID();
      const token = issueCitizenToken(user.id, jti);
      await createCitizenSession(jti, user.id);
      await updateLastLogin(user.id);
      await logActivity({ userId: user.id, userLabel: user.fullName, action: "register", detail: phone, ip: req.ip });

      res.status(201).json({ token, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.post("/api/auth/otp/send", async (req, res) => {
    try {
      const { phone } = req.body ?? {};
      if (!/^09\d{9}$/.test(phone ?? "")) {
        return res.status(400).json({ error: "شماره موبایل معتبر نیست." });
      }
      const user = await findUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد. ابتدا ثبت‌نام کنید." });
      }

      const code = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(phone, { code, expiresAt: Date.now() + 2 * 60 * 1000 });

      // TODO: این بخش باید در نسخه واقعی با یک سرویس پیامک (کاوه‌نگار، ملی‌پیامک و ...) جایگزین شود.
      console.log(`[OTP] کد ورود برای ${phone}: ${code}`);

      res.json({ ok: true, devCode: process.env.NODE_ENV !== "production" ? code : undefined });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { phone, otp } = req.body ?? {};
      const entry = otpStore.get(phone);

      if (!entry || entry.expiresAt < Date.now()) {
        return res.status(400).json({ error: "کد منقضی شده است. دوباره درخواست دهید." });
      }
      if (entry.code !== otp) {
        return res.status(400).json({ error: "کد وارد شده صحیح نیست." });
      }
      otpStore.delete(phone);

      const user = await findUserByPhone(phone);
      if (!user) return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد." });
      if (user.status !== "active") return res.status(403).json({ error: "حساب کاربری شما غیرفعال شده است." });

      const jti = crypto.randomUUID();
      const token = issueCitizenToken(user.id, jti);
      await createCitizenSession(jti, user.id);
      await updateLastLogin(user.id);
      await logActivity({ userId: user.id, userLabel: user.fullName, action: "login_otp", detail: phone, ip: req.ip });

      res.json({ token, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  // ==================== احراز هویت با گوگل ====================

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body ?? {};
      if (!credential) return res.status(400).json({ error: "توکن گوگل ارسال نشده است." });

      let payload;
      try {
        payload = await verifyGoogleIdToken(credential);
      } catch (e) {
        console.error("خطا در تایید گوگل:", e);
        return res.status(401).json({ error: "تایید هویت گوگل ناموفق بود." });
      }
      if (!payload?.email) return res.status(400).json({ error: "ایمیل در پاسخ گوگل یافت نشد." });
      if (payload.email_verified === false) return res.status(400).json({ error: "ایمیل گوگل شما تایید نشده است." });

      let user = await findUserByEmailOrGoogleId(payload.email, payload.sub!);
      let isNew = false;
      if (!user) {
        user = await insertUser({
          id: crypto.randomUUID(),
          firstName: payload.given_name ?? null,
          lastName: payload.family_name ?? null,
          fullName: payload.name ?? payload.email,
          email: payload.email,
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null,
          role: "Citizen",
          status: "active",
        });
        isNew = true;
      } else if (!user.googleId) {
        await linkGoogleToUser(user.id, payload.sub!, payload.picture ?? null);
      }

      if (user.status !== "active") {
        return res.status(403).json({ error: "حساب کاربری شما غیرفعال شده است." });
      }

      const jti = crypto.randomUUID();
      const token = issueCitizenToken(user.id, jti);
      await createCitizenSession(jti, user.id);
      await updateLastLogin(user.id);
      await logActivity({
        userId: user.id,
        userLabel: user.fullName,
        action: isNew ? "register_google" : "login_google",
        detail: user.email ?? undefined,
        ip: req.ip,
      });

      res.json({ token, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  // ==================== پنل مدیریت — ورود فقط با یک رمز عبور ====================

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body ?? {};
      const ip = req.ip || "unknown";
      const attempt = adminLoginAttempts.get(ip);

      if (attempt && attempt.lockedUntil > Date.now()) {
        const waitMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
        return res.status(429).json({ error: `تعداد تلاش‌های ناموفق بیش از حد است. ${waitMin} دقیقه دیگر دوباره امتحان کنید.` });
      }
      if (!password) return res.status(400).json({ error: "رمز عبور الزامی است." });

      const config = await getAdminConfig();
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

      const jti = crypto.randomUUID();
      const token = issueAdminToken(jti);
      await createAdminSession(jti);
      await logActivity({ action: "admin_login", ip: req.ip });

      res.json({ token, isDefault: config.isDefault });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.post("/api/admin/change-password", authenticateAdmin, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body ?? {};
      const config = await getAdminConfig();

      if (!verifyPassword(oldPassword ?? "", config.passwordHash)) {
        return res.status(401).json({ error: "رمز عبور فعلی نادرست است." });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." });
      }

      await updateAdminConfig(hashPassword(newPassword), false);
      await logActivity({ action: "admin_change_password", ip: req.ip });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
    try {
      res.json({
        usersCount: await countUsers(),
        questionsCount: await countQuestions(),
        lawsCount: await countLaws(),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
    try {
      res.json(await getAllUsers());
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.patch("/api/admin/users/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body ?? {};
      if (status !== "active" && status !== "suspended") {
        return res.status(400).json({ error: "وضعیت نامعتبر است." });
      }
      const updated = await setUserStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: "کاربر یافت نشد." });
      await logActivity({ userId: updated.id, userLabel: updated.fullName, action: "admin_set_user_status", detail: status, ip: req.ip });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.get("/api/admin/activity", authenticateAdmin, async (req, res) => {
    try {
      res.json(await getRecentActivity(200));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.get("/api/admin/laws", authenticateAdmin, async (req, res) => {
    try {
      res.json(await getAllLaws());
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.post("/api/admin/laws", authenticateAdmin, async (req, res) => {
    try {
      const { title, category, description } = req.body ?? {};
      if (!title?.trim() || !category?.trim() || !description?.trim()) {
        return res.status(400).json({ error: "تکمیل تمام فیلدها الزامی است." });
      }
      const newLaw: CrisisLawEntry = { id: crypto.randomUUID(), title: title.trim(), category: category.trim(), description: description.trim() };
      await insertLaw(newLaw);
      await logActivity({ action: "law_added", detail: newLaw.title, ip: req.ip });
      res.status(201).json(newLaw);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.put("/api/admin/laws/:id", authenticateAdmin, async (req, res) => {
    try {
      const { title, category, description } = req.body ?? {};
      const updated = await updateLaw(req.params.id, { title, category, description });
      if (!updated) return res.status(404).json({ error: "قانون یافت نشد." });
      await logActivity({ action: "law_updated", detail: updated.title, ip: req.ip });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  app.delete("/api/admin/laws/:id", authenticateAdmin, async (req, res) => {
    try {
      const ok = await deleteLaw(req.params.id);
      if (!ok) return res.status(404).json({ error: "قانون یافت نشد." });
      await logActivity({ action: "law_deleted", detail: req.params.id, ip: req.ip });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  // ==================== مشاور هوشمند — فقط برای کاربران ثبت‌نام‌شده ====================

  app.post("/api/ai/stream", authenticateCitizen, async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required" });
      const userId = (req as any).userId as string;

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

      const qId = crypto.randomUUID();
      await insertQuestion({ id: qId, userId, title, description });
      await insertResponse({ id: crypto.randomUUID(), questionId: qId, content: fullText });
      await logActivity({ userId, action: "chat_question", detail: title, ip: req.ip });

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (e: any) {
      console.error(e);
      res.write(`data: ${JSON.stringify({ error: "Internal AI error", details: e.message })}\n\n`);
      res.end();
    }
  });

  // Laws API (عمومی)
  app.get("/api/laws", async (req, res) => {
    try {
      res.json(await getAllLaws());
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  // === VITE MIDDLEWARE ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("خطا در راه‌اندازی سرور:", e);
  process.exit(1);
});
