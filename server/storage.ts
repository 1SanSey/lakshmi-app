import {
  users,
  sponsors,
  receipts,
  costs,
  type User,
  type UpsertUser,
  type Sponsor,
  type InsertSponsor,
  type Receipt,
  type InsertReceipt,
  type Cost,
  type InsertCost,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, gte, lte, count, sum } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Sponsor operations
  getSponsors(userId: string, search?: string): Promise<Sponsor[]>;
  getSponsor(id: string, userId: string): Promise<Sponsor | undefined>;
  createSponsor(sponsor: InsertSponsor, userId: string): Promise<Sponsor>;
  updateSponsor(id: string, sponsor: Partial<InsertSponsor>, userId: string): Promise<Sponsor | undefined>;
  deleteSponsor(id: string, userId: string): Promise<boolean>;
  
  // Receipt operations
  getReceipts(userId: string, search?: string, fromDate?: Date, toDate?: Date): Promise<(Receipt & { sponsorName?: string })[]>;
  getReceipt(id: string, userId: string): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt, userId: string): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>, userId: string): Promise<Receipt | undefined>;
  deleteReceipt(id: string, userId: string): Promise<boolean>;
  
  // Cost operations
  getCosts(userId: string, search?: string, category?: string, fromDate?: Date, toDate?: Date): Promise<Cost[]>;
  getCost(id: string, userId: string): Promise<Cost | undefined>;
  createCost(cost: InsertCost, userId: string): Promise<Cost>;
  updateCost(id: string, cost: Partial<InsertCost>, userId: string): Promise<Cost | undefined>;
  deleteCost(id: string, userId: string): Promise<boolean>;
  
  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    totalReceipts: number;
    totalCosts: number;
    netBalance: number;
    activeSponsors: number;
  }>;
  
  getRecentActivity(userId: string, limit?: number): Promise<{
    recentReceipts: (Receipt & { sponsorName?: string })[];
    recentCosts: Cost[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Sponsor operations
  async getSponsors(userId: string, search?: string): Promise<Sponsor[]> {
    const conditions = [eq(sponsors.userId, userId)];
    
    if (search) {
      conditions.push(ilike(sponsors.name, `%${search}%`));
    }
    
    return await db
      .select()
      .from(sponsors)
      .where(and(...conditions))
      .orderBy(desc(sponsors.createdAt));
  }

  async getSponsor(id: string, userId: string): Promise<Sponsor | undefined> {
    const [sponsor] = await db
      .select()
      .from(sponsors)
      .where(and(eq(sponsors.id, id), eq(sponsors.userId, userId)));
    return sponsor;
  }

  async createSponsor(sponsor: InsertSponsor, userId: string): Promise<Sponsor> {
    const [newSponsor] = await db
      .insert(sponsors)
      .values({ ...sponsor, userId })
      .returning();
    return newSponsor;
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>, userId: string): Promise<Sponsor | undefined> {
    const [updatedSponsor] = await db
      .update(sponsors)
      .set({ ...sponsor, updatedAt: new Date() })
      .where(and(eq(sponsors.id, id), eq(sponsors.userId, userId)))
      .returning();
    return updatedSponsor;
  }

  async deleteSponsor(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(sponsors)
      .where(and(eq(sponsors.id, id), eq(sponsors.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Receipt operations
  async getReceipts(
    userId: string, 
    search?: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<(Receipt & { sponsorName?: string })[]> {
    const conditions = [eq(receipts.userId, userId)];
    
    if (search) {
      conditions.push(ilike(receipts.description, `%${search}%`));
    }
    
    if (fromDate) {
      conditions.push(gte(receipts.date, fromDate));
    }
    
    if (toDate) {
      conditions.push(lte(receipts.date, toDate));
    }
    
    const result = await db
      .select({
        id: receipts.id,
        date: receipts.date,
        description: receipts.description,
        amount: receipts.amount,
        sponsorId: receipts.sponsorId,
        userId: receipts.userId,
        createdAt: receipts.createdAt,
        updatedAt: receipts.updatedAt,
        sponsorName: sponsors.name,
      })
      .from(receipts)
      .leftJoin(sponsors, eq(receipts.sponsorId, sponsors.id))
      .where(and(...conditions))
      .orderBy(desc(receipts.date));
    
    return result.map(item => ({
      ...item,
      sponsorName: item.sponsorName ?? undefined
    }));
  }

  async getReceipt(id: string, userId: string): Promise<Receipt | undefined> {
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.userId, userId)));
    return receipt;
  }

  async createReceipt(receipt: InsertReceipt, userId: string): Promise<Receipt> {
    const [newReceipt] = await db
      .insert(receipts)
      .values({ ...receipt, userId })
      .returning();
    return newReceipt;
  }

  async updateReceipt(id: string, receipt: Partial<InsertReceipt>, userId: string): Promise<Receipt | undefined> {
    const [updatedReceipt] = await db
      .update(receipts)
      .set({ ...receipt, updatedAt: new Date() })
      .where(and(eq(receipts.id, id), eq(receipts.userId, userId)))
      .returning();
    return updatedReceipt;
  }

  async deleteReceipt(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Cost operations
  async getCosts(
    userId: string, 
    search?: string, 
    category?: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<Cost[]> {
    const conditions = [eq(costs.userId, userId)];
    
    if (search) {
      conditions.push(ilike(costs.description, `%${search}%`));
    }
    
    if (category) {
      conditions.push(eq(costs.category, category));
    }
    
    if (fromDate) {
      conditions.push(gte(costs.date, fromDate));
    }
    
    if (toDate) {
      conditions.push(lte(costs.date, toDate));
    }
    
    return await db
      .select()
      .from(costs)
      .where(and(...conditions))
      .orderBy(desc(costs.date));
  }

  async getCost(id: string, userId: string): Promise<Cost | undefined> {
    const [cost] = await db
      .select()
      .from(costs)
      .where(and(eq(costs.id, id), eq(costs.userId, userId)));
    return cost;
  }

  async createCost(cost: InsertCost, userId: string): Promise<Cost> {
    const [newCost] = await db
      .insert(costs)
      .values({ ...cost, userId })
      .returning();
    return newCost;
  }

  async updateCost(id: string, cost: Partial<InsertCost>, userId: string): Promise<Cost | undefined> {
    const [updatedCost] = await db
      .update(costs)
      .set({ ...cost, updatedAt: new Date() })
      .where(and(eq(costs.id, id), eq(costs.userId, userId)))
      .returning();
    return updatedCost;
  }

  async deleteCost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(costs)
      .where(and(eq(costs.id, id), eq(costs.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    totalReceipts: number;
    totalCosts: number;
    netBalance: number;
    activeSponsors: number;
  }> {
    const [receiptStats] = await db
      .select({ 
        total: sum(receipts.amount).mapWith(Number) 
      })
      .from(receipts)
      .where(eq(receipts.userId, userId));

    const [costStats] = await db
      .select({ 
        total: sum(costs.amount).mapWith(Number) 
      })
      .from(costs)
      .where(eq(costs.userId, userId));

    const [sponsorStats] = await db
      .select({ 
        count: count() 
      })
      .from(sponsors)
      .where(and(eq(sponsors.userId, userId), eq(sponsors.isActive, true)));

    const totalReceipts = receiptStats?.total || 0;
    const totalCosts = costStats?.total || 0;

    return {
      totalReceipts,
      totalCosts,
      netBalance: totalReceipts - totalCosts,
      activeSponsors: sponsorStats?.count || 0,
    };
  }

  async getRecentActivity(userId: string, limit = 5): Promise<{
    recentReceipts: (Receipt & { sponsorName?: string })[];
    recentCosts: Cost[];
  }> {
    const recentReceipts = await db
      .select({
        id: receipts.id,
        date: receipts.date,
        description: receipts.description,
        amount: receipts.amount,
        sponsorId: receipts.sponsorId,
        userId: receipts.userId,
        createdAt: receipts.createdAt,
        updatedAt: receipts.updatedAt,
        sponsorName: sponsors.name,
      })
      .from(receipts)
      .leftJoin(sponsors, eq(receipts.sponsorId, sponsors.id))
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.createdAt))
      .limit(limit);

    const recentCosts = await db
      .select()
      .from(costs)
      .where(eq(costs.userId, userId))
      .orderBy(desc(costs.createdAt))
      .limit(limit);

    return {
      recentReceipts: recentReceipts.map(item => ({
        ...item,
        sponsorName: item.sponsorName ?? undefined
      })),
      recentCosts,
    };
  }
}

export const storage = new DatabaseStorage();
