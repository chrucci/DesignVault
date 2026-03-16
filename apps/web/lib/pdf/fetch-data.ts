import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductImage,
  Project,
  Room,
  RoomProduct,
  BusinessInfo,
  Document,
} from '@design-vault/shared';

export interface RoomWithProducts {
  room: Room;
  products: Array<{
    roomProduct: RoomProduct;
    product: Product;
    images: ProductImage[];
  }>;
}

export interface PdfProjectData {
  project: Project;
  rooms: RoomWithProducts[];
  businessInfo: BusinessInfo | null;
}

/**
 * Fetch all data needed to generate PDFs for a project.
 */
export async function fetchProjectData(
  supabase: SupabaseClient,
  projectId: string,
  roomIds?: string[],
): Promise<PdfProjectData> {
  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Fetch rooms (optionally filtered)
  let roomsQuery = supabase
    .from('rooms')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (roomIds && roomIds.length > 0) {
    roomsQuery = roomsQuery.in('id', roomIds);
  }

  const { data: rooms, error: roomsError } = await roomsQuery;

  if (roomsError) {
    throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
  }

  // Fetch room_products with product data for each room
  const roomsWithProducts: RoomWithProducts[] = [];

  for (const room of rooms || []) {
    const { data: roomProducts, error: rpError } = await supabase
      .from('room_products')
      .select('*')
      .eq('room_id', room.id)
      .order('sort_order', { ascending: true });

    if (rpError) {
      throw new Error(`Failed to fetch room products: ${rpError.message}`);
    }

    const products: RoomWithProducts['products'] = [];

    for (const rp of roomProducts || []) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', rp.product_id)
        .single();

      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', rp.product_id)
        .order('sort_order', { ascending: true });

      if (product) {
        products.push({
          roomProduct: rp,
          product,
          images: images || [],
        });
      }
    }

    roomsWithProducts.push({ room, products });
  }

  // Fetch business info
  const { data: businessInfo } = await supabase.from('business_info').select('*').limit(1).single();

  return {
    project: project as Project,
    rooms: roomsWithProducts,
    businessInfo: businessInfo as BusinessInfo | null,
  };
}

/**
 * Get the next invoice number by looking at the latest document with an invoice_number.
 */
export async function getNextInvoiceNumber(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from('documents')
    .select('invoice_number')
    .not('invoice_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data?.invoice_number) {
    // Extract number portion and increment
    const match = data.invoice_number.match(/(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `INV-${String(nextNum).padStart(4, '0')}`;
    }
  }

  return 'INV-0001';
}

/**
 * Save a generated PDF document to Supabase Storage and create a document record.
 */
export async function savePdfDocument(
  supabase: SupabaseClient,
  params: {
    projectId: string;
    docType: 'invoice' | 'spec_sheet' | 'mood_board';
    pdfBuffer: Buffer;
    fileName: string;
    invoiceNumber?: string;
    taxRate?: number;
    taxState?: string;
    total?: number;
    notes?: string;
  },
): Promise<Document> {
  const {
    projectId,
    docType,
    pdfBuffer,
    fileName,
    invoiceNumber,
    taxRate,
    taxState,
    total,
    notes,
  } = params;

  // Upload to Supabase Storage
  const storagePath = `projects/${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

  // Create document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      doc_type: docType,
      doc_url: urlData.publicUrl,
      invoice_number: invoiceNumber || null,
      tax_rate: taxRate || null,
      tax_state: taxState || null,
      total: total || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (docError || !doc) {
    throw new Error(`Failed to create document record: ${docError?.message}`);
  }

  return doc as Document;
}
