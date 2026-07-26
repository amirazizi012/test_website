/**
 * اعتبارسنجی کد ملی — طبق درخواست، فقط الزام به ۱۰ رقمی بودن است،
 * بدون بررسی رقم کنترلی (چک‌سام).
 */
export function isValidIranianNationalCode(rawCode: string): boolean {
  const code = (rawCode ?? "").trim();
  return /^\d{10}$/.test(code);
}
