import { z } from "zod";
import type { Response } from "express";

/**
 * Утилиты для валидации запросов и обработки ошибок в LakshmiApp
 * 
 * Этот модуль предоставляет централизованные функции для:
 * - Обработки ошибок валидации Zod схем
 * - Универсальной обработки серверных ошибок
 * - Валидации обязательных параметров
 * - Парсинга и валидации входящих данных
 * 
 * Все функции возвращают стандартизированные HTTP ответы для консистентности API.
 */

/**
 * Обработчик ошибок валидации Zod схем
 * 
 * Проверяет, является ли ошибка результатом неудачной валидации Zod,
 * и возвращает структурированный ответ с детальной информацией об ошибках.
 * 
 * @param error - Объект ошибки (может быть любого типа)
 * @param res - Express Response объект для отправки ответа
 * @returns true если ошибка была обработана, false если это не Zod ошибка
 */
export function handleValidationError(error: unknown, res: Response): boolean {
  if (error instanceof z.ZodError) {
    res.status(400).json({ 
      message: "Validation error",     // Общее сообщение об ошибке валидации
      errors: error.errors            // Детальный список ошибок от Zod
    });
    return true;  // Ошибка была обработана
  }
  return false;   // Это не Zod ошибка, нужна дальнейшая обработка
}

/**
 * Универсальный обработчик серверных ошибок
 * 
 * Логирует ошибку в консоль для отладки и возвращает стандартизированный
 * HTTP 500 ответ с безопасным сообщением для клиента.
 * 
 * @param error - Объект ошибки (любого типа)
 * @param res - Express Response объект
 * @param message - Безопасное сообщение для отправки клиенту
 */
export function handleError(error: unknown, res: Response, message: string): void {
  console.error(`${message}:`, error);  // Подробное логирование для разработчиков
  res.status(500).json({ message });    // Безопасный ответ для клиента
}

/**
 * Валидация ID пользователя из сессии аутентификации
 * 
 * Проверяет наличие обязательного ID пользователя, который должен
 * присутствовать во всех защищенных маршрутах после аутентификации.
 * 
 * @param userId - ID пользователя из claims JWT токена
 * @returns Валидный ID пользователя
 * @throws Error если ID отсутствует
 */
export function validateUserId(userId: string | undefined): string {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return userId;
}

/**
 * Безопасный парсинг числовых параметров из запроса
 * 
 * Пытается преобразовать строковый параметр в число.
 * Возвращает значение по умолчанию если параметр отсутствует или невалиден.
 * 
 * @param param - Строковый параметр из query или path
 * @param defaultValue - Значение по умолчанию
 * @returns Числовое значение или значение по умолчанию
 */
export function parseNumericParam(param: string | undefined, defaultValue: number): number {
  if (!param) return defaultValue;
  const parsed = parseInt(param, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Безопасный парсинг параметров даты из запроса
 * 
 * Пытается преобразовать строковый параметр в объект Date.
 * Возвращает undefined если параметр отсутствует или содержит невалидную дату.
 * 
 * @param param - Строковый параметр с датой (ISO формат)
 * @returns Объект Date или undefined
 */
export function parseDateParam(param: string | undefined): Date | undefined {
  if (!param) return undefined;
  const date = new Date(param);
  return isNaN(date.getTime()) ? undefined : date;
}