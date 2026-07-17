/* ═══════════════════════════════════════════════
   ابزارهای فارسی — کد خالص TypeScript
   این فایل بدون تغییر در اپ React Native هم کار می‌کند.
   ═══════════════════════════════════════════════ */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faNum(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function faCompact(n: number): string {
  if (n >= 1000) return faNum((n / 1000).toFixed(n >= 10000 ? 0 : 1)) + "k";
  return faNum(n);
}

/* ─── تبدیل میلادی → جلالی (الگوریتم استاندارد خیام) ─── */
const J_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const J_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export interface JalaliDate {
  jy: number;
  jm: number; // 1..12
  jd: number; // 1..31
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function jalaliMonthName(jm: number): string {
  return J_MONTHS[jm - 1] ?? "";
}

/** «یکشنبه ۲۶ مرداد ۱۴۰۴» */
export function formatJalaliFull(date: Date = new Date()): string {
  const { jy, jm, jd } = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const jsDay = (date.getDay() + 1) % 7; // شنبه = 0
  return `${J_DAYS[jsDay]} ${faNum(jd)} ${J_MONTHS[jm - 1]} ${faNum(jy)}`;
}

/** «۲۶ مرداد» */
export function formatJalaliShort(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const { jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${faNum(jd)} ${J_MONTHS[jm - 1]}`;
}

/** نام روز هفته فارسی از تاریخ ISO */
export function weekdayName(date: Date): string {
  return J_DAYS[(date.getDay() + 1) % 7];
}

/** «x دقیقه پیش» به فارسی */
export function relativeFa(iso: string | Date): string {
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.max(0, Date.now() - then.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${faNum(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${faNum(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${faNum(day)} روز پیش`;
  return formatJalaliShort(then.toISOString().slice(0, 10));
}

/** تاریخ امروز به فرمت ISO (UTC-محلی) برای ستون‌های date */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function jalaliMonthDayList(ago: number): { iso: string; label: string; jdm: string } {
  const { jm, jd } = gregorianToJalaliFromISO(addDaysISO(todayISO(), -ago));
  return { iso: addDaysISO(todayISO(), -ago), label: `${faNum(jd)}`, jdm: J_MONTHS[jm - 1] };
}

function gregorianToJalaliFromISO(iso: string): JalaliDate {
  const d = new Date(iso + "T00:00:00");
  return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** ساعت فارسی «۰۸:۳۰ صبح» */
export function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 5) return "شب بخیر";
  if (h < 12) return "صبح بخیر";
  if (h < 14) return "ظهر بخیر";
  if (h < 17) return "عصر بخیر";
  if (h < 20) return "غروب بخیر";
  return "شب بخیر";
}
