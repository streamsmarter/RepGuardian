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
      ai_agent: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string; name: string; description: string | null; role: string; status: string; is_default: boolean; priority: number; system_prompt: string; style_instructions: string | null; goal_instructions: string | null; tone: Json; glossary: Json; business_context: Json; allowed_channels: Json; allowed_actions: Json; model: string | null; temperature: number | null; max_tokens: number | null; handoff_enabled: boolean; handoff_rules: Json; metadata: Json }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id: string; name: string; description?: string | null; role?: string; status?: string; is_default?: boolean; priority?: number; system_prompt: string; style_instructions?: string | null; goal_instructions?: string | null; tone?: Json; glossary?: Json; business_context?: Json; allowed_channels?: Json; allowed_actions?: Json; model?: string | null; temperature?: number | null; max_tokens?: number | null; handoff_enabled?: boolean; handoff_rules?: Json; metadata?: Json }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string; name?: string; description?: string | null; role?: string; status?: string; is_default?: boolean; priority?: number; system_prompt?: string; style_instructions?: string | null; goal_instructions?: string | null; tone?: Json; glossary?: Json; business_context?: Json; allowed_channels?: Json; allowed_actions?: Json; model?: string | null; temperature?: number | null; max_tokens?: number | null; handoff_enabled?: boolean; handoff_rules?: Json; metadata?: Json }
      }
      app_user: {
        Row: { id: string; created_at: string; company_id: string; name: string; employee_id_crm: string | null; user_id: string | null; role: string | null }
        Insert: { id?: string; created_at?: string; company_id: string; name: string; employee_id_crm?: string | null; user_id?: string | null; role?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string; name?: string; employee_id_crm?: string | null; user_id?: string | null; role?: string | null }
      }
      appointment: {
        Row: { id: string; created_at: string; client_id: string; service_id: string; company_id: string; performed_at: string; dollar_value: number | null; place_id: string | null; workers_commission: number | null; id_crm: string | null; service_provider_id: string | null }
        Insert: { id?: string; created_at?: string; client_id: string; service_id: string; company_id: string; performed_at: string; dollar_value?: number | null; place_id?: string | null; workers_commission?: number | null; id_crm?: string | null; service_provider_id?: string | null }
        Update: { id?: string; created_at?: string; client_id?: string; service_id?: string; company_id?: string; performed_at?: string; dollar_value?: number | null; place_id?: string | null; workers_commission?: number | null; id_crm?: string | null; service_provider_id?: string | null }
      }
      audience_segment: {
        Row: { id: string; created_at: string; company_id: string | null; name: string | null; description: string | null; criteria: Json | null; is_active: boolean | null; updated_at: string | null }
        Insert: { id?: string; created_at?: string; company_id?: string | null; name?: string | null; description?: string | null; criteria?: Json | null; is_active?: boolean | null; updated_at?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string | null; name?: string | null; description?: string | null; criteria?: Json | null; is_active?: boolean | null; updated_at?: string | null }
      }
      billing_customer: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string; user_id: string | null; stripe_customer_id: string; email: string | null; name: string | null; metadata: Json; status: string | null }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id: string; user_id?: string | null; stripe_customer_id: string; email?: string | null; name?: string | null; metadata?: Json; status?: string | null }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string; user_id?: string | null; stripe_customer_id?: string; email?: string | null; name?: string | null; metadata?: Json; status?: string | null }
      }
      billing_event: {
        Row: { id: string; created_at: string; stripe_event_id: string; event_type: string; company_id: string | null; subscription_id: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; processed: boolean; processed_at: string | null; payload: Json; error_message: string | null }
        Insert: { id?: string; created_at?: string; stripe_event_id: string; event_type: string; company_id?: string | null; subscription_id?: string | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; processed?: boolean; processed_at?: string | null; payload: Json; error_message?: string | null }
        Update: { id?: string; created_at?: string; stripe_event_id?: string; event_type?: string; company_id?: string | null; subscription_id?: string | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; processed?: boolean; processed_at?: string | null; payload?: Json; error_message?: string | null }
      }
      campaign: {
        Row: { id: string; created_at: string; company_id: string | null; channel: string | null; status: string | null; audience_segment_id: string | null; goal: string | null; settings: Json | null; start_at: string | null; end_at: string | null; referral_program: string | null; type: string | null; submissions_count: number | null; clicks_count: number | null; total_sends_count: number | null; conversion_rate: number | null; click_through_rate: number | null; clients_count: number | null; revenue_generated: number | null; rewards_expenses: number | null }
        Insert: { id?: string; created_at?: string; company_id?: string | null; channel?: string | null; status?: string | null; audience_segment_id?: string | null; goal?: string | null; settings?: Json | null; start_at?: string | null; end_at?: string | null; referral_program?: string | null; type?: string | null; submissions_count?: number | null; clicks_count?: number | null; total_sends_count?: number | null; conversion_rate?: number | null; click_through_rate?: number | null; clients_count?: number | null; revenue_generated?: number | null; rewards_expenses?: number | null }
        Update: { id?: string; created_at?: string; company_id?: string | null; channel?: string | null; status?: string | null; audience_segment_id?: string | null; goal?: string | null; settings?: Json | null; start_at?: string | null; end_at?: string | null; referral_program?: string | null; type?: string | null; submissions_count?: number | null; clicks_count?: number | null; total_sends_count?: number | null; conversion_rate?: number | null; click_through_rate?: number | null; clients_count?: number | null; revenue_generated?: number | null; rewards_expenses?: number | null }
      }
      campaign_recipient: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string; campaign_id: string; referral_program_id: string; client_id: string; audience_segment_id: string | null; link_id: string | null; channel: string; status: string; send_attempts: number; sent_at: string | null; delivered_at: string | null; failed_at: string | null; clicked_at: string | null; converted_at: string | null; message_sid: string | null; error_message: string | null; metadata: Json; submitted_at: string | null; revenue_generated: number | null; rewards_expenses: number | null }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id: string; campaign_id: string; referral_program_id: string; client_id: string; audience_segment_id?: string | null; link_id?: string | null; channel?: string; status?: string; send_attempts?: number; sent_at?: string | null; delivered_at?: string | null; failed_at?: string | null; clicked_at?: string | null; converted_at?: string | null; message_sid?: string | null; error_message?: string | null; metadata?: Json; submitted_at?: string | null; revenue_generated?: number | null; rewards_expenses?: number | null }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string; campaign_id?: string; referral_program_id?: string; client_id?: string; audience_segment_id?: string | null; link_id?: string | null; channel?: string; status?: string; send_attempts?: number; sent_at?: string | null; delivered_at?: string | null; failed_at?: string | null; clicked_at?: string | null; converted_at?: string | null; message_sid?: string | null; error_message?: string | null; metadata?: Json; submitted_at?: string | null; revenue_generated?: number | null; rewards_expenses?: number | null }
      }
      chat: {
        Row: { id: string; created_at: string; company_id: string; client_id: string; client_phone_number: string | null; company_phone_number: string | null; status_updated_at: string | null; autopilot: boolean | null }
        Insert: { id?: string; created_at?: string; company_id: string; client_id: string; client_phone_number?: string | null; company_phone_number?: string | null; status_updated_at?: string | null; autopilot?: boolean | null }
        Update: { id?: string; created_at?: string; company_id?: string; client_id?: string; client_phone_number?: string | null; company_phone_number?: string | null; status_updated_at?: string | null; autopilot?: boolean | null }
      }
      chat_memory: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string | null; client_id: string | null; message: Json; embedding: unknown | null; session_id: string }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id?: string | null; client_id?: string | null; message?: Json; embedding?: unknown | null; session_id: string }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string | null; client_id?: string | null; message?: Json; embedding?: unknown | null; session_id?: string }
      }
      client: {
        Row: { id: string; created_at: string; first_name: string; company_id: string; phone_number: string; email: string | null; client_id_crm: string | null; review_request_sent: boolean; status: string; last_name: string | null; points_count: number | null; preferences: Json | null; referred_by: string | null }
        Insert: { id?: string; created_at?: string; first_name: string; company_id: string; phone_number?: string; email?: string | null; client_id_crm?: string | null; review_request_sent?: boolean; status?: string; last_name?: string | null; points_count?: number | null; preferences?: Json | null; referred_by?: string | null }
        Update: { id?: string; created_at?: string; first_name?: string; company_id?: string; phone_number?: string; email?: string | null; client_id_crm?: string | null; review_request_sent?: boolean; status?: string; last_name?: string | null; points_count?: number | null; preferences?: Json | null; referred_by?: string | null }
      }
      client_audience_segment_join: {
        Row: { id: string; created_at: string; company_id: string; client_id: string; audience_segment_id: string; source: string }
        Insert: { id?: string; created_at?: string; company_id: string; client_id: string; audience_segment_id: string; source?: string }
        Update: { id?: string; created_at?: string; company_id?: string; client_id?: string; audience_segment_id?: string; source?: string }
      }
      client_reward: {
        Row: { id: string; created_at: string; company_id: string; client_id: string; reward_id: string | null; status: string; source_type: string | null; issued_at: string; redeemed_at: string | null; metadata: Json; expires_at: string | null; source_id: string | null; dollar_value: number | null; reward_amount: number | null; reward_type: string | null }
        Insert: { id?: string; created_at?: string; company_id: string; client_id: string; reward_id?: string | null; status?: string; source_type?: string | null; issued_at?: string; redeemed_at?: string | null; metadata?: Json; expires_at?: string | null; source_id?: string | null; dollar_value?: number | null; reward_amount?: number | null; reward_type?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string; client_id?: string; reward_id?: string | null; status?: string; source_type?: string | null; issued_at?: string; redeemed_at?: string | null; metadata?: Json; expires_at?: string | null; source_id?: string | null; dollar_value?: number | null; reward_amount?: number | null; reward_type?: string | null }
      }
      company: {
        Row: { id: string; created_at: string; name: string; conflict_resolution_prompt: string | null; twilio_auth_token: string | null; twilio_sid_key: string | null; review_link: string | null; phone_number: string; crm_type: string; business_id: string | null; user_id: string | null; reputation_score: Json | null; reviews_analysis: Json | null; placeIds: string[] | null; booking_link: string | null; points_to_usd: number | null; twilio_messaging_service_sid: string | null; stripe_customer_id: string | null; features_enabled: Json | null; subscription_status: string | null; google_maps_url: string | null; payment_method_connected: boolean | null; stripe_plan_id: string | null; reengagement_metadata: Json | null }
        Insert: { id?: string; created_at?: string; name: string; conflict_resolution_prompt?: string | null; twilio_auth_token?: string | null; twilio_sid_key?: string | null; review_link?: string | null; phone_number?: string; crm_type: string; business_id?: string | null; user_id?: string | null; reputation_score?: Json | null; reviews_analysis?: Json | null; placeIds?: string[] | null; booking_link?: string | null; points_to_usd?: number | null; twilio_messaging_service_sid?: string | null; stripe_customer_id?: string | null; features_enabled?: Json | null; subscription_status?: string | null; google_maps_url?: string | null; payment_method_connected?: boolean | null; stripe_plan_id?: string | null; reengagement_metadata?: Json | null }
        Update: { id?: string; created_at?: string; name?: string; conflict_resolution_prompt?: string | null; twilio_auth_token?: string | null; twilio_sid_key?: string | null; review_link?: string | null; phone_number?: string; crm_type?: string; business_id?: string | null; user_id?: string | null; reputation_score?: Json | null; reviews_analysis?: Json | null; placeIds?: string[] | null; booking_link?: string | null; points_to_usd?: number | null; twilio_messaging_service_sid?: string | null; stripe_customer_id?: string | null; features_enabled?: Json | null; subscription_status?: string | null; google_maps_url?: string | null; payment_method_connected?: boolean | null; stripe_plan_id?: string | null; reengagement_metadata?: Json | null }
      }
      conflict: {
        Row: { id: string; created_at: string; company_id: string; client_id: string; status: string; assigned_user_id: string | null; closed_at: string | null; reward_id: string | null; conflict_type: string | null; conflict_notes: Json | null; severity: string | null; user_id: string | null }
        Insert: { id?: string; created_at?: string; company_id: string; client_id: string; status?: string; assigned_user_id?: string | null; closed_at?: string | null; reward_id?: string | null; conflict_type?: string | null; conflict_notes?: Json | null; severity?: string | null; user_id?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string; client_id?: string; status?: string; assigned_user_id?: string | null; closed_at?: string | null; reward_id?: string | null; conflict_type?: string | null; conflict_notes?: Json | null; severity?: string | null; user_id?: string | null }
      }
      faq: {
        Row: { id: string; created_at: string; company_id: string | null; question: string | null; answer: string | null; embedding: unknown | null }
        Insert: { id?: string; created_at?: string; company_id?: string | null; question?: string | null; answer?: string | null; embedding?: unknown | null }
        Update: { id?: string; created_at?: string; company_id?: string | null; question?: string | null; answer?: string | null; embedding?: unknown | null }
      }
      feedback: {
        Row: { id: string; created_at: string; client_id: string; company_id: string; feedback_message: string; sentiment_score: number | null; embedding: unknown | null; severity: string | null; tags: Json | null; user_id: string | null }
        Insert: { id?: string; created_at?: string; client_id: string; company_id: string; feedback_message: string; sentiment_score?: number | null; embedding?: unknown | null; severity?: string | null; tags?: Json | null; user_id?: string | null }
        Update: { id?: string; created_at?: string; client_id?: string; company_id?: string; feedback_message?: string; sentiment_score?: number | null; embedding?: unknown | null; severity?: string | null; tags?: Json | null; user_id?: string | null }
      }
      invoice: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string; subscription_id: string | null; stripe_invoice_id: string; stripe_customer_id: string | null; stripe_payment_intent_id: string | null; amount_due: number; amount_paid: number; amount_remaining: number; currency: string | null; status: string; hosted_invoice_url: string | null; invoice_pdf: string | null; period_start: string | null; period_end: string | null; due_date: string | null; paid_at: string | null; metadata: Json }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id: string; subscription_id?: string | null; stripe_invoice_id: string; stripe_customer_id?: string | null; stripe_payment_intent_id?: string | null; amount_due?: number; amount_paid?: number; amount_remaining?: number; currency?: string | null; status: string; hosted_invoice_url?: string | null; invoice_pdf?: string | null; period_start?: string | null; period_end?: string | null; due_date?: string | null; paid_at?: string | null; metadata?: Json }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string; subscription_id?: string | null; stripe_invoice_id?: string; stripe_customer_id?: string | null; stripe_payment_intent_id?: string | null; amount_due?: number; amount_paid?: number; amount_remaining?: number; currency?: string | null; status?: string; hosted_invoice_url?: string | null; invoice_pdf?: string | null; period_start?: string | null; period_end?: string | null; due_date?: string | null; paid_at?: string | null; metadata?: Json }
      }
      link: {
        Row: { id: string; created_at: string; link: string | null; type: string | null; company_id: string | null; client_id: string | null; sms_sid: string | null; click_count: number; last_clicked: string | null; refcode: string | null; submission_count: number; customer_count: number; campaign_id: string | null; metadata: Json | null; referral_program_id: string | null }
        Insert: { id?: string; created_at?: string; link?: string | null; type?: string | null; company_id?: string | null; client_id?: string | null; sms_sid?: string | null; click_count?: number; last_clicked?: string | null; refcode?: string | null; submission_count?: number; customer_count?: number; campaign_id?: string | null; metadata?: Json | null; referral_program_id?: string | null }
        Update: { id?: string; created_at?: string; link?: string | null; type?: string | null; company_id?: string | null; client_id?: string | null; sms_sid?: string | null; click_count?: number; last_clicked?: string | null; refcode?: string | null; submission_count?: number; customer_count?: number; campaign_id?: string | null; metadata?: Json | null; referral_program_id?: string | null }
      }
      messages: {
        Row: { id: string; created_at: string; session_id: string; role: string | null; message: string | null; sentiment_score: string | null }
        Insert: { id?: string; created_at?: string; session_id: string; role?: string | null; message?: string | null; sentiment_score?: string | null }
        Update: { id?: string; created_at?: string; session_id?: string; role?: string | null; message?: string | null; sentiment_score?: string | null }
      }
      plans: {
        Row: { id: string; created_at: string; name: string; price: number | null; metadata: Json | null; is_active: boolean | null; stripe_price_id: string | null; cadence: string | null }
        Insert: { id?: string; created_at?: string; name: string; price?: number | null; metadata?: Json | null; is_active?: boolean | null; stripe_price_id?: string | null; cadence?: string | null }
        Update: { id?: string; created_at?: string; name?: string; price?: number | null; metadata?: Json | null; is_active?: boolean | null; stripe_price_id?: string | null; cadence?: string | null }
      }
      profiles: {
        Row: { id: string; company_id: string | null }
        Insert: { id: string; company_id?: string | null }
        Update: { id?: string; company_id?: string | null }
      }
      referral: {
        Row: { id: string; created_at: string; referrer_id: string; referrer_reward_id: string | null; status: string | null; company_id: string; link_id: string | null; referred_client: string | null; referred_phone_number: string | null; referred_reward_id: string | null; referral_program_id: string | null }
        Insert: { id?: string; created_at?: string; referrer_id: string; referrer_reward_id?: string | null; status?: string | null; company_id: string; link_id?: string | null; referred_client?: string | null; referred_phone_number?: string | null; referred_reward_id?: string | null; referral_program_id?: string | null }
        Update: { id?: string; created_at?: string; referrer_id?: string; referrer_reward_id?: string | null; status?: string | null; company_id?: string; link_id?: string | null; referred_client?: string | null; referred_phone_number?: string | null; referred_reward_id?: string | null; referral_program_id?: string | null }
      }
      referral_program: {
        Row: { id: string; created_at: string; updated_at: string; company_id: string; status: string; referrer_reward_id: string | null; referred_reward_id: string | null; destination_url: string | null; attribution_window_days: number | null; requires_manual_approval: boolean | null; max_referrals_per_referrer: number | null; qualification_rules: Json | null; metadata: Json | null; referrer_reward_amount: number | null; referred_reward_amount: number | null; referrer_reward_type: string | null; referred_reward_type: string | null }
        Insert: { id?: string; created_at?: string; updated_at?: string; company_id: string; status?: string; referrer_reward_id?: string | null; referred_reward_id?: string | null; destination_url?: string | null; attribution_window_days?: number | null; requires_manual_approval?: boolean | null; max_referrals_per_referrer?: number | null; qualification_rules?: Json | null; metadata?: Json | null; referrer_reward_amount?: number | null; referred_reward_amount?: number | null; referrer_reward_type?: string | null; referred_reward_type?: string | null }
        Update: { id?: string; created_at?: string; updated_at?: string; company_id?: string; status?: string; referrer_reward_id?: string | null; referred_reward_id?: string | null; destination_url?: string | null; attribution_window_days?: number | null; requires_manual_approval?: boolean | null; max_referrals_per_referrer?: number | null; qualification_rules?: Json | null; metadata?: Json | null; referrer_reward_amount?: number | null; referred_reward_amount?: number | null; referrer_reward_type?: string | null; referred_reward_type?: string | null }
      }
      reminder: {
        Row: { id: string; created_at: string; company_id: string | null; client_id: string | null; status: string | null; reminder_message: string | null; type: string | null; link_id: string | null; client_name: string; reengaged_date: string | null }
        Insert: { id?: string; created_at?: string; company_id?: string | null; client_id?: string | null; status?: string | null; reminder_message?: string | null; type?: string | null; link_id?: string | null; client_name: string; reengaged_date?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string | null; client_id?: string | null; status?: string | null; reminder_message?: string | null; type?: string | null; link_id?: string | null; client_name?: string; reengaged_date?: string | null }
      }
      review: {
        Row: { id: string; created_at: string; body: string | null; source: string | null; reviewer_name: string | null; place_id: string | null; company_id: string; review_published_at: string | null; response_body: string | null; review_url: string | null; google_review_id: string | null; reviewer_id: string | null; stars: number | null; response_date: string | null; gathering_method: string | null; tags: Json | null; response_type: string | null; ai_response_apprroved: boolean | null; ai_response: string | null }
        Insert: { id?: string; created_at?: string; body?: string | null; source?: string | null; reviewer_name?: string | null; place_id?: string | null; company_id: string; review_published_at?: string | null; response_body?: string | null; review_url?: string | null; google_review_id?: string | null; reviewer_id?: string | null; stars?: number | null; response_date?: string | null; gathering_method?: string | null; tags?: Json | null; response_type?: string | null; ai_response_apprroved?: boolean | null; ai_response?: string | null }
        Update: { id?: string; created_at?: string; body?: string | null; source?: string | null; reviewer_name?: string | null; place_id?: string | null; company_id?: string; review_published_at?: string | null; response_body?: string | null; review_url?: string | null; google_review_id?: string | null; reviewer_id?: string | null; stars?: number | null; response_date?: string | null; gathering_method?: string | null; tags?: Json | null; response_type?: string | null; ai_response_apprroved?: boolean | null; ai_response?: string | null }
      }
      reward: {
        Row: { id: string; created_at: string; amount: number | null; company_id: string; type: string; status: string; expires_in_days: number | null; applies_to_all_services: boolean; metadata: Json; name: string; description: string | null; minimum_completed_appointments: number | null; first_time_clients_only: boolean | null; min_lifetime_spend: number | null; min_clients_referred: number | null; max_issues_per_client: number | null; reward_reason: string | null }
        Insert: { id?: string; created_at?: string; amount?: number | null; company_id: string; type?: string; status?: string; expires_in_days?: number | null; applies_to_all_services?: boolean; metadata: Json; name: string; description?: string | null; minimum_completed_appointments?: number | null; first_time_clients_only?: boolean | null; min_lifetime_spend?: number | null; min_clients_referred?: number | null; max_issues_per_client?: number | null; reward_reason?: string | null }
        Update: { id?: string; created_at?: string; amount?: number | null; company_id?: string; type?: string; status?: string; expires_in_days?: number | null; applies_to_all_services?: boolean; metadata?: Json; name?: string; description?: string | null; minimum_completed_appointments?: number | null; first_time_clients_only?: boolean | null; min_lifetime_spend?: number | null; min_clients_referred?: number | null; max_issues_per_client?: number | null; reward_reason?: string | null }
      }
      reward_rule: {
        Row: { id: string; created_at: string; company_id: string; rule_type: string; is_active: boolean; priority: number; event_name: string; conditions: Json; metadata: Json }
        Insert: { id?: string; created_at?: string; company_id: string; rule_type: string; is_active?: boolean; priority?: number; event_name: string; conditions?: Json; metadata?: Json }
        Update: { id?: string; created_at?: string; company_id?: string; rule_type?: string; is_active?: boolean; priority?: number; event_name?: string; conditions?: Json; metadata?: Json }
      }
      reward_service: {
        Row: { id: string; created_at: string; service_id: string; company_id: string; reward_id: string }
        Insert: { id?: string; created_at?: string; service_id: string; company_id: string; reward_id: string }
        Update: { id?: string; created_at?: string; service_id?: string; company_id?: string; reward_id?: string }
      }
      service: {
        Row: { id: string; created_at: string; company_id: string; name: string; price: number | null; recommended_cadence_days: number | null; service_id_crm: string; category: string | null }
        Insert: { id?: string; created_at?: string; company_id: string; name: string; price?: number | null; recommended_cadence_days?: number | null; service_id_crm: string; category?: string | null }
        Update: { id?: string; created_at?: string; company_id?: string; name?: string; price?: number | null; recommended_cadence_days?: number | null; service_id_crm?: string; category?: string | null }
      }
      subscription: {
        Row: { id: string; created_at: string; company_id: string; plan_id: string; status: string | null; trial_ends_at: string | null; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; updated_at: string | null; user_id: string | null; billing_interval: string | null; canceled_at: string | null; ended_at: string | null; past_due_at: string | null; metadata: Json }
        Insert: { id?: string; created_at?: string; company_id: string; plan_id: string; status?: string | null; trial_ends_at?: string | null; current_period_start?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; updated_at?: string | null; user_id?: string | null; billing_interval?: string | null; canceled_at?: string | null; ended_at?: string | null; past_due_at?: string | null; metadata?: Json }
        Update: { id?: string; created_at?: string; company_id?: string; plan_id?: string; status?: string | null; trial_ends_at?: string | null; current_period_start?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; updated_at?: string | null; user_id?: string | null; billing_interval?: string | null; canceled_at?: string | null; ended_at?: string | null; past_due_at?: string | null; metadata?: Json }
      }
      update: {
        Row: { id: string; created_at: string; company_id: string | null; client_id: string | null; update_title: string | null; update_text: string | null; update_color: string | null; feedback_id: string | null; conflict_id: string | null; read_status: boolean | null }
        Insert: { id?: string; created_at?: string; company_id?: string | null; client_id?: string | null; update_title?: string | null; update_text?: string | null; update_color?: string | null; feedback_id?: string | null; conflict_id?: string | null; read_status?: boolean | null }
        Update: { id?: string; created_at?: string; company_id?: string | null; client_id?: string | null; update_title?: string | null; update_text?: string | null; update_color?: string | null; feedback_id?: string | null; conflict_id?: string | null; read_status?: boolean | null }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
