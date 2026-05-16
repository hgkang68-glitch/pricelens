// 📄 pages/index.js  — 4단계: 카테고리 → 상품선택 → 검색결과선택 → 가격비교

import { useState, useEffect } from "react";
import Nav from "../components/Nav";

const COSTCO_PRODUCTS = {
  "🥗 식품": [
    { id:1,  emoji:"🥜", name:"Kirkland 혼합 견과류",    query:"Kirkland 혼합견과류 1.13kg",          costco:22990, unit:"1.13kg" },
    { id:2,  emoji:"🫒", name:"Kirkland 올리브오일",      query:"Kirkland 엑스트라버진 올리브오일 3L", costco:34990, unit:"3L" },
    { id:3,  emoji:"🍫", name:"Kirkland 다크초콜릿",      query:"Kirkland 다크초콜릿 1.36kg",          costco:19900, unit:"1.36kg" },
    { id:4,  emoji:"🥚", name:"Kirkland 유기농 달걀",     query:"Kirkland 유기농 달걀 24구",            costco:9990,  unit:"24개" },
    { id:5,  emoji:"🫙", name:"Kirkland 버터",            query:"Kirkland 무염버터 1.36kg",            costco:21900, unit:"1.36kg" },
    { id:6,  emoji:"🥓", name:"Kirkland 베이컨",          query:"Kirkland 베이컨 1.36kg",              costco:18900, unit:"1.36kg" },
    { id:7,  emoji:"🧀", name:"Kirkland 파마산 치즈",     query:"Kirkland 파마산 치즈 1kg",            costco:16900, unit:"1kg" },
    { id:8,  emoji:"🫐", name:"Kirkland 냉동 블루베리",   query:"Kirkland 냉동 블루베리 1.36kg",       costco:12990, unit:"1.36kg" },
  ],
  "🧹 생활용품": [
    { id:9,  emoji:"🧻", name:"Kirkland 화장지 30롤",     query:"Kirkland 화장지 30롤",                costco:18900, unit:"30롤" },
    { id:10, emoji:"🧴", name:"Kirkland 알로에베라 젤",   query:"Kirkland 알로에베라 1L",              costco:12990, unit:"1L" },
    { id:11, emoji:"🫧", name:"Kirkland 세탁세제",        query:"Kirkland 액체 세탁세제 9L",           costco:24900, unit:"9L" },
    { id:12, emoji:"🪥", name:"Kirkland 치실",            query:"Kirkland 치실 3개입",                 costco:11900, unit:"3개입" },
    { id:13, emoji:"🛁", name:"Kirkland 바디워시",        query:"Kirkland 바디워시 1L",                costco:9900,  unit:"1L" },
    { id:14, emoji:"🧺", name:"Kirkland 지퍼백",          query:"Kirkland 지퍼백 대형",                costco:13900, unit:"150매" },
  ],
  "💊 건강기능식품": [
    { id:15, emoji:"🐟", name:"Kirkland 피쉬오일",        query:"Kirkland 오메가3 피쉬오일 400캡슐",  costco:28500, unit:"400캡슐" },
    { id:16, emoji:"🍊", name:"Kirkland 비타민C",         query:"Kirkland 비타민C 1000mg 500정",       costco:19900, unit:"500정" },
    { id:17, emoji:"⚡", name:"Kirkland 코엔자임Q10",     query:"Kirkland 코엔자임Q10 300mg",          costco:32900, unit:"100캡슐" },
    { id:18, emoji:"🦴", name:"Kirkland 칼슘+비타민D",    query:"Kirkland 칼슘 마그네슘 아연 500정",  costco:17900, unit:"500정" },
    { id:19, emoji:"🌿", name:"Kirkland 글루코사민",      query:"Kirkland 글루코사민 1500mg",          costco:24900, unit:"375정" },
    { id:20, emoji:"🔬", name:"Kirkland 아연",            query:"Kirkland 아연 50mg 400정",            costco:14900, unit:"400정" },
  ],
  "📱 전자제품": [
    { id:21, emoji:"🔋", name:"Kirkland 건전지 AA",       query:"Kirkland AA 알카라인 배터리 48개",    costco:14900, unit:"48개" },
    { id:22, emoji:"💡", name:"Feit LED 전구",            query:"Feit LED 전구 A19 60W",              costco:19900, unit:"10개입" },
    { id:23, emoji:"🖨️", name:"HP 복합기 잉크",           query:"HP 잉크 검정 컬러 세트",              costco:32900, unit:"3세트" },
  ],
  "👶 유아용품": [
    { id:24, emoji:"🍼", name:"Kirkland 분유",            query:"Kirkland 시밀락 분유",                costco:34900, unit:"1.36kg" },
    { id:25, emoji:"🧷", name:"Kirkland 기저귀",          query:"Kirkland 기저귀 대형",                costco:42900, unit:"180매" },
    { id:26, emoji:"🤲", name:"Kirkland 물티슈",          query:"Kirkland 순한 물티슈",                costco:16900, unit:"900매" },
  ],
};

const CATS = Object.keys(COSTCO_PRODUCTS);

const PLATFORM_INFO = {
  naver:    { label: "🔍 네이버 쇼핑", color: "#03C75A" },
  coupang:  { label: "🛒 쿠팡",        color: "#E8322A" },
  eleventh: { label: "1️⃣ 11번가",     color: "#FF6000" },
  gmarket:  { label: "🏪 G마켓",       color: "#1A6DFF" },
};

export default function Home() {
  const [cat,         setCat]         = useState(CATS[0]);
  const [costcoProd,  setCostcoProd]  = useState(null);
  const [searchData,  setSearchData]  = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selItem,     setSelItem]     = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [cmpLoading,  setCmpLoading]  = useState(false);
  const [saveStatus,  setSaveStatus]  = useState(null); // null | 'saving' | 'done' | 'err'
  const [dbProducts,  setDbProducts]  = useState([]);

  // DB 상품 목록 로드 (Supabase 연동 시 사용)
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbProducts(d) }).catch(() => {})
  }, []);

  async function handleSave() {
    if (!selItem || !compareData) return;
    setSaveStatus('saving');
    try {
      const dbProd = dbProducts.find(p => p.name === costcoProd?.name);
      const r = await fetch('/api/snapshots/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:   dbProd?.id || null,
          product_name: costcoProd?.name || selItem.title,
          category:     costcoProd?.cat || null,
          costco_price: costcoProd?.costco || null,
          naver:        compareData.naver,
          coupang:      compareData.coupang,
          eleventh:     compareData.eleventh,
          gmarket:      compareData.gmarket,
          winner:       compareData.winner,
        }),
      });
      if (!r.ok) throw new Error();
      setSaveStatus('done');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch { setSaveStatus('err'); setTimeout(() => setSaveStatus(null), 3000); }
  }

  // Step2 → Step3: 코스트코 상품 클릭 → 검색
  async function handleCostcoClick(product) {
    setCostcoProd(product);
    setSearchData(null);
    setSelItem(null);
    setCompareData(null);
    setSearchLoading(true);
    try {
      const res  = await fetch("/api/search/price-compare?query=" + encodeURIComponent(product.query));
      const data = await res.json();
      setSearchData(data);
    } catch (e) {
      setSearchData({ error: e.message });
    } finally {
      setSearchLoading(false);
    }
  }

  // Step3 → Step4: 개별 상품 클릭 → 가격 비교 표시
  function handleItemClick(item, platformId) {
    setSelItem({ ...item, platformId });
    // 이미 searchData에 모든 플랫폼 데이터 있음 → 그대로 표시
    setCompareData(searchData);
  }

  // 카테고리 변경
  function handleCatChange(c) {
    setCat(c);
    setCostcoProd(null);
    setSearchData(null);
    setSelItem(null);
    setCompareData(null);
  }

  const products = COSTCO_PRODUCTS[cat];

  // Step3용: 모든 플랫폼 검색결과 합치기
  const allSearchItems = searchData ? [
    ...(searchData.naver?.items   || []).map(i => ({ ...i, platformId: "naver" })),
    ...(searchData.coupang?.items || []).map(i => ({ ...i, platformId: "coupang" })),
    ...(searchData.eleventh?.items|| []).map(i => ({ ...i, platformId: "eleventh" })),
    ...(searchData.gmarket?.items || []).map(i => ({ ...i, platformId: "gmarket" })),
  ] : [];

  return (
    <div style={S.page}>
      {/* ── 헤더 ── */}
      <Nav active="compare" />

      {/* ── 카테고리 탭 ── */}
      <div style={S.catBar}>
        {CATS.map(c => (
          <button
            key={c}
            style={Object.assign({}, S.catTab, cat === c ? S.catTabOn : {})}
            onClick={() => handleCatChange(c)}
          >
            {c}
            <span style={Object.assign({}, S.catCnt, cat === c ? S.catCntOn : {})}>
              {COSTCO_PRODUCTS[c].length}
            </span>
          </button>
        ))}
      </div>

      {/* ── 단계 표시 ── */}
      <div style={S.steps}>
        {["카테고리", "상품 선택", "온라인 검색결과", "플랫폼 가격 비교"].map((s, i) => (
          <span key={i} style={S.stepWrap}>
            <span style={Object.assign({}, S.stepNum,
              i === 0 ? S.stepDone :
              i === 1 && costcoProd ? S.stepDone :
              i === 2 && searchData ? S.stepDone :
              i === 3 && selItem ? S.stepDone : S.stepTodo
            )}>{i + 1}</span>
            <span style={Object.assign({}, S.stepLbl,
              i === 0 || (i===1 && costcoProd) || (i===2 && searchData) || (i===3 && selItem)
                ? S.stepLblDone : S.stepLblTodo
            )}>{s}</span>
            {i < 3 && <span style={S.stepSep}>›</span>}
          </span>
        ))}
      </div>

      {/* ── 3단 레이아웃 ── */}
      <div style={S.body}>

        {/* 1열: 코스트코 상품 목록 */}
        <div style={S.col}>
          <div style={S.colHead}>코스트코 · {products.length}개</div>
          {products.map(p => (
            <div
              key={p.id}
              style={Object.assign({}, S.prodCard, costcoProd?.id === p.id ? S.prodCardOn : {})}
              onClick={() => handleCostcoClick(p)}
            >
              <div style={S.prodEmoji}>{p.emoji}</div>
              <div style={S.prodInfo}>
                <div style={S.prodName}>{p.name}</div>
                <div style={S.prodMeta}>
                  <span style={S.prodBadge}>코스트코</span>
                  <span style={S.prodPrice}>₩{p.costco.toLocaleString()}</span>
                  <span style={S.prodUnit}>{p.unit}</span>
                </div>
              </div>
              <span style={costcoProd?.id === p.id ? S.arrowOn : S.arrow}>
                {costcoProd?.id === p.id ? "▶" : "›"}
              </span>
            </div>
          ))}
        </div>

        {/* 2열: 온라인 검색결과 */}
        <div style={S.col}>
          <div style={S.colHead}>
            온라인 검색결과
            {costcoProd && <span style={S.colSub}> · {costcoProd.name}</span>}
          </div>

          {!costcoProd && (
            <div style={S.emptySmall}>← 상품을 선택하세요</div>
          )}

          {searchLoading && (
            <div style={S.emptySmall}>🔄 검색 중...</div>
          )}

          {!searchLoading && allSearchItems.length > 0 && (
            <>
              {/* 플랫폼별로 그룹핑해서 표시 */}
              {["naver","coupang","eleventh","gmarket"].map(pid => {
                const platItems = allSearchItems.filter(i => i.platformId === pid);
                if (!platItems.length) return null;
                const info = PLATFORM_INFO[pid];
                return (
                  <div key={pid}>
                    <div style={S.secLabel}>{info.label}</div>
                    {platItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={Object.assign({}, S.searchItem,
                          selItem && selItem.link === item.link ? S.searchItemOn : {}
                        )}
                        onClick={() => handleItemClick(item, pid)}
                      >
                        {item.image
                          ? <img src={item.image} alt="" style={S.searchImg} onError={e => e.target.style.display="none"} />
                          : <div style={S.searchImgEmpty}></div>
                        }
                        <div style={S.searchInfo}>
                          <div style={S.searchTitle}>{item.title}</div>
                          <div style={S.searchBottom}>
                            <span style={S.searchPrice}>₩{item.price.toLocaleString()}</span>
                            {item.isFreeShip
                              ? <span style={S.freeTag}>배송무료</span>
                              : <span style={S.shipTag}>+₩{item.shippingFee.toLocaleString()}</span>
                            }
                            {item.isRocket && <span style={S.rocketTag}>🚀</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 3열: 가격 비교 */}
        <div style={S.col3}>

          {/* 안내 */}
          {!selItem && !cmpLoading && (
            <div style={S.empty}>
              <div style={{ fontSize:36, marginBottom:10 }}>←</div>
              <div style={{ fontSize:14, color:"#555" }}>검색결과에서</div>
              <div style={{ fontSize:14, color:"#555" }}>상품을 선택하세요</div>
            </div>
          )}

          {/* 결과 */}
          {selItem && compareData && (
            <div>
              {/* ① 선택된 상품 헤더 */}
              <div style={S.selBox}>
                {selItem.image
                  ? <img src={selItem.image} alt="" style={S.selImg} onError={e => e.target.style.display="none"} />
                  : <div style={S.selImg}></div>
                }
                <div style={S.selInfo}>
                  <div style={S.selName}>{selItem.title}</div>
                  <div style={S.selMeta}>
                    <span style={Object.assign({}, S.selSrc, { background: PLATFORM_INFO[selItem.platformId]?.color + "22", color: PLATFORM_INFO[selItem.platformId]?.color })}>
                      {PLATFORM_INFO[selItem.platformId]?.label} 선택
                    </span>
                    <span style={S.selPrice}>₩{selItem.price.toLocaleString()}</span>
                    <span style={S.selCostco}>코스트코 ₩{costcoProd?.costco.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ② 최저가 배너 */}
              {compareData.winner && (
                <div style={S.winnerBox}>
                  <div style={S.winnerLeft}>
                    <span style={S.winnerBadge}>🏆 최저가 (배송비 포함)</span>
                    <span style={S.winnerName}>{compareData.winner.name}</span>
                    <span style={S.winnerPrice}>₩{compareData.winner.price.toLocaleString()}</span>
                  </div>
                  <div style={S.winnerRight}>
                    {compareData.winner.saving > 0 && (
                      <span style={S.chipGreen}>타 플랫폼보다 ₩{compareData.winner.saving.toLocaleString()} ↓</span>
                    )}
                    {costcoProd && compareData.winner.price < costcoProd.costco && (
                      <span style={S.chipGreen}>코스트코보다 ₩{(costcoProd.costco - compareData.winner.price).toLocaleString()} 저렴 🎉</span>
                    )}
                    {costcoProd && compareData.winner.price >= costcoProd.costco && (
                      <span style={S.chipGray}>코스트코가 더 저렴</span>
                    )}
                  </div>
                </div>
              )}

              {/* ③ 플랫폼별 가격 비교 테이블 */}
              <div style={S.table}>
                {/* 헤더 */}
                <div style={S.tableHead}>
                  <div style={S.th}>플랫폼</div>
                  <div style={Object.assign({}, S.th, S.thRight)}>상품가</div>
                  <div style={Object.assign({}, S.th, S.thRight)}>배송비</div>
                  <div style={Object.assign({}, S.th, S.thRight)}>총 결제액</div>
                </div>

                {/* 각 플랫폼 행 */}
                {["naver","coupang","eleventh","gmarket"].map(pid => {
                  const platData = compareData[pid];
                  const info     = PLATFORM_INFO[pid];
                  const isBest   = compareData.winner?.platform === pid;
                  const lowestItem = platData?.items?.[0];

                  return (
                    <div key={pid} style={Object.assign({}, S.tableRow, isBest ? S.tableRowBest : {})}>
                      <div style={S.td}>
                        <span style={S.tdName}>{info.label}</span>
                        {isBest && <span style={S.bestBadge}>최저가</span>}
                        {!platData || platData.error || !platData.items?.length
                          ? <span style={S.errBadge}>미연결</span>
                          : null
                        }
                      </div>
                      <div style={Object.assign({}, S.td, S.tdRight)}>
                        {lowestItem
                          ? <span style={isBest ? S.priceGreen : S.priceNorm}>₩{lowestItem.price.toLocaleString()}</span>
                          : <span style={S.priceNone}>—</span>
                        }
                      </div>
                      <div style={Object.assign({}, S.td, S.tdRight)}>
                        {lowestItem
                          ? lowestItem.isFreeShip
                            ? <span style={S.shipFree}>{lowestItem.isRocket ? "무료 🚀" : "무료"}</span>
                            : <span style={S.shipPaid}>₩{lowestItem.shippingFee.toLocaleString()}</span>
                          : <span style={S.priceNone}>—</span>
                        }
                      </div>
                      <div style={Object.assign({}, S.td, S.tdRight)}>
                        {lowestItem
                          ? <span style={isBest ? S.totalBest : S.totalNorm}>₩{lowestItem.total.toLocaleString()}</span>
                          : <span style={S.priceNone}>—</span>
                        }
                      </div>
                    </div>
                  );
                })}

                {/* 코스트코 기준행 */}
                {costcoProd && (
                  <div style={Object.assign({}, S.tableRow, S.tableRowCostco)}>
                    <div style={S.td}><span style={S.tdNameGray}>🏬 코스트코 (기준)</span></div>
                    <div style={Object.assign({}, S.td, S.tdRight)}><span style={S.priceGray}>₩{costcoProd.costco.toLocaleString()}</span></div>
                    <div style={Object.assign({}, S.td, S.tdRight)}><span style={S.priceGray}>직접구매</span></div>
                    <div style={Object.assign({}, S.td, S.tdRight)}><span style={S.priceGray}>₩{costcoProd.costco.toLocaleString()}</span></div>
                  </div>
                )}
              </div>

              <div style={S.note}>* 배송비는 판매자 조건·수량에 따라 달라질 수 있습니다</div>

              {/* 💾 저장 버튼 */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1E1E26', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  style={{
                    background: saveStatus === 'done' ? '#1A2A10' : saveStatus === 'err' ? '#2A0D0D' : '#C8F250',
                    color: saveStatus === 'done' ? '#C8F250' : saveStatus === 'err' ? '#E24B4A' : '#0D0D0F',
                    border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                  }}
                >
                  {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'done' ? '✓ 저장됨' : saveStatus === 'err' ? '저장 실패' : '💾 비교결과 저장'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────
const S = {
  page:      { minHeight:"100vh", background:"#0D0D0F", color:"#F0EDE8", fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif", display:"flex", flexDirection:"column" },
  topbar:    { height:48, borderBottom:"1px solid #1E1E26", display:"flex", alignItems:"center", gap:10, padding:"0 16px", flexShrink:0 },
  logo:      { fontSize:16, fontWeight:700 },
  logoSub:   { fontSize:11, color:"#444" },

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
  col3:      { overflowY:"auto", padding:"0" },
  colHead:   { fontSize:10, color:"#444", fontWeight:500, letterSpacing:".07em", textTransform:"uppercase", padding:"10px 12px 6px", borderBottom:"1px solid #111116", position:"sticky", top:0, background:"#0D0D0F" },
  colSub:    { fontSize:10, color:"#333", fontWeight:400, textTransform:"none", letterSpacing:0 },

  prodCard:  { display:"flex", gap:8, alignItems:"center", padding:"10px 12px", borderBottom:"1px solid #111116", cursor:"pointer", transition:"background .12s" },
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

  emptySmall:{ padding:"20px 12px", color:"#444", fontSize:12, textAlign:"center" },
  secLabel:  { fontSize:10, color:"#444", padding:"5px 12px 4px", borderBottom:"1px solid #111", borderTop:"1px solid #1A1A22" },

  searchItem:  { display:"flex", gap:8, alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #111116", cursor:"pointer", transition:"background .12s" },
  searchItemOn:{ background:"#1A1F0A", borderLeft:"2px solid #C8F250" },
  searchImg:   { width:38, height:38, borderRadius:5, objectFit:"cover", flexShrink:0, background:"#1E1E26" },
  searchImgEmpty:{ width:38, height:38, borderRadius:5, background:"#1E1E26", flexShrink:0 },
  searchInfo:  { flex:1, minWidth:0 },
  searchTitle: { fontSize:11, color:"#CCC", lineHeight:1.4, marginBottom:3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" },
  searchBottom:{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" },
  searchPrice: { fontSize:12, fontWeight:600, color:"#F0EDE8" },
  freeTag:     { fontSize:9, background:"#1E2A10", color:"#7FC850", padding:"1px 5px", borderRadius:3 },
  shipTag:     { fontSize:9, background:"#1E1E26", color:"#666", padding:"1px 5px", borderRadius:3 },
  rocketTag:   { fontSize:11 },

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
  thRight:   { textAlign:"right" },
  tableRow:  { display:"grid", gridTemplateColumns:"1fr 90px 80px 90px", padding:"11px 10px", borderBottom:"1px solid #111116", alignItems:"center" },
  tableRowBest:{ background:"#1A1F0A" },
  tableRowCostco:{ background:"#0D0D10", opacity:0.7 },
  td:        { display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" },
  tdRight:   { justifyContent:"flex-end" },
  tdName:    { fontSize:12, fontWeight:500, color:"#DDD" },
  tdNameGray:{ fontSize:12, fontWeight:400, color:"#444" },
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
  note:      { fontSize:10, color:"#333", padding:"8px 16px 16px" },
};
