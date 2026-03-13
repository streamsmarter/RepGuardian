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
      app_user: {
        Row: {
          id: string
          user_id: string | null
          company_id: string
          role: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_id: string
          role: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          company_id?: string
          role?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      appointment: {
        Row: {
          id: string
          company_id: string
          client_id: string
          scheduled_at: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          scheduled_at: string
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          scheduled_at?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      chat: {
        Row: {
          id: string
          company_id: string
          client_id: string
          status: string
          created_at: string
          updated_at: string | null
          status_updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          status: string
          created_at?: string
          updated_at?: string | null
          status_updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          status?: string
          created_at?: string
          updated_at?: string | null
          status_updated_at?: string | null
        }
      }
      client: {
        Row: {
          id: string
          company_id: string
          first_name: string
          last_name: string
          email: string | null
          phone_number: string
          review_submitted: boolean
          review_request_sent: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone_number: string
          review_submitted?: boolean
          review_request_sent?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone_number?: string
          review_submitted?: boolean
          review_request_sent?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      company: {
        Row: {
          id: string
          name: string
          user_id: string | null
          created_at: string
          updated_at: string | null
          conflict_resolution_prompt: string | null
          twilio_auth_token: string | null
          twilio_sid_key: string | null
          review_link: string | null
          phone_number: string
          crm_type: string
          business_id: string | null
          reputation_score: Json | null
          reviews_analysis: Json | null
          placeIds: string[] | null
          booking_link: string | null
          points_to_usd: number | null
          twilio_messaging_service_sid: string | null
        }
        Insert: {
          id?: string
          name: string
          user_id?: string | null
          created_at?: string
          updated_at?: string | null
          conflict_resolution_prompt?: string | null
          twilio_auth_token?: string | null
          twilio_sid_key?: string | null
          review_link?: string | null
          phone_number?: string
          crm_type: string
          business_id?: string | null
          reputation_score?: Json | null
          reviews_analysis?: Json | null
          placeIds?: string[] | null
          booking_link?: string | null
          points_to_usd?: number | null
          twilio_messaging_service_sid?: string | null
        }
        Update: {
          id?: string
          name?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string | null
          conflict_resolution_prompt?: string | null
          twilio_auth_token?: string | null
          twilio_sid_key?: string | null
          review_link?: string | null
          phone_number?: string
          crm_type?: string
          business_id?: string | null
          reputation_score?: Json | null
          reviews_analysis?: Json | null
          placeIds?: string[] | null
          booking_link?: string | null
          points_to_usd?: number | null
          twilio_messaging_service_sid?: string | null
        }
      }
      conflict: {
        Row: {
          id: string
          company_id: string
          client_id: string
          description: string
          status: string
          resolution: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          description: string
          status: string
          resolution?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          description?: string
          status?: string
          resolution?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      faq: {
        Row: {
          id: string
          company_id: string
          question: string
          answer: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          question: string
          answer: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          question?: string
          answer?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          company_id: string
          client_id: string
          feedback_message: string
          sentiment_score: number | null
          severity: string
          tags: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          feedback_message: string
          sentiment_score?: number | null
          severity?: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          feedback_message?: string
          sentiment_score?: number | null
          severity?: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          message: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          message: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          message?: Json
          created_at?: string
        }
      }
      referral: {
        Row: {
          id: string
          company_id: string
          client_id: string
          referral_code: string
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          referral_code: string
          status: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          referral_code?: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      reward: {
        Row: {
          id: string
          company_id: string
          client_id: string
          points: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          points: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          points?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      reward_service: {
        Row: {
          id: string
          company_id: string
          name: string
          points_required: number
          description: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          points_required: number
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          points_required?: number
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      service: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          price: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          price?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          price?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      link: {
        Row: {
          id: string
          created_at: string
          link: string | null
          type: string | null
          company_id: string | null
          client_id: string | null
          sms_sid: string | null
          metadata: Json | null
          receiver_phone_number: string | null
          source_object: string | null
          click_count: number | null
          last_clicked: string | null
          refcode: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          link?: string | null
          type?: string | null
          company_id?: string | null
          client_id?: string | null
          sms_sid?: string | null
          metadata?: Json | null
          receiver_phone_number?: string | null
          source_object?: string | null
          click_count?: number | null
          last_clicked?: string | null
          refcode?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          link?: string | null
          type?: string | null
          company_id?: string | null
          client_id?: string | null
          sms_sid?: string | null
          metadata?: Json | null
          receiver_phone_number?: string | null
          source_object?: string | null
          click_count?: number | null
          last_clicked?: string | null
          refcode?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
