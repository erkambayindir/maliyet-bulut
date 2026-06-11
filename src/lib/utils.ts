import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Decimal from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/** Herhangi bir değeri güvenli şekilde sayıya çevirir (Decimal nesnesi dahil) */
function toSafeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") return parseFloat(value.replace(",", ".")) || 0;
  // Decimal.js veya Prisma Decimal nesnesi
  if (typeof value === "object" && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export function formatCurrency(value: unknown): string {
  const num = toSafeNumber(value);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: unknown, decimals = 4): string {
  const num = toSafeNumber(value);
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function parseDecimalInput(value: string): Decimal {
  // Accept both comma and dot as decimal separator
  const normalized = value.replace(",", ".").replace(/\s/g, "");
  try {
    return new Decimal(normalized);
  } catch {
    return new Decimal(0);
  }
}

export function calcMetrajQty(
  adet: Decimal | number,
  en: Decimal | number,
  boy: Decimal | number,
  yukseklik: Decimal | number
): Decimal {
  return new Decimal(adet)
    .times(new Decimal(en))
    .times(new Decimal(boy))
    .times(new Decimal(yukseklik));
}

// Rebar weight per meter (kg/m) by diameter (mm)
export const REBAR_WEIGHT: Record<number, number> = {
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.208,
  16: 1.578,
  18: 1.998,
  20: 2.466,
  22: 2.984,
  25: 3.853,
  28: 4.834,
  32: 6.313,
};

export function calcRebarKg(
  cap: number,
  uzunluk: Decimal | number,
  adet: Decimal | number
): Decimal {
  const weightPerMeter = new Decimal(REBAR_WEIGHT[cap] ?? 0);
  return weightPerMeter.times(new Decimal(uzunluk)).times(new Decimal(adet));
}
