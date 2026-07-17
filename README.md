# همبافت — Hambaft v2

ردیاب اهداف، عادت‌ها و تسک‌ها با گیمیفیکیشن فارسی، پارتنر هم‌مسیر، چالش روزانه و لیدربورد.

## استک

| لایه | تکنولوژی | چرا |
| --- | --- | --- |
| وب‌اپ | **Next.js 16 (App Router + React 19)** | SSR + API routes؛ همان کدهایی که قرار است در اپ موبایل reuse شوند |
| دیتابیس | **PostgreSQL + Drizzle ORM** | اسکیمای Supabase-ready (جدول‌های user-scoped، آمادهٔ RLS) |
| UI | Tailwind CSS v4 + Lucide | موبایل‌فرست، RTL، فونت وزیرمتن، پالت محلی همبافت |
| موبایل (گام بعدی) | React Native + Expo | مصرف مستقیم همین REST APIها و `@/lib` مشترک |

## اجرا

```bash
cp .env.example .env      # DATABASE_URL را تنظیم کن
npm install
npx drizzle-kit push      # ساخت جدول‌ها
npm run build && npm run start
```

ورود: هر شماره موبایل (دمو: `09120000000` — با دادهٔ کامل آماده).

## معماری داده (هم‌راستا با نقشهٔ مهاجرت Supabase)

```
users ── sessions
      ── areas ──┬── goals ──┬── goal_members   (اهداف اشتراکی)
                 │           ├── goal_updates   (چک-این‌ها)
                 │           └── projects ── tasks
      ── habits ── habit_logs
      ── point_events        (دفتر کل امتیاز)
      ── badges / user_badges
      ── challenges / user_challenges   (۳ چالش خودکار روزانه)
      ── partnerships / comments / reactions / notifications
```

- **گیمیفیکیشن**: `src/server/gamification.ts` — ریاضیات خالص آن در `src/lib/gamification.ts` (قابل حملِ مستقیم به اپ موبایل/Edge Functions). امتیاز → سطح → نشان + همگام‌سازی چالش روزانه.
- **دسترسی**: `canViewGoal` در `src/server/queries.ts` همان Policyای است که در Supabase به RLS تبدیل می‌شود (owner یا member فعال یا privacy=shared برای مشاهده‌گرها).
- **APIهای REST** (`/api/*`) — قرارداد مشترک وب و اپ آینده:
  - `auth/[action]`: login, demo-login, logout, me, demo
  - `tasks`, `tasks/[id]` • `habits`, `habits/[id]/log`
  - `goals`, `goals/[id]/engage` (progress / comment / reaction)
  - `social` (nudge, partners, bond) • `notifications`

## مسیر مهاجرت به Supabase + React Native

1. `supabase init` و import اسکیمای Drizzle → `supabase migration`
2. تعویض لایهٔ سشن با **Supabase Auth** (همان `users.id` به‌عنوان `auth.uid()`)
3. فعال‌سازی **RLS** روی جدول‌ها با policyهای آماده در `src/server/queries.ts`
4. انتقال `src/server/gamification.ts` به **Edge Function** (award_points)
5. ساخت اپ با **Expo** و استفادهٔ مجدد از `src/lib/*` (تایپ‌ها، جلالی، گیمیفیکیشن)

## صفحات

`/` امروز · `/tasks` · `/habits` · `/goals` (+ جزئیات و گفت‌وگو) · `/arena` (لیدربورد/چالش/پارتنر/فید) · `/notifications` · `/profile`

ساخته‌شده با عشق برای زندگی فارسی — از پیوند «هم» و «بافت».
