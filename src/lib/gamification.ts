/* ═══════════════════════════════════════════════════════════════
   موتور گیمیفیکیشن همبافت — منطق خالص TypeScript
   معادل مستقیم Edge Function مربوط به award_points در معماری
   Supabase؛ همین فایل بدون تغییر در React Native هم کار می‌کند.
   ═══════════════════════════════════════════════════════════════ */

/** امتیازهای هر رویداد — معادل ثابت‌های Frappe در hambaft-api */
export const POINTS = {
  TASK_DONE: 10,
  TASK_HIGH_PRIORITY_BONUS: 5,
  TASK_URGENT_BONUS: 10,
  DAILY_HIGHLIGHT_BONUS: 10,
  HABIT_CHECK: 8,
  GOAL_UPDATE: 15,
  GOAL_COMPLETED: 100,
  COMMENT: 3,
  REACTION_GIVEN: 2,
  REACTION_RECEIVED: 2,
  CHALLENGE_EASY: 20,
  CHALLENGE_MEDIUM: 40,
  CHALLENGE_HARD: 70,
  NUDGE_SENT: 1,
} as const;

/** منحنی سطح: هر سطح ۱۰۰×سطح امتیاز بیشتر از قبلی می‌خواهد
    سطح ۱→۲: ۱۰۰، ۲→۳: ۲۰۰ (+مجموع ۳۰۰)، ۳→۴: ۳۰۰ (مجموع ۶۰۰)… */
export function levelForPoints(total: number): number {
  let level = 1;
  let need = 100;
  let acc = 0;
  while (total >= acc + need) {
    acc += need;
    level += 1;
    need = level * 100;
  }
  return level;
}

export interface LevelInfo {
  level: number;
  currentFloor: number; // مجموع امتیاز شروع این سطح
  nextCeil: number; // مجموع امتیاز سطح بعد
  inLevel: number; // امتیاز داخل این سطح
  span: number; // بازه این سطح
  progress: number; // 0..1
}

export function levelInfo(total: number): LevelInfo {
  const level = levelForPoints(total);
  let floor = 0;
  for (let l = 2; l <= level; l++) floor += (l - 1) * 100;
  const span = level * 100;
  const nextCeil = floor + span;
  const inLevel = Math.max(0, total - floor);
  return { level, currentFloor: floor, nextCeil, inLevel, span, progress: span ? inLevel / span : 0 };
}

/** لقب هر سطح — فارسی */
export function levelTitle(level: number): string {
  if (level >= 12) return "استاد همبافت";
  if (level >= 10) return "قهرمان";
  if (level >= 8) return "پیشرو";
  if (level >= 6) return "مصمم";
  if (level >= 4) return "فعال";
  if (level >= 2) return "رو به رشد";
  return "تازه‌شروع";
}

export function levelAccent(level: number): string {
  if (level >= 12) return "#9B6B61";
  if (level >= 8) return "#E26645";
  if (level >= 4) return "#4A6741";
  return "#7C8363";
}

/** محاسبهٔ زنجیرهٔ روزهای متوالی از لیست تاریخ‌های ISO (مرتب هرطور) */
export function computeStreak(datesISO: string[], today: string): number {
  const set = new Set(datesISO);
  if (!set.has(today) && !set.has(addDays(today, -1))) return 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** درصد پیشرفت هدف */
export function goalProgress(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(1, Math.max(0, current / target));
}

/** کد رنگ سلامت هدف */
export function goalHealthColor(p: number): string {
  if (p >= 0.75) return "#4A6741";
  if (p >= 0.4) return "#7C8363";
  if (p >= 0.15) return "#D6A94B";
  return "#E26645";
}

export const GOAL_CATEGORY: Record<string, { fa: string; color: string }> = {
  health: { fa: "سلامت", color: "#4A6741" },
  career: { fa: "حرفه", color: "#2D3025" },
  learning: { fa: "یادگیری", color: "#7C8363" },
  finance: { fa: "مالی", color: "#9B6B61" },
  relationships: { fa: "روابط", color: "#E26645" },
  personal: { fa: "شخصی", color: "#8D7F72" },
};

export const PRIORITY_META: Record<string, { fa: string; color: string; points: number }> = {
  urgent: { fa: "فوری", color: "#E26645", points: POINTS.TASK_URGENT_BONUS },
  high: { fa: "بالا", color: "#E26645", points: POINTS.TASK_HIGH_PRIORITY_BONUS },
  medium: { fa: "متوسط", color: "#D6A94B", points: 0 },
  low: { fa: "کم", color: "#8D7F72", points: 0 },
};

export const REACTION_KINDS = [
  { kind: "cheer", fa: "دمت گرم", icon: "megaphone" },
  { kind: "fire", fa: "آتشی", icon: "flame" },
  { kind: "clap", fa: "آفرین", icon: "hand" },
  { kind: "heart", fa: "دوستت دارم", icon: "heart" },
] as const;
