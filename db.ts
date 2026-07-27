import pg from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const { Pool } = pg;

// ==================== نسخه‌ی آینه‌ای JSON از کاربران ====================
// این فایل صرفاً یک نسخه‌ی راحت برای مشاهده‌ی محلیه؛ منبع اصلی و قابل‌اتکا
// همیشه جدول users در Postgres (Neon) است. روی Render بدون Persistent Disk،
// این فایل با هر ری‌استارت سرور از بین می‌رود — برای دانلود مطمئن، از دکمه‌ی
// «دانلود JSON» در پنل ادمین (که مستقیم از دیتابیس می‌خواند) استفاده کنید.
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_JSON_MIRROR = path.join(DATA_DIR, "users.json");

async function mirrorUsersToJsonFile(): Promise<void> {
  try {
    const users = await getAllUsers();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_JSON_MIRROR, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.error("خطا در نوشتن نسخه‌ی JSON کاربران (نادیده گرفته شد):", e);
  }
}
let pool: InstanceType<typeof Pool> | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL تنظیم نشده است. آدرس اتصال دیتابیس Neon خود را (از داشبورد Neon → Connection string) در این متغیر محیطی قرار دهید."
      );
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Neon همیشه به SSL نیاز دارد
    });
  }
  return pool;
}

export async function initDb() {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      full_name TEXT NOT NULL,
      national_code TEXT UNIQUE,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      google_id TEXT UNIQUE,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'Citizen',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login_at TIMESTAMPTZ
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id INT PRIMARY KEY DEFAULT 1,
      password_hash TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT true
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS laws (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_label TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// ==================== Users ====================

export interface StoredUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

function rowToUser(row: any): StoredUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    nationalCode: row.national_code,
    phone: row.phone,
    email: row.email,
    googleId: row.google_id,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    lastLoginAt: row.last_login_at ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at) : null,
  };
}

export async function findUserByPhone(phone: string): Promise<StoredUser | null> {
  const { rows } = await getPool().query("SELECT * FROM users WHERE phone = $1", [phone]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserByNationalCode(nationalCode: string): Promise<StoredUser | null> {
  const { rows } = await getPool().query("SELECT * FROM users WHERE national_code = $1", [nationalCode]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserByEmailOrGoogleId(email: string, googleId: string): Promise<StoredUser | null> {
  const { rows } = await getPool().query("SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1", [googleId, email]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const { rows } = await getPool().query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function insertUser(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  nationalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
}): Promise<StoredUser> {
  const { rows } = await getPool().query(
    `INSERT INTO users (id, first_name, last_name, full_name, national_code, phone, email, google_id, avatar_url, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      user.id,
      user.firstName ?? null,
      user.lastName ?? null,
      user.fullName,
      user.nationalCode ?? null,
      user.phone ?? null,
      user.email ?? null,
      user.googleId ?? null,
      user.avatarUrl ?? null,
      user.role ?? "Citizen",
      user.status ?? "active",
    ]
  );
  const created = rowToUser(rows[0]);
  void mirrorUsersToJsonFile();
  return created;
}

export async function linkGoogleToUser(userId: string, googleId: string, avatarUrl: string | null): Promise<void> {
  await getPool().query("UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url) WHERE id = $3", [googleId, avatarUrl, userId]);
  void mirrorUsersToJsonFile();
}

export async function updateLastLogin(userId: string): Promise<void> {
  await getPool().query("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
  void mirrorUsersToJsonFile();
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const { rows } = await getPool().query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(rowToUser);
}

export async function countUsers(): Promise<number> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM users");
  return rows[0].count;
}

export async function setUserStatus(userId: string, status: "active" | "suspended"): Promise<StoredUser | null> {
  const { rows } = await getPool().query("UPDATE users SET status = $1 WHERE id = $2 RETURNING *", [status, userId]);
  const updated = rows[0] ? rowToUser(rows[0]) : null;
  if (updated) void mirrorUsersToJsonFile();
  return updated;
}

// ==================== Admin config ====================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored ?? "").split(":");
  if (!salt || !hash) return false;
  const hashVerify = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(hashVerify, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function getAdminConfig(): Promise<{ passwordHash: string; isDefault: boolean }> {
  const { rows } = await getPool().query("SELECT * FROM admin_config WHERE id = 1");
  if (rows.length === 0) {
    const passwordHash = hashPassword("ADMIN");
    await getPool().query("INSERT INTO admin_config (id, password_hash, is_default) VALUES (1, $1, true)", [passwordHash]);
    return { passwordHash, isDefault: true };
  }
  return { passwordHash: rows[0].password_hash, isDefault: rows[0].is_default };
}

export async function updateAdminConfig(passwordHash: string, isDefault: boolean): Promise<void> {
  await getPool().query(
    `INSERT INTO admin_config (id, password_hash, is_default) VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE SET password_hash = $1, is_default = $2`,
    [passwordHash, isDefault]
  );
}

// ==================== Laws ====================

export interface CrisisLawEntry {
  id: string;
  title: string;
  category: string;
  description: string;
}

export async function getAllLaws(): Promise<CrisisLawEntry[]> {
  const { rows } = await getPool().query("SELECT id, title, category, description FROM laws ORDER BY category, title");
  return rows;
}

export async function seedLawsIfEmpty(defaults: CrisisLawEntry[]): Promise<void> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM laws");
  if (rows[0].count === 0) {
    for (const law of defaults) {
      await getPool().query(
        "INSERT INTO laws (id, title, category, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
        [law.id, law.title, law.category, law.description]
      );
    }
  }
}

export async function insertLaw(law: CrisisLawEntry): Promise<void> {
  await getPool().query("INSERT INTO laws (id, title, category, description) VALUES ($1, $2, $3, $4)", [law.id, law.title, law.category, law.description]);
}

export async function updateLaw(id: string, fields: Partial<Omit<CrisisLawEntry, "id">>): Promise<CrisisLawEntry | null> {
  const existing = await getPool().query("SELECT * FROM laws WHERE id = $1", [id]);
  if (existing.rows.length === 0) return null;
  const current = existing.rows[0];
  const title = fields.title ?? current.title;
  const category = fields.category ?? current.category;
  const description = fields.description ?? current.description;
  await getPool().query("UPDATE laws SET title = $1, category = $2, description = $3 WHERE id = $4", [title, category, description, id]);
  return { id, title, category, description };
}

export async function deleteLaw(id: string): Promise<boolean> {
  const result = await getPool().query("DELETE FROM laws WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function countLaws(): Promise<number> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM laws");
  return rows[0].count;
}

// ==================== Questions / Responses ====================

export async function insertQuestion(q: { id: string; userId: string | null; title: string; description: string }): Promise<void> {
  await getPool().query("INSERT INTO questions (id, user_id, title, description) VALUES ($1, $2, $3, $4)", [q.id, q.userId, q.title, q.description]);
}

export async function insertResponse(r: { id: string; questionId: string; content: string }): Promise<void> {
  await getPool().query("INSERT INTO responses (id, question_id, content) VALUES ($1, $2, $3)", [r.id, r.questionId, r.content]);
}

export async function countQuestions(): Promise<number> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM questions");
  return rows[0].count;
}

// ==================== Activity log ====================

export async function logActivity(entry: {
  userId?: string | null;
  userLabel?: string | null;
  action: string;
  detail?: string | null;
  ip?: string | null;
}): Promise<void> {
  await getPool().query(
    "INSERT INTO activity_logs (id, user_id, user_label, action, detail, ip) VALUES ($1, $2, $3, $4, $5, $6)",
    [crypto.randomUUID(), entry.userId ?? null, entry.userLabel ?? null, entry.action, entry.detail ?? null, entry.ip ?? null]
  );
}

export async function getRecentActivity(limit = 200): Promise<any[]> {
  const { rows } = await getPool().query(
    `SELECT al.id, al.action, al.detail, al.ip, al.created_at, COALESCE(al.user_label, u.full_name) AS user_label
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    detail: r.detail,
    ip: r.ip,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    userLabel: r.user_label,
  }));
}
