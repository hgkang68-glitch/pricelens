// GET    /api/products/:id — 단일 상품
// PUT    /api/products/:id — 수정
// DELETE /api/products/:id — 삭제 (soft delete)
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const db = supabaseAdmin()
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await db.from('products').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: '상품 없음' })
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const { name, emoji, category, costco_price, unit, search_query, notes } = req.body
    const { data, error } = await db
      .from('products')
      .update({ name, emoji, category, costco_price: Number(costco_price), unit, search_query, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
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
