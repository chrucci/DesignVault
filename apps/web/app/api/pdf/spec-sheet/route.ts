import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { renderPdf } from '@/lib/pdf/render';
import { renderToHtml } from '@/lib/pdf/render-html';
import { fetchProjectData, savePdfDocument } from '@/lib/pdf/fetch-data';
import { SpecSheetTemplate } from '@/pdf-templates/spec-sheet';
import type { GeneratePdfRequest } from '@design-vault/shared';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePdfRequest;
    const { project_id, room_ids } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all data
    const data = await fetchProjectData(supabase, project_id, room_ids);

    // Render React template to HTML string
    const fullHtml = await renderToHtml(
      React.createElement(SpecSheetTemplate, {
        project: data.project,
        rooms: data.rooms,
        businessInfo: data.businessInfo,
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
    const fileName = `spec-sheet-${timestamp}.pdf`;

    await savePdfDocument(supabase, {
      projectId: project_id,
      docType: 'spec_sheet',
      pdfBuffer,
      fileName,
    });

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Spec sheet generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
