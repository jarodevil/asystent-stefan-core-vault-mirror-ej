import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
/**
 * Subscription plans - monthly and yearly options
 * Status: DISABLED (waiting for activation)
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).notNull(),
  priceUSD: decimal("priceUSD", { precision: 10, scale: 2 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User subscriptions - tracks active subscriptions
 * Status: DISABLED (waiting for activation)
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: int("planId")
    .notNull()
    .references(() => subscriptionPlans.id),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "pending"])
    .default("pending")
    .notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["blik", "paypal", "card"]),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  cancelledAt: timestamp("cancelledAt"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Payment history - tracks all payment attempts and completions
 * Status: DISABLED (waiting for activation)
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: int("subscriptionId").references(() => userSubscriptions.id),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled"])
    .default("pending")
    .notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["blik", "paypal", "card"]),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Legal News - RSS feed cache for legal updates
 * Automatically refreshed every 24h
 */
export const legalNews = mysqlTable("legalNews", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: text("title").notNull(),
  date: varchar("date", { length: 50 }).notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  excerpt: text("excerpt").notNull(),
  url: text("url").notNull(),
  fullText: text("fullText"),
  category: mysqlEnum("category", [
    "ustawa",
    "rozporządzenie",
    "orzeczenie",
    "nowelizacja",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LegalNews = typeof legalNews.$inferSelect;
export type InsertLegalNews = typeof legalNews.$inferInsert;

/**
 * Chat Sessions - tracks user chat sessions with Stefan
 * Archived after 30 days of inactivity
 */
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  // Existing production table uses this historical column name.
  archived: boolean("isArchived").default(false).notNull(),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat Messages - individual messages within a chat session
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Developer Settings - Owner-only configuration for Stefan's behavior
 * Controls LLM parameters, system prompts, and personalization
 */
export const devSettings = mysqlTable("devSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevSetting = typeof devSettings.$inferSelect;
export type InsertDevSetting = typeof devSettings.$inferInsert;

/**
 * Model audit events — technical decision metadata only.
 * Prompts, client data, documents, answers, and URLs are intentionally excluded.
 */
export const modelAuditEvents = mysqlTable("modelAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  surface: mysqlEnum("surface", ["chat", "document", "pdf", "ksef"]).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  fallbackUsed: boolean("fallbackUsed").default(false).notNull(),
  safetyBlocked: boolean("safetyBlocked").default(false).notNull(),
  validationIssues: int("validationIssues").default(0).notNull(),
  sourceVerified: boolean("sourceVerified").default(false).notNull(),
  promptTokens: int("promptTokens"),
  completionTokens: int("completionTokens"),
  failureKind: varchar("failureKind", { length: 100 }),
  configHash: varchar("configHash", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelAuditEvent = typeof modelAuditEvents.$inferSelect;
export type InsertModelAuditEvent = typeof modelAuditEvents.$inferInsert;

/**
 * Error Logs - Automatic logging of errors for quality monitoring
 * Tracks falsification, source mismatches, and system errors
 */
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  errorType: mysqlEnum("errorType", [
    "falsification",
    "source_mismatch",
    "system_error",
    "llm_error",
  ]).notNull(),
  message: text("message").notNull(),
  stackTrace: text("stackTrace"),
  context: text("context"),
  userId: int("userId").references(() => users.id),
  sessionId: int("sessionId").references(() => chatSessions.id),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

/**
 * Quality Metrics - Tracks quality indicators for Stefan's responses
 * Monitors falsification detection, source validation, and confidence scores
 */
export const qualityMetrics = mysqlTable("qualityMetrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => chatSessions.id),
  messageId: int("messageId").references(() => chatMessages.id),
  falsificationDetected: boolean("falsificationDetected")
    .default(false)
    .notNull(),
  sourceMismatch: boolean("sourceMismatch").default(false).notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QualityMetric = typeof qualityMetrics.$inferSelect;
export type InsertQualityMetric = typeof qualityMetrics.$inferInsert;

/**
 * Source Whitelist - Approved sources for Stefan's knowledge base
 * Owner can manage which domains are trusted for legal information
 */
export const sourceWhitelist = mysqlTable("sourceWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  addedBy: int("addedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SourceWhitelist = typeof sourceWhitelist.$inferSelect;
export type InsertSourceWhitelist = typeof sourceWhitelist.$inferInsert;

/**
 * KSeF Alerts - Monitoring zmian w przepisach KSeF
 * Automatycznie pobierane z ksef.podatki.gov.pl i ELI API (filtry KSeF/VAT)
 */
export const ksefAlerts = mysqlTable("ksefAlerts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  url: text("url").notNull(),
  source: varchar("source", { length: 100 }).notNull(), // 'ksef.podatki.gov.pl' | 'isap.sejm.gov.pl' | 'gov.pl/finanse'
  alertType: mysqlEnum("alertType", [
    "przepis",
    "aktualnosc",
    "interpretacja",
    "komunikat",
    "orzeczenie",
  ]).notNull(),
  priority: mysqlEnum("priority", ["wysoki", "sredni", "niski"])
    .default("sredni")
    .notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  isNew: boolean("isNew").default(true).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  notified: boolean("notified").default(false).notNull(), // czy wyslano powiadomienie do wlasciciela
  legalBasis: varchar("legalBasis", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KsefAlert = typeof ksefAlerts.$inferSelect;
export type InsertKsefAlert = typeof ksefAlerts.$inferInsert;

/**
 * KSeF Client Cards - Karty wdrożenia KSeF dla klientów kancelarii
 * Check-lista wdrożenia z eksportem PDF gotowym do wysłania klientowi
 */
export const ksefClientCards = mysqlTable("ksefClientCards", {
  id: int("id").autoincrement().primaryKey(),
  // Dane identyfikacyjne klienta
  clientName: varchar("clientName", { length: 255 }).notNull(),
  nip: varchar("nip", { length: 20 }).notNull(),
  address: text("address"),
  taxOffice: varchar("taxOffice", { length: 255 }), // właściwy naczelnik US
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  // Status wdrożenia KSeF
  implementationStatus: mysqlEnum("implementationStatus", [
    "not_started", // Nie rozpoczęto
    "in_progress", // W trakcie
    "completed", // Zakończone
    "issues", // Problemy
  ])
    .default("not_started")
    .notNull(),
  obligationDate: varchar("obligationDate", { length: 20 }), // data obowiązku KSeF (np. 2026-02-01)
  obligationType: mysqlEnum("obligationType", [
    "mandatory_large", // Duży podatnik (> 200 mln PLN)
    "mandatory_standard", // Standardowy (od 2026-04-01)
    "voluntary", // Dobrowolny
    "exempt", // Zwolniony
  ]).default("mandatory_standard"),
  // Metoda uwierzytelnienia
  authMethod: mysqlEnum("authMethod", [
    "token", // Token KSeF
    "qualified_sig", // Podpis kwalifikowany
    "trusted_sig", // Podpis zaufany
    "not_set", // Nie ustalono
  ]).default("not_set"),
  // Check-lista wdrożenia (JSON boolean flags)
  checklistJson: text("checklistJson"), // JSON: { zawFaGranted, systemIntegrated, testsDone, ... }
  // Uprawnienia biura rachunkowego
  zawFaGranted: boolean("zawFaGranted").default(false).notNull(),
  zawFaDate: varchar("zawFaDate", { length: 20 }), // data złożenia ZAW-FA
  // Notatki
  notes: text("notes"),
  // Metadata
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KsefClientCard = typeof ksefClientCards.$inferSelect;
export type InsertKsefClientCard = typeof ksefClientCards.$inferInsert;

/**
 * System Cache — trwały cache systemu Stefana
 * Przechowuje skompilowane system prompty, statystyki, metadane seedera
 * Klucze: 'ksef_prompt', 'rss_prompt', 'seeder_last_run', 'db_stats'
 * TTL: per-rekord (ttlSeconds = null oznacza brak wygaśnięcia)
 */
export const systemCache = mysqlTable("systemCache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cacheKey", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  ttlSeconds: int("ttlSeconds"), // null = brak wygaśnięcia
  metadata: text("metadata"), // JSON: dodatkowe dane (np. źródło, wersja)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemCache = typeof systemCache.$inferSelect;
export type InsertSystemCache = typeof systemCache.$inferInsert;

/**
 * Stefan Notes — notatki Stefana z sesji pracy z p. Agnieszką
 * Trwała pamięć między sesjami: ważne ustalenia, preferencje, sprawy w toku
 */
export const stefanNotes = mysqlTable("stefanNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "ksef",
    "klient",
    "sprawa",
    "preferencja",
    "inne",
  ])
    .default("inne")
    .notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  sessionId: int("sessionId").references(() => chatSessions.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StefanNote = typeof stefanNotes.$inferSelect;
export type InsertStefanNote = typeof stefanNotes.$inferInsert;

/**
 * Generated Documents — dokumenty wygenerowane przez Stefana z szablonów
 * Zapisywane po kliknięciu "Zapisz" w pop-up podglądu dokumentu
 * Powiązane z kartą klienta KSeF (opcjonalnie)
 */
export const generatedDocuments = mysqlTable("generatedDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientCardId: int("clientCardId").references(() => ksefClientCards.id, {
    onDelete: "set null",
  }),
  templateId: varchar("templateId", { length: 100 }).notNull(), // np. 'zawiadomienie-offline24'
  templateTitle: varchar("templateTitle", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // np. 'KSeF', 'Prawo cywilne'
  content: text("content").notNull(), // HTML lub plain text wygenerowanego dokumentu
  fieldValues: text("fieldValues"), // JSON: wartości pól formularza
  legalBasis: varchar("legalBasis", { length: 500 }),
  clientName: varchar("clientName", { length: 255 }), // szybki dostęp bez JOIN
  clientNip: varchar("clientNip", { length: 20 }),
  status: mysqlEnum("status", ["draft", "final", "archived"])
    .default("draft")
    .notNull(),
  notes: text("notes"), // notatki księgowego do dokumentu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = typeof generatedDocuments.$inferInsert;
