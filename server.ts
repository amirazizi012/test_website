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
  insertUser,
  getAllUsers,
  countUsers,
  createSession,
  createAdminSession,
  isValidAdminSession,
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
  type StoredUser,
  type CrisisLawEntry,
} from "./db";

const PORT = 3000;

// کد تایید هر شماره موبایل: phone -> { code, expiresAt } — کوتاه‌مدت است، در حافظه کافیست
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// جلوگیری ساده از حدس‌زدن رمز مدیر: بعد از ۵ تلاش ناموفق، ۵ دقیقه قفل
const adminLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token || !(await isValidAdminSession(token))) {
      return res.status(401).json({ error: "دسترسی غیرمجاز. لطفاً وارد پنل مدیریت شوید." });
    }
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطای داخلی سرور." });
  }
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

// ⚠️ فهرست شروع (starter) قوانین. عناوین واقعی‌اند، اما شرح‌ها خلاصه و کلی‌اند
// و شماره‌ی ماده/تبصره‌ی دقیق ندارند. پیش از تکیه‌ی واقعی شهروندان در شرایط
// بحران/جنگ، این فهرست باید توسط یک وکیل یا کارشناس حقوقی بازبینی و تکمیل شود.
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

  // Render (مثل هر PaaS دیگه) اپ شما را پشت یک reverse proxy اجرا می‌کند.
  app.set("trust proxy", 1);

  app.use(express.json());

  // === API ROUTES ===

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ==================== احراز هویت شهروندان — بدون هیچ تغییری در منطق ====================

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

      await insertUser(user);
      const token = await createSession(user.id);

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

      res.json({
        ok: true,
        devCode: process.env.NODE_ENV !== "production" ? code : undefined,
      });
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
      if (!user) {
        return res.status(404).json({ error: "کاربری با این شماره موبایل یافت نشد." });
      }

      const token = await createSession(user.id);
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
      if (!password) {
        return res.status(400).json({ error: "رمز عبور الزامی است." });
      }

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
      const token = await createAdminSession();
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
      const newLaw: CrisisLawEntry = {
        id: crypto.randomUUID(),
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
      };
      await insertLaw(newLaw);
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
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "خطای داخلی سرور." });
    }
  });

  // ==================== مشاور هوشمند (Streaming SSE) ====================

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

      // ذخیره‌ی دائمی پرسش و پاسخ در دیتابیس (دیگر با ری‌استارت سرور پاک نمی‌شود)
      const qId = crypto.randomUUID();
      await insertQuestion({ id: qId, title, description });
      await insertResponse({ id: crypto.randomUUID(), questionId: qId, content: fullText });

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

startServer().catch((e) => {
  console.error("خطا در راه‌اندازی سرور:", e);
  process.exit(1);
});
