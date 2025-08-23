/**
 * Утилиты для генерации уникальных ID
 */

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateUserId(): string {
  return generateId('user');
}

export function generateSponsorId(): string {
  return generateId('sponsor');
}

export function generateReceiptId(): string {
  return generateId('receipt');
}

export function generateCostId(): string {
  return generateId('cost');
}

export function generateFundId(): string {
  return generateId('fund');
}

export function generateFundTransferId(): string {
  return generateId('transfer');
}

export function generateIncomeSourceId(): string {
  return generateId('income_source');
}

export function generateDistributionId(): string {
  return generateId('distribution');
}

export function generateNomenclatureId(): string {
  return generateId('nomenclature');
}

export function generateCategoryId(): string {
  return generateId('category');
}

export function generateItemId(): string {
  return generateId('item');
}

export function generateSourceId(): string {
  return generateId('source');
}

export function generateDistId(): string {
  return generateId('dist');
}