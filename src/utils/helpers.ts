import { format, parseISO } from 'date-fns';

// Format date to readable string
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Generate 5-digit unique code
export function generateUserCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Calculate points from bags (legacy function for backward compatibility)
export function calculatePoints(bags: number): number {
  return bags * 10; // Default to PPC cement points
}

// Calculate points based on cement type
export function calculatePointsByCementType(bags: number, cementType: 'OPC' | 'PPC'): number {
  if (cementType === 'OPC') {
    return bags * 5; // 5 points per OPC bag
  } else {
    return bags * 10; // 10 points per PPC bag
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Get user's full name
export function getUserFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Format phone number
export function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length !== 10) return phoneNumber;
  return `+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}`;
}