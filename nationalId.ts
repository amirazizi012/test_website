/**
 * اعتبارسنجی واقعی کد ملی ایران (با رقم کنترلی)
 * قبلاً فقط چک می‌شد که ۱۰ رقم باشد؛ این نسخه الگوریتم چک‌سام رسمی را هم بررسی می‌کند.
 */
export function isValidIranianNationalCode(rawCode: string): boolean {
  const code = (rawCode ?? "").trim();

  if (!/^\d{10}$/.test(code)) return false;

  // کدهایی مثل 0000000000 یا 1111111111 و ... معتبر نیستند
  if (/^(\d)\1{9}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const check = digits[9];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }

  const remainder = sum % 11;

  if (remainder < 2) {
    return check === remainder;
  }
  return check === 11 - remainder;
}
