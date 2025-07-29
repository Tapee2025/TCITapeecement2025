// User Types
export type UserRole = 'dealer' | 'contractor' | 'admin' | 'sub_dealer';

export interface User {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  city: string;
  address: string;
  district: string;
  gstNumber?: string;
  mobileNumber: string;
  userCode: string; // 5-digit unique code
  points: number;
  createdAt: string;
}

// Rewards Types
export interface Reward {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pointsRequired: number;
  available: boolean;
  expiryDate: string; // ISO date string
  createdAt: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed';
  amount: number; // Points amount
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  dealerId?: string; // For points earned from a dealer
  rewardId?: string; // For points redeemed for a reward
  createdAt: string;
  updatedAt: string;
}

// Approval Types
export interface PointsRequest {
  id: string;
  userId: string;
  userName: string; // First + Last name
  userRole: UserRole;
  userDistrict: string;
  dealerId: string;
  dealerName: string;
  bagsCount: number;
  pointsAmount: number; // 10 points per bag
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Redemption Types
export interface RewardRedemption {
  id: string;
  userId: string;
  userName: string;
  userAddress: string;
  userMobile: string;
  rewardId: string;
  rewardTitle: string;
  pointsRedeemed: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Marketing Types
export interface MarketingSlide {
  id: string;
  imageUrl: string;
  title: string;
  active: boolean;
  order: number;
  createdAt: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  city: string;
  address: string;
  district: string;
  gstNumber?: string;
  mobileNumber: string;
}