export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "employee" | "reviewer" | "admin" | "owner";
export type WriteoffType = "no_deduction" | "employee_deduction";
export type WriteoffStatus = "draft" | "pending" | "approved" | "rejected";
export type FraudRisk = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high";
export type IikoStatus = "not_synced" | "pending" | "synced" | "failed";
export type IikoMode = "real" | "sandbox";
export type SyncStatus = "success" | "failed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          role: UserRole;
          store_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          role: UserRole;
          store_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          iiko_organization_id: string | null;
          iiko_warehouse_id: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          iiko_organization_id?: string | null;
          iiko_warehouse_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          full_name: string;
          store_id: string | null;
          position: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          store_id?: string | null;
          position?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          unit: string;
          estimated_price: number;
          iiko_product_id: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          unit: string;
          estimated_price?: number;
          iiko_product_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      writeoff_requests: {
        Row: {
          id: string;
          request_number: string;
          store_id: string;
          product_id: string;
          sender_id: string;
          quantity: number;
          unit: string;
          reason: string;
          writeoff_type: WriteoffType;
          deduction_employee_id: string | null;
          comment: string;
          photo_url: string;
          photo_storage_path: string;
          captured_at: string | null;
          capture_latitude: number | null;
          capture_longitude: number | null;
          source: string;
          status: WriteoffStatus;
          risk_score: number;
          fraud_risk: FraudRisk;
          duplicate_detected: boolean;
          duplicate_match_percent: number;
          duplicate_request_id: string | null;
          ai_verdict: Json | null;
          reviewer_id: string | null;
          reviewer_comment: string | null;
          reviewed_at: string | null;
          iiko_status: IikoStatus;
          iiko_document_id: string | null;
          iiko_external_number: string | null;
          iiko_payload: Json | null;
          iiko_response: Json | null;
          iiko_error: string | null;
          iiko_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number: string;
          store_id: string;
          product_id: string;
          sender_id: string;
          quantity: number;
          unit: string;
          reason: string;
          writeoff_type: WriteoffType;
          deduction_employee_id?: string | null;
          comment: string;
          photo_url: string;
          photo_storage_path: string;
          captured_at?: string | null;
          capture_latitude?: number | null;
          capture_longitude?: number | null;
          source?: string;
          status?: WriteoffStatus;
          risk_score?: number;
          fraud_risk?: FraudRisk;
          duplicate_detected?: boolean;
          duplicate_match_percent?: number;
          duplicate_request_id?: string | null;
          ai_verdict?: Json | null;
          reviewer_id?: string | null;
          reviewer_comment?: string | null;
          reviewed_at?: string | null;
          iiko_status?: IikoStatus;
          iiko_document_id?: string | null;
          iiko_external_number?: string | null;
          iiko_payload?: Json | null;
          iiko_response?: Json | null;
          iiko_error?: string | null;
          iiko_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["writeoff_requests"]["Insert"]
        >;
        Relationships: [];
      };
      photo_fingerprints: {
        Row: {
          id: string;
          request_id: string;
          hash: string;
          hash_algorithm: string;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          hash: string;
          hash_algorithm?: string;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["photo_fingerprints"]["Insert"]
        >;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          request_id: string | null;
          actor_id: string | null;
          action: string;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          actor_id?: string | null;
          action: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      writeoff_norms: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          avg_daily_quantity: number;
          avg_daily_value: number;
          request_count: number;
          last_calculated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          avg_daily_quantity?: number;
          avg_daily_value?: number;
          request_count?: number;
          last_calculated_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["writeoff_norms"]["Insert"]
        >;
        Relationships: [];
      };
      risk_events: {
        Row: {
          id: string;
          request_id: string;
          type: string;
          severity: Severity;
          message: string;
          score_delta: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          type: string;
          severity: Severity;
          message: string;
          score_delta?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["risk_events"]["Insert"]>;
        Relationships: [];
      };
      iiko_sync_logs: {
        Row: {
          id: string;
          request_id: string;
          mode: IikoMode;
          endpoint: string | null;
          request_payload: Json | null;
          response_payload: Json | null;
          status: SyncStatus;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          mode: IikoMode;
          endpoint?: string | null;
          request_payload?: Json | null;
          response_payload?: Json | null;
          status: SyncStatus;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["iiko_sync_logs"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
