import type { Response } from "express";

/**
 * Утилиты для стандартизации HTTP ответов API в LakshmiApp
 * 
 * Этот модуль обеспечивает консистентность всех API ответов:
 * - Стандартные HTTP статус коды
 * - Единообразная структура JSON ответов
 * - Типобезопасность для TypeScript
 * - Упрощение написания маршрутов
 * 
 * Все функции автоматически устанавливают правильные заголовки
 * и сериализуют данные в JSON формат.
 */

/**
 * Ответ 404 - Ресурс не найден
 * 
 * @param res - Express Response объект
 * @param message - Кастомное сообщение об ошибке
 */
export function notFound(res: Response, message: string = "Resource not found"): void {
  res.status(404).json({ message });
}

/**
 * Ответ 401 - Не авторизован
 * 
 * Используется когда пользователь не прошел аутентификацию
 * или токен доступа невалиден/истек.
 * 
 * @param res - Express Response объект
 * @param message - Кастомное сообщение об ошибке
 */
export function unauthorized(res: Response, message: string = "Unauthorized"): void {
  res.status(401).json({ message });
}

/**
 * Ответ 400 - Неправильный запрос
 * 
 * Используется для ошибок валидации, неправильных параметров
 * или некорректного формата данных.
 * 
 * @param res - Express Response объект
 * @param message - Основное сообщение об ошибке
 * @param errors - Детальная информация об ошибках (например, от Zod)
 */
export function badRequest(res: Response, message: string, errors?: any): void {
  const response: any = { message };
  if (errors) response.errors = errors;
  res.status(400).json(response);
}

/**
 * Ответ 500 - Внутренняя ошибка сервера
 * 
 * Используется для непредвиденных ошибок сервера,
 * проблем с базой данных или других системных сбоев.
 * 
 * @param res - Express Response объект
 * @param message - Безопасное сообщение для клиента
 */
export function serverError(res: Response, message: string = "Internal Server Error"): void {
  res.status(500).json({ message });
}

/**
 * Ответ 201 - Ресурс создан
 * 
 * Используется при успешном создании новых записей
 * (спонсоры, поступления, расходы и т.д.).
 * 
 * @param res - Express Response объект
 * @param data - Созданный объект для возврата клиенту
 */
export function created<T>(res: Response, data: T): void {
  res.status(201).json(data);
}

/**
 * Ответ 200 - Успешно
 * 
 * Стандартный ответ для успешных GET, PUT запросов
 * с возвратом данных клиенту.
 * 
 * @param res - Express Response объект
 * @param data - Данные для возврата клиенту
 */
export function ok<T>(res: Response, data: T): void {
  res.status(200).json(data);
}

/**
 * Ответ 204 - Нет содержимого
 * 
 * Используется для успешных операций DELETE
 * или других действий, которые не возвращают данные.
 * 
 * @param res - Express Response объект
 */
export function noContent(res: Response): void {
  res.status(204).send();
}