// 📄 pages/api/products/[id].js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { id } = req.query

  if (req.method === 'PUT') {
    const { name, emoji, category, costco_price, unit, unit_qty, unit_base, search_query, notes } = req.body
    const { data, error } = await db.from('products')
      .update({ name, emoji, category, costco_price: Number(costco_price), unit, unit_qty: unit_qty ? Number(unit_qty) : null, unit_base: unit_base || '100g', search_query, notes, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
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
