/**
 * Утилиты для безопасной работы с типами данных в LakshmiApp
 * 
 * Этот модуль предоставляет функции для:
 * - Безопасного парсинга nullable значений
 * - Валидации обязательных полей
 * - Преобразования типов с проверками
 * - Работы с потенциально неопределенными значениями
 * 
 * Все функции проектированы для предотвращения runtime ошибок
 * и обеспечения типобезопасности TypeScript кода.
 */

/**
 * Безопасный парсинг даты из nullable значения
 * 
 * Преобразует потенциально null значение даты в Date объект
 * или undefined. Полезно при работе с данными из базы данных.
 * 
 * @param date - Потенциально null значение даты
 * @returns Date объект или undefined если входное значение null
 */
export function safeDateParse(date: Date | null): Date | undefined {
  if (!date) return undefined;
  return new Date(date);
}

/**
 * Безопасный парсинг строки из nullable значения
 * 
 * Преобразует undefined в null для консистентности с базой данных.
 * Возвращает строку как есть, если она определена.
 * 
 * @param value - Потенциально undefined или null строка
 * @returns Строка или null (никогда undefined)
 */
export function safeStringParse(value: string | null | undefined): string | null {
  return value ?? null;
}

/**
 * Безопасное преобразование числа в строку
 * 
 * Простая утилита для явного преобразования чисел в строки.
 * Полезна для обеспечения типобезопасности в местах,
 * где TypeScript требует явного преобразования.
 * 
 * @param value - Числовое значение
 * @returns Строковое представление числа
 */
export function safeNumberToString(value: number): string {
  return value.toString();
}

/**
 * Строгая валидация обязательной строки
 * 
 * Проверяет, что строковое значение определено и не пустое.
 * Выбрасывает ошибку если значение отсутствует.
 * 
 * @param value - Потенциально undefined строка
 * @returns Гарантированно определенная строка
 * @throws Error если значение undefined или пустое
 */
export function ensureString(value: string | undefined): string {
  if (!value) throw new Error("Required string value is missing");
  return value;
}

/**
 * Строгая валидация ненулевого значения
 * 
 * Универсальная функция для проверки, что значение не является
 * null или undefined. Выбрасывает ошибку при отсутствии значения.
 * 
 * @param value - Потенциально null/undefined значение любого типа
 * @returns Гарантированно ненулевое значение
 * @throws Error если значение null или undefined
 */
export function ensureNonNull<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("Required value is null or undefined");
  }
  return value;
}