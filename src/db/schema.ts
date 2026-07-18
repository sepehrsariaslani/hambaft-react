import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ══════════════════════════════════════════════════════════
   همبافت v2 — Schema طراحی‌شده به سبک Supabase (PostgreSQL + RLS-ready)
   هر جدول owner_id/user_id دارد تا در نسخه Supabase مستقیماً
   با Row Level Security + auth.uid() قابل محافظت باشد.
   همین جداول و APIها بعداً توسط اپ React Native مصرف می‌شوند.
   ══════════════════════════════════════════════════════════ */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#4A6741"),
  bio: text("bio").notNull().default(""),
  role: text("role").notNull().default("member"),
  isDemo: boolean("is_demo").notNull().default(false),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* ─── حوزه‌های زندگی (Areas) ─── */
export const areas = pgTable(
  "areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#7C8363"),
    icon: text("icon").notNull().default("leaf"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("areas_user_idx").on(t.userId)],
);

/* ─── اهداف ─── */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("personal"),
    goalType: text("goal_type").notNull().default("outcome"),
    unit: text("unit").notNull().default(""),
    targetValue: integer("target_value").notNull().default(100),
    currentValue: integer("current_value").notNull().default(0),
    privacy: text("privacy").notNull().default("private"), // private | shared | partners
    status: text("status").notNull().default("active"), // active | paused | completed | archived
    scope: text("scope").notNull().default("custom"), // annual | quarterly | monthly | custom
    totalPoints: integer("total_points").notNull().default(0),
    deadline: date("deadline"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_owner_idx").on(t.ownerId)],
);

export const goalMembers = pgTable(
  "goal_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("partner"),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("goal_members_unique").on(t.goalId, t.userId)],
);

/* ثبت پیشرفت (Check-in روی هدف) */
export const goalUpdates = pgTable(
  "goal_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    valueDelta: integer("value_delta").notNull().default(1),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goal_updates_goal_idx").on(t.goalId), index("goal_updates_user_idx").on(t.userId)],
);

/* ─── پروژه‌ها ─── */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("active"),
    color: text("color").notNull().default("#7C8363"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId)],
);

/* ─── تسک‌ها ─── */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("todo"), // todo | in_progress | done
    priority: text("priority").notNull().default("medium"), // low | medium | high | urgent
    dueDate: date("due_date"),
    scheduledDate: date("scheduled_date"),
    scheduledTime: text("scheduled_time"),
    isDailyHighlight: boolean("is_daily_highlight").notNull().default(false),
    estimatedMinutes: integer("estimated_minutes"),
    actualMinutes: integer("actual_minutes").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_owner_idx").on(t.ownerId), index("tasks_scheduled_idx").on(t.scheduledDate)],
);

/* ─── عادت‌ها ─── */
export const habits = pgTable(
  "habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    color: text("color").notNull().default("#4A6741"),
    icon: text("icon").notNull().default("leaf"),
    targetPerDay: integer("target_per_day").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    count: integer("count").notNull().default(1),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("habit_logs_unique").on(t.habitId, t.logDate),
    index("habit_logs_user_date_idx").on(t.userId, t.logDate),
  ],
);

/* ─── گیمیفیکیشن ─── */
export const pointEvents = pgTable(
  "point_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    refType: text("ref_type").notNull().default(""),
    refId: text("ref_id").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("point_events_user_idx").on(t.userId)],
);

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("medal"),
  category: text("category").notNull().default("general"),
  threshold: integer("threshold").notNull().default(1),
  points: integer("points").notNull().default(0),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_badges_unique").on(t.userId, t.badgeId)],
);

/* ─── چالش‌های روزانه ─── */
export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  metric: text("metric").notNull(), // task_done | habit_log | goal_update | reaction_given | comment | points_earned | all_habits | high_priority | highlight_done | shared_goal
  targetCount: integer("target_count").notNull().default(1),
  points: integer("points").notNull().default(20),
  difficulty: text("difficulty").notNull().default("easy"), // easy | medium | hard
});

export const userChallenges = pgTable(
  "user_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    assignedDate: date("assigned_date").notNull(),
    targetCount: integer("target_count").notNull(),
    progress: integer("progress").notNull().default(0),
    status: text("status").notNull().default("active"), // active | completed
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("user_challenges_user_date_idx").on(t.userId, t.assignedDate)],
);

/* ─── اجتماعی ─── */
export const partnerships = pgTable(
  "partnerships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("partnerships_unique").on(t.userId, t.partnerId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull().default("goal"),
    targetId: uuid("target_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_target_idx").on(t.targetType, t.targetId)],
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull().default("goal"),
    targetId: uuid("target_id").notNull(),
    kind: text("kind").notNull().default("cheer"), // cheer | fire | clap | heart
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reactions_unique").on(t.userId, t.targetType, t.targetId, t.kind)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").notNull().default("info"), // nudge | badge | points | reaction | comment | challenge | partner
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    refType: text("ref_type").notNull().default(""),
    refId: text("ref_id").notNull().default(""),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.read)],
);

/* ─── اثبات‌ها (Proof Uploads) ─── */
export const proofs = pgTable(
  "proofs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull().default("goal"), // goal | project | task | habit
    targetId: uuid("target_id").notNull(),
    mediaUrl: text("media_url").notNull(),
    mediaType: text("media_type").notNull().default("photo"), // photo | video
    caption: text("caption").notNull().default(""),
    reflectionNote: text("reflection_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proofs_target_idx").on(t.targetType, t.targetId), index("proofs_user_idx").on(t.userId)],
);

/* ─── بلاک کردن کاربران (User Blocks) ─── */
export const userBlocks = pgTable(
  "user_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_blocks_unique").on(t.blockerId, t.blockedId)],
);

/* ─── گزارش تخلف (Reports) ─── */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedUserId: uuid("reported_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull().default("user"), // user | comment | proof | reaction
    entityId: text("entity_id").notNull().default(""),
    reason: text("reason").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("pending"), // pending | reviewed | dismissed | action_taken
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    actionTaken: text("action_taken").notNull().default(""),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_reporter_idx").on(t.reporterId), index("reports_status_idx").on(t.status)],
);

/* ─── تنظیمات نوتیفیکیشن (Notification Settings) ─── */
export const notificationSettings = pgTable("notification_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  nudge: boolean("nudge").notNull().default(true),
  badge: boolean("badge").notNull().default(true),
  points: boolean("points").notNull().default(true),
  reaction: boolean("reaction").notNull().default(true),
  comment: boolean("comment").notNull().default(true),
  challenge: boolean("challenge").notNull().default(true),
  partner: boolean("partner").notNull().default(true),
  goal: boolean("goal").notNull().default(true),
  habit: boolean("habit").notNull().default(true),
  task: boolean("task").notNull().default(true),
  streak: boolean("streak").notNull().default(true),
  summary: boolean("summary").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── اشتراک Push Notification ─── */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  keys: text("keys").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── حساب‌های بانکی ─── */
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  balance: integer("balance").notNull().default(0),
  accountType: text("account_type").notNull().default("checking"), // checking | savings | credit | investment
  isCredit: boolean("is_credit").notNull().default(false),
  creditLimit: integer("credit_limit").notNull().default(0),
  creditDebt: integer("credit_debt").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── تراکنش‌های مالی ─── */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "set null" }),
    toBankAccountId: uuid("to_bank_account_id").references(() => bankAccounts.id, { onDelete: "set null" }),
    type: text("type").notNull().default("expense"), // income | expense | transfer
    amount: integer("amount").notNull(),
    category: text("category").notNull().default("other"),
    subcategory: text("subcategory").notNull().default(""),
    description: text("description").notNull().default(""),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("transactions_user_date_idx").on(t.userId, t.date)]
);

/* ─── بدهی‌ها و طلب‌ها (Debts) ─── */
export const debts = pgTable("debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  personName: text("person_name").notNull(),
  type: text("type").notNull().default("debt"), // debt (بدهی) | loan (طلب)
  amount: integer("amount").notNull(),
  dueDate: date("due_date"),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── دارایی‌ها و سرمایه‌گذاری‌ها (Assets) ─── */
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  symbol: text("symbol").notNull().default(""),
  type: text("type").notNull().default("gold"), // gold | crypto | stock | currency | real_estate | other
  amount: integer("amount").notNull().default(1),
  purchasePrice: integer("purchase_price").notNull().default(0),
  currentPrice: integer("current_price").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── خریدهای اقساطی (Installments) ─── */
export const installments = pgTable("installments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  totalAmount: integer("total_amount").notNull(),
  installmentAmount: integer("installment_amount").notNull(),
  totalMonths: integer("total_months").notNull().default(12),
  paidMonths: integer("paid_months").notNull().default(0),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  startDate: date("start_date").notNull(),
  category: text("category").notNull().default("shopping"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ─── اشتراک‌ها (Subscriptions) ─── */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly | yearly
  nextBillingDate: date("next_billing_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


