export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'reward' | 'transaction';
  read: boolean;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'maintenance' | 'feature' | 'promotion' | 'urgent';
  target_roles: string[];
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  starts_at: string;
  ends_at?: string;
  created_by: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: 'technical' | 'account' | 'points' | 'rewards' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  attachments?: string[];
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  period: string;
  total_users: number;
  active_users: number;
  new_registrations: number;
  total_transactions: number;
  total_points_issued: number;
  total_bags_sold: number;
  total_rewards_redeemed: number;
  revenue_impact: number;
  user_engagement_rate: number;
  top_performing_dealers: Array<{
    dealer_id: string;
    name: string;
    bags_sold: number;
    points_issued: number;
  }>;
  popular_rewards: Array<{
    reward_id: string;
    title: string;
    redemption_count: number;
  }>;
}