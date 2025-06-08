import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development, use placeholder values if env vars are not set
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

const finalUrl = supabaseUrl || defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

console.log('Supabase URL:', finalUrl);
console.log('Supabase Key present:', !!finalKey);

export const supabase = createClient(finalUrl, finalKey);

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