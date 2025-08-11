import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSponsorSchema, 
  insertReceiptSchema, 
  insertCostSchema, 
  insertFundSchema,
  insertIncomeSourceSchema,
  insertIncomeSourceFundDistributionSchema,
  insertReceiptItemSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Sponsor routes
  app.get("/api/sponsors", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/sponsors/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/sponsors", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/sponsors/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/sponsors/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/receipts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const receipts = await storage.getReceipts(userId, search, fromDate, toDate);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.get("/api/receipts/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/receipts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReceiptSchema.parse(req.body);
      const receipt = await storage.createReceipt(validatedData, userId);
      
      // Automatically distribute funds for this receipt
      await storage.distributeFundsForReceipt(receipt.id, receipt.amount, userId);
      
      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating receipt:", error);
      res.status(500).json({ message: "Failed to create receipt" });
    }
  });

  app.put("/api/receipts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReceiptSchema.partial().parse(req.body);
      const receipt = await storage.updateReceipt(req.params.id, validatedData, userId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      // Re-distribute funds if amount changed
      if (validatedData.amount) {
        await storage.distributeFundsForReceipt(receipt.id, receipt.amount, userId);
      }
      
      res.json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating receipt:", error);
      res.status(500).json({ message: "Failed to update receipt" });
    }
  });

  app.delete("/api/receipts/:id", isAuthenticated, async (req: any, res) => {
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

  // Cost routes
  app.get("/api/costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const costs = await storage.getCosts(userId, search, category, fromDate, toDate);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching costs:", error);
      res.status(500).json({ message: "Failed to fetch costs" });
    }
  });

  app.get("/api/costs/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCostSchema.parse(req.body);
      const cost = await storage.createCost(validatedData, userId);
      res.status(201).json(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating cost:", error);
      res.status(500).json({ message: "Failed to create cost" });
    }
  });

  app.put("/api/costs/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/costs/:id", isAuthenticated, async (req: any, res) => {
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

  // Fund routes
  app.get("/api/funds", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const funds = await storage.getFunds(userId);
      res.json(funds);
    } catch (error) {
      console.error("Error fetching funds:", error);
      res.status(500).json({ message: "Failed to fetch funds" });
    }
  });

  app.get("/api/funds/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/funds", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/funds/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/funds/:id", isAuthenticated, async (req: any, res) => {
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

  // Fund distribution routes
  app.get("/api/receipts/:receiptId/distributions", isAuthenticated, async (req: any, res) => {
    try {
      const distributions = await storage.getFundDistributionsByReceipt(req.params.receiptId);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching fund distributions:", error);
      res.status(500).json({ message: "Failed to fetch fund distributions" });
    }
  });

  // Dashboard statistics routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/activity", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/income-sources", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const incomeSources = await storage.getIncomeSources(userId);
      res.json(incomeSources);
    } catch (error) {
      console.error("Error fetching income sources:", error);
      res.status(500).json({ message: "Failed to fetch income sources" });
    }
  });

  app.get("/api/income-sources/:id", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/income-sources", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/income-sources/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/income-sources/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/income-sources/:id/fund-distributions", isAuthenticated, async (req: any, res) => {
    try {
      const distributions = await storage.getIncomeSourceFundDistributions(req.params.id);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching income source fund distributions:", error);
      res.status(500).json({ message: "Failed to fetch fund distributions" });
    }
  });

  app.post("/api/income-sources/:id/fund-distributions", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/income-sources/:id/fund-distributions", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteIncomeSourceFundDistributions(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund distributions:", error);
      res.status(500).json({ message: "Failed to delete fund distributions" });
    }
  });

  // Receipt items routes
  app.get("/api/receipts/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const receiptItems = await storage.getReceiptItems(req.params.id);
      res.json(receiptItems);
    } catch (error) {
      console.error("Error fetching receipt items:", error);
      res.status(500).json({ message: "Failed to fetch receipt items" });
    }
  });

  app.post("/api/receipts/:id/items", isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
