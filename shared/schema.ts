/**
 * Схема базы данных и типы для LakshmiApp
 * 
 * Этот файл содержит полное определение структуры данных приложения:
 * - Таблицы PostgreSQL с использованием Drizzle ORM
 * - Связи между таблицами (foreign keys, relations)
 * - Схемы валидации Zod для API endpoints
 * - TypeScript типы для типобезопасности
 * 
 * Структура данных поддерживает:
 * - Многопользовательскую работу с изоляцией данных
 * - Детализированный учет доходов и расходов
 * - Гибкую систему распределения средств по фондам
 * - Иерархическую номенклатуру и категории расходов
 */

import { sql } from 'drizzle-orm';
import {
  index,          // Индексы для оптимизации запросов
  jsonb,          // JSON данные (для сессий)
  pgTable,        // Определение таблиц PostgreSQL
  timestamp,      // Временные метки
  varchar,        // Строковые поля с ограничением длины
  text,           // Текстовые поля без ограничений
  decimal,        // Денежные суммы с точностью
  boolean,        // Логические поля
  integer,        // Целые числа
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";                // Определение связей между таблицами
import { createInsertSchema } from "drizzle-zod";       // Автогенерация Zod схем из Drizzle
import { z } from "zod";                                // Библиотека валидации схем

// === ТАБЛИЦЫ СИСТЕМЫ ===

/**
 * Таблица сессий для аутентификации
 * 
 * Используется connect-pg-simple для хранения Express сессий в PostgreSQL.
 * Обеспечивает персистентность сессий между перезапусками сервера.
 */
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),     // Уникальный идентификатор сессии
    sess: jsonb("sess").notNull(),        // Данные сессии в JSON формате
    expire: timestamp("expire").notNull(), // Время истечения сессии
  },
  (table) => [
    index("IDX_session_expire").on(table.expire), // Индекс для очистки истекших сессий
  ],
);

/**
 * Таблица пользователей для аутентификации
 * 
 * Поддерживает как OAuth провайдеров (email), так и локальную аутентификацию (username/password).
 * Пароли хешируются с использованием bcrypt для безопасности.
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // Уникальный ID пользователя
  username: varchar("username").unique(),                         // Логин для простой аутентификации
  password: varchar("password"),                                  // Хешированный пароль
  email: varchar("email").unique(),                              // Email (для OAuth)
  firstName: varchar("first_name"),                              // Имя пользователя
  lastName: varchar("last_name"),                                // Фамилия пользователя
  profileImageUrl: varchar("profile_image_url"),                 // URL аватара
  createdAt: timestamp("created_at").defaultNow(),               // Время создания записи
  updatedAt: timestamp("updated_at").defaultNow(),               // Время последнего обновления
});

// Sponsors table
export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Receipts table (income)
export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  incomeSourceId: varchar("income_source_id").notNull().references(() => incomeSources.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual receipt items from specific sponsors
export const receiptItems = pgTable("receipt_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  comment: varchar("comment", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Номенклатура расходов - справочник названий расходов
export const expenseNomenclature = pgTable("expense_nomenclature", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Статьи расходов - категории расходов
export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Costs table (expenses) - структура как у поступлений
export const costs = pgTable("costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  expenseNomenclatureId: varchar("expense_nomenclature_id").notNull().references(() => expenseNomenclature.id, { onDelete: "cascade" }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  expenseCategoryId: varchar("expense_category_id").notNull().references(() => expenseCategories.id, { onDelete: "cascade" }),
  fundId: varchar("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Позиции расходов из номенклатуры
export const costItems = pgTable("cost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  costId: varchar("cost_id").notNull().references(() => costs.id, { onDelete: "cascade" }),
  expenseNomenclatureId: varchar("expense_nomenclature_id").notNull().references(() => expenseNomenclature.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sponsors: many(sponsors),
  receipts: many(receipts),
  costs: many(costs),
  funds: many(funds),
  incomeSources: many(incomeSources),
  expenseNomenclature: many(expenseNomenclature),
  expenseCategories: many(expenseCategories),
}));

export const sponsorsRelations = relations(sponsors, ({ one, many }) => ({
  user: one(users, {
    fields: [sponsors.userId],
    references: [users.id],
  }),
  receiptItems: many(receiptItems),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
  incomeSource: one(incomeSources, {
    fields: [receipts.incomeSourceId],
    references: [incomeSources.id],
  }),
  receiptItems: many(receiptItems),
  distributions: many(fundDistributions),
}));

// Funds table - represents different funds that receive distributed money
export const funds = pgTable("funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  initialBalance: decimal("initial_balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Income sources table with custom fund distribution
export const incomeSources = pgTable("income_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fund distribution for income sources
export const incomeSourceFundDistributions = pgTable("income_source_fund_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incomeSourceId: varchar("income_source_id").notNull().references(() => incomeSources.id, { onDelete: "cascade" }),
  fundId: varchar("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fund distributions table - tracks how much money each fund receives from receipts
export const fundDistributions = pgTable("fund_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  fundId: varchar("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fund transfers table - tracks money transfers between funds
export const fundTransfers = pgTable("fund_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromFundId: varchar("from_fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  toFundId: varchar("to_fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual fund distributions table - for distributing unallocated funds manually
export const manualFundDistributions = pgTable("manual_fund_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: varchar("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  description: varchar("description", { length: 500 }),
  date: timestamp("date").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const costsRelations = relations(costs, ({ one, many }) => ({
  user: one(users, {
    fields: [costs.userId],
    references: [users.id],
  }),
  expenseCategory: one(expenseCategories, {
    fields: [costs.expenseCategoryId],
    references: [expenseCategories.id],
  }),
  fund: one(funds, {
    fields: [costs.fundId],
    references: [funds.id],
  }),
  costItems: many(costItems),
}));

export const costItemsRelations = relations(costItems, ({ one }) => ({
  cost: one(costs, {
    fields: [costItems.costId],
    references: [costs.id],
  }),
  expenseNomenclature: one(expenseNomenclature, {
    fields: [costItems.expenseNomenclatureId],
    references: [expenseNomenclature.id],
  }),
}));

export const expenseNomenclatureRelations = relations(expenseNomenclature, ({ one, many }) => ({
  user: one(users, {
    fields: [expenseNomenclature.userId],
    references: [users.id],
  }),
  costItems: many(costItems),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  user: one(users, {
    fields: [expenseCategories.userId],
    references: [users.id],
  }),
  costs: many(costs),
}));



export const fundsRelations = relations(funds, ({ one, many }) => ({
  user: one(users, {
    fields: [funds.userId],
    references: [users.id],
  }),
  distributions: many(fundDistributions),
  incomeSourceDistributions: many(incomeSourceFundDistributions),
  transfersFrom: many(fundTransfers, { relationName: "fromFund" }),
  transfersTo: many(fundTransfers, { relationName: "toFund" }),
  manualDistributions: many(manualFundDistributions),
  costs: many(costs),
}));

export const fundDistributionsRelations = relations(fundDistributions, ({ one }) => ({
  receipt: one(receipts, {
    fields: [fundDistributions.receiptId],
    references: [receipts.id],
  }),
  fund: one(funds, {
    fields: [fundDistributions.fundId],
    references: [funds.id],
  }),
}));

// Income sources relations
export const incomeSourcesRelations = relations(incomeSources, ({ one, many }) => ({
  user: one(users, {
    fields: [incomeSources.userId],
    references: [users.id],
  }),
  receipts: many(receipts),
  fundDistributions: many(incomeSourceFundDistributions),
}));

// Income source fund distributions relations
export const incomeSourceFundDistributionsRelations = relations(incomeSourceFundDistributions, ({ one }) => ({
  incomeSource: one(incomeSources, {
    fields: [incomeSourceFundDistributions.incomeSourceId],
    references: [incomeSources.id],
  }),
  fund: one(funds, {
    fields: [incomeSourceFundDistributions.fundId],
    references: [funds.id],
  }),
}));

// Receipt items relations
export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  receipt: one(receipts, {
    fields: [receiptItems.receiptId],
    references: [receipts.id],
  }),
  sponsor: one(sponsors, {
    fields: [receiptItems.sponsorId],
    references: [sponsors.id],
  }),
}));

// Fund transfers relations
export const fundTransfersRelations = relations(fundTransfers, ({ one }) => ({
  fromFund: one(funds, {
    fields: [fundTransfers.fromFundId],
    references: [funds.id],
    relationName: "fromFund",
  }),
  toFund: one(funds, {
    fields: [fundTransfers.toFundId],
    references: [funds.id],
    relationName: "toFund",
  }),
  user: one(users, {
    fields: [fundTransfers.userId],
    references: [users.id],
  }),
}));

// Manual fund distributions relations
export const manualFundDistributionsRelations = relations(manualFundDistributions, ({ one }) => ({
  fund: one(funds, {
    fields: [manualFundDistributions.fundId],
    references: [funds.id],
  }),
  user: one(users, {
    fields: [manualFundDistributions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostSchema = createInsertSchema(costs).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertCostItemSchema = createInsertSchema(costItems).omit({
  id: true,
  costId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFundSchema = createInsertSchema(funds).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFundDistributionSchema = createInsertSchema(fundDistributions).omit({
  id: true,
  createdAt: true,
});

export const insertIncomeSourceSchema = createInsertSchema(incomeSources).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncomeSourceFundDistributionSchema = createInsertSchema(incomeSourceFundDistributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFundTransferSchema = createInsertSchema(fundTransfers).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertManualFundDistributionSchema = createInsertSchema(manualFundDistributions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertExpenseNomenclatureSchema = createInsertSchema(expenseNomenclature).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type CostItem = typeof costItems.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Cost = typeof costs.$inferSelect;
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Fund = typeof funds.$inferSelect;
export type InsertFund = z.infer<typeof insertFundSchema>;
export type FundDistribution = typeof fundDistributions.$inferSelect;
export type InsertFundDistribution = z.infer<typeof insertFundDistributionSchema>;
export type IncomeSource = typeof incomeSources.$inferSelect;
export type InsertIncomeSource = z.infer<typeof insertIncomeSourceSchema>;
export type IncomeSourceFundDistribution = typeof incomeSourceFundDistributions.$inferSelect;
export type InsertIncomeSourceFundDistribution = z.infer<typeof insertIncomeSourceFundDistributionSchema>;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;
export type FundTransfer = typeof fundTransfers.$inferSelect;
export type InsertFundTransfer = z.infer<typeof insertFundTransferSchema>;
export type ManualFundDistribution = typeof manualFundDistributions.$inferSelect;
export type InsertManualFundDistribution = z.infer<typeof insertManualFundDistributionSchema>;
export type ExpenseNomenclature = typeof expenseNomenclature.$inferSelect;
export type InsertExpenseNomenclature = z.infer<typeof insertExpenseNomenclatureSchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type InsertCostItem = z.infer<typeof insertCostItemSchema>;

// Distribution History table - tracks all fund distributions
export const distributionHistory = pgTable("distribution_history", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  distributionDate: timestamp("distribution_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Distribution History Items - individual distributions within a batch
export const distributionHistoryItems = pgTable("distribution_history_items", {
  id: varchar("id").primaryKey(),
  distributionId: varchar("distribution_id").notNull().references(() => distributionHistory.id, { onDelete: 'cascade' }),
  fundId: varchar("fund_id").notNull().references(() => funds.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const distributionHistoryRelations = relations(distributionHistory, ({ one, many }) => ({
  user: one(users, {
    fields: [distributionHistory.userId],
    references: [users.id],
  }),
  items: many(distributionHistoryItems),
}));

export const distributionHistoryItemsRelations = relations(distributionHistoryItems, ({ one }) => ({
  distribution: one(distributionHistory, {
    fields: [distributionHistoryItems.distributionId],
    references: [distributionHistory.id],
  }),
  fund: one(funds, {
    fields: [distributionHistoryItems.fundId],
    references: [funds.id],
  }),
}));

export const insertDistributionHistorySchema = createInsertSchema(distributionHistory).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDistributionHistoryItemSchema = createInsertSchema(distributionHistoryItems).omit({
  id: true,
  createdAt: true,
});

export type DistributionHistory = typeof distributionHistory.$inferSelect;
export type InsertDistributionHistory = z.infer<typeof insertDistributionHistorySchema>;
export type DistributionHistoryItem = typeof distributionHistoryItems.$inferSelect;
export type InsertDistributionHistoryItem = z.infer<typeof insertDistributionHistoryItemSchema>;
