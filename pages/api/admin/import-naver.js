// 📄 pages/api/admin/import-naver.js
// 네이버에서 "코스트코 [검색어]" 검색 → 상품 목록 반환
// GET /api/admin/import-naver?query=견과류

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { query = 'Kirkland' } = req.query
  const clientId     = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) return res.status(500).json({ error: '네이버 API 키 미설정' })

  try {
    // "코스트코 [검색어]" 로 네이버 쇼핑 검색
    const searchQuery = `코스트코 ${query}`
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(searchQuery)}&display=10&sort=sim`

    const r = await fetch(url, {
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    })

    if (!r.ok) throw new Error(`Naver API ${r.status}`)
    const data = await r.json()

    const items = (data.items || []).map(item => {
      const title = item.title.replace(/<[^>]+>/g, '')
      const price = Number(item.lprice)

      // 단위 추출 (예: 1.13kg, 400캡슐, 30롤)
      const unitMatch = title.match(/(\d+[\d.]*)\s*(kg|g|ml|L|l|캡슐|정|롤|개|매|포|팩|병)/)
      const unit      = unitMatch ? `${unitMatch[1]}${unitMatch[2]}` : ''

      // 카테고리 추정
      const cat = item.category1 === '식품' ? '식품'
        : item.category1 === '생활용품' ? '생활용품'
        : item.category2?.includes('건강') ? '건강기능식품'
        : '식품'

      return {
        name:         title,
        image:        item.image,
        link:         item.link,
        costco_price: price,
        unit,
        search_query: title.slice(0, 50),
        category:     cat,
        mallName:     item.mallName,
      }
    }).filter(i => i.costco_price > 0)

    return res.status(200).json({ items, total: data.total })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
