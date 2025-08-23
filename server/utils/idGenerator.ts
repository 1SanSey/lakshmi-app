/**
 * Утилиты для генерации уникальных идентификаторов в LakshmiApp
 * 
 * Система генерации ID обеспечивает уникальность записей в памяти.
 * Каждый ID состоит из префикса, временной метки и случайной строки:
 * Формат: {prefix}_{timestamp}_{random_string}
 * Пример: "sponsor_1755948563766_abc123def"
 * 
 * Преимущества такого подхода:
 * - Гарантия уникальности благодаря timestamp
 * - Возможность сортировки по времени создания
 * - Читаемость и отладочность
 * - Возможность идентификации типа сущности по префиксу
 */

/**
 * Базовая функция генерации уникального ID
 * 
 * @param prefix - Префикс для идентификации типа сущности
 * @returns Уникальный идентификатор в формате {prefix}_{timestamp}_{random}
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();                                    // Текущее время в миллисекундах
  const random = Math.random().toString(36).substr(2, 9);         // Случайная строка из 9 символов
  return `${prefix}_${timestamp}_${random}`;
}

// === ГЕНЕРАТОРЫ ID ДЛЯ ОСНОВНЫХ СУЩНОСТЕЙ ===

/** Генерация ID для пользователей (используется редко, так как ID берется из Replit OIDC) */
export function generateUserId(): string {
  return generateId('user');
}

/** Генерация ID для спонсоров - источников доходов */
export function generateSponsorId(): string {
  return generateId('sponsor');
}

/** Генерация ID для поступлений от спонсоров */
export function generateReceiptId(): string {
  return generateId('receipt');
}

/** Генерация ID для расходов */
export function generateCostId(): string {
  return generateId('cost');
}

/** Генерация ID для фондов управления средствами */
export function generateFundId(): string {
  return generateId('fund');
}

/** Генерация ID для переводов между фондами */
export function generateFundTransferId(): string {
  return generateId('transfer');
}

/** Генерация ID для источников доходов (для настройки распределения) */
export function generateIncomeSourceId(): string {
  return generateId('income_source');
}

/** Генерация ID для операций распределения средств */
export function generateDistributionId(): string {
  return generateId('distribution');
}

/** Генерация ID для номенклатуры расходов (товары/услуги) */
export function generateNomenclatureId(): string {
  return generateId('nomenclature');
}

/** Генерация ID для категорий расходов (статьи расходов) */
export function generateCategoryId(): string {
  return generateId('category');
}

/** Генерация ID для элементов (детализация поступлений/расходов) */
export function generateItemId(): string {
  return generateId('item');
}

/** Генерация ID для различных источников */
export function generateSourceId(): string {
  return generateId('source');
}

/** Генерация ID для распределений (сокращенная версия) */
export function generateDistId(): string {
  return generateId('dist');
}