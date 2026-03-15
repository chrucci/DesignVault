-- =============================================================================
-- DesignVault: Initial Schema Migration
-- =============================================================================
-- Single-user interior design business app for managing products, projects,
-- rooms, and generated documents (invoices, spec sheets, mood boards).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Utility: updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 2. Core tables
-- ---------------------------------------------------------------------------

-- Products ----------------------------------------------------------------
CREATE TABLE products (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT           NOT NULL,
  brand            TEXT,
  model_sku        TEXT,
  source_url       TEXT,
  wholesale_price  DECIMAL(10,2),
  markup_percent   DECIMAL(5,2)   DEFAULT 55.0,
  retail_price     DECIMAL(10,2)  GENERATED ALWAYS AS (
                     wholesale_price * (1 + markup_percent / 100)
                   ) STORED,
  dimensions_width TEXT,
  dimensions_depth TEXT,
  dimensions_height TEXT,
  dimensions_text  TEXT,
  materials        TEXT,
  color            TEXT,
  stock_status     TEXT           DEFAULT 'unknown'
                     CHECK (stock_status IN (
                       'in_stock', 'out_of_stock', 'special_order', 'unknown'
                     )),
  shipping_cost    DECIMAL(10,2)  DEFAULT 0,
  notes            TEXT,
  install_notes    TEXT,
  spec_url         TEXT,
  created_at       TIMESTAMPTZ    DEFAULT now(),
  updated_at       TIMESTAMPTZ    DEFAULT now()
);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Product images (1:many) -------------------------------------------------
CREATE TABLE product_images (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   TEXT    NOT NULL,
  is_primary  BOOLEAN DEFAULT false,
  sort_order  INT     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Projects ----------------------------------------------------------------
CREATE TABLE projects (
  id          uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT   NOT NULL,
  client_name TEXT,
  status      TEXT   DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'archived')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Rooms within projects ---------------------------------------------------
CREATE TABLE rooms (
  id          uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid   NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT   NOT NULL,
  sort_order  INT    DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Junction: products assigned to rooms ------------------------------------
CREATE TABLE room_products (
  id          uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid   NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  product_id  uuid   NOT NULL REFERENCES products(id),
  quantity    INT    DEFAULT 1,
  notes       TEXT,
  sort_order  INT    DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Generated documents (invoices, spec sheets, mood boards) ----------------
CREATE TABLE documents (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  doc_type       TEXT          NOT NULL
                   CHECK (doc_type IN ('invoice', 'spec_sheet', 'mood_board')),
  doc_url        TEXT          NOT NULL,
  invoice_number TEXT,
  tax_rate       DECIMAL(5,2),
  tax_state      TEXT,
  total          DECIMAL(10,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ   DEFAULT now()
);

-- Tax rate presets --------------------------------------------------------
CREATE TABLE tax_rates (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  state      TEXT          NOT NULL UNIQUE,
  rate       DECIMAL(5,2)  NOT NULL,
  updated_at TIMESTAMPTZ   DEFAULT now()
);

-- Business info (invoice headers, single row) -----------------------------
CREATE TABLE business_info (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT  NOT NULL DEFAULT 'Deborah Lynn Designs — Decorating Den Interiors ®',
  contact_name  TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  logo_url      TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes for common lookups & joins
-- ---------------------------------------------------------------------------
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_rooms_project_id          ON rooms(project_id);
CREATE INDEX idx_room_products_room_id     ON room_products(room_id);
CREATE INDEX idx_room_products_product_id  ON room_products(product_id);
CREATE INDEX idx_documents_project_id      ON documents(project_id);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
-- This is a single-user app. Authenticated users get full access to all rows.

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info  ENABLE ROW LEVEL SECURITY;

-- Authenticated-user full-access policies ---------------------------------

CREATE POLICY "Authenticated users full access on products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on product_images"
  ON product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on projects"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on room_products"
  ON room_products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on documents"
  ON documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on tax_rates"
  ON tax_rates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users full access on business_info"
  ON business_info FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. Storage buckets
-- ---------------------------------------------------------------------------
-- Supabase storage buckets are created via the storage schema.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('documents',      'documents',      false);

-- Storage RLS: authenticated users can manage their own files.

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can view product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Public read access for product images (they are in a public bucket) -----
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'product-images');
