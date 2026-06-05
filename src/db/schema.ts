import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  uuid,
  jsonb,
  boolean,
  primaryKey,
  serial,
  doublePrecision,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { type AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isAdmin: boolean("isAdmin").default(false),
  securityLockdown: boolean("security_lockdown").default(false),
  planType: text("plan_type").default("FREE"),
  status: text("status").default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  lastActivity: timestamp("last_activity"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("imageurl").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("createdat").defaultNow(),
});

export const orders = pgTable("order", {
  id: serial("id").primaryKey(),
  userId: text("userid").notNull().references(() => users.id),
  productId: integer("productid").references(() => products.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("createdat").defaultNow(),
});

export const reviews = pgTable("review", {
  id: serial("id").primaryKey(),
  productId: integer("productid").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: text("userid").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdat").defaultNow(),
});

export const transactions = pgTable("transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  orderId: integer("order_id"),
  idempotencyKey: text("idempotency_key"),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull(),
  hash: text("hash"),
  previousHash: text("previous_hash"),
  metadata: jsonb("metadata").default({}),
  lockedUntil: timestamp("locked_until"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const ledgerEntries = pgTable("ledger_entry", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id),
  userId: text("user_id").notNull(),
  accountType: text("account_type").notNull(),
  entryType: text("entry_type").notNull(),
  amount: doublePrecision("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  changes: jsonb("changes"),
  changeHash: text("change_hash"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemHealth = pgTable("system_health", {
  id: uuid("id").defaultRandom().primaryKey(),
  issueType: text("issue_type").notNull(),
  details: text("details"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhookEndpoints = pgTable("webhook_endpoint", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outboxEvents = pgTable("outbox_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  attemptCount: integer("attempt_count").default(0),
  nextRetryAt: timestamp("next_retry_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 1. Clients Directory
export const clients = pgTable("client", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  companyName: text("company_name"),
  location: text("location"),
  industry: text("industry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Invoices (The core ledger source)
export const invoices = pgTable("invoice", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(), // e.g., INV-2026-001
  projectDescription: text("project_description").notNull(),
  amount: doublePrecision("amount").notNull(), // Raw floats in NGN/USD
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("DRAFT"), // DRAFT, SENT, VIEWED, OVERDUE, PAID
  paymentInstructions: text("payment_instructions"),
  metadata: jsonb("metadata").default({}),
  isAutomatedReminderEnabled: boolean("is_automated_reminder_enabled").default(true),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  viewCount: integer("view_count").default(0),
  viewedAt: timestamp("viewed_at"),
  clientPortalToken: text("client_portal_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Payment Collections (Manually recorded payments)
export const payments = pgTable("payment", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  datePaid: timestamp("date_paid").defaultNow(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Automated Reminders Logs & Trackers
export const reminders = pgTable("reminder", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  templateType: text("template_type").notNull(), // DUE_TOMORROW, DUE_TODAY, OVERDUE_3D, OVERDUE_7D
  channel: text("channel").notNull(), // WHATSAPP, EMAIL
  sentDate: timestamp("sent_date").defaultNow(),
  reminderCount: integer("reminder_count").default(1),
  status: text("status").default("SENT"), // SENT, FAILED, DELIVERED
});

// 5. Founder Dashboard & Event Tracking Tables
export const userActivityLogs = pgTable("user_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // USER_SIGNUP, USER_LOGIN, etc.
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const loginLogs = pgTable("login_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  status: text("status").notNull().default("SUCCESS"), // SUCCESS, FAILED
  timestamp: timestamp("timestamp").defaultNow(),
});

export const featureUsageEvents = pgTable("feature_usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  featureName: text("feature_name").notNull(), // Invoice Creation, Client Management, Reminder Feature, Report Downloads
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // SUPPORT, BUG, FEATURE_REQUEST, FEEDBACK
  priority: text("priority").notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, URGENT
  status: text("status").notNull().default("OPEN"), // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(), // USER_SIGNUP, NEW_SUBSCRIPTION, SUPPORT_REQUEST, LARGE_INVOICE, USER_INACTIVE
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Client CRM & Relationship Tables
export const clientNotes = pgTable("client_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  category: text("category").notNull().default("MEETING"), // MEETING, AGREEMENT, SCOPE_CHANGE, SPECIAL_REQUEST, PAYMENT_AGREEMENT
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientTags = pgTable("client_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientActivities = pgTable("client_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // INVOICE_CREATED, INVOICE_SENT, REMINDER_SENT, INVOICE_PAID, NOTE_ADDED, CLIENT_CREATED
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientScores = pgTable("client_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  healthScore: integer("health_score").notNull().default(100),
  reliabilityStatus: text("reliability_status").notNull().default("Reliable"), // Reliable, Moderate Risk, High Risk
  paymentSpeed: integer("payment_speed"),
  completionRate: integer("completion_rate"),
  outstandingBalance: doublePrecision("outstanding_balance").default(0),
  overdueBalance: doublePrecision("overdue_balance").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientContacts = pgTable("client_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientFollowups = pgTable("client_followups", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  followupDate: timestamp("followup_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, CANCELLED
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientRelationships = pgTable("client_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  preferredMethod: text("preferred_method").notNull().default("EMAIL"), // WHATSAPP, EMAIL, PHONE
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. Client Receipt Submissions for Freelancer Review
export const receiptSubmissions = pgTable("receipt_submission", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  userId: text("user_id") // Freelancer ID
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("UNDER_REVIEW"), // 'VERIFIED', 'UNDER_REVIEW', 'FAILED', 'APPROVED', 'REJECTED'
  confidenceScore: doublePrecision("confidence_score").notNull().default(0),
  fraudFlags: jsonb("fraud_flags").default([]),
  receiptImageBase64: text("receipt_image_base64"),
  extractedAmount: doublePrecision("extracted_amount"),
  extractedDate: text("extracted_date"),
  extractedRef: text("extracted_ref"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
