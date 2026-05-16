// 📄 pages/index.js — 흰색 테마 + 객단가 표시

import { useState, useEffect } from "react";
import Nav from "../components/Nav";

const PLATFORM_INFO = {
  naver:    { label: "🔍 네이버 쇼핑", color: "#059669" },
  coupang:  { label: "🛒 쿠팡",        color: "#DC2626" },
  eleventh: { label: "1️⃣ 11번가",     color: "#EA580C" },
  gmarket:  { label: "🏪 G마켓",       color: "#2563EB" },
};

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [cat,         setCat]         = useState("");
  const [cats,        setCats]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [costcoProd,  setCostcoProd]  = useState(null);
  const [searchData,  setSearchData]  = useState(null);
  const [searchLoading,setSearchLoading]= useState(false);
  const [selItem,     setSelItem]     = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [saveStatus,  setSaveStatus]  = useState(null);

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setAllProducts(data);
        const uniqueCats = [...new Set(data.map(p => p.category))];
        setCats(uniqueCats);
        if (uniqueCats.length) setCat(uniqueCats[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const products = allProducts.filter(p => p.category === cat);

  function selectCat(c) { setCat(c); setCostcoProd(null); setSearchData(null); setSelItem(null); setSaveStatus(null); }

  async function handleCostcoClick(product) {
    setCostcoProd(product); setSearchData(null); setSelItem(null); setSaveStatus(null); setSearchLoading(true);
    try {
      const res  = await fetch("/api/search/price-compare?query=" + encodeURIComponent(product.search_query));
      const data = await res.json();
      setSearchData(data);
    } catch (e) { console.error(e); }
    setSearchLoading(false);
  }

  // 2열 클릭 시 선택 상품 헤더에만 표시 — 테이블은 항상 최저가 기준
  function handleItemClick(item, platformId) {
    setSelItem({ ...item, platformId });
    setCompareData(searchData);
  }

  // 코스트코 상품 클릭 시 자동으로 비교결과 표시 (클릭 없이도)
  useEffect(() => {
    if (searchData && !selItem) {
      setCompareData(searchData);
      // 자동으로 최저가 플랫폼의 첫 번째 상품 선택
      const winner = searchData.winner;
      if (winner) {
        const winnerItems = searchData[winner.platform]?.items;
        if (winnerItems?.length) {
          setSelItem({ ...winnerItems[0], platformId: winner.platform });
        }
      }
    }
  }, [searchData]);

  async function handleSave() {
    if (!selItem || !compareData) return;
    setSaveStatus("saving");
    try {
      const r = await fetch("/api/snapshots/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: costcoProd?.id, product_name: costcoProd?.name || selItem.title, category: costcoProd?.category, costco_price: costcoProd?.costco_price, naver: compareData.naver, coupang: compareData.coupang, eleventh: compareData.eleventh, gmarket: compareData.gmarket, winner: compareData.winner }),
      });
      if (!r.ok) throw new Error();
      setSaveStatus("done"); setTimeout(() => setSaveStatus(null), 3000);
    } catch { setSaveStatus("err"); setTimeout(() => setSaveStatus(null), 3000); }
  }

  const allSearchItems = searchData ? [
    ...(searchData.naver?.items   || []).map(i => ({ ...i, platformId: "naver" })),
    ...(searchData.coupang?.items || []).map(i => ({ ...i, platformId: "coupang" })),
    ...(searchData.eleventh?.items|| []).map(i => ({ ...i, platformId: "eleventh" })),
    ...(searchData.gmarket?.items || []).map(i => ({ ...i, platformId: "gmarket" })),
  ] : [];

  return (
    <div style={S.page}>
      <Nav active="compare" />

      {/* 카테고리 탭 */}
      <div style={S.catBar}>
        {cats.map(c => (
          <button key={c} style={{ ...S.catTab, ...(cat === c ? S.catTabOn : {}) }} onClick={() => selectCat(c)}>
            {c} <span style={{ ...S.catCnt, ...(cat === c ? S.catCntOn : {}) }}>{allProducts.filter(p => p.category === c).length}</span>
          </button>
        ))}
      </div>

      {/* 단계 표시 */}
      <div style={S.steps}>
        {["카테고리","상품 선택","온라인 검색결과","플랫폼 가격 비교"].map((s, i) => (
          <span key={i} style={S.stepWrap}>
            <span style={{ ...S.stepNum, ...(i===0||(i===1&&costcoProd)||(i===2&&searchData)||(i===3&&selItem)?S.stepDone:S.stepTodo)}}>{i+1}</span>
            <span style={{ ...S.stepLbl, ...(i===0||(i===1&&costcoProd)||(i===2&&searchData)||(i===3&&selItem)?S.stepLblDone:S.stepLblTodo)}}>{s}</span>
            {i < 3 && <span style={S.stepSep}>›</span>}
          </span>
        ))}
      </div>

      {/* 3단 레이아웃 */}
      <div style={S.body}>

        {/* 1열 */}
        <div style={S.col}>
          <div style={S.colHead}>코스트코 · {products.length}개</div>
          {loading && <div style={S.emptySmall}>불러오는 중...</div>}
          {!loading && products.length === 0 && <div style={S.emptySmall}>상품 없음<br/>관리자 페이지에서 등록해주세요</div>}
          {products.map(p => {
            const up = p.unit_price || (p.unit_qty ? Math.round(p.costco_price / p.unit_qty * 100) : null)
            return (
              <div key={p.id} style={{ ...S.prodCard, ...(costcoProd?.id === p.id ? S.prodCardOn : {}) }} onClick={() => handleCostcoClick(p)}>
                <div style={S.prodEmoji}>{p.emoji}</div>
                <div style={S.prodInfo}>
                  <div style={S.prodName}>{p.name}</div>
                  <div style={S.prodMeta}>
                    <span style={S.prodBadge}>코스트코</span>
                    <span style={S.prodPrice}>₩{p.costco_price?.toLocaleString()}</span>
                    {p.unit && <span style={S.prodUnit}>{p.unit}</span>}
                  </div>
                  {up && <div style={S.unitPrice}>₩{up.toLocaleString()}/{p.unit_base?.replace('당','') || '100g'}</div>}
                </div>
                <span style={{ color: costcoProd?.id === p.id ? '#2563EB' : '#D1D5DB', fontSize: 14 }}>{costcoProd?.id === p.id ? '▶' : '›'}</span>
              </div>
            )
          })}
        </div>

        {/* 2열 */}
        <div style={S.col}>
          <div style={S.colHead}>온라인 검색결과{costcoProd && <span style={S.colSub}> · {costcoProd.name}</span>}</div>
          {!costcoProd && <div style={S.emptySmall}>← 상품을 선택하세요</div>}
          {searchLoading && <div style={S.emptySmall}>🔄 검색 중...</div>}
          {!searchLoading && allSearchItems.length > 0 && ["naver","coupang","eleventh","gmarket"].map(pid => {
            const platItems = allSearchItems.filter(i => i.platformId === pid);
            if (!platItems.length) return null;
            return (
              <div key={pid}>
                <div style={S.secLabel}>{PLATFORM_INFO[pid].label}</div>
                {platItems.map((item, idx) => (
                  <div key={idx} style={{ ...S.searchItem, ...(selItem?.link === item.link ? S.searchItemOn : {}) }} onClick={() => handleItemClick(item, pid)}>
                    {item.image ? <img src={item.image} alt="" style={S.searchImg} onError={e => e.target.style.display="none"} /> : <div style={S.searchImgEmpty}></div>}
                    <div style={S.searchInfo}>
                      <div style={S.searchTitle}>{item.title}</div>
                      <div style={S.searchBottom}>
                        <span style={S.searchPrice}>₩{item.price?.toLocaleString()}</span>
                        {item.isFreeShip ? <span style={S.freeTag}>무료배송</span> : <span style={S.shipTag}>+₩{item.shippingFee?.toLocaleString()}</span>}
                        {item.isRocket && <span style={S.rocketTag}>🚀 로켓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* 3열 */}
        <div style={S.col3}>
          {!selItem && <div style={S.empty}><div style={{ fontSize:32, marginBottom:8 }}>←</div><div style={{ fontSize:13, color:'#9CA3AF' }}>검색결과에서 상품을 선택하세요</div></div>}

          {selItem && compareData && (
            <div>
              {/* 선택된 상품 헤더 */}
              <div style={S.selBox}>
                {selItem.image && <img src={selItem.image} alt="" style={S.selImg} onError={e => e.target.style.display="none"} />}
                <div style={S.selInfo}>
                  <div style={S.selName}>{selItem.title}</div>
                  <div style={S.selMeta}>
                    <span style={{ ...S.selSrc, color: PLATFORM_INFO[selItem.platformId]?.color }}>
                      {PLATFORM_INFO[selItem.platformId]?.label}
                    </span>
                    <span style={S.selPrice}>₩{selItem.price?.toLocaleString()}</span>
                    {costcoProd && <span style={S.selCostco}>코스트코 ₩{costcoProd.costco_price?.toLocaleString()}</span>}
                  </div>
                </div>
              </div>

              {/* 최저가 배너 */}
              {compareData.winner && (
                <div style={S.winnerBox}>
                  <div style={S.winnerLeft}>
                    <span style={S.winnerBadge}>🏆 최저가</span>
                    <span style={S.winnerName}>{compareData.winner.name}</span>
                    <span style={S.winnerPrice}>₩{compareData.winner.price?.toLocaleString()}</span>
                  </div>
                  <div style={S.winnerRight}>
                    {compareData.winner.saving > 0 && <span style={S.chipGreen}>타 플랫폼보다 ₩{compareData.winner.saving?.toLocaleString()} 저렴</span>}
                    {costcoProd && compareData.winner.price < costcoProd.costco_price && <span style={S.chipGreen}>코스트코보다 ₩{(costcoProd.costco_price - compareData.winner.price)?.toLocaleString()} 저렴 🎉</span>}
                    {costcoProd && compareData.winner.price >= costcoProd.costco_price && <span style={S.chipGray}>코스트코가 더 저렴</span>}
                  </div>
                </div>
              )}

              {/* 비교 테이블 */}
              <div style={S.table}>
                <div style={S.tableHead}>
                  <div style={S.th}>플랫폼</div>
                  <div style={{ ...S.th, textAlign:'right' }}>상품가</div>
                  <div style={{ ...S.th, textAlign:'right' }}>배송비</div>
                  <div style={{ ...S.th, textAlign:'right' }}>총 결제액</div>
                </div>
                {["naver","coupang","eleventh","gmarket"].map(pid => {
                  const platData = compareData[pid];
                  const isBest   = compareData.winner?.platform === pid;
                  // 항상 최저가 상품 기준 (서버에서 total 오름차순 정렬됨)
                  const item = platData?.items?.[0] || null;
                  return (
                    <div key={pid} style={{ ...S.tableRow, ...(isBest ? S.tableRowBest : {}) }}>
                      <div style={{ ...S.td, display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:12, fontWeight:500, color: isBest ? '#059669' : '#374151' }}>{PLATFORM_INFO[pid].label}</span>
                        {isBest && <span style={S.bestBadge}>최저가</span>}
                        {(!platData?.items?.length) && <span style={S.errBadge}>미연결</span>}
                      </div>
                      <div style={{ ...S.td, textAlign:'right', color: isBest ? '#059669' : '#111827', fontWeight: isBest ? 600 : 400 }}>{item ? `₩${item.price?.toLocaleString()}` : '—'}</div>
                      <div style={{ ...S.td, textAlign:'right', color: item?.isFreeShip ? '#059669' : '#6B7280' }}>{item ? (item.isFreeShip ? '무료' + (item.isRocket?' 🚀':'') : `₩${item.shippingFee?.toLocaleString()}`) : '—'}</div>
                      <div style={{ ...S.td, textAlign:'right', fontSize:14, fontWeight: isBest ? 700 : 500, color: isBest ? '#059669' : '#111827' }}>{item ? `₩${item.total?.toLocaleString()}` : '—'}</div>
                    </div>
                  );
                })}
                {costcoProd && (
                  <div style={{ ...S.tableRow, background:'#F9FAFB' }}>
                    <div style={S.td}><span style={{ fontSize:12, color:'#9CA3AF' }}>🏬 코스트코 (기준)</span></div>
                    <div style={{ ...S.td, textAlign:'right', color:'#9CA3AF', fontSize:12 }}>₩{costcoProd.costco_price?.toLocaleString()}</div>
                    <div style={{ ...S.td, textAlign:'right', color:'#9CA3AF', fontSize:12 }}>직접구매</div>
                    <div style={{ ...S.td, textAlign:'right', color:'#9CA3AF', fontSize:12 }}>₩{costcoProd.costco_price?.toLocaleString()}</div>
                  </div>
                )}
              </div>

              <div style={S.note}>* 배송비는 판매자 조건에 따라 달라질 수 있습니다</div>

              {/* 저장 버튼 */}
              <div style={{ padding:'12px 16px', borderTop:'1px solid #F3F4F6', display:'flex', justifyContent:'flex-end' }}>
                <button onClick={handleSave} disabled={saveStatus==="saving"} style={{
                  background: saveStatus==="done" ? '#059669' : saveStatus==="err" ? '#DC2626' : '#111827',
                  color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                }}>
                  {saveStatus==="saving"?"저장 중...":saveStatus==="done"?"✓ 저장됨":saveStatus==="err"?"저장 실패":"💾 비교결과 저장"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:        { minHeight:'100vh', background:'#F9FAFB', color:'#111827', fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif", display:'flex', flexDirection:'column' },
  catBar:      { borderBottom:'1px solid #E5E7EB', background:'#fff', display:'flex', padding:'0 16px', flexShrink:0, overflowX:'auto' },
  catTab:      { background:'none', border:'none', color:'#6B7280', padding:'10px 14px', cursor:'pointer', fontSize:13, borderBottom:'2px solid transparent', marginBottom:-1, display:'flex', alignItems:'center', gap:5, fontFamily:'inherit', whiteSpace:'nowrap' },
  catTabOn:    { color:'#111827', borderBottom:'2px solid #2563EB', fontWeight:500 },
  catCnt:      { fontSize:10, background:'#F3F4F6', color:'#6B7280', padding:'1px 6px', borderRadius:10 },
  catCntOn:    { background:'#EFF6FF', color:'#1D4ED8' },
  steps:       { display:'flex', alignItems:'center', gap:2, padding:'8px 16px', borderBottom:'1px solid #F3F4F6', background:'#fff', flexShrink:0, flexWrap:'wrap' },
  stepWrap:    { display:'flex', alignItems:'center', gap:4 },
  stepNum:     { width:18, height:18, borderRadius:'50%', fontSize:10, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepDone:    { background:'#2563EB', color:'#fff' },
  stepTodo:    { background:'#E5E7EB', color:'#9CA3AF' },
  stepLbl:     { fontSize:12 },
  stepLblDone: { color:'#374151' },
  stepLblTodo: { color:'#D1D5DB' },
  stepSep:     { color:'#D1D5DB', fontSize:13, margin:'0 2px' },
  body:        { display:'grid', gridTemplateColumns:'220px 260px 1fr', flex:1, minHeight:0, overflow:'hidden' },
  col:         { borderRight:'1px solid #E5E7EB', overflowY:'auto', background:'#fff' },
  col3:        { overflowY:'auto', background:'#fff' },
  colHead:     { fontSize:11, color:'#9CA3AF', fontWeight:500, letterSpacing:'.07em', textTransform:'uppercase', padding:'10px 12px 6px', borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, background:'#fff' },
  colSub:      { fontSize:11, color:'#D1D5DB', fontWeight:400, textTransform:'none', letterSpacing:0 },
  emptySmall:  { padding:'20px 12px', color:'#9CA3AF', fontSize:12, textAlign:'center', lineHeight:1.8 },
  secLabel:    { fontSize:11, color:'#9CA3AF', padding:'6px 12px 4px', borderBottom:'1px solid #F9FAFB', borderTop:'1px solid #F3F4F6', background:'#FAFAFA' },
  prodCard:    { display:'flex', gap:8, alignItems:'flex-start', padding:'10px 12px', borderBottom:'1px solid #F3F4F6', cursor:'pointer' },
  prodCardOn:  { background:'#EFF6FF', borderLeft:'2px solid #2563EB' },
  prodEmoji:   { fontSize:18, flexShrink:0, width:28, textAlign:'center', marginTop:2 },
  prodInfo:    { flex:1, minWidth:0 },
  prodName:    { fontSize:12, fontWeight:500, color:'#111827', marginBottom:2, lineHeight:1.3 },
  prodMeta:    { display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' },
  prodBadge:   { fontSize:9, background:'#F3F4F6', color:'#6B7280', padding:'1px 5px', borderRadius:3 },
  prodPrice:   { fontSize:12, fontWeight:500, color:'#111827' },
  prodUnit:    { fontSize:10, color:'#9CA3AF' },
  unitPrice:   { fontSize:10, color:'#854D0E', background:'#FEF9C3', display:'inline-block', padding:'1px 6px', borderRadius:4, marginTop:3 },
  searchItem:  { display:'flex', gap:8, alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #F3F4F6', cursor:'pointer' },
  searchItemOn:{ background:'#EFF6FF', borderLeft:'2px solid #2563EB' },
  searchImg:   { width:40, height:40, borderRadius:6, objectFit:'cover', flexShrink:0, background:'#F3F4F6' },
  searchImgEmpty:{ width:40, height:40, borderRadius:6, background:'#F3F4F6', flexShrink:0 },
  searchInfo:  { flex:1, minWidth:0 },
  searchTitle: { fontSize:11, color:'#374151', lineHeight:1.4, marginBottom:3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' },
  searchBottom:{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' },
  searchPrice: { fontSize:13, fontWeight:600, color:'#111827' },
  freeTag:     { fontSize:9, background:'#ECFDF5', color:'#065F46', padding:'1px 5px', borderRadius:3 },
  shipTag:     { fontSize:9, background:'#F3F4F6', color:'#6B7280', padding:'1px 5px', borderRadius:3 },
  rocketTag:   { fontSize:9, background:'#FFF7ED', color:'#C2410C', padding:'1px 5px', borderRadius:3 },
  empty:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:4 },
  selBox:      { display:'flex', gap:12, alignItems:'flex-start', padding:'14px 16px', borderBottom:'1px solid #F3F4F6', background:'#F9FAFB' },
  selImg:      { width:56, height:56, borderRadius:8, objectFit:'cover', flexShrink:0, background:'#E5E7EB' },
  selInfo:     { flex:1, minWidth:0 },
  selName:     { fontSize:13, fontWeight:500, color:'#111827', marginBottom:5, lineHeight:1.4 },
  selMeta:     { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  selSrc:      { fontSize:11, fontWeight:500 },
  selPrice:    { fontSize:14, fontWeight:700, color:'#111827' },
  selCostco:   { fontSize:11, color:'#9CA3AF' },
  winnerBox:   { background:'#ECFDF5', border:'1px solid #A7F3D0', margin:'12px 16px', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' },
  winnerLeft:  { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  winnerRight: { display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' },
  winnerBadge: { background:'#059669', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 },
  winnerName:  { fontSize:13, fontWeight:500, color:'#065F46' },
  winnerPrice: { fontSize:18, fontWeight:700, color:'#059669' },
  chipGreen:   { fontSize:10, background:'#D1FAE5', color:'#065F46', padding:'2px 9px', borderRadius:20 },
  chipGray:    { fontSize:10, background:'#F3F4F6', color:'#6B7280', padding:'2px 9px', borderRadius:20 },
  table:       { margin:'12px 16px' },
  tableHead:   { display:'grid', gridTemplateColumns:'1fr 90px 80px 90px', padding:'6px 10px', borderBottom:'1px solid #E5E7EB' },
  th:          { fontSize:11, color:'#9CA3AF', fontWeight:500 },
  tableRow:    { display:'grid', gridTemplateColumns:'1fr 90px 80px 90px', padding:'11px 10px', borderBottom:'1px solid #F3F4F6', alignItems:'center' },
  tableRowBest:{ background:'#F0FDF4' },
  td:          { fontSize:12, color:'#374151' },
  bestBadge:   { fontSize:9, background:'#059669', color:'#fff', fontWeight:700, padding:'1px 6px', borderRadius:20 },
  errBadge:    { fontSize:9, background:'#F3F4F6', color:'#9CA3AF', padding:'1px 6px', borderRadius:20 },
  note:        { fontSize:10, color:'#D1D5DB', padding:'8px 16px 0' },
};
