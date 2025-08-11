import { type IStorage } from "./storage";
import { 
  type User, 
  type UpsertUser, 
  type Sponsor, 
  type InsertSponsor, 
  type Receipt, 
  type InsertReceipt,
  type ReceiptItem,
  type InsertReceiptItem,
  type Cost, 
  type InsertCost,
  type Fund,
  type InsertFund,
  type FundDistribution,
  type InsertFundDistribution,
  type FundTransfer,
  type InsertFundTransfer,
  type IncomeSource,
  type InsertIncomeSource,
  type IncomeSourceFundDistribution,
  type InsertIncomeSourceFundDistribution
} from "@shared/schema";

export class NewMemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();
  private receipts: Map<string, Receipt> = new Map();
  private receiptItems: Map<string, ReceiptItem> = new Map();
  private costs: Map<string, Cost> = new Map();
  private funds: Map<string, Fund> = new Map();
  private fundDistributions: Map<string, FundDistribution> = new Map();
  private fundTransfers: Map<string, FundTransfer> = new Map();
  private incomeSources: Map<string, IncomeSource> = new Map();
  private incomeSourceFundDistributions: Map<string, IncomeSourceFundDistribution> = new Map();

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

  // Receipt operations (new architecture)
  async getReceipts(
    userId: string, 
    search?: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<(Receipt & { sponsorName?: string })[]> {
    let result = Array.from(this.receipts.values()).filter(r => r.userId === userId);
    
    if (search) {
      result = result.filter(r => r.description.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (fromDate) {
      result = result.filter(r => r.date >= fromDate);
    }
    
    if (toDate) {
      result = result.filter(r => r.date <= toDate);
    }
    
    // Note: sponsorName will be undefined in new architecture as receipts are linked to income sources
    return result.map(receipt => ({
      ...receipt,
      sponsorName: undefined
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
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
      incomeSourceId: receipt.incomeSourceId,
      createdAt: now,
      updatedAt: now,
    };
    this.receipts.set(id, newReceipt);
    
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
    
    return updated;
  }

  async deleteReceipt(id: string, userId: string): Promise<boolean> {
    const existing = this.receipts.get(id);
    if (!existing || existing.userId !== userId) return false;
    
    // Delete associated receipt items
    const receiptItemsToDelete = Array.from(this.receiptItems.values())
      .filter(item => item.receiptId === id);
    receiptItemsToDelete.forEach(item => this.receiptItems.delete(item.id));
    
    // Delete fund distributions
    const distributionsToDelete = Array.from(this.fundDistributions.values())
      .filter(dist => dist.receiptId === id);
    distributionsToDelete.forEach(dist => this.fundDistributions.delete(dist.id));
    
    return this.receipts.delete(id);
  }

  // Cost operations
  async getCosts(
    userId: string, 
    search?: string, 
    category?: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<Cost[]> {
    let result = Array.from(this.costs.values()).filter(c => c.userId === userId);
    
    if (search) {
      result = result.filter(c => c.description.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (category) {
      result = result.filter(c => c.category === category);
    }
    
    if (fromDate) {
      result = result.filter(c => c.date >= fromDate);
    }
    
    if (toDate) {
      result = result.filter(c => c.date <= toDate);
    }
    
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getCost(id: string, userId: string): Promise<Cost | undefined> {
    const cost = this.costs.get(id);
    return cost && cost.userId === userId ? cost : undefined;
  }

  async createCost(cost: InsertCost, userId: string): Promise<Cost> {
    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newCost: Cost = {
      id,
      userId,
      date: cost.date,
      description: cost.description,
      amount: cost.amount,
      category: cost.category,
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

  // Fund operations (no percentage distribution)
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
    return this.funds.delete(id);
  }

  async getFund(id: string, userId: string): Promise<Fund | undefined> {
    const fund = this.funds.get(id);
    return fund && fund.userId === userId ? fund : undefined;
  }

  // Income source operations
  async getIncomeSources(userId: string): Promise<IncomeSource[]> {
    return Array.from(this.incomeSources.values()).filter(s => s.userId === userId);
  }

  async createIncomeSource(incomeSource: InsertIncomeSource, userId: string): Promise<IncomeSource> {
    const id = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newIncomeSource: IncomeSource = {
      id,
      userId,
      name: incomeSource.name,
      description: incomeSource.description || null,
      isActive: incomeSource.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.incomeSources.set(id, newIncomeSource);
    return newIncomeSource;
  }

  async updateIncomeSource(id: string, incomeSource: Partial<InsertIncomeSource>, userId: string): Promise<IncomeSource | undefined> {
    const existing = this.incomeSources.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: IncomeSource = {
      ...existing,
      ...incomeSource,
      updatedAt: new Date(),
    };
    this.incomeSources.set(id, updated);
    return updated;
  }

  async deleteIncomeSource(id: string, userId: string): Promise<boolean> {
    const existing = this.incomeSources.get(id);
    if (!existing || existing.userId !== userId) return false;
    
    // Delete associated fund distributions
    const distributionsToDelete = Array.from(this.incomeSourceFundDistributions.values())
      .filter(dist => dist.incomeSourceId === id);
    distributionsToDelete.forEach(dist => this.incomeSourceFundDistributions.delete(dist.id));
    
    return this.incomeSources.delete(id);
  }

  async getIncomeSource(id: string, userId: string): Promise<IncomeSource | undefined> {
    const incomeSource = this.incomeSources.get(id);
    return incomeSource && incomeSource.userId === userId ? incomeSource : undefined;
  }

  // Income source fund distribution operations
  async createIncomeSourceFundDistribution(distribution: InsertIncomeSourceFundDistribution): Promise<IncomeSourceFundDistribution> {
    const id = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newDistribution: IncomeSourceFundDistribution = {
      id,
      incomeSourceId: distribution.incomeSourceId,
      fundId: distribution.fundId,
      percentage: distribution.percentage,
      createdAt: now,
      updatedAt: now,
    };
    this.incomeSourceFundDistributions.set(id, newDistribution);
    return newDistribution;
  }

  async getIncomeSourceFundDistributions(incomeSourceId: string): Promise<(IncomeSourceFundDistribution & { fundName: string })[]> {
    const distributions = Array.from(this.incomeSourceFundDistributions.values())
      .filter(dist => dist.incomeSourceId === incomeSourceId);
    
    return distributions.map(dist => ({
      ...dist,
      fundName: this.funds.get(dist.fundId)?.name || 'Unknown Fund'
    }));
  }

  async deleteIncomeSourceFundDistributions(incomeSourceId: string): Promise<boolean> {
    const distributionsToDelete = Array.from(this.incomeSourceFundDistributions.values())
      .filter(dist => dist.incomeSourceId === incomeSourceId);
    
    distributionsToDelete.forEach(dist => this.incomeSourceFundDistributions.delete(dist.id));
    return true;
  }

  // Receipt item operations
  async createReceiptItem(receiptItem: InsertReceiptItem): Promise<ReceiptItem> {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newReceiptItem: ReceiptItem = {
      id,
      receiptId: receiptItem.receiptId,
      sponsorId: receiptItem.sponsorId,
      amount: receiptItem.amount,
      comment: receiptItem.comment || null,
      createdAt: now,
      updatedAt: now,
    };
    this.receiptItems.set(id, newReceiptItem);
    return newReceiptItem;
  }

  async getReceiptItems(receiptId: string): Promise<(ReceiptItem & { sponsorName: string })[]> {
    const items = Array.from(this.receiptItems.values())
      .filter(item => item.receiptId === receiptId);
    
    return items.map(item => ({
      ...item,
      sponsorName: this.sponsors.get(item.sponsorId)?.name || 'Unknown Sponsor'
    }));
  }

  async deleteReceiptItems(receiptId: string): Promise<boolean> {
    const itemsToDelete = Array.from(this.receiptItems.values())
      .filter(item => item.receiptId === receiptId);
    
    itemsToDelete.forEach(item => this.receiptItems.delete(item.id));
    return true;
  }

  // Fund distribution operations
  async createFundDistribution(distribution: InsertFundDistribution): Promise<FundDistribution> {
    const id = `fundDist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newDistribution: FundDistribution = {
      id,
      receiptId: distribution.receiptId,
      fundId: distribution.fundId,
      amount: distribution.amount,
      percentage: distribution.percentage,
      createdAt: now,
    };
    this.fundDistributions.set(id, newDistribution);
    return newDistribution;
  }

  async getFundDistributionsByReceipt(receiptId: string): Promise<(FundDistribution & { fundName: string })[]> {
    const distributions = Array.from(this.fundDistributions.values())
      .filter(dist => dist.receiptId === receiptId);
    
    return distributions.map(dist => ({
      ...dist,
      fundName: this.funds.get(dist.fundId)?.name || 'Unknown Fund'
    }));
  }

  async deleteFundDistributionsByReceipt(receiptId: string): Promise<void> {
    const distributionsToDelete = Array.from(this.fundDistributions.values())
      .filter(dist => dist.receiptId === receiptId);
    
    distributionsToDelete.forEach(dist => this.fundDistributions.delete(dist.id));
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
    const userSponsors = Array.from(this.sponsors.values()).filter(s => s.userId === userId && s.isActive);
    const userFunds = Array.from(this.funds.values()).filter(f => f.userId === userId && f.isActive);

    // Calculate total receipts amount by summing receipt items
    const totalReceiptsAmount = userReceipts.reduce((sum, receipt) => {
      const receiptItemsSum = Array.from(this.receiptItems.values())
        .filter(item => item.receiptId === receipt.id)
        .reduce((itemSum, item) => itemSum + parseFloat(item.amount), 0);
      return sum + receiptItemsSum;
    }, 0);

    const totalCostsAmount = userCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

    return {
      totalReceipts: totalReceiptsAmount,
      totalCosts: totalCostsAmount,
      netBalance: totalReceiptsAmount - totalCostsAmount,
      activeSponsors: userSponsors.length,
      activeFunds: userFunds.length,
      totalFundPercentage: 0 // Not applicable in new architecture
    };
  }

  async getRecentActivity(userId: string, limit: number = 10): Promise<{
    recentReceipts: (Receipt & { sponsorName?: string })[];
    recentCosts: Cost[];
  }> {
    const userReceipts = Array.from(this.receipts.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit)
      .map(receipt => ({
        ...receipt,
        sponsorName: undefined as string | undefined
      }));

    const userCosts = Array.from(this.costs.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);

    return {
      recentReceipts: userReceipts,
      recentCosts: userCosts
    };
  }

  // Fund transfer operations
  async createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer> {
    const id = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newTransfer: FundTransfer = {
      id,
      fromFundId: transfer.fromFundId,
      toFundId: transfer.toFundId,
      amount: transfer.amount,
      description: transfer.description || null,
      userId: transfer.userId,
      createdAt: now,
    };
    this.fundTransfers.set(id, newTransfer);
    return newTransfer;
  }

  async getFundTransfers(userId: string): Promise<(FundTransfer & { fromFundName: string; toFundName: string })[]> {
    const transfers = Array.from(this.fundTransfers.values())
      .filter(transfer => transfer.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return transfers.map(transfer => ({
      ...transfer,
      fromFundName: this.funds.get(transfer.fromFundId)?.name || 'Unknown Fund',
      toFundName: this.funds.get(transfer.toFundId)?.name || 'Unknown Fund'
    }));
  }

  async deleteFundTransfer(id: string): Promise<boolean> {
    return this.fundTransfers.delete(id);
  }

  // Fund balance calculations
  async getFundBalance(fundId: string): Promise<number> {
    const fund = this.funds.get(fundId);
    if (!fund) return 0;

    let balance = parseFloat(fund.initialBalance || "0");

    // Add money from fund distributions (receipts)
    const distributions = Array.from(this.fundDistributions.values())
      .filter(dist => dist.fundId === fundId);
    balance += distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

    // Add money transferred TO this fund
    const transfersTo = Array.from(this.fundTransfers.values())
      .filter(transfer => transfer.toFundId === fundId);
    balance += transfersTo.reduce((sum, transfer) => sum + parseFloat(transfer.amount), 0);

    // Subtract money transferred FROM this fund
    const transfersFrom = Array.from(this.fundTransfers.values())
      .filter(transfer => transfer.fromFundId === fundId);
    balance -= transfersFrom.reduce((sum, transfer) => sum + parseFloat(transfer.amount), 0);

    return balance;
  }

  async getFundsWithBalances(userId: string): Promise<(Fund & { balance: number })[]> {
    const userFunds = Array.from(this.funds.values())
      .filter(fund => fund.userId === userId);
    
    const fundsWithBalances = await Promise.all(
      userFunds.map(async (fund) => ({
        ...fund,
        balance: await this.getFundBalance(fund.id)
      }))
    );

    return fundsWithBalances;
  }
}

export const newMemStorage = new NewMemStorage();