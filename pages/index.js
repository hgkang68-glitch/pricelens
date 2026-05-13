// 📄 pages/index.js  — 3단 레이아웃: 카테고리 | 상품목록 | 가격비교

import { useState } from "react";

const COSTCO_PRODUCTS = {
  "🥗 식품": [
    { id:1,  emoji:"🥜", name:"Kirkland 혼합 견과류",     query:"Kirkland 혼합견과류 1.13kg",          costco:22990, unit:"1.13kg" },
    { id:2,  emoji:"🫒", name:"Kirkland 올리브오일",       query:"Kirkland 엑스트라버진 올리브오일 3L", costco:34990, unit:"3L" },
    { id:3,  emoji:"🍫", name:"Kirkland 다크초콜릿",       query:"Kirkland 다크초콜릿 1.36kg",          costco:19900, unit:"1.36kg" },
    { id:4,  emoji:"🥚", name:"Kirkland 유기농 달걀",      query:"Kirkland 유기농 달걀 24구",            costco:9990,  unit:"24개" },
    { id:5,  emoji:"🫙", name:"Kirkland 버터",             query:"Kirkland 무염버터 1.36kg",            costco:21900, unit:"1.36kg" },
    { id:6,  emoji:"🥓", name:"Kirkland 베이컨",           query:"Kirkland 베이컨 1.36kg",              costco:18900, unit:"1.36kg" },
    { id:7,  emoji:"🧀", name:"Kirkland 파마산 치즈",      query:"Kirkland 파마산 치즈 1kg",            costco:16900, unit:"1kg" },
    { id:8,  emoji:"🫐", name:"Kirkland 냉동 블루베리",    query:"Kirkland 냉동 블루베리 1.36kg",       costco:12990, unit:"1.36kg" },
  ],
  "🧹 생활용품": [
    { id:9,  emoji:"🧻", name:"Kirkland 화장지 30롤",      query:"Kirkland 화장지 30롤",                costco:18900, unit:"30롤" },
    { id:10, emoji:"🧴", name:"Kirkland 알로에베라 젤",    query:"Kirkland 알로에베라 1L",              costco:12990, unit:"1L" },
    { id:11, emoji:"🫧", name:"Kirkland 세탁세제",         query:"Kirkland 액체 세탁세제 9L",           costco:24900, unit:"9L" },
    { id:12, emoji:"🪥", name:"Kirkland 치실",             query:"Kirkland 치실 3개입",                 costco:11900, unit:"3개입" },
    { id:13, emoji:"🛁", name:"Kirkland 바디워시",         query:"Kirkland 바디워시 1L",                costco:9900,  unit:"1L" },
    { id:14, emoji:"🧺", name:"Kirkland 지퍼백",           query:"Kirkland 지퍼백 대형",                costco:13900, unit:"150매" },
  ],
  "💊 건강기능식품": [
    { id:15, emoji:"🐟", name:"Kirkland 피쉬오일",         query:"Kirkland 오메가3 피쉬오일 400캡슐",  costco:28500, unit:"400캡슐" },
    { id:16, emoji:"🍊", name:"Kirkland 비타민C",          query:"Kirkland 비타민C 1000mg 500정",       costco:19900, unit:"500정" },
    { id:17, emoji:"⚡", name:"Kirkland 코엔자임Q10",      query:"Kirkland 코엔자임Q10 300mg",          costco:32900, unit:"100캡슐" },
    { id:18, emoji:"🦴", name:"Kirkland 칼슘+비타민D",     query:"Kirkland 칼슘 마그네슘 아연 500정",  costco:17900, unit:"500정" },
    { id:19, emoji:"🌿", name:"Kirkland 글루코사민",       query:"Kirkland 글루코사민 1500mg",          costco:24900, unit:"375정" },
    { id:20, emoji:"🔬", name:"Kirkland 아연",             query:"Kirkland 아연 50mg 400정",            costco:14900, unit:"400정" },
  ],
  "📱 전자제품": [
    { id:21, emoji:"🔋", name:"Kirkland 건전지 AA",        query:"Kirkland AA 알카라인 배터리 48개",    costco:14900, unit:"48개" },
    { id:22, emoji:"💡", name:"Feit LED 전구",             query:"Feit LED 전구 A19 60W",              costco:19900, unit:"10개입" },
    { id:23, emoji:"🖨️", name:"HP 복합기 잉크",            query:"HP 잉크 검정 컬러 세트",              costco:32900, unit:"3세트" },
  ],
  "👶 유아용품": [
    { id:24, emoji:"🍼", name:"Kirkland 분유",             query:"Kirkland 시밀락 분유",                costco:34900, unit:"1.36kg" },
    { id:25, emoji:"🧷", name:"Kirkland 기저귀",           query:"Kirkland 기저귀 대형",                costco:42900, unit:"180매" },
    { id:26, emoji:"🤲", name:"Kirkland 물티슈",           query:"Kirkland 순한 물티슈",                costco:16900, unit:"900매" },
  ],
};

const CATEGORIES = Object.keys(COSTCO_PRODUCTS);

export default function Home() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0]);
  const [selected,  setSelected]  = useState(null);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  function selectCat(cat) {
    setActiveCat(cat);
    setSelected(null);
    setResult(null);
    setError(null);
  }

  async function selectProduct(product) {
    setSelected(product);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/search/price-compare?query=" + encodeURIComponent(product.query));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const products = COSTCO_PRODUCTS[activeCat];

  return (
    <div style={S.page}>
      {/* ── 헤더 ── */}
      <div style={S.topbar}>
        <span style={S.logo}>🏷️ PriceLens</span>
        <span style={S.logoSub}>코스트코 × 온라인 가격 비교</span>
      </div>

      <div style={S.layout}>

        {/* ── 1열: 카테고리 ── */}
        <div style={S.col1}>
          <div style={S.colTitle}>카테고리</div>
          {CATEGORIES.map(cat => (
            <div
              key={cat}
              style={Object.assign({}, S.catItem, activeCat === cat ? S.catItemActive : {})}
              onClick={() => selectCat(cat)}
            >
              <span style={S.catLabel}>{cat}</span>
              <span style={Object.assign({}, S.catCount, activeCat === cat ? S.catCountActive : {})}>
                {COSTCO_PRODUCTS[cat].length}
              </span>
            </div>
          ))}
        </div>

        {/* ── 2열: 상품 목록 ── */}
        <div style={S.col2}>
          <div style={S.colTitle}>{activeCat} 상품 <span style={S.colSub}>{products.length}개</span></div>
          {products.map(product => (
            <div
              key={product.id}
              style={Object.assign({}, S.productItem, selected && selected.id === product.id ? S.productItemActive : {})}
              onClick={() => selectProduct(product)}
            >
              <span style={S.pEmoji}>{product.emoji}</span>
              <div style={S.pInfo}>
                <div style={S.pName}>{product.name}</div>
                <div style={S.pMeta}>
                  <span style={S.pUnit}>{product.unit}</span>
                  <span style={S.pPrice}>₩{product.costco.toLocaleString()}</span>
                </div>
              </div>
              <span style={S.pArrow}>{selected && selected.id === product.id ? "▶" : "›"}</span>
            </div>
          ))}
        </div>

        {/* ── 3열: 가격 비교 결과 ── */}
        <div style={S.col3}>
          {/* 빈 상태 */}
          {!selected && (
            <div style={S.empty}>
              <div style={S.emptyIcon}>👈</div>
              <div style={S.emptyText}>상품을 선택하면</div>
              <div style={S.emptyText}>온라인 가격을 비교합니다</div>
            </div>
          )}

          {/* 로딩 */}
          {selected && loading && (
            <div style={S.empty}>
              <div style={S.emptyIcon}>⏳</div>
              <div style={S.emptyText}>가격 비교 중...</div>
              <div style={{ fontSize:13, color:"#555", marginTop:8 }}>{selected.name}</div>
            </div>
          )}

          {/* 에러 */}
          {error && <div style={S.errorBox}>⚠️ {error}</div>}

          {/* 결과 */}
          {result && selected && !loading && (
            <div>
              {/* 상품 헤더 */}
              <div style={S.resultTop}>
                <span style={{ fontSize:28 }}>{selected.emoji}</span>
                <div>
                  <div style={S.resultName}>{selected.name}</div>
                  <div style={S.resultUnit}>
                    코스트코 ₩{selected.costco.toLocaleString()} · {selected.unit}
                  </div>
                </div>
              </div>

              {/* 최저가 배너 */}
              {result.winner && (
                <div style={S.winnerBox}>
                  <div style={S.winnerLeft}>
                    <span style={S.winnerBadge}>🏆 최저가</span>
                    <span style={S.winnerName}>{result.winner.name}</span>
                    <span style={S.winnerPrice}>₩{result.winner.price.toLocaleString()}</span>
                  </div>
                  <div style={S.winnerRight}>
                    {result.winner.saving > 0 && (
                      <span style={S.savingChip}>타 플랫폼보다 ₩{result.winner.saving.toLocaleString()} ↓</span>
                    )}
                    {result.winner.price < selected.costco && (
                      <span style={S.savingChip2}>코스트코보다 ₩{(selected.costco - result.winner.price).toLocaleString()} 저렴 🎉</span>
                    )}
                    {result.winner.price >= selected.costco && (
                      <span style={S.expChip}>코스트코가 더 저렴</span>
                    )}
                  </div>
                </div>
              )}

              {/* 플랫폼별 결과 */}
              <PlatformCard
                name="🔍 네이버 쇼핑"
                color="#03C75A"
                data={result.naver}
                isWinner={result.winner && result.winner.platform === "naver"}
              />
              <PlatformCard
                name="🛒 쿠팡"
                color="#E8322A"
                data={result.coupang}
                isWinner={result.winner && result.winner.platform === "coupang"}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function PlatformCard({ name, color, data, isWinner }) {
  return (
    <div style={Object.assign({}, S.platCard, isWinner ? { borderColor: color } : {})}>
      <div style={S.platHeader}>
        <span style={S.platName}>{name}</span>
        {isWinner && <span style={Object.assign({}, S.platBadge, { background: color })}>최저가 ✓</span>}
        {data.lowestPrice && (
          <span style={S.platLowest}>최저 ₩{data.lowestPrice.toLocaleString()}</span>
        )}
      </div>
      {data.error && (
        <div style={S.platError}>API 키 미설정 또는 오류</div>
      )}
      {data.items && data.items.map(function(item, i) {
        return (
          <a key={i} href={item.link} target="_blank" rel="noreferrer" style={S.itemRow}>
            {item.image && <img src={item.image} alt="" style={S.itemImg} />}
            <div style={S.itemBody}>
              <div style={S.itemTitle}>{item.title}</div>
              <div style={S.itemPrice}>₩{item.price && item.price.toLocaleString()}</div>
              {item.isRocket && <span style={S.rocketTag}>🚀 로켓배송</span>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

const S = {
  page:    { minHeight:"100vh", background:"#0D0D0F", color:"#F0EDE8", fontFamily:"system-ui,-apple-system,'Noto Sans KR',sans-serif", display:"flex", flexDirection:"column" },
  topbar:  { height:52, borderBottom:"1px solid #1E1E26", display:"flex", alignItems:"center", gap:10, padding:"0 20px", flexShrink:0 },
  logo:    { fontSize:17, fontWeight:700 },
  logoSub: { fontSize:12, color:"#444" },
  layout:  { display:"grid", gridTemplateColumns:"180px 280px 1fr", flex:1, minHeight:0 },

  /* 1열 카테고리 */
  col1:          { borderRight:"1px solid #1E1E26", padding:"16px 0", overflowY:"auto" },
  colTitle:      { fontSize:11, color:"#444", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", padding:"0 16px 10px" },
  colSub:        { fontSize:12, color:"#555", fontWeight:400 },
  catItem:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px", cursor:"pointer", fontSize:13, color:"#666", transition:"all 0.12s" },
  catItemActive: { background:"#1A1F0A", color:"#C8F250", borderLeft:"2px solid #C8F250" },
  catLabel:      { flex:1 },
  catCount:      { fontSize:11, background:"#1E1E26", color:"#555", padding:"2px 7px", borderRadius:10 },
  catCountActive:{ background:"#243010", color:"#C8F250" },

  /* 2열 상품목록 */
  col2:            { borderRight:"1px solid #1E1E26", padding:"16px 0", overflowY:"auto" },
  productItem:     { display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", transition:"background 0.12s", borderBottom:"1px solid #111118" },
  productItemActive:{ background:"#1A1F0A", borderLeft:"2px solid #C8F250" },
  pEmoji:          { fontSize:20, flexShrink:0, width:28, textAlign:"center" },
  pInfo:           { flex:1, minWidth:0 },
  pName:           { fontSize:13, fontWeight:500, color:"#DDD", marginBottom:3, lineHeight:1.3 },
  pMeta:           { display:"flex", gap:6, alignItems:"center" },
  pUnit:           { fontSize:11, color:"#444" },
  pPrice:          { fontSize:12, fontWeight:600, color:"#F0EDE8" },
  pArrow:          { color:"#333", fontSize:16, flexShrink:0 },

  /* 3열 결과 */
  col3:       { padding:"20px", overflowY:"auto" },
  empty:      { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh" },
  emptyIcon:  { fontSize:40, marginBottom:12 },
  emptyText:  { fontSize:14, color:"#555" },
  errorBox:   { background:"#1A0D0D", border:"1px solid #4A1B1B", borderRadius:10, padding:14, color:"#E24B4A", fontSize:13, marginBottom:14 },

  resultTop:  { display:"flex", alignItems:"center", gap:14, marginBottom:16, paddingBottom:16, borderBottom:"1px solid #1E1E26" },
  resultName: { fontSize:16, fontWeight:600, color:"#F0EDE8", marginBottom:4 },
  resultUnit: { fontSize:12, color:"#555" },

  winnerBox:   { background:"#1A1F0A", border:"1px solid #C8F250", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 },
  winnerLeft:  { display:"flex", alignItems:"center", gap:10 },
  winnerRight: { display:"flex", gap:6, flexWrap:"wrap" },
  winnerBadge: { background:"#C8F250", color:"#0D0D0F", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 },
  winnerName:  { fontSize:14, fontWeight:600, color:"#F0EDE8" },
  winnerPrice: { fontSize:18, fontWeight:700, color:"#C8F250" },
  savingChip:  { background:"#1E2A10", color:"#7FC850", fontSize:11, padding:"3px 10px", borderRadius:20 },
  savingChip2: { background:"#1A2E10", color:"#C8F250", fontSize:11, padding:"3px 10px", borderRadius:20 },
  expChip:     { background:"#1E1E26", color:"#888", fontSize:11, padding:"3px 10px", borderRadius:20 },

  platCard:    { background:"#14141A", border:"1px solid #1E1E26", borderRadius:10, padding:14, marginBottom:12 },
  platHeader:  { display:"flex", alignItems:"center", gap:8, marginBottom:10 },
  platName:    { fontSize:14, fontWeight:600 },
  platBadge:   { color:"#0D0D0F", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 },
  platLowest:  { marginLeft:"auto", fontSize:12, color:"#C8F250", fontWeight:600 },
  platError:   { fontSize:12, color:"#555", padding:"8px 0" },

  itemRow:   { display:"flex", gap:10, padding:"10px 0", borderTop:"1px solid #1A1A22", textDecoration:"none", color:"inherit", alignItems:"flex-start" },
  itemImg:   { width:54, height:54, objectFit:"cover", borderRadius:6, flexShrink:0, background:"#1E1E26" },
  itemBody:  { flex:1, minWidth:0 },
  itemTitle: { fontSize:12, lineHeight:1.5, color:"#AAA", marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" },
  itemPrice: { fontSize:14, fontWeight:600, color:"#F0EDE8" },
  rocketTag: { display:"inline-block", marginTop:3, fontSize:10, background:"#1A1F0A", color:"#C8F250", padding:"1px 6px", borderRadius:4 },
};
