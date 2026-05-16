// 📄 pages/saved.js — 저장된 가격비교 그리드 + 엑셀 다운로드
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'

const COLS = [
  { key: 'collected_at',  label: '수집일시',        fmt: v => new Date(v).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) },
  { key: 'category',      label: '카테고리' },
  { key: 'product_name',  label: '상품명',           wide: true },
  { key: 'costco_price',  label: '코스트코',         price: true },
  { key: 'naver_total',   label: '네이버(배송포함)', price: true, platform: 'naver' },
  { key: 'coupang_total', label: '쿠팡(배송포함)',   price: true, platform: 'coupang' },
  { key: 'eleventh_total',label: '11번가',           price: true, platform: 'eleventh' },
  { key: 'gmarket_total', label: 'G마켓',            price: true, platform: 'gmarket' },
  { key: 'winner_price',  label: '최저가',           price: true, accent: true },
  { key: 'saving_amount', label: '절약금액',         price: true, saving: true },
]

export default function Saved() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('전체')
  const [dateFrom,setDateFrom]= useState('')
  const [dateTo,  setDateTo]  = useState('')
  const [sortKey, setSortKey] = useState('collected_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { load() }, [filter, dateFrom, dateTo])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== '전체') params.set('category', filter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo)   params.set('to', dateTo + 'T23:59:59')
    const r = await fetch('/api/snapshots/list?' + params)
    const d = await r.json()
    setRows(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  // 엑셀 다운로드 — CSV 방식 (xlsx 라이브러리 없이 동작)
  function downloadExcel() {
    const headers = ['수집일시','카테고리','상품명','코스트코(원)','네이버 상품가','네이버 배송비','네이버 합계','쿠팡 상품가','쿠팡 배송비','쿠팡 합계','11번가 합계','G마켓 합계','최저가 플랫폼','최저가(원)','절약금액(원)']
    const csvRows = [
      headers.join(','),
      ...sorted.map(r => [
        new Date(r.collected_at).toLocaleString('ko-KR'),
        r.category || '',
        `"${r.product_name || ''}"`,
        r.costco_price || '',
        r.naver_price || '',
        r.naver_ship || 0,
        r.naver_total || '',
        r.coupang_price || '',
        r.coupang_ship || 0,
        r.coupang_total || '',
        r.eleventh_total || '',
        r.gmarket_total || '',
        r.winner_platform || '',
        r.winner_price || '',
        r.saving_amount || '',
      ].join(','))
    ]
    const bom     = '\uFEFF' // 한글 깨짐 방지
    const blob    = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement('a')
    a.href        = url
    a.download    = `PriceLens_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={S.page}>
      <Nav active="saved" />
      <div style={S.container}>
        <div style={S.topRow}>
          <h1 style={S.h1}>📊 저장된 가격 비교</h1>
          <button style={S.excelBtn} onClick={downloadExcel}>⬇ CSV 다운로드</button>
        </div>

        <div style={S.filterBar}>
          <div style={S.filterGroup}>
            <span style={S.filterLabel}>카테고리</span>
            {['전체','식품','생활용품','건강기능식품','전자제품','유아용품'].map(c => (
              <button key={c} style={{ ...S.filterBtn, ...(filter === c ? S.filterBtnOn : {}) }} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
          <div style={S.filterGroup}>
            <span style={S.filterLabel}>기간</span>
            <input type="date" style={S.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color:'#444', fontSize:12 }}>~</span>
            <input type="date" style={S.dateInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <span style={S.rowCount}>{sorted.length}건</span>
        </div>

        {loading ? (
          <div style={S.empty}>불러오는 중...</div>
        ) : sorted.length === 0 ? (
          <div style={S.empty}>저장된 비교 결과가 없습니다.<br/>가격 비교 후 💾 저장 버튼을 눌러주세요.</div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {COLS.map(c => (
                    <th key={c.key} style={{ ...S.th, ...(c.wide ? S.thWide : {}), ...(c.accent ? { color:'#C8F250' } : {}) }} onClick={() => toggleSort(c.key)}>
                      {c.label} {sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? '#14141A' : '#0D0D0F' }}>
                    {COLS.map(c => {
                      const v = row[c.key]
                      const isWinner = c.platform && row.winner_platform === c.platform
                      return (
                        <td key={c.key} style={{ ...S.td, ...(c.wide ? S.tdWide : {}), ...(isWinner ? S.tdWinner : {}), ...(c.saving && v > 0 ? S.tdSaving : {}), ...(c.saving && v < 0 ? S.tdExpensive : {}) }}>
                          {c.fmt ? c.fmt(v) : c.price ? (v ? `₩${Number(v).toLocaleString()}` : '—') : v || '—'}
                          {isWinner && <span style={S.bestDot}>●</span>}
                        </td>
                      )
                    })}
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
  page:       { minHeight:'100vh', background:'#0D0D0F', color:'#F0EDE8', fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif" },
  container:  { maxWidth:'100%', padding:'24px 20px' },
  topRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  h1:         { fontSize:22, fontWeight:500 },
  excelBtn:   { background:'#1A3A10', border:'1px solid #3A6A1A', color:'#C8F250', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  filterBar:  { display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', marginBottom:16, padding:'12px 16px', background:'#14141A', borderRadius:10, border:'1px solid #1E1E26' },
  filterGroup:{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' },
  filterLabel:{ fontSize:11, color:'#555', fontWeight:500, marginRight:2 },
  filterBtn:  { background:'none', border:'1px solid #2A2A30', color:'#666', borderRadius:20, padding:'3px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  filterBtnOn:{ background:'#F0EDE8', color:'#0D0D0F', border:'1px solid #F0EDE8', fontWeight:500 },
  dateInput:  { background:'#0D0D0F', border:'1px solid #2A2A30', color:'#888', borderRadius:6, padding:'4px 8px', fontSize:12, outline:'none', fontFamily:'inherit' },
  rowCount:   { marginLeft:'auto', fontSize:12, color:'#444' },
  tableWrap:  { overflowX:'auto' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:         { padding:'8px 10px', textAlign:'right', color:'#555', fontWeight:500, borderBottom:'1px solid #1E1E26', cursor:'pointer', whiteSpace:'nowrap', userSelect:'none' },
  thWide:     { textAlign:'left', minWidth:180 },
  td:         { padding:'8px 10px', textAlign:'right', borderBottom:'1px solid #111116', color:'#CCC', whiteSpace:'nowrap' },
  tdWide:     { textAlign:'left', color:'#DDD', fontWeight:500 },
  tdWinner:   { color:'#03C75A', fontWeight:600 },
  tdSaving:   { color:'#C8F250', fontWeight:600 },
  tdExpensive:{ color:'#E24B4A' },
  bestDot:    { marginLeft:4, fontSize:8, color:'#03C75A' },
  empty:      { color:'#444', textAlign:'center', padding:'60px 0', lineHeight:2 },
}
