-- =============================================================================
-- DesignVault: Seed Data
-- =============================================================================
-- Populates the database with sensible defaults and sample data for
-- development and first-run experience.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Default tax rates
-- ---------------------------------------------------------------------------
INSERT INTO tax_rates (state, rate) VALUES
  ('CT', 6.35),
  ('MA', 6.25),
  ('CA', 7.25),
  ('FL', 6.00);

-- ---------------------------------------------------------------------------
-- Default business info
-- ---------------------------------------------------------------------------
INSERT INTO business_info (business_name) VALUES
  ('Deborah Lynn Designs — Decorating Den Interiors ®');

-- ---------------------------------------------------------------------------
-- Sample project with one room
-- ---------------------------------------------------------------------------
-- Use a DO block so we can reference generated UUIDs across inserts.
DO $$
DECLARE
  v_project_id uuid;
  v_room_id    uuid;
  v_product_id uuid;
BEGIN
  -- Sample project
  INSERT INTO projects (name, client_name, status, notes)
  VALUES ('Sample Project', 'Sample Client', 'active',
          'This is a sample project to demonstrate the schema.')
  RETURNING id INTO v_project_id;

  -- Room inside the sample project
  INSERT INTO rooms (project_id, name, sort_order)
  VALUES (v_project_id, 'Living Room', 0)
  RETURNING id INTO v_room_id;

  -- Sample product
  INSERT INTO products (
    name, brand, model_sku, wholesale_price, markup_percent,
    stock_status, notes
  ) VALUES (
    'Sample Product',
    'Sample Brand',
    'SAMPLE-001',
    500.00,
    55.00,
    'in_stock',
    'This is a sample product. Retail price is auto-calculated from wholesale price and markup.'
  )
  RETURNING id INTO v_product_id;

  -- Place the sample product in the living room
  INSERT INTO room_products (room_id, product_id, quantity, notes, sort_order)
  VALUES (v_room_id, v_product_id, 1, 'Sample placement', 0);
END $$;
