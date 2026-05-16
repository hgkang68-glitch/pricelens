// 📄 pages/index.js — DB에서 상품 불러오기 + 4단계 가격비교

import { useState, useEffect } from "react";
import Nav from "../components/Nav";

const PLATFORM_INFO = {
  naver:    { label: "🔍 네이버 쇼핑", color: "#03C75A" },
  coupang:  { label: "🛒 쿠팡",        color: "#E8322A" },
  eleventh: { label: "1️⃣ 11번가",     color: "#FF6000" },
  gmarket:  { label: "🏪 G마켓",       color: "#1A6DFF" },
};

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [cat,         setCat]         = useState("");
  const [cats,        setCats]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [costcoProd,  setCostcoProd]  = useState(null);
  const [searchData,  setSearchData]  = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selItem,     setSelItem]     = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [saveStatus,  setSaveStatus]  = useState(null);

  // DB에서 상품 불러오기
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllProducts(data);
          // 카테고리 추출
          const uniqueCats = [...new Set(data.map(p => p.category))];
          setCats(uniqueCats);
          if (uniqueCats.length) setCat(uniqueCats[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const products = allProducts.filter(p => p.category === cat);

  function selectCat(c) {
    setCat(c);
    setCostcoProd(null);
    setSearchData(null);
    setSelItem(null);
    setSaveStatus(null);
  }

  async function handleCostcoClick(product) {
    setCostcoProd(product);
    setSearchData(null);
    setSelItem(null);
    setSaveStatus(null);
    setSearchLoading(true);
    try {
      const res  = await fetch("/api/search/price-compare?query=" + encodeURIComponent(product.search_query));
      const data = await res.json();
      setSearchData(data);
    } catch (e) { console.error(e); }
    setSearchLoading(false);
  }

  function handleItemClick(item, platformId) {
    setSelItem({ ...item, platformId });
    setCompareData(searchData);
  }

  async function handleSave() {
    if (!selItem || !compareData) return;
    setSaveStatus("saving");
    try {
      const r = await fetch("/api/snapshots/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id:   costcoProd?.id || null,
          product_name: costcoProd?.name || selItem.title,
          category:     costcoProd?.category || null,
          costco_price: costcoProd?.costco_price || null,
          naver:        compareData.naver,
          coupang:      compareData.coupang,
          eleventh:     compareData.eleventh,
          gmarket:      compareData.gmarket,
          winner:       compareData.winner,
        }),
      });
      if (!r.ok) throw new Error();
      setSaveStatus("done");
      setTimeout(() => setSaveStatus(null), 3000);
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
            {c}
            <span style={{ ...S.catCnt, ...(cat === c ? S.catCntOn : {}) }}>
              {allProducts.filter(p => p.category === c).length}
            </span>
          </button>
        ))}
      </div>

      {/* 단계 표시 */}
      <div style={S.steps}>
        {["카테고리", "상품 선택", "온라인 검색결과", "플랫폼 가격 비교"].map((s, i) => (
          <span key={i} style={S.stepWrap}>
            <span style={{ ...S.stepNum, ...(
              i === 0 || (i===1 && costcoProd) || (i===2 && searchData) || (i===3 && selItem)
                ? S.stepDone : S.stepTodo
            )}}>{i + 1}</span>
            <span style={{ ...S.stepLbl, ...(
              i === 0 || (i===1 && costcoProd) || (i===2 && searchData) || (i===3 && selItem)
                ? S.stepLblDone : S.stepLblTodo
            )}}>{s}</span>
            {i < 3 && <span style={S.stepSep}>›</span>}
          </span>
        ))}
      </div>

      {/* 3단 레이아웃 */}
      <div style={S.body}>

        {/* 1열: 코스트코 상품 */}
        <div style={S.col}>
          <div style={S.colHead}>코스트코 · {products.length}개</div>
          {loading && <div style={S.emptySmall}>불러오는 중...</div>}
          {!loading && products.length === 0 && (
            <div style={S.emptySmall}>상품이 없습니다.<br/>관리자 페이지에서 등록해주세요.</div>
          )}
          {products.map(p => (
            <div key={p.id} style={{ ...S.prodCard, ...(costcoProd?.id === p.id ? S.prodCardOn : {}) }} onClick={() => handleCostcoClick(p)}>
              <div style={S.prodEmoji}>{p.emoji}</div>
              <div style={S.prodInfo}>
                <div style={S.prodName}>{p.name}</div>
                <div style={S.prodMeta}>
                  <span style={S.prodBadge}>코스트코</span>
                  <span style={S.prodPrice}>₩{p.costco_price?.toLocaleString()}</span>
                  <span style={S.prodUnit}>{p.unit}</span>
                </div>
              </div>
              <span style={costcoProd?.id === p.id ? S.arrowOn : S.arrow}>{costcoProd?.id === p.id ? "▶" : "›"}</span>
            </div>
          ))}
        </div>

        {/* 2열: 온라인 검색결과 */}
        <div style={S.col}>
          <div style={S.colHead}>
            온라인 검색결과
            {costcoProd && <span style={S.colSub}> · {costcoProd.name}</span>}
          </div>
          {!costcoProd && <div style={S.emptySmall}>← 상품을 선택하세요</div>}
          {searchLoading && <div style={S.emptySmall}>🔄 검색 중...</div>}
          {!searchLoading && allSearchItems.length > 0 && (
            ["naver","coupang","eleventh","gmarket"].map(pid => {
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
                          {item.isFreeShip ? <span style={S.freeTag}>배송무료</span> : <span style={S.shipTag}>+₩{item.shippingFee?.toLocaleString()}</span>}
                          {item.isRocket && <span>🚀</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* 3열: 가격 비교 */}
        <div style={S.col3}>
          {!selItem && <div style={S.empty}><div style={{ fontSize:36, marginBottom:10 }}>←</div><div style={{ fontSize:14, color:"#555" }}>검색결과에서 상품을 선택하세요</div></div>}

          {selItem && compareData && (
            <div>
              {/* 선택된 상품 */}
              <div style={S.selBox}>
                {selItem.image && <img src={selItem.image} alt="" style={S.selImg} onError={e => e.target.style.display="none"} />}
                <div style={S.selInfo}>
                  <div style={S.selName}>{selItem.title}</div>
                  <div style={S.selMeta}>
                    <span style={{ ...S.selSrc, background: PLATFORM_INFO[selItem.platformId]?.color + "22", color: PLATFORM_INFO[selItem.platformId]?.color }}>
                      {PLATFORM_INFO[selItem.platformId]?.label} 선택
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
                    <span style={S.winnerBadge}>🏆 최저가 (배송비 포함)</span>
                    <span style={S.winnerName}>{compareData.winner.name}</span>
                    <span style={S.winnerPrice}>₩{compareData.winner.price?.toLocaleString()}</span>
                  </div>
                  <div style={S.winnerRight}>
                    {compareData.winner.saving > 0 && <span style={S.chipGreen}>타 플랫폼보다 ₩{compareData.winner.saving?.toLocaleString()} ↓</span>}
                    {costcoProd && compareData.winner.price < costcoProd.costco_price && <span style={S.chipGreen}>코스트코보다 ₩{(costcoProd.costco_price - compareData.winner.price)?.toLocaleString()} 저렴 🎉</span>}
                    {costcoProd && compareData.winner.price >= costcoProd.costco_price && <span style={S.chipGray}>코스트코가 더 저렴</span>}
                  </div>
                </div>
              )}

              {/* 비교 테이블 */}
              <div style={S.table}>
                <div style={S.tableHead}>
                  <div style={S.th}>플랫폼</div>
                  <div style={{ ...S.th, textAlign:"right" }}>상품가</div>
                  <div style={{ ...S.th, textAlign:"right" }}>배송비</div>
                  <div style={{ ...S.th, textAlign:"right" }}>총 결제액</div>
                </div>

                {["naver","coupang","eleventh","gmarket"].map(pid => {
                  const platData = compareData[pid];
                  const isBest   = compareData.winner?.platform === pid;
                  const item     = platData?.items?.[0];
                  return (
                    <div key={pid} style={{ ...S.tableRow, ...(isBest ? S.tableRowBest : {}) }}>
                      <div style={{ ...S.td, display:"flex", alignItems:"center", gap:5 }}>
                        <span style={S.tdName}>{PLATFORM_INFO[pid].label}</span>
                        {isBest && <span style={S.bestBadge}>최저가</span>}
                        {(!platData || platData.error || !platData.items?.length) && <span style={S.errBadge}>미연결</span>}
                      </div>
                      <div style={{ ...S.td, textAlign:"right" }}>
                        {item ? <span style={isBest ? S.priceGreen : S.priceNorm}>₩{item.price?.toLocaleString()}</span> : <span style={S.priceNone}>—</span>}
                      </div>
                      <div style={{ ...S.td, textAlign:"right" }}>
                        {item ? (item.isFreeShip ? <span style={S.shipFree}>{item.isRocket ? "무료 🚀" : "무료"}</span> : <span style={S.shipPaid}>₩{item.shippingFee?.toLocaleString()}</span>) : <span style={S.priceNone}>—</span>}
                      </div>
                      <div style={{ ...S.td, textAlign:"right" }}>
                        {item ? <span style={isBest ? S.totalBest : S.totalNorm}>₩{item.total?.toLocaleString()}</span> : <span style={S.priceNone}>—</span>}
                      </div>
                    </div>
                  );
                })}

                {costcoProd && (
                  <div style={{ ...S.tableRow, background:"#0D0D10", opacity:0.7 }}>
                    <div style={S.td}><span style={{ ...S.tdName, color:"#444" }}>🏬 코스트코 (기준)</span></div>
                    <div style={{ ...S.td, textAlign:"right" }}><span style={S.priceGray}>₩{costcoProd.costco_price?.toLocaleString()}</span></div>
                    <div style={{ ...S.td, textAlign:"right" }}><span style={S.priceGray}>직접구매</span></div>
                    <div style={{ ...S.td, textAlign:"right" }}><span style={S.priceGray}>₩{costcoProd.costco_price?.toLocaleString()}</span></div>
                  </div>
                )}
              </div>

              <div style={S.note}>* 배송비는 판매자 조건·수량에 따라 달라질 수 있습니다</div>

              {/* 저장 버튼 */}
              <div style={{ padding:"12px 16px", borderTop:"1px solid #1E1E26", display:"flex", justifyContent:"flex-end" }}>
                <button onClick={handleSave} disabled={saveStatus === "saving"} style={{
                  background: saveStatus === "done" ? "#1A2A10" : saveStatus === "err" ? "#2A0D0D" : "#C8F250",
                  color: saveStatus === "done" ? "#C8F250" : saveStatus === "err" ? "#E24B4A" : "#0D0D0F",
                  border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {saveStatus === "saving" ? "저장 중..." : saveStatus === "done" ? "✓ 저장됨" : saveStatus === "err" ? "저장 실패" : "💾 비교결과 저장"}
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
  page:      { minHeight:"100vh", background:"#0D0D0F", color:"#F0EDE8", fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif", display:"flex", flexDirection:"column" },
  catBar:    { borderBottom:"1px solid #1E1E26", display:"flex", padding:"0 16px", flexShrink:0, overflowX:"auto" },
  catTab:    { background:"none", border:"none", color:"#555", padding:"10px 14px", cursor:"pointer", fontSize:13, borderBottom:"2px solid transparent", marginBottom:-1, display:"flex", alignItems:"center", gap:5, fontFamily:"inherit", whiteSpace:"nowrap" },
  catTabOn:  { color:"#C8F250", borderBottom:"2px solid #C8F250" },
  catCnt:    { fontSize:10, background:"#1E1E26", color:"#555", padding:"1px 6px", borderRadius:10 },
  catCntOn:  { background:"#1E2A10", color:"#C8F250" },
  steps:     { display:"flex", alignItems:"center", gap:2, padding:"7px 16px", borderBottom:"1px solid #111", flexShrink:0, flexWrap:"wrap" },
  stepWrap:  { display:"flex", alignItems:"center", gap:4 },
  stepNum:   { width:17, height:17, borderRadius:"50%", fontSize:9, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  stepDone:  { background:"#C8F250", color:"#0D0D0F" },
  stepTodo:  { background:"#1E1E26", color:"#555" },
  stepLbl:   { fontSize:11 },
  stepLblDone:{ color:"#888" },
  stepLblTodo:{ color:"#333" },
  stepSep:   { color:"#2A2A30", fontSize:13, margin:"0 2px" },
  body:      { display:"grid", gridTemplateColumns:"200px 240px 1fr", flex:1, minHeight:0, overflow:"hidden" },
  col:       { borderRight:"1px solid #1E1E26", overflowY:"auto" },
  col3:      { overflowY:"auto" },
  colHead:   { fontSize:10, color:"#444", fontWeight:500, letterSpacing:".07em", textTransform:"uppercase", padding:"10px 12px 6px", borderBottom:"1px solid #111116", position:"sticky", top:0, background:"#0D0D0F" },
  colSub:    { fontSize:10, color:"#333", fontWeight:400, textTransform:"none", letterSpacing:0 },
  emptySmall:{ padding:"20px 12px", color:"#444", fontSize:12, textAlign:"center", lineHeight:1.8 },
  secLabel:  { fontSize:10, color:"#444", padding:"5px 12px 4px", borderBottom:"1px solid #111", borderTop:"1px solid #1A1A22" },
  prodCard:  { display:"flex", gap:8, alignItems:"center", padding:"10px 12px", borderBottom:"1px solid #111116", cursor:"pointer" },
  prodCardOn:{ background:"#1A1F0A", borderLeft:"2px solid #C8F250" },
  prodEmoji: { fontSize:18, flexShrink:0, width:30, textAlign:"center" },
  prodInfo:  { flex:1, minWidth:0 },
  prodName:  { fontSize:11, fontWeight:500, color:"#DDD", marginBottom:2, lineHeight:1.3 },
  prodMeta:  { display:"flex", gap:5, alignItems:"center" },
  prodBadge: { fontSize:9, background:"#1E1E26", color:"#555", padding:"1px 5px", borderRadius:3 },
  prodPrice: { fontSize:11, fontWeight:500, color:"#F0EDE8" },
  prodUnit:  { fontSize:10, color:"#444" },
  arrow:     { color:"#2A2A30", fontSize:13, flexShrink:0 },
  arrowOn:   { color:"#C8F250", fontSize:13, flexShrink:0 },
  searchItem:  { display:"flex", gap:8, alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #111116", cursor:"pointer" },
  searchItemOn:{ background:"#1A1F0A", borderLeft:"2px solid #C8F250" },
  searchImg:   { width:38, height:38, borderRadius:5, objectFit:"cover", flexShrink:0, background:"#1E1E26" },
  searchImgEmpty:{ width:38, height:38, borderRadius:5, background:"#1E1E26", flexShrink:0 },
  searchInfo:  { flex:1, minWidth:0 },
  searchTitle: { fontSize:11, color:"#CCC", lineHeight:1.4, marginBottom:3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" },
  searchBottom:{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" },
  searchPrice: { fontSize:12, fontWeight:600, color:"#F0EDE8" },
  freeTag:     { fontSize:9, background:"#1E2A10", color:"#7FC850", padding:"1px 5px", borderRadius:3 },
  shipTag:     { fontSize:9, background:"#1E1E26", color:"#666", padding:"1px 5px", borderRadius:3 },
  empty:     { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:4 },
  selBox:    { display:"flex", gap:12, alignItems:"flex-start", padding:"14px 16px", borderBottom:"1px solid #1E1E26", background:"#14141A" },
  selImg:    { width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0, background:"#1E1E26" },
  selInfo:   { flex:1, minWidth:0 },
  selName:   { fontSize:13, fontWeight:500, color:"#F0EDE8", marginBottom:5, lineHeight:1.4 },
  selMeta:   { display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" },
  selSrc:    { fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:4 },
  selPrice:  { fontSize:13, fontWeight:600, color:"#C8F250" },
  selCostco: { fontSize:11, color:"#444" },
  winnerBox:   { background:"#1A1F0A", border:"1px solid #C8F250", borderRadius:8, margin:"12px 16px", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" },
  winnerLeft:  { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  winnerRight: { display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" },
  winnerBadge: { background:"#C8F250", color:"#0D0D0F", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 },
  winnerName:  { fontSize:13, fontWeight:500, color:"#F0EDE8" },
  winnerPrice: { fontSize:18, fontWeight:700, color:"#C8F250" },
  chipGreen:   { fontSize:10, background:"#1E2A10", color:"#7FC850", padding:"2px 9px", borderRadius:20 },
  chipGray:    { fontSize:10, background:"#1E1E26", color:"#666", padding:"2px 9px", borderRadius:20 },
  table:     { margin:"12px 16px" },
  tableHead: { display:"grid", gridTemplateColumns:"1fr 90px 80px 90px", padding:"6px 10px", borderBottom:"1px solid #1E1E26" },
  th:        { fontSize:10, color:"#444", fontWeight:500 },
  tableRow:  { display:"grid", gridTemplateColumns:"1fr 90px 80px 90px", padding:"11px 10px", borderBottom:"1px solid #111116", alignItems:"center" },
  tableRowBest:{ background:"#1A1F0A" },
  td:        { fontSize:12 },
  tdName:    { fontSize:12, fontWeight:500, color:"#DDD" },
  bestBadge: { fontSize:9, background:"#C8F250", color:"#0D0D0F", fontWeight:700, padding:"1px 6px", borderRadius:20 },
  errBadge:  { fontSize:9, background:"#1E1E26", color:"#555", padding:"1px 6px", borderRadius:20 },
  priceGreen:{ fontSize:13, fontWeight:600, color:"#C8F250" },
  priceNorm: { fontSize:13, fontWeight:600, color:"#F0EDE8" },
  priceGray: { fontSize:12, color:"#444" },
  priceNone: { fontSize:13, color:"#333" },
  shipFree:  { fontSize:11, color:"#7FC850" },
  shipPaid:  { fontSize:11, color:"#888" },
  totalBest: { fontSize:14, fontWeight:700, color:"#C8F250" },
  totalNorm: { fontSize:13, fontWeight:500, color:"#F0EDE8" },
  note:      { fontSize:10, color:"#333", padding:"8px 16px 0" },
};
