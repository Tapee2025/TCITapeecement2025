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

// Calculate points based on cement type - FIXED to ensure proper integer handling
export function calculatePointsByCementType(bags: number, cementType: 'OPC' | 'PPC'): number {
  // Ensure bags is a proper integer - use parseInt to handle string inputs properly
  const bagCount = parseInt(bags.toString(), 10);
  
  if (isNaN(bagCount) || bagCount <= 0) {
    return 0;
  }
  
  if (cementType === 'OPC') {
    return bagCount * 5; // 5 points per OPC bag - no rounding needed for whole numbers
  } else {
    return bagCount * 10; // 10 points per PPC bag - no rounding needed for whole numbers
  }
}

// Calculate bags from points and cement type
export function calculateBagsFromPoints(points: number, cementType: 'OPC' | 'PPC'): number {
  if (cementType === 'OPC') {
    return Math.floor(points / 5); // 5 points per OPC bag - use floor to avoid over-counting
  } else {
    return Math.floor(points / 10); // 10 points per PPC bag - use floor to avoid over-counting
  }
}

// Calculate bags from transaction description and points
export function calculateBagsFromTransaction(description: string, points: number): number {
  if (description.includes('OPC')) {
    return Math.floor(points / 5); // OPC cement: 5 points per bag - use floor to avoid over-counting
  } else if (description.includes('PPC')) {
    return Math.floor(points / 10); // PPC cement: 10 points per bag - use floor to avoid over-counting
  } else {
    // Legacy transactions without cement type - assume PPC
    return Math.floor(points / 10);
  }
}

// Get cement type from transaction description
export function getCementTypeFromDescription(description: string): 'OPC' | 'PPC' | 'Unknown' {
  if (description.includes('OPC')) {
    return 'OPC';
  } else if (description.includes('PPC')) {
    return 'PPC';
  } else {
    return 'Unknown';
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