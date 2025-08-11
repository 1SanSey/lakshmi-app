import { type IStorage } from "./storage";
import { 
  type User, 
  type UpsertUser, 
  type Sponsor, 
  type InsertSponsor, 
  type Receipt, 
  type InsertReceipt, 
  type Cost, 
  type InsertCost,
  type Fund,
  type InsertFund,
  type FundDistribution,
  type InsertFundDistribution
} from "@shared/schema";

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();
  private receipts: Map<string, Receipt> = new Map();
  private costs: Map<string, Cost> = new Map();
  private funds: Map<string, Fund> = new Map();
  private fundDistributions: Map<string, FundDistribution> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id: userId,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: this.users.get(userId)?.createdAt || now,
      updatedAt: now,
    };
    this.users.set(userId, user);
    return user;
  }

  // Sponsor operations
  async getSponsors(userId: string, search?: string): Promise<Sponsor[]> {
    let result = Array.from(this.sponsors.values()).filter(s => s.userId === userId);
    if (search) {
      result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }

  async getSponsor(id: string, userId: string): Promise<Sponsor | undefined> {
    const sponsor = this.sponsors.get(id);
    return sponsor && sponsor.userId === userId ? sponsor : undefined;
  }

  async createSponsor(sponsor: InsertSponsor, userId: string): Promise<Sponsor> {
    const id = `sponsor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newSponsor: Sponsor = {
      id,
      userId,
      name: sponsor.name,
      phone: sponsor.phone,
      isActive: sponsor.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.sponsors.set(id, newSponsor);
    return newSponsor;
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>, userId: string): Promise<Sponsor | undefined> {
    const existing = this.sponsors.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Sponsor = {
      ...existing,
      ...sponsor,
      updatedAt: new Date(),
    };
    this.sponsors.set(id, updated);
    return updated;
  }

  async deleteSponsor(id: string, userId: string): Promise<boolean> {
    const existing = this.sponsors.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.sponsors.delete(id);
  }

  // Receipt operations
  async getReceipts(userId: string, search?: string, fromDate?: Date, toDate?: Date): Promise<(Receipt & { sponsorName?: string })[]> {
    let userReceipts = Array.from(this.receipts.values()).filter(r => r.userId === userId);
    
    if (search) {
      userReceipts = userReceipts.filter(r => 
        r.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (fromDate) {
      userReceipts = userReceipts.filter(r => new Date(r.date) >= fromDate);
    }
    
    if (toDate) {
      userReceipts = userReceipts.filter(r => new Date(r.date) <= toDate);
    }
    
    return userReceipts.map(receipt => ({
      ...receipt,
      sponsorName: receipt.sponsorId ? this.sponsors.get(receipt.sponsorId)?.name : undefined,
    }));
  }

  async getReceipt(id: string, userId: string): Promise<Receipt | undefined> {
    const receipt = this.receipts.get(id);
    return receipt && receipt.userId === userId ? receipt : undefined;
  }

  async createReceipt(receipt: InsertReceipt, userId: string): Promise<Receipt> {
    const id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newReceipt: Receipt = {
      id,
      userId,
      date: receipt.date,
      description: receipt.description,
      amount: receipt.amount,
      sponsorId: receipt.sponsorId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.receipts.set(id, newReceipt);
    
    // Distribute funds for this receipt
    await this.distributeFundsForReceipt(id, receipt.amount, userId);
    
    return newReceipt;
  }

  async updateReceipt(id: string, receipt: Partial<InsertReceipt>, userId: string): Promise<Receipt | undefined> {
    const existing = this.receipts.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Receipt = {
      ...existing,
      ...receipt,
      updatedAt: new Date(),
    };
    this.receipts.set(id, updated);
    
    // Redistribute funds if amount changed
    if (receipt.amount) {
      await this.distributeFundsForReceipt(id, receipt.amount, userId);
    }
    
    return updated;
  }

  async deleteReceipt(id: string, userId: string): Promise<boolean> {
    const existing = this.receipts.get(id);
    if (!existing || existing.userId !== userId) return false;
    
    // Delete fund distributions
    await this.deleteFundDistributionsByReceipt(id);
    
    return this.receipts.delete(id);
  }

  // Cost operations
  async getCosts(userId: string, search?: string, category?: string, fromDate?: Date, toDate?: Date): Promise<Cost[]> {
    let result = Array.from(this.costs.values()).filter(c => c.userId === userId);
    
    if (search) {
      result = result.filter(c => c.description.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (category) {
      result = result.filter(c => c.category === category);
    }
    
    if (fromDate) {
      result = result.filter(c => new Date(c.date) >= fromDate);
    }
    
    if (toDate) {
      result = result.filter(c => new Date(c.date) <= toDate);
    }
    
    return result;
  }

  async getCost(id: string, userId: string): Promise<Cost | undefined> {
    const cost = this.costs.get(id);
    return cost && cost.userId === userId ? cost : undefined;
  }

  async createCost(cost: InsertCost, userId: string): Promise<Cost> {
    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newCost: Cost = {
      ...cost,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.costs.set(id, newCost);
    return newCost;
  }

  async updateCost(id: string, cost: Partial<InsertCost>, userId: string): Promise<Cost | undefined> {
    const existing = this.costs.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Cost = {
      ...existing,
      ...cost,
      updatedAt: new Date(),
    };
    this.costs.set(id, updated);
    return updated;
  }

  async deleteCost(id: string, userId: string): Promise<boolean> {
    const existing = this.costs.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.costs.delete(id);
  }

  // Fund operations
  async getFunds(userId: string): Promise<Fund[]> {
    return Array.from(this.funds.values()).filter(f => f.userId === userId);
  }

  async createFund(fund: InsertFund, userId: string): Promise<Fund> {
    const id = `fund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newFund: Fund = {
      id,
      userId,
      name: fund.name,
      description: fund.description || null,
      percentage: fund.percentage,
      isActive: fund.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.funds.set(id, newFund);
    return newFund;
  }

  async updateFund(id: string, fund: Partial<InsertFund>, userId: string): Promise<Fund | undefined> {
    const existing = this.funds.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Fund = {
      ...existing,
      ...fund,
      updatedAt: new Date(),
    };
    this.funds.set(id, updated);
    return updated;
  }

  async deleteFund(id: string, userId: string): Promise<boolean> {
    const existing = this.funds.get(id);
    if (!existing || existing.userId !== userId) return false;
    
    // Delete all distributions for this fund
    const distributionsToDelete = Array.from(this.fundDistributions.entries())
      .filter(([_, dist]) => dist.fundId === id)
      .map(([key, _]) => key);
    
    distributionsToDelete.forEach(key => this.fundDistributions.delete(key));
    
    return this.funds.delete(id);
  }

  async getFund(id: string, userId: string): Promise<Fund | undefined> {
    const fund = this.funds.get(id);
    return fund && fund.userId === userId ? fund : undefined;
  }

  // Fund distribution operations
  async createFundDistribution(distribution: InsertFundDistribution): Promise<FundDistribution> {
    const id = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newDistribution: FundDistribution = {
      ...distribution,
      id,
      createdAt: now,
    };
    this.fundDistributions.set(id, newDistribution);
    return newDistribution;
  }

  async getFundDistributionsByReceipt(receiptId: string): Promise<(FundDistribution & { fundName: string })[]> {
    const distributions = Array.from(this.fundDistributions.values())
      .filter(d => d.receiptId === receiptId);
    
    return distributions.map(dist => ({
      ...dist,
      fundName: this.funds.get(dist.fundId)?.name || 'Unknown Fund',
    }));
  }

  async deleteFundDistributionsByReceipt(receiptId: string): Promise<void> {
    const keysToDelete = Array.from(this.fundDistributions.entries())
      .filter(([_, dist]) => dist.receiptId === receiptId)
      .map(([key, _]) => key);
    
    keysToDelete.forEach(key => this.fundDistributions.delete(key));
  }

  async distributeFundsForReceipt(receiptId: string, receiptAmount: string, userId: string): Promise<void> {
    // Get all active funds for the user
    const activeFunds = Array.from(this.funds.values())
      .filter(f => f.userId === userId && f.isActive);

    // Delete existing distributions for this receipt
    await this.deleteFundDistributionsByReceipt(receiptId);

    // Calculate and create new distributions
    const amount = parseFloat(receiptAmount);
    
    for (const fund of activeFunds) {
      const percentage = parseFloat(fund.percentage);
      const distributionAmount = (amount * percentage) / 100;
      
      await this.createFundDistribution({
        receiptId,
        fundId: fund.id,
        amount: distributionAmount.toString(),
        percentage: fund.percentage,
      });
    }
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    totalReceipts: number;
    totalCosts: number;
    netBalance: number;
    activeSponsors: number;
    activeFunds: number;
    totalFundPercentage: number;
  }> {
    const userReceipts = Array.from(this.receipts.values()).filter(r => r.userId === userId);
    const userCosts = Array.from(this.costs.values()).filter(c => c.userId === userId);
    const activeSponsors = Array.from(this.sponsors.values()).filter(s => s.userId === userId && s.isActive);
    const activeFunds = Array.from(this.funds.values()).filter(f => f.userId === userId && f.isActive);

    const totalReceipts = userReceipts.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalCosts = userCosts.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalFundPercentage = activeFunds.reduce((sum, f) => sum + parseFloat(f.percentage), 0);

    return {
      totalReceipts,
      totalCosts,
      netBalance: totalReceipts - totalCosts,
      activeSponsors: activeSponsors.length,
      activeFunds: activeFunds.length,
      totalFundPercentage,
    };
  }

  async getRecentActivity(userId: string, limit = 5): Promise<{
    recentReceipts: (Receipt & { sponsorName?: string })[];
    recentCosts: Cost[];
  }> {
    const userReceipts = Array.from(this.receipts.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit)
      .map(receipt => ({
        ...receipt,
        sponsorName: receipt.sponsorId ? this.sponsors.get(receipt.sponsorId)?.name : undefined,
      }));

    const userCosts = Array.from(this.costs.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);

    return {
      recentReceipts: userReceipts,
      recentCosts: userCosts,
    };
  }
}

export const memStorage = new MemStorage();