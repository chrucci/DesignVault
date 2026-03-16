import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clipProductSchema } from '@design-vault/shared';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clipProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Extract fields that don't go into the products table
  const { image_urls, project_id: _projectId, room_id, ...productData } = parsed.data;

  // Also handle single image_url from body (not in schema but used by tests)
  const singleImageUrl = (body as Record<string, unknown>).image_url as string | undefined;

  const insertData: Record<string, unknown> = { ...productData };
  if (!insertData.source_url) delete insertData.source_url;
  if (!insertData.spec_url) delete insertData.spec_url;

  const { data: product, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert images
  const imageUrls: string[] = [];
  if (image_urls && image_urls.length > 0) {
    imageUrls.push(...image_urls);
  }
  if (singleImageUrl) {
    imageUrls.push(singleImageUrl);
  }

  for (let i = 0; i < imageUrls.length; i++) {
    await supabase.from('product_images').insert({
      product_id: product.id,
      image_url: imageUrls[i],
      is_primary: i === 0,
      sort_order: i,
    });
  }

  // If room_id provided, link product to room
  if (room_id) {
    await supabase.from('room_products').insert({
      room_id,
      product_id: product.id,
      quantity: 1,
    });
  }

  return NextResponse.json(product, { status: 201 });
}
