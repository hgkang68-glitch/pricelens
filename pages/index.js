// 📄 파일 위치: pages/index.js
// 메인 화면 — 검색창에 상품명 입력하면 네이버 + 쿠팡 가격 비교

import { useState } from "react";

export default function Home() {
  const [query,   setQuery]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // price-compare API를 한 번만 호출하면 네이버+쿠팡 동시 결과가 옴
      const res  = await fetch(`/api/search/price-compare?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* 헤더 */}
        <div style={styles.header}>
          <h1 style={styles.title}>🏷️ PriceLens</h1>
          <p style={styles.subtitle}>코스트코 상품을 네이버 · 쿠팡에서 얼마에 파는지 비교해드립니다</p>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: Kirkland 견과류, 올리브오일, 피쉬오일..."
          />
          <button style={styles.searchBtn} type="submit" disabled={loading}>
            {loading ? "검색 중..." : "비교 검색"}
          </button>
        </form>

        {/* 에러 */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
            <br/>
            <small style={{ color: "#999" }}>.env.local 파일에 API 키가 올바르게 입력되었는지 확인하세요.</small>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div>
            {/* 최저가 배너 */}
            {result.winner && (
              <div style={styles.winnerBanner}>
                <span style={styles.winnerBadge}>🏆 최저가</span>
                <strong>{result.winner.name}</strong>에서
                {" "}
                <span style={styles.winnerPrice}>₩{result.winner.price.toLocaleString()}</span>
                {result.winner.saving > 0 && (
                  <span style={styles.savingText}> — 상대방보다 ₩{result.winner.saving.toLocaleString()} 저렴</span>
                )}
              </div>
            )}

            {/* 플랫폼 결과 나란히 */}
            <div style={styles.platformGrid}>
              <PlatformResult
                name="🔍 네이버 쇼핑"
                color="#03C75A"
                data={result.naver}
                isWinner={result.winner?.platform === "naver"}
              />
              <PlatformResult
                name="🛒 쿠팡"
                color="#E8322A"
                data={result.coupang}
                isWinner={result.winner?.platform === "coupang"}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// 플랫폼별 결과 카드
function PlatformResult({ name, color, data, isWinner }) {
  return (
    <div style={{ ...styles.platformCard, borderColor: isWinner ? color : "#2A2A30" }}>
      <div style={styles.platformHeader}>
        <span style={styles.platformName}>{name}</span>
        {isWinner && <span style={{ ...styles.badge, background: color }}>최저가 ✓</span>}
        {data.lowestPrice && (
          <span style={styles.lowestLabel}>최저 ₩{data.lowestPrice.toLocaleString()}</span>
        )}
      </div>

      {data.error && <p style={{ color: "#E24B4A", fontSize: 13 }}>오류: {data.error}</p>}

      {data.items?.map((item, i) => (
        <a key={i} href={item.link} target="_blank" rel="noreferrer" style={styles.itemRow}>
          {item.image && (
            <img src={item.image} alt="" style={styles.itemImage} />
          )}
          <div style={styles.itemInfo}>
            <div style={styles.itemTitle}>{item.title}</div>
            <div style={styles.itemPrice}>₩{item.price?.toLocaleString()}</div>
            {item.isRocket && <span style={styles.rocketBadge}>🚀 로켓배송</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

// 인라인 스타일
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0D0D0F",
    color: "#F0EDE8",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "40px 20px",
  },
  container:  { maxWidth: 900, margin: "0 auto" },
  header:     { textAlign: "center", marginBottom: 40 },
  title:      { fontSize: 36, fontWeight: 700, marginBottom: 8 },
  subtitle:   { fontSize: 15, color: "#666" },

  searchForm:  { display: "flex", gap: 10, marginBottom: 24 },
  searchInput: {
    flex: 1,
    background: "#14141A",
    border: "1px solid #2A2A30",
    borderRadius: 10,
    padding: "14px 18px",
    fontSize: 15,
    color: "#F0EDE8",
    outline: "none",
  },
  searchBtn: {
    background: "#C8F250",
    color: "#0D0D0F",
    border: "none",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  errorBox: {
    background: "#1A0D0D",
    border: "1px solid #4A1B1B",
    borderRadius: 10,
    padding: "14px 18px",
    color: "#E24B4A",
    fontSize: 14,
    marginBottom: 20,
  },

  winnerBanner: {
    background: "#1A1F0A",
    border: "1px solid #C8F250",
    borderRadius: 10,
    padding: "14px 20px",
    marginBottom: 20,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  winnerBadge:  { background: "#C8F250", color: "#0D0D0F", padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  winnerPrice:  { color: "#C8F250", fontWeight: 700, fontSize: 18 },
  savingText:   { color: "#888", fontSize: 13 },

  platformGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  platformCard: {
    background: "#14141A",
    border: "1.5px solid #1E1E26",
    borderRadius: 12,
    padding: 20,
    transition: "border-color 0.2s",
  },
  platformHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  platformName:   { fontSize: 15, fontWeight: 600 },
  badge: { color: "#0D0D0F", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  lowestLabel:    { marginLeft: "auto", fontSize: 13, color: "#C8F250", fontWeight: 600 },

  itemRow: {
    display: "flex",
    gap: 12,
    padding: "12px 0",
    borderTop: "1px solid #1E1E26",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
    alignItems: "flex-start",
  },
  itemImage:  { width: 60, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#1E1E26" },
  itemInfo:   { flex: 1, minWidth: 0 },
  itemTitle:  { fontSize: 12, lineHeight: 1.5, color: "#CCC", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  itemPrice:  { fontSize: 15, fontWeight: 600, color: "#F0EDE8" },
  rocketBadge: { display: "inline-block", marginTop: 4, fontSize: 11, background: "#1A1F0A", color: "#C8F250", padding: "2px 8px", borderRadius: 4 },
};
