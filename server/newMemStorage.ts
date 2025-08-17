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
  type CostItem,
  type InsertCostItem,
  type Fund,
  type InsertFund,
  type FundDistribution,
  type InsertFundDistribution,
  type FundTransfer,
  type InsertFundTransfer,
  type IncomeSource,
  type InsertIncomeSource,
  type IncomeSourceFundDistribution,
  type InsertIncomeSourceFundDistribution,
  type ManualFundDistribution,
  type InsertManualFundDistribution,
  type DistributionHistory,
  type InsertDistributionHistory,
  type DistributionHistoryItem,
  type InsertDistributionHistoryItem,
  type ExpenseNomenclature,
  type InsertExpenseNomenclature,
  type ExpenseCategory,
  type InsertExpenseCategory
} from "@shared/schema";

export class NewMemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();
  private receipts: Map<string, Receipt> = new Map();
  private receiptItems: Map<string, ReceiptItem> = new Map();
  private costs: Map<string, Cost> = new Map();
  private costItems: Map<string, CostItem> = new Map();
  private funds: Map<string, Fund> = new Map();
  private fundDistributions: Map<string, FundDistribution> = new Map();
  private fundTransfers: Map<string, FundTransfer> = new Map();
  private incomeSources: Map<string, IncomeSource> = new Map();
  private incomeSourceFundDistributions: Map<string, IncomeSourceFundDistribution> = new Map();
  private manualFundDistributions: Map<string, ManualFundDistribution> = new Map();
  private distributionHistory: Map<string, DistributionHistory> = new Map();
  private distributionHistoryItems: Map<string, DistributionHistoryItem> = new Map();
  private expenseNomenclature: Map<string, ExpenseNomenclature> = new Map();
  private expenseCategories: Map<string, ExpenseCategory> = new Map();

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
    
    // Return income source name instead of sponsor name
    return result.map(receipt => ({
      ...receipt,
      sponsorName: this.incomeSources.get(receipt.incomeSourceId)?.name
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getReceiptsPaginated(
    userId: string, 
    search?: string, 
    fromDate?: Date, 
    toDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: (Receipt & { sponsorName?: string })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Получаем все записи с фильтрацией
    const allReceipts = await this.getReceipts(userId, search, fromDate, toDate);
    
    // Применяем пагинацию
    const total = allReceipts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allReceipts.slice(offset, offset + limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
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

  // Cost operations - новая структура
  async getCosts(
    userId: string, 
    search?: string, 
    expenseCategoryId?: string, 
    fromDate?: Date, 
    toDate?: Date
  ): Promise<(Cost & { expenseCategoryName?: string; items?: (CostItem & { nomenclatureName?: string })[] })[]> {
    let result = Array.from(this.costs.values()).filter(c => c.userId === userId);
    
    if (search) {
      result = result.filter(c => c.description.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (expenseCategoryId) {
      result = result.filter(c => c.expenseCategoryId === expenseCategoryId);
    }
    
    if (fromDate) {
      result = result.filter(c => c.date >= fromDate);
    }
    
    if (toDate) {
      result = result.filter(c => c.date <= toDate);
    }
    
    // Добавляем информацию о категории и позициях
    return result.map(cost => {
      const category = this.expenseCategories.get(cost.expenseCategoryId);
      const items = Array.from(this.costItems.values())
        .filter(item => item.costId === cost.id)
        .map(item => {
          const nomenclature = this.expenseNomenclature.get(item.expenseNomenclatureId);
          return {
            ...item,
            nomenclatureName: nomenclature?.name
          };
        });
        
      return {
        ...cost,
        expenseCategoryName: category?.name,
        items
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getCostsPaginated(
    userId: string, 
    search?: string, 
    expenseCategoryId?: string, 
    fromDate?: Date, 
    toDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: (Cost & { expenseCategoryName?: string; items?: (CostItem & { nomenclatureName?: string })[] })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const allCosts = await this.getCosts(userId, search, expenseCategoryId, fromDate, toDate);
    
    const total = allCosts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allCosts.slice(offset, offset + limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getCost(id: string, userId: string): Promise<Cost | undefined> {
    const cost = this.costs.get(id);
    return cost && cost.userId === userId ? cost : undefined;
  }

  async createCost(cost: InsertCost, userId: string): Promise<Cost> {
    // Check if the fund exists and has enough balance
    const fund = this.funds.get(cost.fundId);
    if (!fund || fund.userId !== userId) {
      throw new Error("Фонд не найден");
    }

    const currentBalance = await this.getFundBalance(cost.fundId);
    const costAmount = parseFloat(cost.totalAmount.toString());
    
    if (currentBalance < costAmount) {
      throw new Error(`Недостаточно средств в фонде "${fund.name}". Доступно: ${currentBalance.toLocaleString('ru-RU')}₽, требуется: ${costAmount.toLocaleString('ru-RU')}₽`);
    }

    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newCost: Cost = {
      id,
      userId,
      date: cost.date,
      expenseNomenclatureId: cost.expenseNomenclatureId,
      expenseCategoryId: cost.expenseCategoryId,
      fundId: cost.fundId,
      totalAmount: costAmount.toString(),
      createdAt: now,
      updatedAt: now,
    };
    this.costs.set(id, newCost);
    return newCost;
  }

  async updateCost(id: string, cost: Partial<InsertCost>, userId: string): Promise<Cost | undefined> {
    const existing = this.costs.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    // If fundId or totalAmount is being updated, check fund balance
    if (cost.fundId || cost.totalAmount) {
      const fundId = cost.fundId || existing.fundId;
      const fund = this.funds.get(fundId);
      if (!fund || fund.userId !== userId) {
        throw new Error("Фонд не найден");
      }

      const newAmount = cost.totalAmount ? parseFloat(cost.totalAmount.toString()) : parseFloat(existing.totalAmount.toString());
      const oldAmount = parseFloat(existing.totalAmount.toString());
      const currentBalance = await this.getFundBalance(fundId);
      
      // Calculate new balance if this cost was already deducted
      const balanceWithOldCost = fundId === existing.fundId ? currentBalance + oldAmount : currentBalance;
      
      if (balanceWithOldCost < newAmount) {
        throw new Error(`Недостаточно средств в фонде "${fund.name}". Доступно: ${balanceWithOldCost.toLocaleString('ru-RU')}₽, требуется: ${newAmount.toLocaleString('ru-RU')}₽`);
      }
    }
    
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
    
    // Delete associated cost items
    const costItemsToDelete = Array.from(this.costItems.values())
      .filter(item => item.costId === id);
    costItemsToDelete.forEach(item => this.costItems.delete(item.id));
    
    return this.costs.delete(id);
  }

  // Cost Items operations
  async getCostItems(costId: string): Promise<(CostItem & { nomenclatureName?: string })[]> {
    const items = Array.from(this.costItems.values())
      .filter(item => item.costId === costId);
      
    return items.map(item => {
      const nomenclature = this.expenseNomenclature.get(item.expenseNomenclatureId);
      return {
        ...item,
        nomenclatureName: nomenclature?.name
      };
    });
  }

  async createCostItem(costItem: InsertCostItem, costId: string): Promise<CostItem> {
    const id = `cost_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newCostItem: CostItem = {
      id,
      costId,
      expenseNomenclatureId: costItem.expenseNomenclatureId,
      quantity: costItem.quantity,
      unitPrice: costItem.unitPrice,
      amount: costItem.amount,
      description: costItem.description,
      createdAt: now,
      updatedAt: now,
    };
    this.costItems.set(id, newCostItem);
    return newCostItem;
  }

  async updateCostItem(id: string, costItem: Partial<InsertCostItem>): Promise<CostItem | undefined> {
    const existing = this.costItems.get(id);
    if (!existing) return undefined;
    
    const updated: CostItem = {
      ...existing,
      ...costItem,
      updatedAt: new Date(),
    };
    this.costItems.set(id, updated);
    return updated;
  }

  async deleteCostItem(id: string): Promise<boolean> {
    return this.costItems.delete(id);
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
      initialBalance: fund.initialBalance || "0",
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
  async createReceiptItem(receiptItem: InsertReceiptItem, userId?: string): Promise<ReceiptItem> {
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

  async deleteReceiptItems(receiptId: string): Promise<void> {
    const itemsToDelete = Array.from(this.receiptItems.values())
      .filter(item => item.receiptId === receiptId);
    
    itemsToDelete.forEach(item => this.receiptItems.delete(item.id));
  }

  async distributeFundsForReceiptByIncomeSource(receiptId: string, amount: number, incomeSourceId: string, userId: string): Promise<void> {
    // Remove existing distributions for this receipt
    const existingDistributions = Array.from(this.fundDistributions.values())
      .filter(d => d.receiptId === receiptId);
    existingDistributions.forEach(d => this.fundDistributions.delete(d.id));
    
    // Get fund distributions for this income source
    const incomeSourceDistributions = Array.from(this.incomeSourceFundDistributions.values())
      .filter(d => d.incomeSourceId === incomeSourceId);
    
    if (incomeSourceDistributions.length === 0) {
      // No distribution configured for this income source
      return;
    }
    
    for (const sourceDistribution of incomeSourceDistributions) {
      const distributionAmount = (amount * sourceDistribution.percentage) / 100;
      
      const id = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const distribution: FundDistribution = {
        id,
        receiptId,
        fundId: sourceDistribution.fundId,
        amount: distributionAmount,
        percentage: sourceDistribution.percentage,
        createdAt: now,
        updatedAt: now,
      };
      this.fundDistributions.set(id, distribution);
    }
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

    const totalCostsAmount = userCosts.reduce((sum, cost) => sum + parseFloat(cost.totalAmount), 0);

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

    // Subtract costs from this fund
    const costs = Array.from(this.costs.values())
      .filter(cost => cost.fundId === fundId);
    balance -= costs.reduce((sum, cost) => sum + parseFloat(cost.totalAmount), 0);

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

  // Manual fund distributions operations
  async getManualFundDistributions(userId: string): Promise<ManualFundDistribution[]> {
    return Array.from(this.manualFundDistributions.values())
      .filter(dist => dist.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createManualFundDistribution(distribution: InsertManualFundDistribution, userId: string): Promise<ManualFundDistribution> {
    const id = `manual_dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newDistribution: ManualFundDistribution = {
      id,
      fundId: distribution.fundId,
      amount: distribution.amount,
      percentage: distribution.percentage || null,
      description: distribution.description || null,
      date: distribution.date,
      userId,
      createdAt: now,
    };
    this.manualFundDistributions.set(id, newDistribution);
    return newDistribution;
  }

  async deleteManualFundDistribution(id: string, userId: string): Promise<boolean> {
    const distribution = this.manualFundDistributions.get(id);
    if (distribution && distribution.userId === userId) {
      this.manualFundDistributions.delete(id);
      return true;
    }
    return false;
  }

  // Calculate total unallocated funds
  async getUnallocatedFunds(userId: string): Promise<number> {
    // Get total receipts
    const userReceipts = Array.from(this.receipts.values())
      .filter(receipt => receipt.userId === userId);
    const totalReceipts = userReceipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);

    // Get total distributed through income sources
    const totalDistributed = Array.from(this.fundDistributions.values())
      .reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

    // Get total manually distributed
    const totalManuallyDistributed = Array.from(this.manualFundDistributions.values())
      .filter(dist => dist.userId === userId)
      .reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

    return totalReceipts - totalDistributed - totalManuallyDistributed;
  }

  // Get detailed fund balance including manual distributions
  async getFundBalanceDetailed(fundId: string): Promise<number> {
    const fund = this.funds.get(fundId);
    if (!fund) return 0;

    let balance = parseFloat(fund.initialBalance || "0");

    // Add money from automatic fund distributions (receipts)
    const distributions = Array.from(this.fundDistributions.values())
      .filter(dist => dist.fundId === fundId);
    balance += distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

    // Add money from manual distributions
    const manualDistributions = Array.from(this.manualFundDistributions.values())
      .filter(dist => dist.fundId === fundId);
    balance += manualDistributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

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

  // Automatically distribute all unallocated funds based on income sources
  async distributeUnallocatedFunds(userId: string): Promise<void> {
    const unallocatedAmount = await this.getUnallocatedFunds(userId);
    
    if (unallocatedAmount <= 0) {
      return; // Nothing to distribute
    }

    // Create distribution history entry
    const historyId = `distribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const distributionHistory: DistributionHistory = {
      id: historyId,
      userId,
      totalAmount: unallocatedAmount.toString(),
      distributionDate: new Date(),
      createdAt: new Date(),
    };
    this.distributionHistory.set(historyId, distributionHistory);

    // Get all receipts that haven't been distributed yet
    const userReceipts = Array.from(this.receipts.values())
      .filter(receipt => receipt.userId === userId);

    // Get receipts that don't have fund distributions yet
    const undistributedReceipts = userReceipts.filter(receipt => {
      const hasDistributions = Array.from(this.fundDistributions.values())
        .some(dist => dist.receiptId === receipt.id);
      return !hasDistributions;
    });

    // Track distribution amounts for history
    const distributionAmounts: Map<string, number> = new Map();

    // Distribute funds for each undistributed receipt
    for (const receipt of undistributedReceipts) {
      if (receipt.incomeSourceId) {
        const receiptAmount = parseFloat(receipt.amount);
        
        // Get fund distributions for this income source
        const fundDistributions = Array.from(this.incomeSourceFundDistributions.values())
          .filter(dist => dist.incomeSourceId === receipt.incomeSourceId);

        for (const fundDist of fundDistributions) {
          const percentage = parseFloat(fundDist.percentage);
          const amount = (receiptAmount * percentage) / 100;
          
          // Add to existing amount or create new
          const currentAmount = distributionAmounts.get(fundDist.fundId) || 0;
          distributionAmounts.set(fundDist.fundId, currentAmount + amount);
        }

        await this.distributeFundsForReceiptByIncomeSource(
          receipt.id, 
          receiptAmount, 
          receipt.incomeSourceId, 
          userId
        );
      }
    }

    // Create history items for each fund that received money
    distributionAmounts.forEach((amount, fundId) => {
      // Calculate percentage of total
      const percentage = (amount / unallocatedAmount) * 100;
      
      const historyItemId = `distribution_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const historyItem: DistributionHistoryItem = {
        id: historyItemId,
        distributionId: historyId,
        fundId,
        amount: amount.toString(),
        percentage: percentage.toString(),
        createdAt: new Date(),
      };
      this.distributionHistoryItems.set(historyItemId, historyItem);
    });
  }

  // Distribution History operations
  async getDistributionHistory(userId: string): Promise<DistributionHistory[]> {
    return Array.from(this.distributionHistory.values())
      .filter(dist => dist.userId === userId)
      .sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime());
  }

  async getDistributionHistoryWithItems(userId: string): Promise<(DistributionHistory & { items: (DistributionHistoryItem & { fundName: string })[] })[]> {
    const histories = await this.getDistributionHistory(userId);
    
    return histories.map(history => {
      const items = Array.from(this.distributionHistoryItems.values())
        .filter(item => item.distributionId === history.id)
        .map(item => {
          const fund = this.funds.get(item.fundId);
          return {
            ...item,
            fundName: fund?.name || 'Unknown Fund'
          };
        });
      
      return {
        ...history,
        items
      };
    });
  }

  async getDistributionHistoryById(id: string, userId: string): Promise<(DistributionHistory & { items: (DistributionHistoryItem & { fundName: string })[] }) | undefined> {
    const history = this.distributionHistory.get(id);
    if (!history || history.userId !== userId) {
      return undefined;
    }

    const items = Array.from(this.distributionHistoryItems.values())
      .filter(item => item.distributionId === id)
      .map(item => {
        const fund = this.funds.get(item.fundId);
        return {
          ...item,
          fundName: fund?.name || 'Unknown Fund'
        };
      });

    return {
      ...history,
      items
    };
  }

  async deleteDistributionHistory(id: string, userId: string): Promise<boolean> {
    const history = this.distributionHistory.get(id);
    if (!history || history.userId !== userId) {
      return false;
    }

    // Get all items for this distribution
    const items = Array.from(this.distributionHistoryItems.values())
      .filter(item => item.distributionId === id);

    // Delete all distribution items
    items.forEach(item => this.distributionHistoryItems.delete(item.id));

    // Delete the distribution history entry
    this.distributionHistory.delete(id);

    // Find and delete the corresponding fund distributions that were created during this distribution
    // This will automatically make the funds unallocated again since unallocated funds are calculated dynamically
    const distributionsToDelete = Array.from(this.fundDistributions.values())
      .filter(dist => {
        // Find distributions that were created around the same time as this history
        const distributionTime = new Date(history.distributionDate).getTime();
        const distTime = new Date(dist.createdAt).getTime();
        // Allow 1 minute tolerance for timing
        return Math.abs(distributionTime - distTime) < 60000;
      });

    // Delete the corresponding fund distributions
    distributionsToDelete.forEach(dist => this.fundDistributions.delete(dist.id));

    return true;
  }

  // Expense Nomenclature operations
  async getExpenseNomenclature(userId: string): Promise<ExpenseNomenclature[]> {
    return Array.from(this.expenseNomenclature.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getExpenseNomenclatureById(id: string, userId: string): Promise<ExpenseNomenclature | undefined> {
    const nomenclature = this.expenseNomenclature.get(id);
    return nomenclature && nomenclature.userId === userId ? nomenclature : undefined;
  }

  async createExpenseNomenclature(nomenclature: InsertExpenseNomenclature, userId: string): Promise<ExpenseNomenclature> {
    const id = `expnom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newNomenclature: ExpenseNomenclature = {
      id,
      userId,
      name: nomenclature.name,
      description: nomenclature.description || null,
      isActive: nomenclature.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.expenseNomenclature.set(id, newNomenclature);
    return newNomenclature;
  }

  async updateExpenseNomenclature(id: string, nomenclature: Partial<InsertExpenseNomenclature>, userId: string): Promise<ExpenseNomenclature | undefined> {
    const existing = this.expenseNomenclature.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: ExpenseNomenclature = {
      ...existing,
      ...nomenclature,
      updatedAt: new Date(),
    };
    this.expenseNomenclature.set(id, updated);
    return updated;
  }

  async deleteExpenseNomenclature(id: string, userId: string): Promise<boolean> {
    const existing = this.expenseNomenclature.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.expenseNomenclature.delete(id);
  }

  // Expense Categories operations
  async getExpenseCategories(userId: string): Promise<ExpenseCategory[]> {
    return Array.from(this.expenseCategories.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getExpenseCategoryById(id: string, userId: string): Promise<ExpenseCategory | undefined> {
    const category = this.expenseCategories.get(id);
    return category && category.userId === userId ? category : undefined;
  }

  async createExpenseCategory(category: InsertExpenseCategory, userId: string): Promise<ExpenseCategory> {
    const id = `expcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newCategory: ExpenseCategory = {
      id,
      userId,
      name: category.name,
      description: category.description || null,
      isActive: category.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.expenseCategories.set(id, newCategory);
    return newCategory;
  }

  async updateExpenseCategory(id: string, category: Partial<InsertExpenseCategory>, userId: string): Promise<ExpenseCategory | undefined> {
    const existing = this.expenseCategories.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: ExpenseCategory = {
      ...existing,
      ...category,
      updatedAt: new Date(),
    };
    this.expenseCategories.set(id, updated);
    return updated;
  }

  async deleteExpenseCategory(id: string, userId: string): Promise<boolean> {
    const existing = this.expenseCategories.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.expenseCategories.delete(id);
  }
}

export const newMemStorage = new NewMemStorage();