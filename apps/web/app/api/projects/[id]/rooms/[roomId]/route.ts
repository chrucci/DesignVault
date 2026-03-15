import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('rooms')
    .update({ name: body.name, sort_order: body.sort_order })
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('rooms').delete().eq('id', roomId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
