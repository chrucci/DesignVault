import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string; productId: string }> },
) {
  const { productId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('room_products')
    .update({ quantity: body.quantity, notes: body.notes })
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string; productId: string }> },
) {
  const { productId } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('room_products').delete().eq('id', productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
