import { Pool } from "pg";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // fail-fast: به‌جای اینکه بعداً و بی‌سروصدا خراب شود، همین اول با پیام واضح متوقف می‌شویم
  throw new Error(
    "DATABASE_URL تنظیم نشده است. یک دیتابیس Postgres رایگان (مثلاً از neon.tech) بسازید " +
    "و connection string آن را در متغیر محیطی DATABASE_URL قرار دهید."
  );
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // برای Neon/Render لازم است
});

export interface DbUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  national_code: string | null;
  phone: string | null;
  email: string | null;
  google_id: string | null;
  role: string;
  created_at: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export function toPublicUser(u: DbUser): PublicUser {
  return {
    id: u.id,
    firstName: u.first_name ?? "",
    lastName: u.last_name ?? "",
    fullName: u.full_name,
    nationalCode: u.national_code,
    phone: u.phone,
    email: u.email,
    role: u.role,
    createdAt: u.created_at,
  };
}

// === راه‌اندازی جدول‌ها (idempotent - هر بار سرور بالا می‌آید اجرا می‌شود) ===
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      full_name TEXT NOT NULL,
      national_code TEXT UNIQUE,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      google_id TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'Citizen',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  // تاریخچه‌ی هر سوال/درخواست مشاوره‌ی کاربر + پاسخ AI، برای همیشه نگه داشته می‌شود
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      response TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`);
}

// === Admin: users + activity overview ===

export interface UserWithStats extends DbUser {
  consultation_count: string; // pg برمی‌گرداند COUNT() به شکل رشته
}

export async function getAllUsersWithStats(): Promise<UserWithStats[]> {
  const r = await pool.query(`
    SELECT u.*, COUNT(c.id) AS consultation_count
    FROM users u
    LEFT JOIN consultations c ON c.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  return r.rows;
}

export interface ConsultationWithUser {
  id: string;
  full_name: string;
  phone: string | null;
  national_code: string | null;
  title: string;
  description: string;
  response: string | null;
  created_at: string;
}

export async function getAllConsultationsWithUser(): Promise<ConsultationWithUser[]> {
  const r = await pool.query(`
    SELECT c.id, u.full_name, u.phone, u.national_code,
           c.title, c.description, c.response, c.created_at
    FROM consultations c
    JOIN users u ON u.id = c.user_id
    ORDER BY c.created_at DESC
  `);
  return r.rows;
}

export interface AdminStats {
  totalUsers: string;
  totalConsultations: string;
  usersLast7Days: string;
  consultationsLast7Days: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS "totalUsers",
      (SELECT COUNT(*) FROM consultations) AS "totalConsultations",
      (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '7 days') AS "usersLast7Days",
      (SELECT COUNT(*) FROM consultations WHERE created_at > now() - interval '7 days') AS "consultationsLast7Days"
  `);
  return r.rows[0];
}

// === Users ===

export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  const r = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
  return r.rows[0] ?? null;
}

export async function getUserByNationalCode(code: string): Promise<DbUser | null> {
  const r = await pool.query("SELECT * FROM users WHERE national_code = $1", [code]);
  return r.rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const r = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return r.rows[0] ?? null;
}

export async function getUserByGoogleId(googleId: string): Promise<DbUser | null> {
  const r = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
  return r.rows[0] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const r = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

export async function insertUser(data: {
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  nationalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  googleId?: string | null;
}): Promise<DbUser> {
  const id = crypto.randomUUID();
  const r = await pool.query(
    `INSERT INTO users (id, first_name, last_name, full_name, national_code, phone, email, google_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      id,
      data.firstName ?? null,
      data.lastName ?? null,
      data.fullName,
      data.nationalCode ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.googleId ?? null,
    ]
  );
  return r.rows[0];
}

export async function linkGoogleId(userId: string, googleId: string) {
  await pool.query("UPDATE users SET google_id = $1 WHERE id = $2", [googleId, userId]);
}

export async function setUserRole(userId: string, role: string) {
  await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
}

// === Sessions ===

const SESSION_TTL_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)", [
    token,
    userId,
    expiresAt,
  ]);
  return token;
}

export async function getUserBySessionToken(token: string): Promise<DbUser | null> {
  const r = await pool.query(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  );
  return r.rows[0] ?? null;
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}

// === Consultations (تاریخچه‌ی چت/مشاوره) ===

export async function insertConsultation(userId: string, title: string, description: string): Promise<string> {
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO consultations (id, user_id, title, description) VALUES ($1,$2,$3,$4)",
    [id, userId, title, description]
  );
  return id;
}

export async function saveConsultationResponse(id: string, response: string) {
  await pool.query("UPDATE consultations SET response = $1 WHERE id = $2", [response, id]);
}

export async function getUserHistory(userId: string, limit = 50) {
  const r = await pool.query(
    `SELECT id, title, description, response, created_at
     FROM consultations WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return r.rows;
}
