// 📄 pages/index.js
// 코스트코 카테고리별 상품 목록 → 클릭하면 네이버+쿠팡 가격 자동 비교

import { useState } from "react";

const COSTCO_PRODUCTS = {
  "식품": [
    { id: 1,  emoji: "🥜", name: "Kirkland 혼합 견과류",   query: "Kirkland 혼합견과류 1.13kg",         costco: 22990, unit: "1.13kg" },
    { id: 2,  emoji: "🫒", name: "Kirkland 올리브오일",     query: "Kirkland 엑스트라버진 올리브오일 3L", costco: 34990, unit: "3L" },
    { id: 3,  emoji: "🍫", name: "Kirkland 다크초콜릿",     query: "Kirkland 다크초콜릿 1.36kg",         costco: 19900, unit: "1.36kg" },
    { id: 4,  emoji: "🥚", name: "Kirkland 유기농 달걀",    query: "Kirkland 유기농 달걀 24구",           costco: 9990,  unit: "24개" },
    { id: 5,  emoji: "🫙", name: "Kirkland 버터",           query: "Kirkland 무염버터 1.36kg",           costco: 21900, unit: "1.36kg" },
    { id: 6,  emoji: "🥓", name: "Kirkland 베이컨",         query: "Kirkland 베이컨 1.36kg",             costco: 18900, unit: "1.36kg" },
    { id: 7,  emoji: "🧀", name: "Kirkland 파마산 치즈",    query: "Kirkland 파마산 치즈 1kg",           costco: 16900, unit: "1kg" },
    { id: 8,  emoji: "🫐", name: "Kirkland 냉동 블루베리",  query: "Kirkland 냉동 블루베리 1.36kg",      costco: 12990, unit: "1.36kg" },
  ],
  "생활용품": [
    { id: 9,  emoji: "🧻", name: "Kirkland 화장지 30롤",    query: "Kirkland 화장지 30롤",               costco: 18900, unit: "30롤" },
    { id: 10, emoji: "🧴", name: "Kirkland 알로에베라 젤",  query: "Kirkland 알로에베라 1L",             costco: 12990, unit: "1L" },
    { id: 11, emoji: "🫧", name: "Kirkland 세탁세제",       query: "Kirkland 액체 세탁세제 9L",          costco: 24900, unit: "9L" },
    { id: 12, emoji: "🪥", name: "Kirkland 치실",           query: "Kirkland 치실 3개입",                costco: 11900, unit: "3개입" },
    { id: 13, emoji: "🛁", name: "Kirkland 바디워시",       query: "Kirkland 바디워시 1L",               costco: 9900,  unit: "1L" },
    { id: 14, emoji: "🧺", name: "Kirkland 지퍼백",         query: "Kirkland 지퍼백 대형",               costco: 13900, unit: "150매" },
  ],
  "건강기능식품": [
    { id: 15, emoji: "💊", name: "Kirkland 피쉬오일",       query: "Kirkland 오메가3 피쉬오일 400캡슐",  costco: 28500, unit: "400캡슐" },
    { id: 16, emoji: "💉", name: "Kirkland 비타민C",        query: "Kirkland 비타민C 1000mg 500정",      costco: 19900, unit: "500정" },
    { id: 17, emoji: "🫀", name: "Kirkland 코엔자임Q10",    query: "Kirkland 코엔자임Q10 300mg",         costco: 32900, unit: "100캡슐" },
    { id: 18, emoji: "🦴", name: "Kirkland 칼슘+비타민D",   query: "Kirkland 칼슘 마그네슘 아연 500정",  costco: 17900, unit: "500정" },
    { id: 19, emoji: "🧬", name: "Kirkland 글루코사민",     query: "Kirkland 글루코사민 1500mg",         costco: 24900, unit: "375정" },
    { id: 20, emoji: "🌿", name: "Kirkland 아연",           query: "Kirkland 아연 50mg 400정",           costco: 14900, unit: "400정" },
  ],
  "전자제품": [
    { id: 21, emoji: "🔋", name: "Kirkland 건전지 AA",      query: "Kirkland AA 알카라인 배터리 48개",   costco: 14900, unit: "48개" },
    { id: 22, emoji: "💡", name: "Feit LED 전구",           query: "Feit LED 전구 A19 60W",             costco: 19900, unit: "10개입" },
    { id: 23, emoji: "🖨️", name: "HP 복합기 잉크",          query: "HP 잉크 검정 컬러 세트",             costco: 32900, unit: "3세트" },
  ],
  "유아용품": [
    { id: 24, emoji: "🍼", name: "Kirkland 분유",           query: "Kirkland 시밀락 분유",               costco: 34900, unit: "1.36kg" },
    { id: 25, emoji: "🧷", name: "Kirkland 기저귀",         query: "Kirkland 기저귀 대형",               costco: 42900, unit: "180매" },
    { id: 26, emoji: "🧹", name: "Kirkland 물티슈",         query: "Kirkland 순한 물티슈",               costco: 16900, unit: "900매" },
  ],
};

const CATEGORIES = Object.keys(COSTCO_PRODUCTS);

export default function Home() {
  const [activeCat,   setActiveCat]   = useState("식품");
  const [selected,    setSelected]    = useState(null);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleSelect(product) {
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

  const displayProducts = COSTCO_PRODUCTS[activeCat].filter(p =>
    searchQuery ? p.name.includes(searchQuery) : true
  );

  return (
    <div style={S.page}>
      <div style={S.container}>

        <div style={S.header}>
          <h1 style={S.title}>🏷️ PriceLens</h1>
          <p style={S.subtitle}>코스트코 상품을 클릭하면 네이버 · 쿠팡 가격을 바로 비교합니다</p>
        </div>

        <div style={S.searchWrap}>
          <span style={S.searchIcon}>🔍</span>
          <input
            style={S.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="상품명 검색..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={S.clearBtn}>×</button>
          )}
        </div>

        <div style={S.tabRow}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={Object.assign({}, S.tab, activeCat === cat ? S.tabActive : {})}
              onClick={() => { setActiveCat(cat); setSelected(null); setResult(null); }}
            >
              {cat}
              <span style={Object.assign({}, S.tabCount, activeCat === cat ? S.tabCountActive : {})}>
                {COSTCO_PRODUCTS[cat].length}
              </span>
            </button>
          ))}
        </div>

        <div style={S.body}>
          <div style={S.productList}>
            {displayProducts.map(product => (
              <div
                key={product.id}
                style={Object.assign({}, S.productCard, selected && selected.id === product.id ? S.productCardActive : {})}
                onClick={() => handleSelect(product)}
              >
                <div style={S.productEmoji}>{product.emoji}</div>
                <div style={S.productInfo}>
                  <div style={S.productName}>{product.name}</div>
                  <div style={S.productMeta}>
                    <span style={S.unitBadge}>코스트코</span>
                    <span style={S.costcoPrice}>₩{product.costco.toLocaleString()}</span>
                    <span style={S.unitText}>{product.unit}</span>
                  </div>
                </div>
                <div style={S.arrow}>{selected && selected.id === product.id ? "▶" : "›"}</div>
              </div>
            ))}
          </div>

          <div style={S.resultPanel}>
            {!selected && !loading && (
              <div style={S.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <div style={{ fontSize: 15, color: "#888" }}>상품을 클릭하면</div>
                <div style={{ fontSize: 15, color: "#888" }}>가격 비교가 시작됩니다</div>
              </div>
            )}

            {loading && (
              <div style={S.emptyState}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔄</div>
                <div style={{ fontSize: 15, color: "#888" }}>가격 비교 중...</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>{selected && selected.name}</div>
              </div>
            )}

            {error && <div style={S.errorBox}>⚠️ {error}</div>}

            {result && selected && !loading && (
              <div>
                <div style={S.resultHeader}>
                  <span style={{ fontSize: 24 }}>{selected.emoji}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#F0EDE8" }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                      코스트코 기준가: <span style={{ color: "#888" }}>₩{selected.costco.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {result.winner && (
                  <div style={S.winnerBanner}>
                    <span style={S.winnerBadge}>🏆 최저가</span>
                    <span style={{ fontWeight: 600 }}>{result.winner.name}</span>
                    <span style={S.winnerPrice}>₩{result.winner.price.toLocaleString()}</span>
                    {result.winner.saving > 0 && (
                      <span style={S.savingText}>상대방보다 ₩{result.winner.saving.toLocaleString()} 저렴</span>
                    )}
                    {result.winner.price < selected.costco && (
                      <span style={S.savingText}>코스트코보다 ₩{(selected.costco - result.winner.price).toLocaleString()} 저렴 🎉</span>
                    )}
                  </div>
                )}

                <PlatformResult name="🔍 네이버 쇼핑" color="#03C75A" data={result.naver}   isWinner={result.winner && result.winner.platform === "naver"} />
                <PlatformResult name="🛒 쿠팡"        color="#E8322A" data={result.coupang} isWinner={result.winner && result.winner.platform === "coupang"} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function PlatformResult({ name, color, data, isWinner }) {
  return (
    <div style={Object.assign({}, S.platformCard, { borderColor: isWinner ? color : "#1E1E26" })}>
      <div style={S.platformHeader}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
        {isWinner && <span style={Object.assign({}, S.badge, { background: color })}>최저가 ✓</span>}
        {data.lowestPrice && <span style={S.lowestLabel}>최저 ₩{data.lowestPrice.toLocaleString()}</span>}
      </div>
      {data.error && <p style={{ color: "#E24B4A", fontSize: 12, margin: 0 }}>오류: {data.error}</p>}
      {data.items && data.items.map(function(item, i) {
        return (
          <a key={i} href={item.link} target="_blank" rel="noreferrer" style={S.itemRow}>
            {item.image && <img src={item.image} alt="" style={S.itemImage} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.itemTitle}>{item.title}</div>
              <div style={S.itemPrice}>₩{item.price && item.price.toLocaleString()}</div>
              {item.isRocket && <span style={S.rocketBadge}>🚀 로켓배송</span>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

const S = {
  page:        { minHeight: "100vh", background: "#0D0D0F", color: "#F0EDE8", fontFamily: "system-ui, -apple-system, 'Noto Sans KR', sans-serif" },
  container:   { maxWidth: 1100, margin: "0 auto", padding: "32px 20px" },
  header:      { textAlign: "center", marginBottom: 28 },
  title:       { fontSize: 32, fontWeight: 700, marginBottom: 6 },
  subtitle:    { fontSize: 14, color: "#555" },
  searchWrap:  { position: "relative", marginBottom: 16, maxWidth: 400 },
  searchIcon:  { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#444" },
  searchInput: { background: "#14141A", border: "1px solid #1E1E26", color: "#F0EDE8", padding: "10px 36px", borderRadius: 10, fontSize: 14, width: "100%", outline: "none" },
  clearBtn:    { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 },
  tabRow:      { display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", borderBottom: "1px solid #1E1E26" },
  tab:         { background: "none", border: "none", color: "#555", padding: "10px 16px", cursor: "pointer", fontSize: 14, borderBottom: "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
  tabActive:   { color: "#F0EDE8", borderBottom: "2px solid #C8F250" },
  tabCount:    { fontSize: 11, background: "#1E1E26", color: "#555", padding: "1px 6px", borderRadius: 10 },
  tabCountActive: { background: "#1E2A10", color: "#C8F250" },
  body:        { display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" },
  productList: { display: "flex", flexDirection: "column", gap: 6 },
  productCard: { background: "#14141A", border: "1px solid #1E1E26", borderRadius: 10, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" },
  productCardActive: { border: "1px solid #C8F250", background: "#1A1F0A" },
  productEmoji: { fontSize: 22, flexShrink: 0, width: 32, textAlign: "center" },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { fontSize: 13, fontWeight: 500, color: "#DDD", marginBottom: 4, lineHeight: 1.4 },
  productMeta: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  unitBadge:   { fontSize: 10, background: "#1E1E26", color: "#666", padding: "1px 6px", borderRadius: 4 },
  costcoPrice: { fontSize: 12, fontWeight: 600, color: "#F0EDE8" },
  unitText:    { fontSize: 11, color: "#444" },
  arrow:       { color: "#333", fontSize: 16, flexShrink: 0 },
  resultPanel: { background: "#14141A", border: "1px solid #1E1E26", borderRadius: 12, padding: 20, minHeight: 400 },
  emptyState:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 360 },
  resultHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1E1E26" },
  winnerBanner: { background: "#1A1F0A", border: "1px solid #C8F250", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 },
  winnerBadge:  { background: "#C8F250", color: "#0D0D0F", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  winnerPrice:  { color: "#C8F250", fontWeight: 700, fontSize: 16 },
  savingText:   { color: "#666", fontSize: 12 },
  errorBox:    { background: "#1A0D0D", border: "1px solid #4A1B1B", borderRadius: 10, padding: "14px", color: "#E24B4A", fontSize: 13 },
  platformCard:   { background: "#0D0D0F", border: "1px solid #1E1E26", borderRadius: 10, padding: 14, marginBottom: 10 },
  platformHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  badge:          { color: "#0D0D0F", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  lowestLabel:    { marginLeft: "auto", fontSize: 12, color: "#C8F250", fontWeight: 600 },
  itemRow:     { display: "flex", gap: 10, padding: "10px 0", borderTop: "1px solid #1A1A20", textDecoration: "none", color: "inherit", alignItems: "flex-start" },
  itemImage:   { width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "#1E1E26" },
  itemTitle:   { fontSize: 11, lineHeight: 1.5, color: "#AAA", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  itemPrice:   { fontSize: 14, fontWeight: 600, color: "#F0EDE8" },
  rocketBadge: { display: "inline-block", marginTop: 3, fontSize: 10, background: "#1A1F0A", color: "#C8F250", padding: "1px 6px", borderRadius: 4 },
};
