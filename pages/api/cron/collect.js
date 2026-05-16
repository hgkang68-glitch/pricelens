// GET /api/cron/collect — Vercel Cron이 매일 자정 호출
// 모든 활성 상품의 가격을 자동 수집해서 price_history에 저장
import crypto from 'crypto'
import { supabaseAdmin } from '../../../lib/supabase'

function buildCoupangAuth(ak, sk, path) {
  const datetime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const sig = crypto.createHmac('sha256', sk).update(datetime + 'GET' + path).digest('hex')
  return `CEA algorithm=HmacSHA256, access-key=${ak}, signed-date=${datetime}, signature=${sig}`
}

async function fetchLowestPrice(query) {
  const results = {}

  // 네이버
  try {
    const r = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=3&sort=sim`,
      { headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET } }
    )
    const d = await r.json()
    if (d.items?.length) {
      const price = Number(d.items[0].lprice)
      results.naver = { price, shipping_fee: 0, total_price: price }
    }
  } catch {}

  // 쿠팡
  try {
    const params = new URLSearchParams({ keyword: query, limit: '3' })
    const apiPath = `/v2/providers/affiliate_open_api/apis/openapi/products/search?${params}`
    const auth = buildCoupangAuth(process.env.COUPANG_ACCESS_KEY, process.env.COUPANG_SECRET_KEY, apiPath)
    const r = await fetch(`https://api-gateway.coupang.com${apiPath}`, { headers: { Authorization: auth, 'Content-Type': 'application/json' } })
    const d = await r.json()
    if (d.rCode === '0' && d.data?.productData?.[0]) {
      const item = d.data.productData[0]
      const price = item.lowestPrice
      const ship  = item.isFreeShipping || item.isRocket ? 0 : 3000
      results.coupang = { price, shipping_fee: ship, total_price: price + ship }
    }
  } catch {}

  return results
}

export default async function handler(req, res) {
  // 보안: Cron Secret 검증
  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && req.headers['x-vercel-cron-signature'] === undefined) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const db = supabaseAdmin()
  const { data: products, error } = await db.from('products').select('*').eq('is_active', true)
  if (error) return res.status(500).json({ error: error.message })

  const rows = []
  for (const product of products) {
    const prices = await fetchLowestPrice(product.search_query)
    for (const [platform, data] of Object.entries(prices)) {
      rows.push({
        product_id:   product.id,
        platform,
        price:        data.price,
        shipping_fee: data.shipping_fee,
        total_price:  data.total_price,
      })
    }
    // API 과부하 방지
    await new Promise(r => setTimeout(r, 300))
  }

  if (rows.length) {
    const { error: insertErr } = await db.from('price_history').insert(rows)
    if (insertErr) return res.status(500).json({ error: insertErr.message })
  }

  return res.status(200).json({ success: true, collected: rows.length, products: products.length })
}
