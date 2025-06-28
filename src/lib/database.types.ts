export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'dealer' | 'contractor' | 'admin'
          city: string
          address: string
          district: string
          gst_number: string | null
          mobile_number: string
          user_code: string
          points: number
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: 'dealer' | 'contractor' | 'admin'
          city: string
          address: string
          district: string
          gst_number?: string | null
          mobile_number: string
          user_code: string
          points?: number
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'dealer' | 'contractor' | 'admin'
          city?: string
          address?: string
          district?: string
          gst_number?: string | null
          mobile_number?: string
          user_code?: string
          points?: number
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          points_required: number
          available: boolean
          visible_to: ('dealer' | 'contractor')[]
          expiry_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          points_required: number
          available?: boolean
          visible_to?: ('dealer' | 'contractor')[]
          expiry_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          points_required?: number
          available?: boolean
          visible_to?: ('dealer' | 'contractor')[]
          expiry_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'earned' | 'redeemed'
          amount: number
          description: string
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'dealer_approved'
          dealer_id: string | null
          reward_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'earned' | 'redeemed'
          amount: number
          description: string
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'dealer_approved'
          dealer_id?: string | null
          reward_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'earned' | 'redeemed'
          amount?: number
          description?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'dealer_approved'
          dealer_id?: string | null
          reward_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      marketing_slides: {
        Row: {
          id: string
          image_url: string
          title: string
          active: boolean
          order_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          title: string
          active?: boolean
          order_number: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          title?: string
          active?: boolean
          order_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      dealer_approvals: {
        Row: {
          id: string
          transaction_id: string | null
          user_id: string | null
          dealer_id: string | null
          amount: number
          description: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id?: string | null
          user_id?: string | null
          dealer_id?: string | null
          amount: number
          description: string
          status: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string | null
          user_id?: string | null
          dealer_id?: string | null
          amount?: number
          description?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}