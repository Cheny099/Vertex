import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads a controlled `<input type="number">` value.
 *
 * A number input reports `''` while it is empty or mid-edit ("-", "1e"). `parseInt(v) || fallback`
 * turns that into the fallback and writes it straight back into the field, so the digits the user
 * types next get appended to it ("" -> 50 -> typing "1" gives 501). It also swallows a deliberate
 * 0. Returning `null` for "no value yet" lets the caller keep the field empty and decide what an
 * empty field means at submit time.
 *
 * `min`/`max` clamp only real numbers - they never resurrect an empty field.
 */
export function parseNumberInput(
  raw: string,
  { min, max, integer }: { min?: number; max?: number; integer?: boolean } = {}
): number | null {
  if (raw.trim() === '') return null;
  let n = Number(raw);
  if (!Number.isFinite(n)) return null;
  // Number() accepts "2.5" where the old parseInt() silently truncated it; endpoints that declare
  // an int would reject the fraction, so callers for those fields opt into truncation explicitly.
  if (integer) n = Math.trunc(n);
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}
