// 📄 pages/api/history/list.js
// GET /api/history/list?product_id=xxx&days=30
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { product_id, days = 30 } = req.query
  if (!product_id) return res.status(400).json({ error: 'product_id 필요' })

  const db = supabaseAdmin()
  const from = new Date()
  from.setDate(from.getDate() - Number(days))

  const { data, error } = await db
    .from('price_history')
    .select('*')
    .eq('product_id', product_id)
    .gte('collected_at', from.toISOString())
    .order('collected_at')

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
