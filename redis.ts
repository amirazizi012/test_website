import Redis from "ioredis";

let client: Redis | null = null;
let redisUnavailable = false;

// اگر REDIS_URL تنظیم نشده باشد یا اتصال ممکن نباشد، به‌جای خطا دادن،
// از این حافظه‌ی موقت داخل پروسه استفاده می‌کنیم (دقیقاً مثل قبل از اضافه
// شدن Redis) — یعنی سایت همیشه کار می‌کند، حتی بدون تنظیم Redis.
// تنها تفاوت: بدون Redis واقعی، با هر ری‌استارت سرور همه باید دوباره وارد شوند.
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memSet(key: string, value: string, ttlSeconds: number) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}
function memDel(key: string) {
  memoryStore.delete(key);
}

function getRedisOrNull(): Redis | null {
  if (redisUnavailable) return null;
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.warn(
        "⚠️ REDIS_URL تنظیم نشده — نشست‌ها موقتاً در حافظه‌ی سرور نگه‌داری می‌شوند (با هر ری‌استارت پاک می‌شوند). برای پایداری، یک Redis واقعی (مثلاً رایگان از Upstash) بسازید و REDIS_URL را تنظیم کنید."
      );
      redisUnavailable = true;
      return null;
    }
    client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
    client.on("error", (err) => {
      console.error("خطای اتصال به Redis — موقتاً به حافظه‌ی داخلی سوییچ می‌شود:", err.message);
      redisUnavailable = true;
    });
  }
  return client;
}

const CITIZEN_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // ۳۰ روز
const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60; // ۱۲ ساعت

// ==================== نشست شهروندان ====================

export async function createCitizenSession(jti: string, userId: string): Promise<void> {
  const r = getRedisOrNull();
  if (r) {
    try {
      await r.set(`session:citizen:${jti}`, userId, "EX", CITIZEN_SESSION_TTL_SECONDS);
      return;
    } catch (e) {
      console.error("خطا در نوشتن نشست در Redis، استفاده از حافظه:", e);
    }
  }
  memSet(`session:citizen:${jti}`, userId, CITIZEN_SESSION_TTL_SECONDS);
}

export async function getCitizenSessionUserId(jti: string): Promise<string | null> {
  const r = getRedisOrNull();
  if (r) {
    try {
      return await r.get(`session:citizen:${jti}`);
    } catch (e) {
      console.error("خطا در خواندن نشست از Redis، استفاده از حافظه:", e);
    }
  }
  return memGet(`session:citizen:${jti}`);
}

export async function revokeCitizenSession(jti: string): Promise<void> {
  const r = getRedisOrNull();
  if (r) {
    try {
      await r.del(`session:citizen:${jti}`);
      return;
    } catch (e) {
      console.error("خطا در حذف نشست از Redis:", e);
    }
  }
  memDel(`session:citizen:${jti}`);
}

// ==================== نشست مدیر ====================

export async function createAdminSession(jti: string): Promise<void> {
  const r = getRedisOrNull();
  if (r) {
    try {
      await r.set(`session:admin:${jti}`, "1", "EX", ADMIN_SESSION_TTL_SECONDS);
      return;
    } catch (e) {
      console.error("خطا در نوشتن نشست ادمین در Redis، استفاده از حافظه:", e);
    }
  }
  memSet(`session:admin:${jti}`, "1", ADMIN_SESSION_TTL_SECONDS);
}

export async function isAdminSessionValid(jti: string): Promise<boolean> {
  const r = getRedisOrNull();
  if (r) {
    try {
      return (await r.get(`session:admin:${jti}`)) !== null;
    } catch (e) {
      console.error("خطا در خواندن نشست ادمین از Redis، استفاده از حافظه:", e);
    }
  }
  return memGet(`session:admin:${jti}`) !== null;
}

export async function revokeAdminSession(jti: string): Promise<void> {
  const r = getRedisOrNull();
  if (r) {
    try {
      await r.del(`session:admin:${jti}`);
      return;
    } catch (e) {
      console.error("خطا در حذف نشست ادمین از Redis:", e);
    }
  }
  memDel(`session:admin:${jti}`);
}
