import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('room_products')
    .select('*, product:products(*)')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> },
) {
  const { roomId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('room_products')
    .insert({
      room_id: roomId,
      product_id: body.product_id,
      quantity: body.quantity || 1,
      notes: body.notes,
    })
    .select('*, product:products(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
