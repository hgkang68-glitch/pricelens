// 📄 pages/api/snapshots/save.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const db  = createClient(url, key)

  const { product_id, product_name, category, costco_price, naver, coupang, eleventh, gmarket, winner } = req.body
  if (!product_name) return res.status(400).json({ error: 'product_name 필요' })

  const n = naver?.items?.[0]   || null
  const c = coupang?.items?.[0] || null
  const e = eleventh?.items?.[0]|| null
  const g = gmarket?.items?.[0] || null

  const row = {
    product_id:      product_id || null,
    product_name,
    category:        category || null,
    costco_price:    costco_price || null,
    naver_price:     n?.price || null,
    naver_ship:      n?.shippingFee || 0,
    naver_total:     n?.total || null,
    coupang_price:   c?.price || null,
    coupang_ship:    c?.shippingFee || 0,
    coupang_total:   c?.total || null,
    eleventh_price:  e?.price || null,
    eleventh_ship:   e?.shippingFee || 0,
    eleventh_total:  e?.total || null,
    gmarket_price:   g?.price || null,
    gmarket_ship:    g?.shippingFee || 0,
    gmarket_total:   g?.total || null,
    winner_platform: winner?.platform || null,
    winner_price:    winner?.price || null,
    saving_amount:   costco_price && winner?.price ? costco_price - winner.price : null,
  }

  const { data, error } = await db.from('price_snapshots').insert([row]).select().single()
  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}
