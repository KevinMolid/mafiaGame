// src/constants/support.ts

// Keep literals intact for strong typing
export const CATEGORIES = [
  { value: "bug",      label: "Feil & krasj" },
  { value: "account",  label: "Konto & innlogging" },
  { value: "purchase", label: "Kjøp & betaling" },
  { value: "report",   label: "Rapporter spiller / Juks" },
  { value: "balance",  label: "Balanse & spillinnhold" },
  { value: "other",    label: "Annet" },
] as const;

// Derive union type from the constant (no duplication)
export type CategoryValue = typeof CATEGORIES[number]["value"];

// Handy lookup map
export const CATEGORY_LABELS: Record<CategoryValue, string> =
  Object.fromEntries(CATEGORIES.map(c => [c.value, c.label])) as Record<CategoryValue, string>;

// Safe helper if the value could be unknown
export function getCategoryLabel(val?: string | null) {
  if (!val) return "Ukjent kategori";
  return (CATEGORY_LABELS as Record<string, string>)[val] ?? val;
}
