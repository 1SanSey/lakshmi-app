import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Costs table (expenses)
export const costs = pgTable("costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Funds table - represents different funds that receive distributed money (removed percentage)
export const funds = pgTable("funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
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

export const costsRelations = relations(costs, ({ one }) => ({
  user: one(users, {
    fields: [costs.userId],
    references: [users.id],
  }),
}));

export const fundsRelations = relations(funds, ({ one, many }) => ({
  user: one(users, {
    fields: [funds.userId],
    references: [users.id],
  }),
  distributions: many(fundDistributions),
  incomeSourceDistributions: many(incomeSourceFundDistributions),
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
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
