import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { renderPdf } from '@/lib/pdf/render';
import { renderToHtml } from '@/lib/pdf/render-html';
import { fetchProjectData, getNextInvoiceNumber, savePdfDocument } from '@/lib/pdf/fetch-data';
import { InvoiceTemplate } from '@/pdf-templates/invoice';
import type { GenerateInvoiceRequest } from '@design-vault/shared';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateInvoiceRequest;
    const { project_id, room_ids, tax_state, tax_rate, shipping_total, notes } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all data
    const data = await fetchProjectData(supabase, project_id, room_ids);

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber(supabase);

    // Calculate total for document record
    let subtotal = 0;
    for (const { products } of data.rooms) {
      for (const { product, roomProduct } of products) {
        subtotal += (product.retail_price ?? 0) * roomProduct.quantity;
      }
    }
    const taxAmount = subtotal * ((tax_rate ?? 0) / 100);
    const grandTotal = subtotal + taxAmount + (shipping_total ?? 0);

    // Render React template to HTML string
    const fullHtml = await renderToHtml(
      React.createElement(InvoiceTemplate, {
        project: data.project,
        rooms: data.rooms,
        businessInfo: data.businessInfo,
        invoiceNumber,
        taxRate: tax_rate ?? 0,
        taxState: tax_state ?? 'N/A',
        shippingTotal: shipping_total ?? 0,
        notes,
      }),
    );

    // Render HTML to PDF
    const pdfBuffer = await renderPdf({
      html: fullHtml,
      width: '8.5in',
      height: '11in',
    });

    // Save to storage and create document record
    const timestamp = Date.now();
    const fileName = `invoice-${invoiceNumber}-${timestamp}.pdf`;

    await savePdfDocument(supabase, {
      projectId: project_id,
      docType: 'invoice',
      pdfBuffer,
      fileName,
      invoiceNumber,
      taxRate: tax_rate,
      taxState: tax_state,
      total: grandTotal,
      notes,
    });

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
