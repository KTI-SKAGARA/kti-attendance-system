import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indonesian Rupiah currency.
 * e.g. 5000 -> "Rp 5.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Get today's date formatted as DD/MM/YYYY.
 */
export function getTodayFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get current month-year formatted as MM-YYYY.
 */
export function getCurrentBulanTahun(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${month}-${year}`;
}

/**
 * Mask a full name for display on public-facing pages (privacy).
 * e.g. "MUHAMMAD RIZKY PRATAMA" -> "MUHAMMAD P." / "AHMAD" -> "A***"
 */
export function maskNama(nama: string): string {
  const parts = nama.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) {
    return parts[0].length > 2 ? `${parts[0][0]}***` : parts[0];
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`;
}

/**
 * Convert MM-YYYY to a human-readable month name in Indonesian.
 * e.g. "07-2026" -> "Juli 2026"
 */
export function formatBulanTahun(bulanTahun: string): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [month, year] = bulanTahun.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${months[monthIndex]} ${year}`;
  }
  return bulanTahun;
}
