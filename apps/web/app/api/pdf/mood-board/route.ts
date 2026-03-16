import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { renderPdf } from '@/lib/pdf/render';
import { renderToHtml } from '@/lib/pdf/render-html';
import { fetchProjectData, savePdfDocument } from '@/lib/pdf/fetch-data';
import { MoodBoardTemplate } from '@/pdf-templates/mood-board';
import type { GenerateMoodBoardRequest } from '@design-vault/shared';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateMoodBoardRequest;
    const { project_id, room_ids, layouts } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all data
    const data = await fetchProjectData(supabase, project_id, room_ids);

    // Render React template to HTML string
    const fullHtml = await renderToHtml(
      React.createElement(MoodBoardTemplate, {
        project: data.project,
        rooms: data.rooms,
        businessInfo: data.businessInfo,
        layouts,
      }),
    );

    // Render HTML to PDF — mood board uses landscape 16:9
    const pdfBuffer = await renderPdf({
      html: fullHtml,
      width: '1440px',
      height: '810px',
      landscape: true,
    });

    // Save to storage and create document record
    const timestamp = Date.now();
    const fileName = `mood-board-${timestamp}.pdf`;

    await savePdfDocument(supabase, {
      projectId: project_id,
      docType: 'mood_board',
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
    console.error('Mood board generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
