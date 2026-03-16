// API request/response types

export interface ClipProductRequest {
  name: string;
  brand?: string;
  model_sku?: string;
  source_url?: string;
  wholesale_price?: number;
  markup_percent?: number;
  dimensions_width?: string;
  dimensions_depth?: string;
  dimensions_height?: string;
  dimensions_text?: string;
  materials?: string;
  color?: string;
  stock_status?: string;
  shipping_cost?: number;
  notes?: string;
  install_notes?: string;
  spec_url?: string;
  image_urls?: string[]; // URLs from the supplier page to download
  project_id?: string; // optional: assign directly to a project
  room_id?: string; // optional: assign directly to a room
}

export interface GeneratePdfRequest {
  project_id: string;
  room_ids?: string[]; // optional: generate for specific rooms only
}

export interface GenerateInvoiceRequest extends GeneratePdfRequest {
  tax_state?: string;
  tax_rate?: number;
  shipping_total?: number;
  notes?: string;
}

export interface GenerateMoodBoardRequest extends GeneratePdfRequest {
  layouts?: Record<string, 'hero' | 'grid' | 'collage'>; // page_id -> layout type
}
