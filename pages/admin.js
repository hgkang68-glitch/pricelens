// 📄 pages/admin.js
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'

const CATEGORIES = ['식품', '생활용품', '건강기능식품', '전자제품', '유아용품', '기타']
const UNIT_BASES  = ['100g당', '100ml당', '1개당', '1롤당', '1캡슐당', '1정당', '1포당']
const EMOJIS      = ['📦','🥜','🫒','🍫','🥚','🫙','🥓','🧀','🫐','🧻','🧴','🫧','🪥','🛁','🧺','🐟','🍊','⚡','🦴','🌿','🔬','🔋','💡','🍼','🧷','🤲','🥩','🥦','🍕','🛒']
const EMPTY = { name:'', emoji:'📦', category:'식품', costco_price:'', unit:'', unit_qty:'', unit_base:'100g당', search_query:'', notes:'' }

function calcUnitPrice(price, qty) {
  if (!price || !qty || Number(qty) === 0) return null
  return Math.round(Number(price) / Number(qty) * 100)
}

export default function Admin() {
  const [products,     setProducts]     = useState([])
  const [form,         setForm]         = useState(EMPTY)
  const [editId,       setEditId]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [msg,          setMsg]          = useState(null)
  const [filter,       setFilter]       = useState('전체')
  const [importQuery,  setImportQuery]  = useState('')
  const [importItems,  setImportItems]  = useState([])
  const [importLoading,setImportLoading]= useState(false)

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const r = await fetch('/api/products')
    const d = await r.json()
    if (Array.isArray(d)) setProducts(d)
  }

  function showMsg(text, type='ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2500)
  }

  // 네이버에서 코스트코 상품 검색
  async function handleImportSearch() {
    if (!importQuery.trim()) return
    setImportLoading(true)
    setImportItems([])
    try {
      const r = await fetch(`/api/admin/import-naver?query=${encodeURIComponent(importQuery)}`)
      const d = await r.json()
      setImportItems(d.items || [])
    } catch { showMsg('검색 오류', 'err') }
    setImportLoading(false)
  }

  // 네이버 결과 → 폼에 채우기
  function fillForm(item) {
    setForm({
      name:         item.name.slice(0, 60),
      emoji:        '📦',
      category:     item.category || '식품',
      costco_price: item.costco_price || '',
      unit:         item.unit || '',
      unit_qty:     '',
      unit_base:    '100g당',
      search_query: item.search_query || item.name.slice(0, 50),
      notes:        '',
    })
    setEditId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showMsg('폼에 채워졌습니다. 수량 입력 후 등록하세요.')
  }

  // 폼 제출
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const url    = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      showMsg(editId ? '수정 완료!' : '등록 완료!')
      resetForm()
      loadProducts()
    } catch (err) { showMsg(err.message, 'err') }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    showMsg('삭제 완료')
    loadProducts()
  }

  function handleEdit(p) {
    setEditId(p.id)
    setForm({ name: p.name, emoji: p.emoji, category: p.category, costco_price: p.costco_price, unit: p.unit||'', unit_qty: p.unit_qty||'', unit_base: p.unit_base||'100g당', search_query: p.search_query, notes: p.notes||'' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() { setForm(EMPTY); setEditId(null) }

  const unitPrice   = calcUnitPrice(form.costco_price, form.unit_qty)
  const filtered    = filter === '전체' ? products : products.filter(p => p.category === filter)

  return (
    <div style={S.page}>
      <Nav active="admin" />
      {msg && <div style={{ ...S.toast, background: msg.type === 'ok' ? '#059669' : '#DC2626' }}>{msg.text}</div>}

      <div style={S.container}>
        <h1 style={S.h1}>🛠️ 상품 관리</h1>

        <div style={S.layout}>

          {/* ── 왼쪽: 자동수집 + 폼 ── */}
          <div style={S.leftCol}>

            {/* 네이버 자동 수집 */}
            <div style={S.section}>
              <div style={S.sectionTitle}>🔍 네이버에서 코스트코 상품 자동 수집</div>
              <div style={S.importRow}>
                <input
                  style={S.input}
                  value={importQuery}
                  onChange={e => setImportQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleImportSearch()}
                  placeholder="검색어 입력 (예: Kirkland 견과류)"
                />
                <button style={S.searchBtn} onClick={handleImportSearch} disabled={importLoading}>
                  {importLoading ? '검색중...' : '검색'}
                </button>
                <button style={S.costcoBtn} onClick={() => window.open(`https://www.costco.co.kr/search?q=${encodeURIComponent(importQuery)}`, '_blank')}>
                  코스트코몰 ↗
                </button>
              </div>

              {importItems.length > 0 && (
                <div style={S.importList}>
                  <div style={S.importHint}>클릭하면 아래 폼에 자동으로 채워집니다</div>
                  {importItems.map((item, i) => (
                    <div key={i} style={S.importCard} onClick={() => fillForm(item)}>
                      {item.image && <img src={item.image} alt="" style={S.importImg} onError={e => e.target.style.display='none'} />}
                      <div style={S.importInfo}>
                        <div style={S.importName}>{item.name}</div>
                        <div style={S.importMeta}>
                          <span style={S.importPrice}>₩{item.costco_price?.toLocaleString()}</span>
                          {item.unit && <span style={S.importUnit}>{item.unit}</span>}
                          <span style={S.importMall}>{item.mallName}</span>
                        </div>
                      </div>
                      <button style={S.addBtn}>+ 폼에 채우기</button>
                    </div>
                  ))}
                </div>
              )}
              {!importLoading && importQuery && importItems.length === 0 && (
                <div style={S.importEmpty}>검색 결과가 없습니다. 다른 검색어를 시도해보세요.</div>
              )}
            </div>

            {/* 등록/수정 폼 */}
            <div style={S.section}>
              <div style={S.sectionTitle}>{editId ? '✏️ 상품 수정' : '➕ 직접 등록'}</div>
              <form onSubmit={handleSubmit}>

                {/* 이모지 */}
                <div style={S.field}>
                  <label style={S.label}>이모지</label>
                  <div style={S.emojiGrid}>
                    {EMOJIS.map(e => (
                      <button key={e} type="button"
                        style={{ ...S.emojiBtn, ...(form.emoji === e ? S.emojiBtnOn : {}) }}
                        onClick={() => setForm(p => ({ ...p, emoji: e }))}>{e}</button>
                    ))}
                  </div>
                </div>

                {/* 카테고리 */}
                <div style={S.field}>
                  <label style={S.label}>카테고리 *</label>
                  <select style={S.select} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* 상품명 */}
                <div style={S.field}>
                  <label style={S.label}>상품명 *</label>
                  <input style={S.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="예: Kirkland 혼합 견과류" required />
                </div>

                {/* 가격 + 단위 */}
                <div style={{ ...S.field, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={S.label}>코스트코 가격 (원) *</label>
                    <input style={S.input} type="number" value={form.costco_price} onChange={e => setForm(p => ({ ...p, costco_price: e.target.value }))} placeholder="22990" required />
                  </div>
                  <div>
                    <label style={S.label}>단위</label>
                    <input style={S.input} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="예: 1.13kg, 400캡슐" />
                  </div>
                </div>

                {/* 객단가 */}
                <div style={{ ...S.field, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={S.label}>수량 (객단가 계산용)</label>
                    <input style={S.input} type="number" value={form.unit_qty} onChange={e => setForm(p => ({ ...p, unit_qty: e.target.value }))} placeholder="예: 1130" />
                  </div>
                  <div>
                    <label style={S.label}>단위 기준</label>
                    <select style={S.select} value={form.unit_base} onChange={e => setForm(p => ({ ...p, unit_base: e.target.value }))}>
                      {UNIT_BASES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* 객단가 미리보기 */}
                {unitPrice && (
                  <div style={S.unitPreview}>
                    📊 객단가: <strong>₩{unitPrice.toLocaleString()} / {form.unit_base.replace('당','')}</strong>
                    <span style={{ color: '#6B7280', fontSize: 11 }}> ({form.costco_price} ÷ {form.unit_qty} × 100)</span>
                  </div>
                )}

                {/* 검색어 */}
                <div style={S.field}>
                  <label style={S.label}>온라인 검색어 * <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(네이버/쿠팡 검색에 사용)</span></label>
                  <input style={S.input} value={form.search_query} onChange={e => setForm(p => ({ ...p, search_query: e.target.value }))} placeholder="예: Kirkland 혼합견과류 1.13kg" required />
                </div>

                {/* 메모 */}
                <div style={S.field}>
                  <label style={S.label}>메모</label>
                  <textarea style={{ ...S.input, resize: 'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="특이사항, 구매 팁 등" />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.submitBtn} type="submit" disabled={loading}>{loading ? '저장 중...' : editId ? '수정 저장' : '등록하기'}</button>
                  {editId && <button style={S.cancelBtn} type="button" onClick={resetForm}>취소</button>}
                </div>
              </form>
            </div>
          </div>

          {/* ── 오른쪽: 상품 목록 ── */}
          <div style={S.rightCol}>
            <div style={S.sectionTitle}>📋 등록된 상품 ({products.length}개)</div>

            <div style={S.filterRow}>
              {['전체', ...CATEGORIES].map(c => (
                <button key={c} style={{ ...S.filterBtn, ...(filter === c ? S.filterBtnOn : {}) }} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>

            {filtered.map(p => {
              const up = p.unit_price || calcUnitPrice(p.costco_price, p.unit_qty)
              return (
                <div key={p.id} style={S.prodRow}>
                  <span style={S.prodEmoji}>{p.emoji}</span>
                  <div style={S.prodInfo}>
                    <div style={S.prodName}>{p.name}</div>
                    <div style={S.prodMeta}>
                      <span style={S.catTag}>{p.category}</span>
                      <span style={S.prodPrice}>₩{p.costco_price?.toLocaleString()}</span>
                      {p.unit && <span style={S.prodUnit}>{p.unit}</span>}
                      {up && <span style={S.unitTag}>₩{up.toLocaleString()}/{p.unit_base?.replace('당','') || '100g'}</span>}
                    </div>
                    {p.notes && <div style={S.prodNote}>{p.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button style={S.editBtn} onClick={() => handleEdit(p)}>수정</button>
                    <button style={S.delBtn} onClick={() => handleDelete(p.id)}>삭제</button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div style={S.empty}>등록된 상품이 없습니다</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  page:       { minHeight: '100vh', background: '#F9FAFB', color: '#111827', fontFamily: "system-ui,-apple-system,'Noto Sans KR',sans-serif" },
  container:  { maxWidth: 1300, margin: '0 auto', padding: '24px 20px' },
  h1:         { fontSize: 22, fontWeight: 600, marginBottom: 20, color: '#111827' },
  layout:     { display: 'grid', gridTemplateColumns: '500px 1fr', gap: 20, alignItems: 'start' },
  toast:      { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: '#fff', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' },

  leftCol:    { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol:   { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 },

  section:    { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 },
  sectionTitle:{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' },

  importRow:  { display: 'flex', gap: 8, marginBottom: 12 },
  searchBtn:  { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  costcoBtn:  { background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 7, padding: '8px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  importList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' },
  importHint: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  importCard: { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' },
  importImg:  { width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#E5E7EB' },
  importInfo: { flex: 1, minWidth: 0 },
  importName: { fontSize: 12, fontWeight: 500, color: '#111827', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  importMeta: { display: 'flex', gap: 6, alignItems: 'center' },
  importPrice:{ fontSize: 12, fontWeight: 600, color: '#111827' },
  importUnit: { fontSize: 11, color: '#6B7280' },
  importMall: { fontSize: 10, color: '#9CA3AF' },
  addBtn:     { background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  importEmpty:{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' },

  field:      { marginBottom: 12 },
  label:      { display: 'block', fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 },
  input:      { width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, padding: '9px 12px', color: '#111827', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  select:     { width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, padding: '9px 12px', color: '#111827', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  emojiGrid:  { display: 'flex', flexWrap: 'wrap', gap: 4 },
  emojiBtn:   { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 6px', fontSize: 18, cursor: 'pointer', lineHeight: 1 },
  emojiBtnOn: { background: '#EFF6FF', border: '2px solid #2563EB' },
  unitPreview:{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#854D0E', marginBottom: 12 },
  submitBtn:  { background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn:  { background: '#fff', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  filterRow:  { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  filterBtn:  { background: '#fff', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  filterBtnOn:{ background: '#111827', color: '#fff', border: '1px solid #111827', fontWeight: 500 },

  prodRow:    { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
  prodEmoji:  { fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center', marginTop: 2 },
  prodInfo:   { flex: 1, minWidth: 0 },
  prodName:   { fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 3 },
  prodMeta:   { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  catTag:     { fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4 },
  prodPrice:  { fontSize: 12, fontWeight: 600, color: '#111827' },
  prodUnit:   { fontSize: 11, color: '#9CA3AF' },
  unitTag:    { fontSize: 10, background: '#FEF9C3', color: '#854D0E', padding: '1px 6px', borderRadius: 4, fontWeight: 500 },
  prodNote:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  editBtn:    { background: '#fff', border: '1px solid #E5E7EB', color: '#374151', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  delBtn:     { background: '#fff', border: '1px solid #FEE2E2', color: '#DC2626', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  empty:      { color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '40px 0' },
}
