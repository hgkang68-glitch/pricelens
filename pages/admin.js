// 📄 pages/admin.js — 소싱처 + 사진업로드 + 환율가격 + 방안C 통화태그
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Nav from '../components/Nav'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null




const SOURCES    = ['코스트코','올리브영','다이소','기타']
const CATEGORIES = ['식품','생활용품','건강기능식품','전자제품','유아용품','기타']
const UNIT_BASES = ['100g당','100ml당','1개당','1롤당','1캡슐당','1정당','1포당']
const EMOJIS     = ['📦','🥜','🫒','🍫','🥚','🧻','🧴','🫧','🐟','🍊','⚡','🌿','🛒','🥩','🥦','💊','🌸','💄','🪥','🧽','🧺','🍼','🧷','🔋','💡','📱','🎁','🌟','🍕','🥗']
const sourceBadgeColor = { '코스트코':'#2563EB','올리브영':'#EC4899','다이소':'#059669','기타':'#9CA3AF' }

const STATUS_OPTS = [
  { val:'draft',   label:'초안',    color:'#9CA3AF' },
  { val:'active',  label:'판매중',  color:'#059669' },
  { val:'paused',  label:'일시정지',color:'#D97706' },
]

const EMPTY = {
  name:'', emoji:'📦', category:'식품', source_type:'코스트코',
  costco_price:'', unit:'', unit_qty:'', unit_base:'100g당',
  search_query:'', notes:'',
  margin_rate: 35, fx_safety: 5, platform_fee: 13,
  sell_price_krw: null, sell_price_usd: null, sell_price_eur: null, sell_price_jpy: null,
  photos: [], description_ko:'', description_en:'',
  features: [], weight_g:'', ship_info:'', listing_status:'draft',
}

function calcPrices(buyPrice, marginRate, fxSafety, platformFee, rates) {
  if (!buyPrice || !rates) return null
  const cost    = Number(buyPrice)
  const sellKRW = cost / (1 - marginRate/100) / (1 - platformFee/100)
  const safe    = (r) => r * (1 - fxSafety/100)
  return {
    krw: Math.round(sellKRW),
    usd: Math.round(sellKRW / safe(rates.USD) * 100) / 100,
    eur: Math.round(sellKRW / safe(rates.EUR) * 100) / 100,
    jpy: Math.round(sellKRW / safe(rates.JPY)),
  }
}

export default function Admin() {
  const [products,      setProducts]      = useState([])
  const [form,          setForm]          = useState(EMPTY)
  const [editId,        setEditId]        = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [msg,           setMsg]           = useState(null)
  const [filter,        setFilter]        = useState('전체')
  const [importQuery,   setImportQuery]   = useState('')
  const [importItems,   setImportItems]   = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [rates,         setRates]         = useState(null)
  const [rateUpdated,   setRateUpdated]   = useState(null)
  const [featureInput,  setFeatureInput]  = useState('')
  const [activeTab,     setActiveTab]     = useState('basic') // basic | content | pricing
  const fileRef0 = useRef(null)
  const fileRef1 = useRef(null)
  const fileRef2 = useRef(null)
  const fileRef3 = useRef(null)
  const fileRef4 = useRef(null)
  const fileRef5 = useRef(null)
  const fileRefs = [fileRef0, fileRef1, fileRef2, fileRef3, fileRef4, fileRef5]

  useEffect(() => { loadProducts(); fetchRates() }, [])

  async function fetchRates() {
    try {
      const r = await fetch('/api/exchange-rate')
      const d = await r.json()
      setRates(d)
      setRateUpdated(d.updated)
    } catch {}
  }

  async function loadProducts() {
    const r = await fetch('/api/products')
    const d = await r.json()
    if (Array.isArray(d)) setProducts(d)
  }

  function showMsg(text, type='ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2500)
  }

  // 환율 기반 가격 계산
  const computed = calcPrices(form.costco_price, form.margin_rate, form.fx_safety, form.platform_fee, rates)

  // 사진 업로드
  async function handlePhotoUpload(e, idx) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const ext  = file.name.split('.').pop()
      const path = `products/${editId || 'new_' + Date.now()}/photo_${idx}.${ext}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      const newPhotos = [...(form.photos || [])]
      newPhotos[idx] = publicUrl
      setForm(p => ({ ...p, photos: newPhotos }))
      showMsg('사진 업로드 완료!')
    } catch (err) { showMsg('사진 업로드 실패: ' + err.message, 'err') }
  }

  function removePhoto(idx) {
    const newPhotos = [...(form.photos || [])]
    newPhotos[idx] = null
    setForm(p => ({ ...p, photos: newPhotos }))
  }

  // 특징 태그 추가/삭제
  function addFeature() {
    if (!featureInput.trim()) return
    setForm(p => ({ ...p, features: [...(p.features||[]), featureInput.trim()] }))
    setFeatureInput('')
  }
  function removeFeature(i) {
    setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))
  }

  // 네이버 자동 수집
  async function handleImportSearch() {
    if (!importQuery.trim()) return
    setImportLoading(true); setImportItems([])
    try {
      const r = await fetch(`/api/admin/import-naver?query=${encodeURIComponent(importQuery)}`)
      const d = await r.json()
      setImportItems(d.items || [])
    } catch { showMsg('검색 오류', 'err') }
    setImportLoading(false)
  }

  function fillForm(item) {
    setForm(p => ({ ...p,
      name: item.name.slice(0,60), costco_price: item.costco_price || '',
      unit: item.unit || '', search_query: item.search_query || item.name.slice(0,50),
    }))
    setEditId(null)
    setActiveTab('basic')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showMsg('폼에 채워졌습니다!')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        sell_price_krw: computed?.krw || null,
        sell_price_usd: computed?.usd || null,
        sell_price_eur: computed?.eur || null,
        sell_price_jpy: computed?.jpy || null,
      }
      const url    = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      showMsg(editId ? '수정 완료!' : '등록 완료!')
      resetForm(); loadProducts()
    } catch (err) { showMsg(err.message, 'err') }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    showMsg('삭제 완료'); loadProducts()
  }

  function handleEdit(p) {
    setEditId(p.id)
    setForm({
      name: p.name, emoji: p.emoji, category: p.category, source_type: p.source_type || '코스트코',
      costco_price: p.costco_price, unit: p.unit||'', unit_qty: p.unit_qty||'', unit_base: p.unit_base||'100g당',
      search_query: p.search_query, notes: p.notes||'',
      margin_rate: p.margin_rate||35, fx_safety: p.fx_safety||5, platform_fee: p.platform_fee||13,
      sell_price_krw: p.sell_price_krw, sell_price_usd: p.sell_price_usd,
      sell_price_eur: p.sell_price_eur, sell_price_jpy: p.sell_price_jpy,
      photos: p.photos||[], description_ko: p.description_ko||'', description_en: p.description_en||'',
      features: p.features||[], weight_g: p.weight_g||'', ship_info: p.ship_info||'',
      listing_status: p.listing_status||'draft',
    })
    setActiveTab('basic')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() { setForm(EMPTY); setEditId(null); setActiveTab('basic') }

  const filtered = filter === '전체' ? products : products.filter(p => p.category === filter)

  return (
    <div style={S.page}>
      <Nav active="admin" />
      {msg && <div style={{ ...S.toast, background: msg.type==='ok'?'#059669':'#DC2626' }}>{msg.text}</div>}

      <div style={S.container}>
        <div style={S.topbar}>
          <h1 style={S.h1}>🛠️ 상품 관리</h1>
          {rates && (
            <div style={S.rateBar}>
              <span style={S.rateLabel}>환율</span>
              {[['🇺🇸','$','USD',rates.USD],['🇪🇺','€','EUR',rates.EUR],['🇯🇵','¥','JPY',rates.JPY]].map(([f,s,c,r]) => (
                <span key={c} style={S.rateChip}>{f} {s}1 = ₩{Number(r).toLocaleString()}</span>
              ))}
              {rates.fallback && <span style={{ fontSize:10, color:'#D97706' }}>기본값</span>}
              <button style={S.rateRefresh} onClick={fetchRates} title="환율 새로고침">↻</button>
            </div>
          )}
        </div>

        <div style={S.layout}>
          {/* ── 왼쪽 폼 ── */}
          <div style={S.leftCol}>

            {/* 네이버 자동 수집 */}
            <div style={S.section}>
              <div style={S.sectionTitle}>🔍 네이버 자동 수집</div>
              <div style={S.importRow}>
                <input style={S.input} value={importQuery} onChange={e=>setImportQuery(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleImportSearch()} placeholder="검색어 입력 (예: 올리브영 마스크팩)" />
                <button style={S.searchBtn} onClick={handleImportSearch} disabled={importLoading}>{importLoading?'검색중...':'검색'}</button>
                <button style={S.outlineBtn} onClick={()=>window.open(`https://www.costco.co.kr/search?q=${encodeURIComponent(importQuery)}`,'_blank')}>코스트코몰 ↗</button>
              </div>
              {importItems.length > 0 && (
                <div style={S.importList}>
                  <div style={S.importHint}>클릭 → 폼에 자동 채우기</div>
                  {importItems.map((item,i) => (
                    <div key={i} style={S.importCard} onClick={()=>fillForm(item)}>
                      {item.image && <img src={item.image} alt="" style={S.importImg} onError={e=>e.target.style.display='none'} />}
                      <div style={S.importInfo}>
                        <div style={S.importName}>{item.name}</div>
                        <div style={S.importMeta}>
                          <span style={S.importPrice}>₩{item.costco_price?.toLocaleString()}</span>
                          {item.unit && <span style={S.importUnit}>{item.unit}</span>}
                        </div>
                      </div>
                      <button style={S.addBtn}>+ 채우기</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 탭 메뉴 */}
            <div style={S.section}>
              <div style={S.tabRow}>
                {[['basic','기본정보'],['pricing','가격/환율'],['content','콘텐츠']].map(([k,l])=>(
                  <button key={k} style={{...S.tab,...(activeTab===k?S.tabOn:{})}} onClick={()=>setActiveTab(k)}>{l}</button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>

                {/* ─ 탭1: 기본정보 ─ */}
                {activeTab === 'basic' && (
                  <div>
                    {/* 소싱처 */}
                    <div style={S.field}>
                      <label style={S.label}>소싱처 *</label>
                      <div style={S.sourceRow}>
                        {SOURCES.map(s => (
                          <button key={s} type="button"
                            style={{...S.sourceBtn,...(form.source_type===s?{...S.sourceBtnOn,borderColor:sourceBadgeColor[s],color:sourceBadgeColor[s]}:{})}}
                            onClick={()=>setForm(p=>({...p,source_type:s}))}>{s}</button>
                        ))}
                      </div>
                    </div>

                    {/* 이모지 */}
                    <div style={S.field}>
                      <label style={S.label}>이모지</label>
                      <div style={S.emojiGrid}>
                        {EMOJIS.map(e=>(
                          <button key={e} type="button"
                            style={{...S.emojiBtn,...(form.emoji===e?S.emojiBtnOn:{})}}
                            onClick={()=>setForm(p=>({...p,emoji:e}))}>{e}</button>
                        ))}
                      </div>
                    </div>

                    {/* 카테고리 + 상태 */}
                    <div style={{...S.field,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={S.label}>카테고리 *</label>
                        <select style={S.select} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>판매 상태</label>
                        <select style={S.select} value={form.listing_status} onChange={e=>setForm(p=>({...p,listing_status:e.target.value}))}>
                          {STATUS_OPTS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* 상품명 */}
                    <div style={S.field}>
                      <label style={S.label}>상품명 *</label>
                      <input style={S.input} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="예: 올리브영 닥터자르트 세라마이딘 크림" required />
                    </div>

                    {/* 구매가 + 단위 */}
                    <div style={{...S.field,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={S.label}>구매가 (₩) *</label>
                        <input style={S.input} type="number" value={form.costco_price} onChange={e=>setForm(p=>({...p,costco_price:e.target.value}))} placeholder="32000" required />
                      </div>
                      <div>
                        <label style={S.label}>단위</label>
                        <input style={S.input} value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="예: 50ml, 10매" />
                      </div>
                    </div>

                    {/* 수량 + 객단가 기준 */}
                    <div style={{...S.field,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={S.label}>수량 (객단가 계산)</label>
                        <input style={S.input} type="number" value={form.unit_qty} onChange={e=>setForm(p=>({...p,unit_qty:e.target.value}))} placeholder="예: 50" />
                      </div>
                      <div>
                        <label style={S.label}>단위 기준</label>
                        <select style={S.select} value={form.unit_base} onChange={e=>setForm(p=>({...p,unit_base:e.target.value}))}>
                          {UNIT_BASES.map(b=><option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* 검색어 */}
                    <div style={S.field}>
                      <label style={S.label}>온라인 검색어 * <span style={{color:'#9CA3AF',fontWeight:400}}>(네이버/쿠팡 비교에 사용)</span></label>
                      <input style={S.input} value={form.search_query} onChange={e=>setForm(p=>({...p,search_query:e.target.value}))} placeholder="예: 닥터자르트 세라마이딘 크림 50ml" required />
                    </div>

                    {/* 무게 + 배송 */}
                    <div style={{...S.field,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={S.label}>무게 (g)</label>
                        <input style={S.input} type="number" value={form.weight_g} onChange={e=>setForm(p=>({...p,weight_g:e.target.value}))} placeholder="예: 250" />
                      </div>
                      <div>
                        <label style={S.label}>배송 정보</label>
                        <input style={S.input} value={form.ship_info} onChange={e=>setForm(p=>({...p,ship_info:e.target.value}))} placeholder="예: 국제배송 가능" />
                      </div>
                    </div>

                    <div style={S.field}>
                      <label style={S.label}>메모</label>
                      <textarea style={{...S.input,resize:'vertical'}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="특이사항, 구매 팁" />
                    </div>
                  </div>
                )}

                {/* ─ 탭2: 가격/환율 ─ */}
                {activeTab === 'pricing' && (
                  <div>
                    <div style={{...S.field,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={S.label}>목표 마진율 (%)</label>
                        <input style={S.input} type="number" min="0" max="90" value={form.margin_rate} onChange={e=>setForm(p=>({...p,margin_rate:Number(e.target.value)}))} />
                      </div>
                      <div>
                        <label style={S.label}>플랫폼 수수료 (%) <span style={{color:'#9CA3AF',fontWeight:400}}>eBay≈13, Shopify≈2</span></label>
                        <input style={S.input} type="number" min="0" max="30" value={form.platform_fee} onChange={e=>setForm(p=>({...p,platform_fee:Number(e.target.value)}))} />
                      </div>
                    </div>

                    <div style={S.field}>
                      <label style={S.label}>환율 안전마진 (%) <span style={{color:'#9CA3AF',fontWeight:400}}>환율 변동 리스크 방어</span></label>
                      <input type="range" min="0" max="15" value={form.fx_safety}
                        onChange={e=>setForm(p=>({...p,fx_safety:Number(e.target.value)}))}
                        style={{width:'100%',margin:'6px 0'}} />
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#9CA3AF'}}>
                        <span>0% 없음</span>
                        <span style={{color:'#2563EB',fontWeight:500}}>{form.fx_safety}% 적용</span>
                        <span>15% 보수적</span>
                      </div>
                    </div>

                    {/* 방안C 통화태그 미리보기 */}
                    {computed && rates ? (
                      <div style={S.pricePreview}>
                        <div style={S.previewLabel}>📊 권장 판매가 (실시간 환율 반영)</div>
                        <div style={S.currencyTagRow}>
                          <span style={S.curTagMain}>🇰🇷 ₩{computed.krw.toLocaleString()}</span>
                          <span style={S.curTag}>🇺🇸 ${computed.usd.toFixed(2)}</span>
                          <span style={S.curTag}>🇪🇺 €{computed.eur.toFixed(2)}</span>
                          <span style={S.curTag}>🇯🇵 ¥{computed.jpy.toLocaleString()}</span>
                        </div>
                        <div style={S.previewSub}>
                          구매가 ₩{Number(form.costco_price||0).toLocaleString()} · 마진 {form.margin_rate}% · 수수료 {form.platform_fee}% · 환율안전마진 {form.fx_safety}%
                          {rates.fallback && <span style={{color:'#D97706'}}> · 기본환율 사용</span>}
                        </div>
                      </div>
                    ) : (
                      <div style={{...S.pricePreview,textAlign:'center',color:'#9CA3AF',padding:'20px'}}>
                        구매가를 입력하면 판매가가 자동 계산됩니다
                      </div>
                    )}
                  </div>
                )}

                {/* ─ 탭3: 콘텐츠 ─ */}
                {activeTab === 'content' && (
                  <div>
                    {/* 사진 업로드 6장 */}
                    <div style={S.field}>
                      <label style={S.label}>상품 사진 (최대 6장)</label>
                      <div style={S.photoGrid}>
                        {Array.from({length:6}).map((_,idx)=>{
                          const url = form.photos?.[idx]
                          return (
                            <div key={idx} style={S.photoSlot}>
                              {url ? (
                                <div style={{position:'relative',width:'100%',height:'100%'}}>
                                  <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6}} />
                                  <button type="button" style={S.photoRemove} onClick={()=>removePhoto(idx)}>✕</button>
                                </div>
                              ) : (
                                <div style={S.photoEmpty} onClick={()=>fileRefs[idx].current?.click()}>
                                  <span style={{fontSize:20}}>+</span>
                                  <span style={{fontSize:10,color:'#9CA3AF',marginTop:3}}>{idx===0?'대표':'추가'}</span>
                                </div>
                              )}
                              <input ref={fileRefs[idx]} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handlePhotoUpload(e,idx)} />
                            </div>
                          )
                        })}
                      </div>
                      <div style={{fontSize:11,color:'#9CA3AF',marginTop:6}}>첫 번째 사진이 대표 이미지로 사용됩니다</div>
                    </div>

                    {/* 한글 설명 */}
                    <div style={S.field}>
                      <label style={S.label}>상품 설명 (한글)</label>
                      <textarea style={{...S.input,resize:'vertical'}} value={form.description_ko}
                        onChange={e=>setForm(p=>({...p,description_ko:e.target.value}))}
                        rows={4} placeholder="상품 특징, 사용법, 주의사항 등을 입력하세요" />
                    </div>

                    {/* 영문 설명 */}
                    <div style={S.field}>
                      <label style={S.label}>상품 설명 (English) <span style={{color:'#9CA3AF',fontWeight:400}}>eBay 등록용</span></label>
                      <textarea style={{...S.input,resize:'vertical'}} value={form.description_en}
                        onChange={e=>setForm(p=>({...p,description_en:e.target.value}))}
                        rows={4} placeholder="Product features, usage, and precautions" />
                    </div>

                    {/* 특징 태그 */}
                    <div style={S.field}>
                      <label style={S.label}>주요 특징 태그</label>
                      <div style={{display:'flex',gap:8,marginBottom:8}}>
                        <input style={{...S.input,flex:1}} value={featureInput}
                          onChange={e=>setFeatureInput(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addFeature())}
                          placeholder="예: 무향, 저자극, 비건 인증" />
                        <button type="button" style={S.addTagBtn} onClick={addFeature}>추가</button>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {(form.features||[]).map((f,i)=>(
                          <span key={i} style={S.featureTag}>{f} <button type="button" style={S.featureRemove} onClick={()=>removeFeature(i)}>✕</button></span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:8,marginTop:16}}>
                  <button style={S.submitBtn} type="submit" disabled={loading}>{loading?'저장 중...':editId?'수정 저장':'등록하기'}</button>
                  {editId && <button style={S.cancelBtn} type="button" onClick={resetForm}>취소</button>}
                </div>
              </form>
            </div>
          </div>

          {/* ── 오른쪽: 상품 목록 ── */}
          <div style={S.rightCol}>
            <div style={S.sectionTitle}>📋 등록 상품 ({products.length}개)</div>

            <div style={S.filterRow}>
              {['전체',...CATEGORIES].map(c=>(
                <button key={c} style={{...S.filterBtn,...(filter===c?S.filterBtnOn:{})}} onClick={()=>setFilter(c)}>{c}</button>
              ))}
            </div>

            {filtered.map(p => {
              const st = STATUS_OPTS.find(o=>o.val===p.listing_status) || STATUS_OPTS[0]
              const hasPrices = p.sell_price_usd || p.sell_price_eur
              return (
                <div key={p.id} style={S.prodRow}>
                  <div style={{width:40,height:40,borderRadius:6,background:'#F3F4F6',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    {p.photos?.[0]
                      ? <img src={p.photos[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : <span style={{fontSize:20}}>{p.emoji}</span>}
                  </div>
                  <div style={S.prodInfo}>
                    <div style={S.prodNameRow}>
                      <span style={S.prodName}>{p.name}</span>
                      <span style={{...S.statusDot,color:st.color}}>● {st.label}</span>
                    </div>
                    <div style={S.prodMeta}>
                      <span style={{...S.sourceTag,borderColor:sourceBadgeColor[p.source_type]||'#9CA3AF',color:sourceBadgeColor[p.source_type]||'#9CA3AF'}}>{p.source_type||'코스트코'}</span>
                      <span style={S.prodPrice}>₩{p.costco_price?.toLocaleString()}</span>
                      {p.unit && <span style={S.prodUnit}>{p.unit}</span>}
                    </div>
                    {hasPrices && (
                      <div style={S.currencyTagRow2}>
                        <span style={S.curTag2}>🇰🇷 ₩{p.sell_price_krw?.toLocaleString()}</span>
                        {p.sell_price_usd && <span style={S.curTag2}>🇺🇸 ${Number(p.sell_price_usd).toFixed(2)}</span>}
                        {p.sell_price_eur && <span style={S.curTag2}>🇪🇺 €{Number(p.sell_price_eur).toFixed(2)}</span>}
                        {p.sell_price_jpy && <span style={S.curTag2}>🇯🇵 ¥{Number(p.sell_price_jpy).toLocaleString()}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:5,flexShrink:0}}>
                    <button style={S.editBtn} onClick={()=>handleEdit(p)}>수정</button>
                    <button style={S.delBtn} onClick={()=>handleDelete(p.id)}>삭제</button>
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
  page:      { minHeight:'100vh', background:'#F9FAFB', color:'#111827', fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif" },
  container: { maxWidth:1300, margin:'0 auto', padding:'24px 20px' },
  topbar:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 },
  h1:        { fontSize:22, fontWeight:600, color:'#111827' },
  toast:     { position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', color:'#fff', padding:'10px 24px', borderRadius:20, fontSize:13, fontWeight:600, zIndex:999, whiteSpace:'nowrap' },
  rateBar:   { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  rateLabel: { fontSize:11, color:'#9CA3AF', fontWeight:500 },
  rateChip:  { fontSize:12, background:'#F3F4F6', color:'#374151', padding:'4px 10px', borderRadius:20 },
  rateRefresh:{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#6B7280', padding:'4px' },
  layout:    { display:'grid', gridTemplateColumns:'500px 1fr', gap:20, alignItems:'start' },
  leftCol:   { display:'flex', flexDirection:'column', gap:16 },
  rightCol:  { background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:20 },
  section:   { background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:20 },
  sectionTitle:{ fontSize:14, fontWeight:600, color:'#111827', marginBottom:14, paddingBottom:12, borderBottom:'1px solid #F3F4F6' },
  importRow: { display:'flex', gap:8, marginBottom:10 },
  searchBtn: { background:'#2563EB', color:'#fff', border:'none', borderRadius:7, padding:'8px 14px', fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' },
  outlineBtn:{ background:'#F9FAFB', color:'#374151', border:'1px solid #E5E7EB', borderRadius:7, padding:'8px 10px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' },
  importList:{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 },
  importHint:{ fontSize:11, color:'#9CA3AF', marginBottom:4 },
  importCard:{ display:'flex', gap:10, alignItems:'center', padding:'9px 12px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, cursor:'pointer' },
  importImg: { width:38, height:38, borderRadius:5, objectFit:'cover', flexShrink:0, background:'#E5E7EB' },
  importInfo:{ flex:1, minWidth:0 },
  importName:{ fontSize:12, fontWeight:500, color:'#111827', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:2 },
  importMeta:{ display:'flex', gap:6 },
  importPrice:{ fontSize:12, fontWeight:600, color:'#111827' },
  importUnit:{ fontSize:11, color:'#9CA3AF' },
  addBtn:    { background:'#EFF6FF', color:'#1D4ED8', border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' },
  tabRow:    { display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid #F3F4F6', paddingBottom:12 },
  tab:       { background:'none', border:'1px solid #E5E7EB', color:'#6B7280', borderRadius:20, padding:'5px 14px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  tabOn:     { background:'#111827', color:'#fff', border:'1px solid #111827', fontWeight:500 },
  field:     { marginBottom:12 },
  label:     { display:'block', fontSize:12, color:'#374151', marginBottom:5, fontWeight:500 },
  input:     { width:'100%', background:'#fff', border:'1px solid #E5E7EB', borderRadius:7, padding:'9px 12px', color:'#111827', fontSize:13, outline:'none', fontFamily:'inherit' },
  select:    { width:'100%', background:'#fff', border:'1px solid #E5E7EB', borderRadius:7, padding:'9px 12px', color:'#111827', fontSize:13, outline:'none', fontFamily:'inherit' },
  sourceRow: { display:'flex', gap:6, flexWrap:'wrap' },
  sourceBtn: { background:'#fff', border:'1px solid #E5E7EB', color:'#6B7280', borderRadius:20, padding:'6px 16px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  sourceBtnOn:{ background:'#F9FAFB', fontWeight:600 },
  emojiGrid: { display:'flex', flexWrap:'wrap', gap:4 },
  emojiBtn:  { background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:6, padding:'4px 5px', fontSize:17, cursor:'pointer', lineHeight:1 },
  emojiBtnOn:{ background:'#EFF6FF', border:'2px solid #2563EB' },
  pricePreview:{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:8, padding:'12px 14px', marginTop:12 },
  previewLabel:{ fontSize:12, fontWeight:500, color:'#065F46', marginBottom:8 },
  currencyTagRow:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 },
  curTagMain:{ background:'#059669', color:'#fff', border:'none', borderRadius:20, padding:'5px 12px', fontSize:13, fontWeight:600 },
  curTag:    { background:'#fff', border:'1px solid #D1FAE5', color:'#065F46', borderRadius:20, padding:'5px 12px', fontSize:13, fontWeight:500 },
  previewSub:{ fontSize:11, color:'#6B7280' },
  photoGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 },
  photoSlot: { aspectRatio:'1', borderRadius:8, border:'1px dashed #D1D5DB', overflow:'hidden', position:'relative' },
  photoEmpty:{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#F9FAFB' },
  photoRemove:{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  addTagBtn: { background:'#111827', color:'#fff', border:'none', borderRadius:7, padding:'9px 14px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0 },
  featureTag:{ background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE', borderRadius:20, padding:'4px 10px', fontSize:12, display:'flex', alignItems:'center', gap:5 },
  featureRemove:{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#93C5FD', padding:0 },
  submitBtn: { background:'#111827', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  cancelBtn: { background:'#fff', border:'1px solid #E5E7EB', color:'#6B7280', borderRadius:8, padding:'10px 16px', fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  filterRow: { display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 },
  filterBtn: { background:'#fff', border:'1px solid #E5E7EB', color:'#6B7280', borderRadius:20, padding:'3px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  filterBtnOn:{ background:'#111827', color:'#fff', border:'1px solid #111827', fontWeight:500 },
  prodRow:   { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid #F3F4F6' },
  prodInfo:  { flex:1, minWidth:0 },
  prodNameRow:{ display:'flex', alignItems:'center', gap:6, marginBottom:3 },
  prodName:  { fontSize:13, fontWeight:500, color:'#111827', flex:1, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' },
  statusDot: { fontSize:10, flexShrink:0 },
  prodMeta:  { display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:3 },
  sourceTag: { fontSize:10, border:'1px solid', borderRadius:4, padding:'1px 6px', fontWeight:500 },
  prodPrice: { fontSize:12, fontWeight:600, color:'#111827' },
  prodUnit:  { fontSize:11, color:'#9CA3AF' },
  currencyTagRow2:{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 },
  curTag2:   { background:'#F3F4F6', color:'#374151', borderRadius:12, padding:'2px 7px', fontSize:10, fontWeight:500 },
  editBtn:   { background:'#fff', border:'1px solid #E5E7EB', color:'#374151', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  delBtn:    { background:'#fff', border:'1px solid #FEE2E2', color:'#DC2626', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  empty:     { color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'40px 0' },
}
