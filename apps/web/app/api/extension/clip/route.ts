import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientFromToken, createServiceClient } from '@/lib/supabase/server';
import { clipProductSchema } from '@design-vault/shared';

/**
 * Download an image from an external URL and upload it to Supabase Storage.
 * Returns the public URL of the uploaded image, or the original URL on failure.
 */
async function downloadAndUploadImage(
  serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>,
  productId: string,
  imageUrl: string,
  index: number,
): Promise<string> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Some sites block requests without a User-Agent
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to download image ${imageUrl}: ${response.status}`);
      return imageUrl;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine file extension from content type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
    };
    const ext = extMap[contentType] || 'jpg';
    const fileName = `${productId}/${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await serviceSupabase.storage
      .from('product-images')
      .upload(fileName, buffer, { contentType });

    if (uploadError) {
      console.error(`Failed to upload image to storage:`, uploadError);
      return imageUrl;
    }

    const { data: publicUrlData } = serviceSupabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`Error processing image ${imageUrl}:`, err);
    return imageUrl;
  }
}

export async function POST(request: NextRequest) {
  // Try Bearer token auth (extension) first, fall back to cookie auth (web app)
  const supabase = (await createClientFromToken(request)) ?? (await createClient());

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

  // Collect all image URLs
  const rawImageUrls: string[] = [];
  if (image_urls && image_urls.length > 0) {
    rawImageUrls.push(...image_urls);
  }
  if (singleImageUrl) {
    rawImageUrls.push(singleImageUrl);
  }

  // Download images and upload to Supabase Storage (use service client for storage access)
  if (rawImageUrls.length > 0) {
    const serviceSupabase = await createServiceClient();

    for (let i = 0; i < rawImageUrls.length; i++) {
      const storedUrl = await downloadAndUploadImage(
        serviceSupabase,
        product.id,
        rawImageUrls[i],
        i,
      );

      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: storedUrl,
        is_primary: i === 0,
        sort_order: i,
      });
    }
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
