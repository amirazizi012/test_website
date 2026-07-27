import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET تنظیم نشده و از یک مقدار پیش‌فرض ناامن استفاده می‌شود. حتماً قبل از انتشار واقعی، JWT_SECRET را در متغیرهای محیطی تنظیم کنید."
  );
}

export interface CitizenTokenPayload {
  sub: string; // userId
  jti: string; // شناسه‌ی نشست (برای چک با Redis)
  type: "citizen";
}

export interface AdminTokenPayload {
  jti: string;
  type: "admin";
}

export function issueCitizenToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti, type: "citizen" }, JWT_SECRET, { expiresIn: "30d" });
}

export function issueAdminToken(jti: string): string {
  return jwt.sign({ jti, type: "admin" }, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyCitizenToken(token: string): CitizenTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== "citizen") return null;
    return payload as CitizenTokenPayload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== "admin") return null;
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

// ==================== Google Sign-In ====================

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!googleClient) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID تنظیم نشده است.");
    googleClient = new OAuth2Client(clientId);
  }
  return googleClient;
}

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await getGoogleClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}
