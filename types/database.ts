// types/database.ts
// Generated from Supabase schema — Ethiopia Arenguade Paper Product
// Update by running: npx supabase gen types typescript --local > types/database.ts
// Or run the generation script: node scripts/gen-types.js

export type UserRole         = 'customer' | 'teacher' | 'admin';
export type OrderStatus      = 'pending_payment' | 'pending_verification' | 'verified' | 'approved' | 'in_production' | 'ready' | 'delivered' | 'completed' | 'rejected' | 'cancelled';
export type EnrollmentStatus = 'pending_verification' | 'confirmed' | 'approved' | 'rejected' | 'cancelled';
export type DesignStatus     = 'new' | 'reviewing' | 'quoted' | 'accepted' | 'declined';
export type SessionType      = 'in_person' | 'live';
export type SessionStatus    = 'scheduled' | 'live' | 'ended' | 'cancelled';

// ---------------------------------------------------------------------------
// Row types (what you get back from SELECT *)
// ---------------------------------------------------------------------------

export interface Profile {
  id:         string;
  full_name:  string;
  phone:      string | null;
  avatar_url: string | null;
  role:       UserRole;
  is_active:  boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id:             string;
  name:           string;
  description:    string | null;
  price:          number;
  images:         string[];
  category:       string | null;
  stock_quantity: number | null;
  is_available:   boolean;
  created_at:     string;
  updated_at:     string;
}

export interface BankAccount {
  id:             string;
  bank_name:      string;
  account_name:   string;
  account_number: string;
  instructions:   string | null;
  is_active:      boolean;
  created_at:     string;
  updated_at:     string;
}

export interface Order {
  id:                 string;
  order_number:       string | null;
  buyer_id:           string;
  status:             OrderStatus;
  total_price:        number;
  delivery_address:   string | null;
  phone:              string | null;
  notes:              string | null;
  bank_account_id:    string | null;
  payment_proof_path: string | null;
  rejection_reason:   string | null;
  verified_by:        string | null;
  verified_at:        string | null;
  created_at:         string;
  updated_at:         string;
}

export interface OrderItem {
  id:                   string;
  order_id:             string;
  product_id:           string;
  quantity:             number;
  unit_price_snapshot:  number;
  created_at:           string;
}

export interface OrderStatusHistory {
  id:          string;
  order_id:    string;
  from_status: string | null;
  to_status:   string;
  changed_by:  string | null;
  note:        string | null;
  created_at:  string;
}

export interface Design {
  id:              string;
  submitted_by:    string;
  title:           string;
  description:     string | null;
  file_path:       string;
  status:          DesignStatus;
  admin_reply:     string | null;
  quoted_price:    number | null;
  linked_order_id: string | null;
  created_at:      string;
  updated_at:      string;
}

export interface ClassSession {
  id:                string;
  type:              SessionType;
  title:             string;
  description:       string | null;
  teacher_id:        string | null;
  location:          string | null;
  starts_at:         string | null;
  ends_at:           string | null;
  capacity:          number;
  price:             number;
  status:            SessionStatus;
  livekit_room_name: string | null;
  recording_notes:   string | null;
  created_at:        string;
  updated_at:        string;
}

export interface Enrollment {
  id:                 string;
  session_id:         string;
  student_id:         string;
  status:             EnrollmentStatus;
  payment_proof_path: string | null;
  rejection_reason:   string | null;
  verified_by:        string | null;
  verified_at:        string | null;
  attended:           boolean;
  created_at:         string;
  updated_at:         string;
}

export interface Notification {
  id:         string;
  user_id:    string;
  title:      string;
  body:       string;
  link:       string | null;
  is_read:    boolean;
  created_at: string;
}

export interface AuditLog {
  id:         string;
  actor_id:   string | null;
  action:     string;
  entity:     string;
  entity_id:  string;
  metadata:   Record<string, unknown>;
  created_at: string;
}

export interface Settings {
  id:              string;
  company_name:    string;
  contact_phone:   string;
  contact_email:   string;
  address:         string;
  tax_id:          string | null;
  settlement_days: number | null;
  updated_at:      string;
}

// ---------------------------------------------------------------------------
// Insert types (omit server-generated fields)
// ---------------------------------------------------------------------------

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type BankAccountInsert = Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>;
export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>;
export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>;
export type DesignInsert = Omit<Design, 'id' | 'created_at' | 'updated_at'>;
export type ClassSessionInsert = Omit<ClassSession, 'id' | 'created_at' | 'updated_at'>;
export type EnrollmentInsert = Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>;

// ---------------------------------------------------------------------------
// Update types (all fields optional)
// ---------------------------------------------------------------------------

export type ProfileUpdate     = Partial<Omit<Profile,     'id' | 'created_at'>>;
export type ProductUpdate     = Partial<Omit<Product,     'id' | 'created_at'>>;
export type BankAccountUpdate = Partial<Omit<BankAccount, 'id' | 'created_at'>>;
export type OrderUpdate       = Partial<Omit<Order,       'id' | 'created_at'>>;
export type DesignUpdate      = Partial<Omit<Design,      'id' | 'created_at'>>;
export type ClassSessionUpdate = Partial<Omit<ClassSession, 'id' | 'created_at'>>;
export type EnrollmentUpdate  = Partial<Omit<Enrollment,  'id' | 'created_at'>>;

// ---------------------------------------------------------------------------
// Supabase Database type map (for use with createClient<Database>())
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles:             { Row: Profile;            Insert: ProfileInsert;     Update: ProfileUpdate };
      products:             { Row: Product;            Insert: ProductInsert;     Update: ProductUpdate };
      bank_accounts:        { Row: BankAccount;        Insert: BankAccountInsert; Update: BankAccountUpdate };
      orders:               { Row: Order;              Insert: OrderInsert;       Update: OrderUpdate };
      order_items:          { Row: OrderItem;          Insert: OrderItemInsert;   Update: Partial<OrderItem> };
      order_status_history: { Row: OrderStatusHistory; Insert: Omit<OrderStatusHistory, 'id' | 'created_at'>; Update: never };
      designs:              { Row: Design;             Insert: DesignInsert;      Update: DesignUpdate };
      class_sessions:       { Row: ClassSession;       Insert: ClassSessionInsert; Update: ClassSessionUpdate };
      enrollments:          { Row: Enrollment;         Insert: EnrollmentInsert;  Update: EnrollmentUpdate };
      notifications:        { Row: Notification;       Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> };
      audit_log:            { Row: AuditLog;           Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never };
      settings:             { Row: Settings;           Insert: Omit<Settings, 'updated_at'>; Update: Partial<Settings> };
    };
    Enums: {
      user_role:         UserRole;
      order_status:      OrderStatus;
      enrollment_status: EnrollmentStatus;
      design_status:     DesignStatus;
      session_type:      SessionType;
      session_status:    SessionStatus;
    };
    Functions: {
      is_admin:              { Args: Record<never, never>; Returns: boolean };
      is_teacher:            { Args: Record<never, never>; Returns: boolean };
      current_user_role:     { Args: Record<never, never>; Returns: string };
      create_enrollment:     {
        Args: { p_session_id: string; p_student_id: string; p_payment_proof_path?: string };
        Returns: Record<string, unknown>;
      };
      register_for_session_atomic: {
        Args: { p_session_id: string; p_student_id: string; p_payment_proof_path?: string };
        Returns: Record<string, unknown>;
      };
    };
  };
}
