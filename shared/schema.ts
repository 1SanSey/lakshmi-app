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
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  sponsorId: varchar("sponsor_id").references(() => sponsors.id, { onDelete: "set null" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
}));

export const sponsorsRelations = relations(sponsors, ({ one, many }) => ({
  user: one(users, {
    fields: [sponsors.userId],
    references: [users.id],
  }),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
  sponsor: one(sponsors, {
    fields: [receipts.sponsorId],
    references: [sponsors.id],
  }),
  distributions: many(fundDistributions),
}));

// Funds table - represents different funds that receive distributed money
export const funds = pgTable("funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 25.50 for 25.5%
  isActive: boolean("is_active").default(true),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
