import type { Express } from "express";
import { createServer, type Server } from "http";
import { newMemStorage as storage } from "./newMemStorage";
import { setupAuth } from "./replitAuth";

// Временный middleware для пропуска аутентификации
const skipAuth = (req: any, res: any, next: any) => {
  // Добавляем фиктивного пользователя для тестирования
  req.user = {
    claims: {
      sub: "test_user_123"
    }
  };
  req.skipAuth = () => true;
  next();
};
import { 
  insertSponsorSchema, 
  insertReceiptSchema, 
  insertCostSchema,
  insertCostItemSchema, 
  insertFundSchema,
  insertFundTransferSchema,
  insertIncomeSourceSchema,
  insertIncomeSourceFundDistributionSchema,
  insertReceiptItemSchema,
  insertManualFundDistributionSchema,
  insertExpenseNomenclatureSchema,
  insertExpenseCategorySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Временное отключение аутентификации для всех API-маршрутов
  app.use("/api", skipAuth);
  
  // Auth middleware - отключен для тестирования
  // await setupAuth(app);

  // Auth routes - временно возвращаем фиктивного пользователя
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      res.json({
        id: "test_user_123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User"
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Sponsor routes
  app.get("/api/sponsors", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const sponsors = await storage.getSponsors(userId, search);
      res.json(sponsors);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.get("/api/sponsors/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sponsor = await storage.getSponsor(req.params.id, userId);
      if (!sponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      res.json(sponsor);
    } catch (error) {
      console.error("Error fetching sponsor:", error);
      res.status(500).json({ message: "Failed to fetch sponsor" });
    }
  });

  app.post("/api/sponsors", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSponsorSchema.parse(req.body);
      const sponsor = await storage.createSponsor(validatedData, userId);
      res.status(201).json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating sponsor:", error);
      res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  app.put("/api/sponsors/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSponsorSchema.partial().parse(req.body);
      const sponsor = await storage.updateSponsor(req.params.id, validatedData, userId);
      if (!sponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      res.json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating sponsor:", error);
      res.status(500).json({ message: "Failed to update sponsor" });
    }
  });

  app.delete("/api/sponsors/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteSponsor(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      res.status(500).json({ message: "Failed to delete sponsor" });
    }
  });

  // Receipt routes
  app.get("/api/receipts", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getReceiptsPaginated(userId, search, fromDate, toDate, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.get("/api/receipts/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const receipt = await storage.getReceipt(req.params.id, userId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });

  app.post("/api/receipts", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const receiptData = {
        ...req.body,
        amount: parseFloat(req.body.amount) || 0,
        date: new Date(req.body.date),
      };
      
      const receipt = await storage.createReceipt(receiptData, userId);
      
      // Don't automatically distribute funds - let user manually distribute them
      
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating receipt:", error);
      res.status(500).json({ message: "Failed to create receipt" });
    }
  });

  app.put("/api/receipts/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Преобразуем данные для обновления поступления
      const receiptData = {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount).toString() : undefined,
        date: req.body.date ? new Date(req.body.date) : undefined,
      };
      
      const receipt = await storage.updateReceipt(req.params.id, receiptData, userId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      // Note: Fund redistribution will be handled manually by user
      
      res.json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating receipt:", error);
      res.status(500).json({ message: "Failed to update receipt" });
    }
  });

  app.delete("/api/receipts/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteReceipt(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  app.post("/api/receipts/:receiptId/items", skipAuth, async (req: any, res) => {
    try {
      const { receiptId } = req.params;
      const { sponsorId, amount } = req.body;
      
      const receiptItem = await storage.createReceiptItem({
        receiptId,
        sponsorId,
        amount: parseFloat(amount).toString(),
      });
      
      res.status(201).json(receiptItem);
    } catch (error) {
      console.error("Error creating receipt item:", error);
      res.status(500).json({ error: "Failed to create receipt item" });
    }
  });

  app.delete("/api/receipts/:receiptId/items", skipAuth, async (req: any, res) => {
    try {
      const { receiptId } = req.params;
      await storage.deleteReceiptItems(receiptId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting receipt items:", error);
      res.status(500).json({ error: "Failed to delete receipt items" });
    }
  });

  // Cost routes - новая структура
  app.get("/api/costs", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const expenseCategoryId = req.query.expenseCategoryId as string;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Always use pagination for consistency with other endpoints
      const result = await storage.getCostsPaginated(userId, search, expenseCategoryId, fromDate, toDate, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching costs:", error);
      res.status(500).json({ message: "Failed to fetch costs" });
    }
  });

  app.get("/api/costs/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cost = await storage.getCost(req.params.id, userId);
      if (!cost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      res.json(cost);
    } catch (error) {
      console.error("Error fetching cost:", error);
      res.status(500).json({ message: "Failed to fetch cost" });
    }
  });

  app.post("/api/costs", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Преобразуем данные вручную
      const requestData = {
        ...req.body,
        date: new Date(req.body.date),
        totalAmount: String(req.body.totalAmount)  // Принудительно конвертируем в строку
      };
      
      console.log("Request data:", requestData);
      const validatedData = insertCostSchema.parse(requestData);
      console.log("Validated data:", validatedData);
      const cost = await storage.createCost(validatedData, userId);
      res.status(201).json(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating cost:", error);
      res.status(500).json({ message: "Failed to create cost", error: error.message });
    }
  });

  app.put("/api/costs/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCostSchema.partial().parse(req.body);
      const cost = await storage.updateCost(req.params.id, validatedData, userId);
      if (!cost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      res.json(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating cost:", error);
      res.status(500).json({ message: "Failed to update cost" });
    }
  });

  app.delete("/api/costs/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteCost(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Cost not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost:", error);
      res.status(500).json({ message: "Failed to delete cost" });
    }
  });

  // Cost Items routes  
  app.get("/api/costs/:costId/items", skipAuth, async (req: any, res) => {
    try {
      const { costId } = req.params;
      const items = await storage.getCostItems(costId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cost items:", error);
      res.status(500).json({ message: "Failed to fetch cost items" });
    }
  });

  app.post("/api/costs/:costId/items", skipAuth, async (req: any, res) => {
    try {
      const { costId } = req.params;
      const validatedData = insertCostItemSchema.parse(req.body);
      const costItem = await storage.createCostItem(validatedData, costId);
      res.status(201).json(costItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating cost item:", error);
      res.status(500).json({ message: "Failed to create cost item" });
    }
  });

  app.put("/api/cost-items/:id", skipAuth, async (req: any, res) => {
    try {
      const validatedData = insertCostItemSchema.partial().parse(req.body);
      const costItem = await storage.updateCostItem(req.params.id, validatedData);
      if (!costItem) {
        return res.status(404).json({ message: "Cost item not found" });
      }
      res.json(costItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating cost item:", error);
      res.status(500).json({ message: "Failed to update cost item" });
    }
  });

  app.delete("/api/cost-items/:id", skipAuth, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCostItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Cost item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost item:", error);
      res.status(500).json({ message: "Failed to delete cost item" });
    }
  });

  // Fund routes
  app.get("/api/funds", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const funds = await storage.getFunds(userId);
      res.json(funds);
    } catch (error) {
      console.error("Error fetching funds:", error);
      res.status(500).json({ message: "Failed to fetch funds" });
    }
  });

  app.get("/api/funds/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fund = await storage.getFund(req.params.id, userId);
      if (!fund) {
        return res.status(404).json({ message: "Fund not found" });
      }
      res.json(fund);
    } catch (error) {
      console.error("Error fetching fund:", error);
      res.status(500).json({ message: "Failed to fetch fund" });
    }
  });

  app.post("/api/funds", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertFundSchema.parse(req.body);
      const fund = await storage.createFund(validatedData, userId);
      res.status(201).json(fund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating fund:", error);
      res.status(500).json({ message: "Failed to create fund" });
    }
  });

  app.put("/api/funds/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertFundSchema.partial().parse(req.body);
      const fund = await storage.updateFund(req.params.id, validatedData, userId);
      if (!fund) {
        return res.status(404).json({ message: "Fund not found" });
      }
      res.json(fund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating fund:", error);
      res.status(500).json({ message: "Failed to update fund" });
    }
  });

  app.delete("/api/funds/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteFund(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Fund not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund:", error);
      res.status(500).json({ message: "Failed to delete fund" });
    }
  });

  app.get("/api/funds/balances", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fundsWithBalances = await storage.getFundsWithBalances(userId);
      res.json(fundsWithBalances);
    } catch (error) {
      console.error("Error fetching funds with balances:", error);
      res.status(500).json({ message: "Failed to fetch funds with balances" });
    }
  });

  // Fund distribution routes
  app.get("/api/receipts/:receiptId/distributions", skipAuth, async (req: any, res) => {
    try {
      const distributions = await storage.getFundDistributionsByReceipt(req.params.receiptId);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching fund distributions:", error);
      res.status(500).json({ message: "Failed to fetch fund distributions" });
    }
  });

  // Dashboard statistics routes
  app.get("/api/dashboard/stats", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/activity", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const activity = await storage.getRecentActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Income source routes
  app.get("/api/income-sources", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const incomeSources = await storage.getIncomeSources(userId);
      res.json(incomeSources);
    } catch (error) {
      console.error("Error fetching income sources:", error);
      res.status(500).json({ message: "Failed to fetch income sources" });
    }
  });

  app.get("/api/income-sources/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const incomeSource = await storage.getIncomeSource(req.params.id, userId);
      if (!incomeSource) {
        return res.status(404).json({ message: "Income source not found" });
      }
      res.json(incomeSource);
    } catch (error) {
      console.error("Error fetching income source:", error);
      res.status(500).json({ message: "Failed to fetch income source" });
    }
  });

  app.post("/api/income-sources", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertIncomeSourceSchema.parse(req.body);
      const incomeSource = await storage.createIncomeSource(validatedData, userId);
      res.status(201).json(incomeSource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating income source:", error);
      res.status(500).json({ message: "Failed to create income source" });
    }
  });

  app.put("/api/income-sources/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertIncomeSourceSchema.partial().parse(req.body);
      const incomeSource = await storage.updateIncomeSource(req.params.id, validatedData, userId);
      if (!incomeSource) {
        return res.status(404).json({ message: "Income source not found" });
      }
      res.json(incomeSource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating income source:", error);
      res.status(500).json({ message: "Failed to update income source" });
    }
  });

  app.delete("/api/income-sources/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteIncomeSource(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Income source not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting income source:", error);
      res.status(500).json({ message: "Failed to delete income source" });
    }
  });

  // Income source fund distribution routes
  app.get("/api/income-sources/:id/fund-distributions", skipAuth, async (req: any, res) => {
    try {
      const distributions = await storage.getIncomeSourceFundDistributions(req.params.id);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching income source fund distributions:", error);
      res.status(500).json({ message: "Failed to fetch fund distributions" });
    }
  });

  app.post("/api/income-sources/:id/fund-distributions", skipAuth, async (req: any, res) => {
    try {
      const validatedData = insertIncomeSourceFundDistributionSchema.parse({
        ...req.body,
        incomeSourceId: req.params.id
      });
      const distribution = await storage.createIncomeSourceFundDistribution(validatedData);
      res.status(201).json(distribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating fund distribution:", error);
      res.status(500).json({ message: "Failed to create fund distribution" });
    }
  });

  app.delete("/api/income-sources/:id/fund-distributions", skipAuth, async (req: any, res) => {
    try {
      await storage.deleteIncomeSourceFundDistributions(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund distributions:", error);
      res.status(500).json({ message: "Failed to delete fund distributions" });
    }
  });

  // Receipt items routes
  app.get("/api/receipts/:id/items", skipAuth, async (req: any, res) => {
    try {
      const receiptItems = await storage.getReceiptItems(req.params.id);
      res.json(receiptItems);
    } catch (error) {
      console.error("Error fetching receipt items:", error);
      res.status(500).json({ message: "Failed to fetch receipt items" });
    }
  });

  app.post("/api/receipts/:id/items", skipAuth, async (req: any, res) => {
    try {
      const validatedData = insertReceiptItemSchema.parse({
        ...req.body,
        receiptId: req.params.id
      });
      const receiptItem = await storage.createReceiptItem(validatedData);
      res.status(201).json(receiptItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating receipt item:", error);
      res.status(500).json({ message: "Failed to create receipt item" });
    }
  });

  // Fund transfer routes
  app.get("/api/fund-transfers", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transfers = await storage.getFundTransfers(userId);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching fund transfers:", error);
      res.status(500).json({ message: "Failed to fetch fund transfers" });
    }
  });

  app.post("/api/fund-transfers", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transferData = {
        ...req.body,
        amount: parseFloat(req.body.amount),
        userId
      };
      const transfer = await storage.createFundTransfer(transferData);
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating fund transfer:", error);
      res.status(500).json({ message: "Failed to create fund transfer" });
    }
  });

  app.delete("/api/fund-transfers/:id", skipAuth, async (req: any, res) => {
    try {
      const deleted = await storage.deleteFundTransfer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Fund transfer not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund transfer:", error);
      res.status(500).json({ message: "Failed to delete fund transfer" });
    }
  });

  // Manual fund distribution routes
  app.get("/api/manual-fund-distributions", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const distributions = await storage.getManualFundDistributions(userId);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching manual fund distributions:", error);
      res.status(500).json({ error: "Ошибка при получении ручных распределений" });
    }
  });

  app.post("/api/manual-fund-distributions", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertManualFundDistributionSchema.parse(req.body);
      const distribution = await storage.createManualFundDistribution(validatedData, userId);
      res.status(201).json(distribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating manual fund distribution:", error);
      res.status(500).json({ error: "Ошибка при создании ручного распределения" });
    }
  });

  app.delete("/api/manual-fund-distributions/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteManualFundDistribution(req.params.id, userId);
      if (success) {
        res.json({ message: "Ручное распределение удалено" });
      } else {
        res.status(404).json({ error: "Распределение не найдено" });
      }
    } catch (error) {
      console.error("Error deleting manual fund distribution:", error);
      res.status(500).json({ error: "Ошибка при удалении ручного распределения" });
    }
  });

  app.get("/api/unallocated-funds", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unallocatedAmount = await storage.getUnallocatedFunds(userId);
      res.json({ unallocatedAmount });
    } catch (error) {
      console.error("Error getting unallocated funds:", error);
      res.status(500).json({ error: "Ошибка при получении нераспределенных средств" });
    }
  });

  // Automatically distribute all unallocated funds based on income sources
  app.post("/api/distribute-unallocated-funds", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.distributeUnallocatedFunds(userId);
      res.json({ message: "Funds distributed successfully" });
    } catch (error) {
      console.error("Error distributing unallocated funds:", error);
      res.status(500).json({ error: "Ошибка при распределении средств" });
    }
  });

  // Fund balance routes
  app.get("/api/funds-with-balances", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fundsWithBalances = await storage.getFundsWithBalances(userId);
      res.json(fundsWithBalances);
    } catch (error) {
      console.error("Error fetching funds with balances:", error);
      res.status(500).json({ message: "Failed to fetch funds with balances" });
    }
  });

  app.get("/api/funds/:id/balance", skipAuth, async (req: any, res) => {
    try {
      const balance = await storage.getFundBalance(req.params.id);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching fund balance:", error);
      res.status(500).json({ message: "Failed to fetch fund balance" });
    }
  });

  // Distribution History endpoints
  app.get("/api/distribution-history", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getDistributionHistoryWithItems(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching distribution history:", error);
      res.status(500).json({ message: "Failed to fetch distribution history" });
    }
  });

  app.get("/api/distribution-history/:id", skipAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const history = await storage.getDistributionHistoryById(id, userId);
      if (history) {
        res.json(history);
      } else {
        res.status(404).json({ message: "Distribution history not found" });
      }
    } catch (error) {
      console.error("Error fetching distribution history:", error);
      res.status(500).json({ message: "Failed to fetch distribution history" });
    }
  });

  app.delete("/api/distribution-history/:id", skipAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const deleted = await storage.deleteDistributionHistory(id, userId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Distribution history not found" });
      }
    } catch (error) {
      console.error("Error deleting distribution history:", error);
      res.status(500).json({ message: "Failed to delete distribution history" });
    }
  });

  // Expense Nomenclature routes
  app.get("/api/expense-nomenclature", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nomenclature = await storage.getExpenseNomenclature(userId);
      res.json(nomenclature);
    } catch (error) {
      console.error("Error fetching expense nomenclature:", error);
      res.status(500).json({ message: "Failed to fetch expense nomenclature" });
    }
  });

  app.get("/api/expense-nomenclature/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nomenclature = await storage.getExpenseNomenclatureById(req.params.id, userId);
      if (!nomenclature) {
        return res.status(404).json({ message: "Expense nomenclature not found" });
      }
      res.json(nomenclature);
    } catch (error) {
      console.error("Error fetching expense nomenclature:", error);
      res.status(500).json({ message: "Failed to fetch expense nomenclature" });
    }
  });

  app.post("/api/expense-nomenclature", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertExpenseNomenclatureSchema.parse(req.body);
      const nomenclature = await storage.createExpenseNomenclature(validatedData, userId);
      res.status(201).json(nomenclature);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating expense nomenclature:", error);
      res.status(500).json({ message: "Failed to create expense nomenclature" });
    }
  });

  app.put("/api/expense-nomenclature/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertExpenseNomenclatureSchema.partial().parse(req.body);
      const nomenclature = await storage.updateExpenseNomenclature(req.params.id, validatedData, userId);
      if (!nomenclature) {
        return res.status(404).json({ message: "Expense nomenclature not found" });
      }
      res.json(nomenclature);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating expense nomenclature:", error);
      res.status(500).json({ message: "Failed to update expense nomenclature" });
    }
  });

  app.delete("/api/expense-nomenclature/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteExpenseNomenclature(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Expense nomenclature not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense nomenclature:", error);
      res.status(500).json({ message: "Failed to delete expense nomenclature" });
    }
  });

  // Expense Categories routes
  app.get("/api/expense-categories", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getExpenseCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  app.get("/api/expense-categories/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const category = await storage.getExpenseCategoryById(req.params.id, userId);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching expense category:", error);
      res.status(500).json({ message: "Failed to fetch expense category" });
    }
  });

  app.post("/api/expense-categories", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(validatedData, userId);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating expense category:", error);
      res.status(500).json({ message: "Failed to create expense category" });
    }
  });

  app.put("/api/expense-categories/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertExpenseCategorySchema.partial().parse(req.body);
      const category = await storage.updateExpenseCategory(req.params.id, validatedData, userId);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating expense category:", error);
      res.status(500).json({ message: "Failed to update expense category" });
    }
  });

  app.delete("/api/expense-categories/:id", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteExpenseCategory(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense category:", error);
      res.status(500).json({ message: "Failed to delete expense category" });
    }
  });

  // Reports API
  app.get("/api/reports/fund-balance/:dateFrom/:dateTo", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateFrom, dateTo } = req.params;
      
      // Get all funds for the user
      const funds = await storage.getFundsWithBalances(userId);
      
      // Get distribution history to calculate period income
      const distributionHistory = await storage.getDistributionHistoryWithItems(userId);
      const costs = await storage.getCosts(userId);
      
      // Filter data by date range
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Filter distributions within period
      const periodDistributions = distributionHistory.filter((dist: any) => {
        const distDate = new Date(dist.createdAt);
        return distDate >= startDate && distDate <= endDate;
      });
      
      // Filter costs within period
      const periodCosts = costs.filter((cost: any) => {
        const costDate = new Date(cost.date);
        return costDate >= startDate && costDate <= endDate;
      });
      
      // Calculate fund balances and movements
      const fundBalanceReport = funds.map((fund: any) => {
        // Calculate income from distributions in period
        let periodIncome = 0;
        periodDistributions.forEach((dist: any) => {
          if (dist.items && Array.isArray(dist.items)) {
            const fundItems = dist.items.filter((item: any) => item.fundId === fund.id);
            periodIncome += fundItems.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
          }
        });
        
        // Calculate expenses in period
        const fundCosts = periodCosts.filter((cost: any) => cost.fundId === fund.id);
        const periodExpenses = fundCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.totalAmount), 0);
        
        // Current balance
        const currentBalance = parseFloat(fund.balance);
        
        // Opening balance = current - period income + period expenses
        const openingBalance = Math.max(0, currentBalance - periodIncome + periodExpenses);
        
        return {
          fundName: fund.name,
          openingBalance: openingBalance,
          income: periodIncome,
          expenses: periodExpenses,
          currentBalance: currentBalance
        };
      });
      
      res.json(fundBalanceReport);
    } catch (error) {
      console.error("Error generating fund balance report:", error);
      res.status(500).json({ message: "Failed to generate fund balance report" });
    }
  });

  // Expense Report API
  app.get("/api/reports/expenses/:dateFrom/:dateTo", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateFrom, dateTo } = req.params;
      
      const costs = await storage.getCosts(userId);
      const categories = await storage.getExpenseCategories(userId);
      const nomenclature = await storage.getExpenseNomenclature(userId);
      
      // Filter costs by date range
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      
      const periodCosts = costs.filter((cost: any) => {
        const costDate = new Date(cost.date);
        return costDate >= startDate && costDate <= endDate;
      });
      
      // Group by category
      const categoryMap = new Map();
      
      categories.forEach((category: any) => {
        categoryMap.set(category.id, {
          categoryName: category.name,
          expenses: []
        });
      });
      
      // Add costs to categories
      periodCosts.forEach((cost: any) => {
        const nomenclatureItem = nomenclature.find((n: any) => n.id === cost.expenseNomenclatureId);
        const nomenclatureName = nomenclatureItem ? nomenclatureItem.name : "Без номенклатуры";
        
        if (categoryMap.has(cost.expenseCategoryId)) {
          categoryMap.get(cost.expenseCategoryId).expenses.push({
            name: nomenclatureName,
            amount: parseFloat(cost.totalAmount)
          });
        }
      });
      
      // Convert to array and filter out empty categories
      const reportData = Array.from(categoryMap.values()).filter((category: any) => category.expenses.length > 0);
      
      res.json(reportData);
    } catch (error) {
      console.error("Error generating expense report:", error);
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  // Sponsor Report API
  app.get("/api/reports/sponsors/:dateFrom/:dateTo", skipAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateFrom, dateTo } = req.params;
      
      const receipts = await storage.getReceipts(userId);
      const sponsors = await storage.getSponsors(userId);
      
      // Filter receipts by date range
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      
      const periodReceipts = receipts.filter((receipt: any) => {
        const receiptDate = new Date(receipt.date);
        return receiptDate >= startDate && receiptDate <= endDate;
      });
      
      // Get receipt items for these receipts
      const sponsorMap = new Map();
      
      // Initialize sponsors map
      sponsors.forEach((sponsor: any) => {
        sponsorMap.set(sponsor.id, {
          sponsorName: sponsor.name,
          totalAmount: 0
        });
      });
      
      // Process receipt items to get sponsor totals
      for (const receipt of periodReceipts) {
        const receiptItems = await storage.getReceiptItems(receipt.id);
        
        receiptItems.forEach((item: any) => {
          if (sponsorMap.has(item.sponsorId)) {
            const sponsorData = sponsorMap.get(item.sponsorId);
            sponsorData.totalAmount += parseFloat(item.amount);
          }
        });
      }
      
      // Filter out sponsors with no donations and convert to array
      const reportData = Array.from(sponsorMap.values())
        .filter((sponsor: any) => sponsor.totalAmount > 0);
      
      res.json(reportData);
    } catch (error) {
      console.error("Error generating sponsor report:", error);
      res.status(500).json({ message: "Failed to generate sponsor report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
