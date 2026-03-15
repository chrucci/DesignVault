import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const [taxRates, businessInfo] = await Promise.all([
    supabase.from('tax_rates').select('*').order('state'),
    supabase.from('business_info').select('*').limit(1).single(),
  ])

  return NextResponse.json({
    tax_rates: taxRates.data || [],
    business_info: businessInfo.data || null,
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  if (body.business_info) {
    const info = body.business_info
    if (info.id) {
      await supabase
        .from('business_info')
        .update({
          business_name: info.business_name,
          contact_name: info.contact_name,
          phone: info.phone,
          email: info.email,
          address: info.address,
        })
        .eq('id', info.id)
    } else {
      await supabase.from('business_info').insert({
        business_name: info.business_name,
        contact_name: info.contact_name,
        phone: info.phone,
        email: info.email,
        address: info.address,
      })
    }
  }

  return NextResponse.json({ success: true })
}
