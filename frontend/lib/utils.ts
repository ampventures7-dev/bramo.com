import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a direct WhatsApp wa.me link with pre-filled message
 * @param phone Indian mobile number string without +
 * @param message Pre-filled URL encoded message
 */
export function getWhatsAppLink(phone: string, message: string): string {
  // Strip non-numeric characters
  const cleanPhone = phone.replace(/\D/g, "");
  // Ensure country code 91 if 10-digit number
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${finalPhone}?text=${encodedMsg}`;
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
