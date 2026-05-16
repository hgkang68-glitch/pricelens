// 📄 pages/history.js — 가격 변동 이력 차트
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabase'

const PLATFORMS = [
  { id: 'naver',    label: '네이버', color: '#03C75A' },
  { id: 'coupang',  label: '쿠팡',   color: '#E8322A' },
  { id: 'eleventh', label: '11번가', color: '#FF6000' },
  { id: 'gmarket',  label: 'G마켓',  color: '#1A6DFF' },
]

const RANGES = [
  { label: '1주', days: 7 },
  { label: '1개월', days: 30 },
  { label: '3개월', days: 90 },
  { label: '전체', days: 999 },
]

export default function History() {
  const [products,  setProducts]  = useState([])
  const [selId,     setSelId]     = useState('')
  const [selProd,   setSelProd]   = useState(null)
  const [history,   setHistory]   = useState([])
  const [chartData, setChartData] = useState([])
  const [range,     setRange]     = useState(30)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (selId) loadHistory() }, [selId, range])

  async function loadProducts() {
    const r = await fetch('/api/products')
    const d = await r.json()
    setProducts(d)
    if (d.length) { setSelId(d[0].id); setSelProd(d[0]) }
  }

  async function loadHistory() {
    setLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - range)

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', selId)
      .gte('collected_at', from.toISOString())
      .order('collected_at')

    if (!error && data) {
      setHistory(data)
      buildChartData(data)
    }
    setLoading(false)
  }

  function buildChartData(data) {
    const byDate = {}
    data.forEach(row => {
      const date = row.collected_at.slice(0, 10)
      if (!byDate[date]) byDate[date] = { date }
      byDate[date][row.platform] = row.total_price
    })
    setChartData(Object.values(byDate).sort((a, b) => a.date > b.date ? 1 : -1))
  }

  function handleProdChange(id) {
    setSelId(id)
    setSelProd(products.find(p => p.id === id) || null)
  }

  const formatPrice = v => v ? `₩${Number(v).toLocaleString()}` : ''
  const formatDate  = d => d?.slice(5) // MM-DD

  // 최저/최고 통계
  const allPrices = history.map(h => h.total_price).filter(Boolean)
  const minPrice = allPrices.length ? Math.min(...allPrices) : null
  const maxPrice = allPrices.length ? Math.max(...allPrices) : null

  return (
    <div style={S.page}>
      <Nav active="history" />
      <div style={S.container}>
        <h1 style={S.h1}>📈 가격 변동 이력</h1>

        {/* 컨트롤 */}
        <div style={S.controls}>
          <div style={S.controlGroup}>
            <label style={S.controlLabel}>상품 선택</label>
            <select style={S.select} value={selId} onChange={e => handleProdChange(e.target.value)}>
              {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
          <div style={S.controlGroup}>
            <label style={S.controlLabel}>기간</label>
            <div style={S.rangeBtns}>
              {RANGES.map(r => (
                <button key={r.days} style={{ ...S.rangeBtn, ...(range === r.days ? S.rangeBtnOn : {}) }} onClick={() => setRange(r.days)}>{r.label}</button>
              ))}
            </div>
          </div>
        </div>

        {selProd && (
          <div style={S.prodHeader}>
            <span style={{ fontSize: 24 }}>{selProd.emoji}</span>
            <div>
              <div style={S.prodName}>{selProd.name}</div>
              <div style={S.prodSub}>코스트코 기준가 ₩{selProd.costco_price.toLocaleString()} · {selProd.unit}</div>
            </div>
            {minPrice && (
              <div style={S.statsRow}>
                <div style={S.statItem}><div style={S.statLabel}>기간 최저가</div><div style={{ ...S.statVal, color: '#C8F250' }}>₩{minPrice.toLocaleString()}</div></div>
                <div style={S.statItem}><div style={S.statLabel}>기간 최고가</div><div style={S.statVal}>₩{maxPrice.toLocaleString()}</div></div>
                <div style={S.statItem}><div style={S.statLabel}>수집 횟수</div><div style={S.statVal}>{history.length}회</div></div>
              </div>
            )}
          </div>
        )}

        {/* 차트 */}
        <div style={S.chartBox}>
          {loading ? (
            <div style={S.chartEmpty}>데이터 불러오는 중...</div>
          ) : chartData.length === 0 ? (
            <div style={S.chartEmpty}>
              아직 수집된 데이터가 없습니다.<br />
              매일 자정 자동 수집되며, 수동 수집은 <code>/api/cron/collect</code> 를 호출하세요.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E26" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis tickFormatter={v => `₩${(v/1000).toFixed(0)}k`} stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#14141A', border: '1px solid #2A2A30', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#888' }}
                  formatter={(v, name) => [`₩${v.toLocaleString()}`, PLATFORMS.find(p => p.id === name)?.label || name]}
                />
                <Legend formatter={v => PLATFORMS.find(p => p.id === v)?.label || v} wrapperStyle={{ fontSize: 12, color: '#888' }} />
                {selProd && (
                  <Line type="monotone" dataKey="costco" name="코스트코" stroke="#888" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                )}
                {PLATFORMS.map(p => (
                  <Line key={p.id} type="monotone" dataKey={p.id} name={p.id} stroke={p.color} strokeWidth={2} dot={{ r: 3, fill: p.color }} connectNulls={true} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 이력 테이블 */}
        {history.length > 0 && (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>수집일시</th>
                  <th style={S.th}>플랫폼</th>
                  <th style={S.th}>상품가</th>
                  <th style={S.th}>배송비</th>
                  <th style={S.th}>합계</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 50).map((row, i) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? '#14141A' : '#0D0D0F' }}>
                    <td style={S.td}>{new Date(row.collected_at).toLocaleString('ko-KR')}</td>
                    <td style={S.td}>{PLATFORMS.find(p => p.id === row.platform)?.label || row.platform}</td>
                    <td style={S.tdR}>{row.price ? `₩${row.price.toLocaleString()}` : '—'}</td>
                    <td style={S.tdR}>{row.shipping_fee ? `₩${row.shipping_fee.toLocaleString()}` : '무료'}</td>
                    <td style={{ ...S.tdR, color: '#F0EDE8', fontWeight: 500 }}>{row.total_price ? `₩${row.total_price.toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  page:       { minHeight: '100vh', background: '#0D0D0F', color: '#F0EDE8', fontFamily: "system-ui,-apple-system,'Noto Sans KR',sans-serif" },
  container:  { maxWidth: 1100, margin: '0 auto', padding: '24px 20px' },
  h1:         { fontSize: 22, fontWeight: 500, marginBottom: 20 },
  controls:   { display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' },
  controlGroup:{ display: 'flex', flexDirection: 'column', gap: 6 },
  controlLabel:{ fontSize: 12, color: '#555', fontWeight: 500 },
  select:     { background: '#14141A', border: '1px solid #2A2A30', color: '#F0EDE8', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 260 },
  rangeBtns:  { display: 'flex', gap: 4 },
  rangeBtn:   { background: 'none', border: '1px solid #2A2A30', color: '#666', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  rangeBtnOn: { background: '#1E2A10', border: '1px solid #C8F250', color: '#C8F250' },
  prodHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#14141A', borderRadius: 10, border: '1px solid #1E1E26', marginBottom: 16 },
  prodName:   { fontSize: 15, fontWeight: 500, color: '#F0EDE8' },
  prodSub:    { fontSize: 12, color: '#555', marginTop: 2 },
  statsRow:   { display: 'flex', gap: 16, marginLeft: 'auto' },
  statItem:   { textAlign: 'center' },
  statLabel:  { fontSize: 10, color: '#444', marginBottom: 2 },
  statVal:    { fontSize: 14, fontWeight: 600, color: '#F0EDE8' },
  chartBox:   { background: '#14141A', border: '1px solid #1E1E26', borderRadius: 12, padding: '20px 10px', marginBottom: 20 },
  chartEmpty: { textAlign: 'center', color: '#444', padding: '80px 20px', lineHeight: 2 },
  tableWrap:  { overflowX: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:         { padding: '8px 12px', textAlign: 'left', color: '#555', fontWeight: 500, borderBottom: '1px solid #1E1E26' },
  td:         { padding: '8px 12px', color: '#888', borderBottom: '1px solid #111116' },
  tdR:        { padding: '8px 12px', color: '#888', borderBottom: '1px solid #111116', textAlign: 'right' },
}
