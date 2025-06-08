import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'builder' | 'dealer' | 'contractor' | 'admin';
          city: string;
          address: string;
          district: string;
          gst_number: string | null;
          mobile_number: string;
          user_code: string;
          points: number;
          created_at: string;
          updated_at: string;
          profile_picture_url: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'builder' | 'dealer' | 'contractor' | 'admin';
          city: string;
          address: string;
          district: string;
          gst_number?: string | null;
          mobile_number: string;
          user_code: string;
          points?: number;
          created_at?: string;
          updated_at?: string;
          profile_picture_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: 'builder' | 'dealer' | 'contractor' | 'admin';
          city?: string;
          address?: string;
          district?: string;
          gst_number?: string | null;
          mobile_number?: string;
          user_code?: string;
          points?: number;
          created_at?: string;
          updated_at?: string;
          profile_picture_url?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'earned' | 'redeemed';
          amount: number;
          description: string;
          status: 'pending' | 'approved' | 'rejected' | 'dealer_approved';
          dealer_id: string | null;
          reward_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'earned' | 'redeemed';
          amount: number;
          description: string;
          status: 'pending' | 'approved' | 'rejected' | 'dealer_approved';
          dealer_id?: string | null;
          reward_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'earned' | 'redeemed';
          amount?: number;
          description?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'dealer_approved';
          dealer_id?: string | null;
          reward_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          points_required: number;
          available: boolean;
          expiry_date: string;
          created_at: string;
          updated_at: string;
          visible_to: string[];
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url: string;
          points_required: number;
          available?: boolean;
          expiry_date: string;
          created_at?: string;
          updated_at?: string;
          visible_to?: string[];
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string;
          points_required?: number;
          available?: boolean;
          expiry_date?: string;
          created_at?: string;
          updated_at?: string;
          visible_to?: string[];
        };
      };
      marketing_slides: {
        Row: {
          id: string;
          image_url: string;
          title: string;
          active: boolean;
          order_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          title: string;
          active?: boolean;
          order_number: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          title?: string;
          active?: boolean;
          order_number?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      dealer_approvals: {
        Row: {
          id: string;
          transaction_id: string | null;
          user_id: string | null;
          dealer_id: string | null;
          amount: number;
          description: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id?: string | null;
          user_id?: string | null;
          dealer_id?: string | null;
          amount: number;
          description: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          user_id?: string | null;
          dealer_id?: string | null;
          amount?: number;
          description?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};