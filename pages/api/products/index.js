// GET  /api/products       — 상품 목록
// POST /api/products       — 상품 등록
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, emoji, category, costco_price, unit, search_query, notes } = req.body
    if (!name || !category || !costco_price || !search_query)
      return res.status(400).json({ error: '필수 항목 누락' })

    const { data, error } = await db
      .from('products')
      .insert([{ name, emoji: emoji || '📦', category, costco_price: Number(costco_price), unit, search_query, notes }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
