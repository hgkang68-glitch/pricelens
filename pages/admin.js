// 📄 pages/admin.js — 코스트코 상품 관리자 페이지
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'

const CATEGORIES = ['식품', '생활용품', '건강기능식품', '전자제품', '유아용품', '기타']
const EMOJIS = ['📦','🥜','🫒','🍫','🥚','🫙','🥓','🧀','🫐','🧻','🧴','🫧','🪥','🛁','🧺','🐟','🍊','⚡','🦴','🌿','🔬','🔋','💡','🍼','🧷','🤲','🛒','🍕','🥩','🥦']

const EMPTY = { name: '', emoji: '📦', category: '식품', costco_price: '', unit: '', search_query: '', notes: '' }

export default function Admin() {
  const [products, setProducts] = useState([])
  const [form,     setForm]     = useState(EMPTY)
  const [editId,   setEditId]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState(null)
  const [filter,   setFilter]   = useState('전체')
  const [costcoQ,  setCostcoQ]  = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const r = await fetch('/api/products')
    const d = await r.json()
    setProducts(d)
  }

  function showMsg(text, type = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2500)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const url    = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const r      = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d      = await r.json()
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
    setForm({ name: p.name, emoji: p.emoji, category: p.category, costco_price: p.costco_price, unit: p.unit || '', search_query: p.search_query, notes: p.notes || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() { setForm(EMPTY); setEditId(null) }

  const filtered = filter === '전체' ? products : products.filter(p => p.category === filter)

  return (
    <div style={S.page}>
      <Nav active="admin" />
      {msg && <div style={{ ...S.msg, background: msg.type === 'ok' ? '#C8F250' : '#E24B4A', color: '#0D0D0F' }}>{msg.text}</div>}

      <div style={S.container}>
        <h1 style={S.h1}>🛠️ 상품 관리</h1>

        <div style={S.layout}>
          {/* ── 왼쪽: 등록/수정 폼 ── */}
          <div style={S.formPanel}>
            <div style={S.panelTitle}>{editId ? '✏️ 상품 수정' : '➕ 새 상품 등록'}</div>

            {/* 코스트코몰 참고 */}
            <div style={S.costcoRef}>
              <span style={S.refLabel}>💡 코스트코몰 참고</span>
              <div style={S.refRow}>
                <input
                  style={S.refInput}
                  value={costcoQ}
                  onChange={e => setCostcoQ(e.target.value)}
                  placeholder="검색어 입력..."
                  onKeyDown={e => e.key === 'Enter' && window.open(`https://www.costco.co.kr/search?q=${encodeURIComponent(costcoQ)}`, '_blank')}
                />
                <button
                  style={S.refBtn}
                  onClick={() => window.open(`https://www.costco.co.kr/search?q=${encodeURIComponent(costcoQ || form.name)}`, '_blank')}
                >코스트코몰 열기 ↗</button>
              </div>
              <div style={S.refHint}>코스트코몰에서 상품 확인 후 아래 폼에 입력하세요</div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 이모지 선택 */}
              <div style={S.field}>
                <label style={S.label}>이모지</label>
                <div style={S.emojiGrid}>
                  {EMOJIS.map(e => (
                    <button key={e} type="button" style={{ ...S.emojiBtn, ...(form.emoji === e ? S.emojiBtnOn : {}) }} onClick={() => setForm(p => ({ ...p, emoji: e }))}>{e}</button>
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
                  <input style={S.input} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="예: 1.13kg, 30롤" />
                </div>
              </div>

              {/* 검색 쿼리 */}
              <div style={S.field}>
                <label style={S.label}>온라인 검색어 * <span style={{ color: '#555', fontWeight: 400 }}>(네이버/쿠팡 검색에 사용)</span></label>
                <input style={S.input} value={form.search_query} onChange={e => setForm(p => ({ ...p, search_query: e.target.value }))} placeholder="예: Kirkland 혼합견과류 1.13kg" required />
                <div style={S.fieldHint}>정확한 검색어일수록 비교 결과가 정확해집니다</div>
              </div>

              {/* 메모 */}
              <div style={S.field}>
                <label style={S.label}>메모</label>
                <textarea style={S.textarea} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="특이사항, 구매 팁 등" rows={2} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.submitBtn} type="submit" disabled={loading}>{loading ? '저장 중...' : editId ? '수정 저장' : '등록하기'}</button>
                {editId && <button style={S.cancelBtn} type="button" onClick={resetForm}>취소</button>}
              </div>
            </form>
          </div>

          {/* ── 오른쪽: 상품 목록 ── */}
          <div style={S.listPanel}>
            <div style={S.panelTitle}>📋 등록된 상품 ({products.length}개)</div>

            {/* 카테고리 필터 */}
            <div style={S.filterRow}>
              {['전체', ...CATEGORIES].map(c => (
                <button key={c} style={{ ...S.filterBtn, ...(filter === c ? S.filterBtnOn : {}) }} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>

            {filtered.map(p => (
              <div key={p.id} style={S.prodRow}>
                <span style={S.prodEmoji}>{p.emoji}</span>
                <div style={S.prodInfo}>
                  <div style={S.prodName}>{p.name}</div>
                  <div style={S.prodMeta}>
                    <span style={S.catTag}>{p.category}</span>
                    <span style={S.prodPrice}>₩{p.costco_price.toLocaleString()}</span>
                    <span style={S.prodUnit}>{p.unit}</span>
                  </div>
                  {p.notes && <div style={S.prodNote}>{p.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={S.editBtn} onClick={() => handleEdit(p)}>수정</button>
                  <button style={S.delBtn}  onClick={() => handleDelete(p.id)}>삭제</button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && <div style={S.empty}>등록된 상품이 없습니다</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  page:       { minHeight: '100vh', background: '#0D0D0F', color: '#F0EDE8', fontFamily: "system-ui,-apple-system,'Noto Sans KR',sans-serif" },
  container:  { maxWidth: 1200, margin: '0 auto', padding: '24px 20px' },
  h1:         { fontSize: 22, fontWeight: 500, marginBottom: 20 },
  layout:     { display: 'grid', gridTemplateColumns: '460px 1fr', gap: 20, alignItems: 'start' },
  msg:        { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 999 },

  formPanel:  { background: '#14141A', border: '1px solid #1E1E26', borderRadius: 12, padding: 20 },
  listPanel:  { background: '#14141A', border: '1px solid #1E1E26', borderRadius: 12, padding: 20 },
  panelTitle: { fontSize: 14, fontWeight: 500, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1E1E26' },

  costcoRef:  { background: '#1A1500', border: '1px solid #3A3000', borderRadius: 8, padding: 12, marginBottom: 16 },
  refLabel:   { fontSize: 12, color: '#EF9F27', display: 'block', marginBottom: 8 },
  refRow:     { display: 'flex', gap: 8 },
  refInput:   { flex: 1, background: '#0D0D0F', border: '1px solid #2A2A00', borderRadius: 6, padding: '7px 10px', color: '#F0EDE8', fontSize: 12, outline: 'none', fontFamily: 'inherit' },
  refBtn:     { background: '#EF9F27', color: '#0D0D0F', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  refHint:    { fontSize: 11, color: '#555', marginTop: 6 },

  field:      { marginBottom: 14 },
  label:      { display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500 },
  input:      { width: '100%', background: '#0D0D0F', border: '1px solid #2A2A30', borderRadius: 7, padding: '9px 12px', color: '#F0EDE8', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  select:     { width: '100%', background: '#0D0D0F', border: '1px solid #2A2A30', borderRadius: 7, padding: '9px 12px', color: '#F0EDE8', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  textarea:   { width: '100%', background: '#0D0D0F', border: '1px solid #2A2A30', borderRadius: 7, padding: '9px 12px', color: '#F0EDE8', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  fieldHint:  { fontSize: 11, color: '#444', marginTop: 4 },

  emojiGrid:  { display: 'flex', flexWrap: 'wrap', gap: 4 },
  emojiBtn:   { background: '#1E1E26', border: '1px solid #2A2A30', borderRadius: 6, padding: '4px 6px', fontSize: 18, cursor: 'pointer', lineHeight: 1 },
  emojiBtnOn: { background: '#1A2A10', border: '1px solid #C8F250' },

  submitBtn:  { background: '#C8F250', color: '#0D0D0F', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn:  { background: 'none', border: '1px solid #2A2A30', color: '#888', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  filterRow:  { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  filterBtn:  { background: 'none', border: '1px solid #2A2A30', color: '#666', borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  filterBtnOn:{ background: '#F0EDE8', color: '#0D0D0F', border: '1px solid #F0EDE8', fontWeight: 500 },

  prodRow:    { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #1E1E26' },
  prodEmoji:  { fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center', marginTop: 2 },
  prodInfo:   { flex: 1, minWidth: 0 },
  prodName:   { fontSize: 13, fontWeight: 500, color: '#DDD', marginBottom: 3 },
  prodMeta:   { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  catTag:     { fontSize: 10, background: '#1E1E26', color: '#666', padding: '1px 6px', borderRadius: 4 },
  prodPrice:  { fontSize: 12, fontWeight: 600, color: '#F0EDE8' },
  prodUnit:   { fontSize: 11, color: '#444' },
  prodNote:   { fontSize: 11, color: '#555', marginTop: 3 },
  editBtn:    { background: 'none', border: '1px solid #2A2A30', color: '#888', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  delBtn:     { background: 'none', border: '1px solid #2A2A30', color: '#666', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  empty:      { color: '#444', fontSize: 13, textAlign: 'center', padding: '40px 0' },
}
