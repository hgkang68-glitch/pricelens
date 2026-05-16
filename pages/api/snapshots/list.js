// GET /api/snapshots/list?category=식품&from=2025-01-01&limit=100
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const db = supabaseAdmin()
  const { category, from, to, limit = 200 } = req.query

  let q = db.from('price_snapshots').select('*').order('collected_at', { ascending: false }).limit(Number(limit))
  if (category && category !== '전체') q = q.eq('category', category)
  if (from) q = q.gte('collected_at', from)
  if (to)   q = q.lte('collected_at', to)

  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
