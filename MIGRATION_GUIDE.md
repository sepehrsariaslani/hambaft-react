# 🚀 دستورالعمل مهاجرت همبافت: Frappe → Next.js + PostgreSQL

## ریپازیتوری
- **مبدأ (منطق و دیزاین مرجع):** `https://github.com/sepehrsariaslani/Hambaft` (branch: `feat/areas-views-notion`)
- **مقصد (پروژه فعلی):** `https://github.com/sepehrsariaslani/hambaft-react`

## وضعیت فعلی hambaft-react
- ✅ Next.js 16 + React 19 + TypeScript
- ✅ PostgreSQL + Drizzle ORM (schema کامل در `src/db/schema.ts`)
- ✅ Tailwind CSS v4 + Lucide icons
- ✅ Schema شامل: users, goals, projects, tasks, habits, gamification, social
- ✅ API routes اولیه: auth, tasks, habits, goals, social, notifications
- ✅ صفحات اولیه: login, today, tasks, habits, goals, arena, notifications, profile
- ✅ Gamication logic: `src/server/gamification.ts` + `src/lib/gamification.ts`
- ❌ صفحات ناقص — فقط skeleton هستن
- ❌ کامپوننت‌های اجتماعی (comments, reactions, proofs) هنوز نیستن
- ❌ Nudge، Partner comparison، Notification settings نیستن
- ❌ Badge grid، Challenge cards، Points history نیستن
- ❌ Moderation/Admin panel نیست

## دیزاین مرجع (از Frappe PWA)
پالت رنگ همبافت که باید حفظ بشه:
```
bg-[#2D3025]    → سایدبار/هدر تیره
bg-[#4A6741]    → سبز اصلی (accent)
bg-[#E26645]    → نارنجی (CTA/دکمه‌ها)
bg-[#F9F6EE]    → کرمی (background)
bg-[#E8ECE0]    → سبز کم‌رنگ (success/active)
bg-[#E6DFD3]    → حاشیه‌ها
text-[#8D7F72]  → متن فرعی
text-[#2D3025]  → متن اصلی
font-black      → تیترها
text-[10px-12px] → سایز متن‌ها (موبایل‌فرست)
rounded-2xl/3xl  → گوشه‌های گرد
```
- **RTL** — همه صفحات dir="rtl"
- **فونت وزیرمتن** — فونت فارسی
- **موبایل‌فرست** — max-w-md mx-auto
- **انیمیشن**: motion/react (Framer Motion)
- **ایموجی‌ها** به جای SVG icons در جاهای زیادی

## صفحاتی که باید ساخته بشن (از Frappe مرجع)

### ۱. داشبورد (Today)
- کارت سلام + سطح + امتیاز + استریک
- چالش‌های امروز (۳ کارت)
- تسک‌های امروز (scheduled)
- عادت‌های امروز (check-in)
- ناج‌های اخیر از پارتنرها

### ۲. تسک‌ها (/tasks)
- لیست تسک‌ها با فیلتر (todo/in_progress/done)
- تسک row: چک‌باکس + عنوان + اولویت + تاریخ
- تسک دیتیل: ویرایش + کامنت + واکنش + اثبات + مخاطبین

### ۳. عادت‌ها (/habits)
- هفته‌ویو (7 روز)
- چک‌این با tap
- استریک نمایش

### ۴. اهداف (/goals + /goals/[id])
- لیست اهداف با progress bar
- جزئیات هدف: progress + updates + members + comments + reactions
- اشتراک‌گذاری هدف با پارتنر

### ۵. آrena (/arena) — لیدربورد + چالش + پارتنر + فید
- تب لیدربورد: top users
- تب چالش: چالش‌های امروز + تاریخچه
- تب پارتنر: لیست پارتنرها + ناج + مقایسه
- تب فید: فعالیت‌های اخیر پارتنرها

### ۶. نوتیفیکیشن‌ها (/notifications)
- لیست نوتیف‌ها با read/unread
- فیلتر همه/خوانده‌نشده
- mark all read + dismiss

### ۷. پروفایل (/profile)
- تب اطلاعات: نام، بیو، آواتار
- تب گیمیفیکیشن: سطح + امتیاز + نشان‌ها + تاریخچه امتیاز + مقایسه پارتنر
- تب تنظیمات نوتیف: ۱۲ toggle per-type
- تب مربی توازن (AI Coach)

### ۸. لاگین (/login)
- شماره موبایل + OTP
- Demo login

## کامپوننت‌هایی که باید ساخته بشن

### هسته
- `AppShell` — layout با سایدبار/تب‌بار
- `Sidebar` — ناوبری اصلی (مشابه Frappe sidebar)

### اجتماعی (از فاز ۶-۸ Frappe)
- `PartnerManager` — دعوت + لیست پارتنرها + اشتراک هدف
- `CommentReactions` — کامنت + ایموجی 🔥👏💪❤️✅🎉
- `ProofUploader` — آپلود عکس/ویدیو + کپشن + تأمل
- `NudgeSender` — ۱۲ قالب تشویقی + پیام دلخواه

### گیمیفیکیشن (از فاز ۹ Frappe)
- `LevelProgressBar` — نوار پیشرفت سطح
- `BadgeCard` / `BadgeGrid` — نشان‌ها با رنگ کمیابی
- `PointsHistory` — لیست تراکنش‌های امتیاز
- `StreakDisplay` — استریک فعلی + بهترین
- `StatsGrid` — آمار خلاصه (تسک/اثبات/نظر)
- `LevelUpCelebration` — انیمیشن 🎉
- `BadgeEarnedCelebration` — انیمیشن 🏆

### چالش (از فاز ۱۰ Frappe)
- `ChallengeCard` — کارت چالش با difficulty color
- `ChallengeHistory` — تاریخچه چالش‌ها

### نوتیفیکیشن (از فاز ۱۱ Frappe)
- `NotificationRow` — ردیف نوتیف با read/unread
- `NotificationCenter` — مرکز اعلان‌ها

### مقایسه و ناج (از Completion)
- `PartnerComparisonDisplay` — مقایسه side-by-side با dual bars
- `NotificationSettingsDisplay` — ۱۲ toggle

### مودراسیون (از فاز ۱۲ Frappe)
- `ModerationPanel` — مسدودشده‌ها + گزارش‌ها + ادمین
- `ReportModal` — فرم گزارش تخلف

## API Routes که باید تکمیل بشن

### موجود
- `/api/auth/[action]` — login, logout, me, demo-login
- `/api/tasks`, `/api/tasks/[id]`
- `/api/habits`, `/api/habits/[id]/log`
- `/api/goals`, `/api/goals/[id]/engage`
- `/api/social` — nudge, partners, bond
- `/api/notifications`
- `/api/health`

### باید اضافه بشه
- `/api/goals/[id]/members` — مدیریت اعضای هدف
- `/api/goals/[id]/proofs` — اثبات‌ها
- `/api/partners/invite` — دعوت پارتنر
- `/api/partners/block` — مسدودسازی
- `/api/reports` — گزارش تخلف
- `/api/admin/*` — پنل مدیر
- `/api/gamification/badges` — نشان‌ها
- `/api/gamification/challenges` — چالش‌ها
- `/api/gamification/comparison` — مقایسه پارتنر
- `/api/notifications/settings` — تنظیمات نوتیف
- `/api/push/subscribe` — push subscription

## فایل‌های کلیدی فراپ (مرجع برای منطق)

### بک‌اند منطق
- `/hambaft/api.py` — تمام API endpoints با لاجیک کامل:
  - `_award_points()` (line ~7741) — سیستم امتیازدهی
  - `_check_and_award_badges()` — بررسی و اعطای نشان
  - `_level_for_points()` — محاسبه سطح
  - `_update_daily_streak()` — آپدیت استریک
  - `_assign_daily_challenges()` — تخصیص چالش روزانه
  - `_update_challenge_progress()` — پیشرفت چالش
  - `_create_notification()` — ایجاد نوتیف
  - `_should_notify()` — بررسی تنظیمات نوتیف
  - `send_nudge()` — ارسال ناج
  - `get_partner_comparison()` — مقایسه پارتنر

### فرانت‌اند دیزاین (کپی الگو)
- `/frontend/src/legacy/components/` — همه کامپوننت‌ها:
  - `GamificationDisplay.tsx` — سیستم امتیاز/سطح/نشان/مقایسه
  - `DailyChallengesDisplay.tsx` — چالش‌های روزانه
  - `NotificationCenter.tsx` — مرکز نوتیفیکیشن
  - `ModerationPanel.tsx` — پنل مدیریت
  - `NudgeSender.tsx` — ناج تشویقی
  - `PartnerComparisonDisplay.tsx` — مقایسه پارتنر
  - `NotificationSettingsDisplay.tsx` — تنظیمات نوتیف
  - `CommentReactions.tsx` — کامنت + واکنش
  - `ProofUploader.tsx` — آپلود اثبات
  - `PartnerManager.tsx` — مدیریت پارتنر

### تایپ‌ها (قابل انتقال مستقیم)
- `/frontend/src/legacy/types.ts` — همه TypeScript interfaces

## نکات مهم
1. **دیزاین باید یکسان باشه** — پالت رنگ، گوشه‌ها، سایز متن‌ها، RTL
2. **فارسی‌نویسی** — همه label‌ها فارسی
3. **موبایل‌فرست** — max-w-md mx-auto مثل نسخه Frappe
4. **انیمیشن**: framer-motion بجای motion/react (همون API)
5. **ایموجی**: بجای SVG icon در جاهایی که Frappe ایموجی داره
6. **Drizzle ORM**: بجای SQL خام از Drizzle استفاده بشه
7. **Next.js Server Actions**: بجای API routes میشه از server actions هم استفاده کرد ولی API routes فعلاً اوکیه
