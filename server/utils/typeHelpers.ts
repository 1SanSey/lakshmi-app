/**
 * Утилиты для работы с типами
 */

export function safeDateParse(date: Date | null): Date | undefined {
  if (!date) return undefined;
  return new Date(date);
}

export function safeStringParse(value: string | null | undefined): string | null {
  return value ?? null;
}

export function safeNumberToString(value: number): string {
  return value.toString();
}

export function ensureString(value: string | undefined): string {
  if (!value) throw new Error("Required string value is missing");
  return value;
}

export function ensureNonNull<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("Required value is null or undefined");
  }
  return value;
}