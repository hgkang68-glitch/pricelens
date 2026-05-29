// 📄 pages/api/exchange-rate.js
// 실시간 환율 조회 (ExchangeRate-API 무료 · API키 불필요)
// GET /api/exchange-rate

export default async function handler(req, res) {
  // 캐시 1시간
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/KRW', {
      next: { revalidate: 3600 }
    })
    if (!r.ok) throw new Error('API 오류')
    const data = await r.json()

    // KRW 기준 → 각 통화 1단위당 KRW 환산
    const rates = data.rates
    return res.status(200).json({
      USD: Math.round(1 / rates.USD),
      EUR: Math.round(1 / rates.EUR),
      JPY: Math.round((1 / rates.JPY) * 10) / 10, // 소수점 1자리
      GBP: Math.round(1 / rates.GBP),
      updated: data.time_last_update_utc,
      fallback: false,
    })
  } catch (err) {
    // API 오류 시 기본값
    console.error('환율 조회 실패:', err.message)
    return res.status(200).json({
      USD: 1380, EUR: 1510, JPY: 9.2, GBP: 1760,
      updated: null, fallback: true,
    })
  }
}
