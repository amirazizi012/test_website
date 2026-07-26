const ADMIN_TOKEN_KEY = "crisislaw_admin_token";
const ADMIN_DEFAULT_KEY = "crisislaw_admin_is_default";

export function saveAdminSession(token: string, isDefault: boolean) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_DEFAULT_KEY, isDefault ? "1" : "0");
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminDefaultPassword(): boolean {
  return localStorage.getItem(ADMIN_DEFAULT_KEY) === "1";
}

export function setAdminDefaultPassword(isDefault: boolean) {
  localStorage.setItem(ADMIN_DEFAULT_KEY, isDefault ? "1" : "0");
}

export function isAdminLoggedIn(): boolean {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_DEFAULT_KEY);
}
