// Database row types — mirrors Supabase schema
// These will eventually be auto-generated via `supabase gen types typescript`

export type StockStatus = 'in_stock' | 'out_of_stock' | 'special_order' | 'unknown';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type DocumentType = 'invoice' | 'spec_sheet' | 'mood_board';

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  model_sku: string | null;
  source_url: string | null;
  wholesale_price: number | null;
  markup_percent: number;
  retail_price: number | null; // generated column
  dimensions_width: string | null;
  dimensions_depth: string | null;
  dimensions_height: string | null;
  dimensions_text: string | null;
  materials: string | null;
  color: string | null;
  stock_status: StockStatus;
  shipping_cost: number;
  notes: string | null;
  install_notes: string | null;
  spec_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface RoomProduct {
  id: string;
  room_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  doc_type: DocumentType;
  doc_url: string;
  invoice_number: string | null;
  tax_rate: number | null;
  tax_state: string | null;
  total: number | null;
  notes: string | null;
  created_at: string;
}

export interface TaxRate {
  id: string;
  state: string;
  rate: number;
  updated_at: string;
}

export interface BusinessInfo {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  updated_at: string;
}
