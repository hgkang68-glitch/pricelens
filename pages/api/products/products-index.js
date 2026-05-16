// 📄 pages/api/products/index.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase 환경변수 미설정', url: !!url, key: !!key })
  }

  const db = createClient(url, key)

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
