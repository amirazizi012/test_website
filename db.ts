import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL تنظیم نشده است. یک دیتابیس Postgres بسازید (مثلاً از داشبورد Render → New → PostgreSQL، رایگان) و آدرس اتصالش را در متغیر محیطی DATABASE_URL قرار دهید."
      );
    }
    pool = new Pool({
      connectionString,
      // اکثر سرویس‌های Postgres ابری (از جمله Render) نیاز به SSL دارند؛
      // برای دیتابیس لوکال (localhost) نیازی به SSL نیست.
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

/** ساخت جداول در صورت نبود — بی‌خطر برای اجرای مکرر (هر بار سرور بالا می‌آید صدا زده می‌شود) */
export async function initDb() {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      national_code TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'Citizen',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
}

// ==================== Users ====================

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  role: "Citizen";
  createdAt: string;
}

function rowToUser(row: any): StoredUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    nationalCode: row.national_code,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
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

export async function insertUser(user: StoredUser): Promise<void> {
  await getPool().query(
    `INSERT INTO users (id, first_name, last_name, full_name, national_code, phone, role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, user.firstName, user.lastName, user.fullName, user.nationalCode, user.phone, user.role, user.createdAt]
  );
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const { rows } = await getPool().query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(rowToUser);
}

export async function countUsers(): Promise<number> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM users");
  return rows[0].count;
}

// ==================== Sessions (شهروندان) ====================

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await getPool().query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);
  return token;
}

export async function getSessionUserId(token: string): Promise<string | null> {
  const { rows } = await getPool().query("SELECT user_id FROM sessions WHERE token = $1", [token]);
  return rows[0]?.user_id ?? null;
}

// ==================== Admin ====================

export async function createAdminSession(): Promise<string> {
  const token = crypto.randomUUID();
  await getPool().query("INSERT INTO admin_sessions (token) VALUES ($1)", [token]);
  return token;
}

export async function isValidAdminSession(token: string): Promise<boolean> {
  const { rows } = await getPool().query("SELECT 1 FROM admin_sessions WHERE token = $1", [token]);
  return rows.length > 0;
}

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
    await getPool().query(
      "INSERT INTO admin_config (id, password_hash, is_default) VALUES (1, $1, true)",
      [passwordHash]
    );
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
  await getPool().query(
    "INSERT INTO laws (id, title, category, description) VALUES ($1, $2, $3, $4)",
    [law.id, law.title, law.category, law.description]
  );
}

export async function updateLaw(id: string, fields: Partial<Omit<CrisisLawEntry, "id">>): Promise<CrisisLawEntry | null> {
  const existing = await getPool().query("SELECT * FROM laws WHERE id = $1", [id]);
  if (existing.rows.length === 0) return null;
  const current = existing.rows[0];
  const title = fields.title ?? current.title;
  const category = fields.category ?? current.category;
  const description = fields.description ?? current.description;
  await getPool().query(
    "UPDATE laws SET title = $1, category = $2, description = $3 WHERE id = $4",
    [title, category, description, id]
  );
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

// ==================== Questions / Responses (تاریخچه چت) ====================

export async function insertQuestion(q: { id: string; title: string; description: string }): Promise<void> {
  await getPool().query(
    "INSERT INTO questions (id, title, description) VALUES ($1, $2, $3)",
    [q.id, q.title, q.description]
  );
}

export async function insertResponse(r: { id: string; questionId: string; content: string }): Promise<void> {
  await getPool().query(
    "INSERT INTO responses (id, question_id, content) VALUES ($1, $2, $3)",
    [r.id, r.questionId, r.content]
  );
}

export async function countQuestions(): Promise<number> {
  const { rows } = await getPool().query("SELECT COUNT(*)::int AS count FROM questions");
  return rows[0].count;
}
