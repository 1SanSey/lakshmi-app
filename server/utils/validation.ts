import { z } from "zod";
import type { Response } from "express";

/**
 * Утилиты для валидации запросов
 */

export function handleValidationError(error: unknown, res: Response): boolean {
  if (error instanceof z.ZodError) {
    res.status(400).json({ 
      message: "Validation error", 
      errors: error.errors 
    });
    return true;
  }
  return false;
}

export function handleError(error: unknown, res: Response, message: string): void {
  console.error(`${message}:`, error);
  res.status(500).json({ message });
}

export function validateUserId(userId: string | undefined): string {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return userId;
}

export function parseNumericParam(param: string | undefined, defaultValue: number): number {
  if (!param) return defaultValue;
  const parsed = parseInt(param, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseDateParam(param: string | undefined): Date | undefined {
  if (!param) return undefined;
  const date = new Date(param);
  return isNaN(date.getTime()) ? undefined : date;
}