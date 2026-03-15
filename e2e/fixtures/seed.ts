import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getClient(): SupabaseClient {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing required env vars: TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Seed helpers — each returns the inserted row so tests can reference IDs
// ---------------------------------------------------------------------------

export async function seedProduct(
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const db = getClient();
  const defaults = {
    name: `Test Product ${Date.now()}`,
    brand: "Test Brand",
    wholesale_price: 100,
    markup_percent: 50,
  };

  const { data, error } = await db
    .from("products")
    .insert({ ...defaults, ...overrides })
    .select()
    .single();

  if (error) throw new Error(`seedProduct failed: ${error.message}`);
  return data;
}

export async function seedProject(
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const db = getClient();
  const defaults = {
    name: `Test Project ${Date.now()}`,
    client_name: "Test Client",
    status: "active",
  };

  const { data, error } = await db
    .from("projects")
    .insert({ ...defaults, ...overrides })
    .select()
    .single();

  if (error) throw new Error(`seedProject failed: ${error.message}`);
  return data;
}

export async function seedRoom(
  projectId: string,
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const db = getClient();
  const defaults = {
    project_id: projectId,
    name: `Test Room ${Date.now()}`,
  };

  const { data, error } = await db
    .from("rooms")
    .insert({ ...defaults, ...overrides })
    .select()
    .single();

  if (error) throw new Error(`seedRoom failed: ${error.message}`);
  return data;
}

export async function seedRoomProduct(
  roomId: string,
  productId: string,
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const db = getClient();
  const defaults = {
    room_id: roomId,
    product_id: productId,
    quantity: 1,
  };

  const { data, error } = await db
    .from("room_products")
    .insert({ ...defaults, ...overrides })
    .select()
    .single();

  if (error) throw new Error(`seedRoomProduct failed: ${error.message}`);
  return data;
}

/**
 * Remove all test data. Order matters due to foreign keys.
 */
export async function clearAll(): Promise<void> {
  const db = getClient();

  const tables = ["room_products", "rooms", "product_images", "products", "projects"];

  for (const table of tables) {
    const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.warn(`clearAll: failed to clear ${table}: ${error.message}`);
    }
  }
}
