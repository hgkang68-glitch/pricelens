// 📄 pages/api/products/[id].js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await db.from('products').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: '상품 없음' })
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const {
      name, emoji, category, source_type,
      costco_price, unit, unit_qty, unit_base,
      search_query, notes,
      margin_rate, fx_safety, platform_fee,
      sell_price_krw, sell_price_usd, sell_price_eur, sell_price_jpy,
      photos, description_ko, description_en, features,
      weight_g, ship_info, listing_status,
    } = req.body

    const { data, error } = await db.from('products').update({
      name, emoji, category, source_type,
      costco_price: Number(costco_price),
      unit, unit_qty: unit_qty ? Number(unit_qty) : null, unit_base,
      search_query, notes,
      margin_rate: Number(margin_rate || 35),
      fx_safety: Number(fx_safety || 5),
      platform_fee: Number(platform_fee || 13),
      sell_price_krw: sell_price_krw ? Number(sell_price_krw) : null,
      sell_price_usd: sell_price_usd ? Number(sell_price_usd) : null,
      sell_price_eur: sell_price_eur ? Number(sell_price_eur) : null,
      sell_price_jpy: sell_price_jpy ? Number(sell_price_jpy) : null,
      photos: photos || [],
      description_ko, description_en,
      features: features || [],
      weight_g: weight_g ? Number(weight_g) : null,
      ship_info, listing_status,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('products').update({ is_active: false }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
