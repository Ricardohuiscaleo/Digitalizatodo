import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns today's date string in Chile timezone: "2026-03-15" */
export function todayCL(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

/** Returns a Date-like object adjusted to Chile timezone */
export function nowCL(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
}
