import type { Response } from "express";

/**
 * Утилиты для стандартизации ответов API
 */

export function notFound(res: Response, message: string = "Resource not found"): void {
  res.status(404).json({ message });
}

export function unauthorized(res: Response, message: string = "Unauthorized"): void {
  res.status(401).json({ message });
}

export function badRequest(res: Response, message: string, errors?: any): void {
  const response: any = { message };
  if (errors) response.errors = errors;
  res.status(400).json(response);
}

export function serverError(res: Response, message: string = "Internal Server Error"): void {
  res.status(500).json({ message });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json(data);
}

export function ok<T>(res: Response, data: T): void {
  res.status(200).json(data);
}

export function noContent(res: Response): void {
  res.status(204).send();
}