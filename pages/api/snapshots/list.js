// 📄 pages/api/snapshots/list.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const db  = createClient(url, key)

  const { category, from, to, limit = 200 } = req.query

  let q = db.from('price_snapshots').select('*').order('collected_at', { ascending: false }).limit(Number(limit))
  if (category && category !== '전체') q = q.eq('category', category)
  if (from) q = q.gte('collected_at', from)
  if (to)   q = q.lte('collected_at', to)

  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
