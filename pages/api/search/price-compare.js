// 📄 파일 위치: pages/api/search/price-compare.js
// 네이버 + 쿠팡을 동시에 호출해서 최저가를 비교해서 한 번에 돌려줍니다
// 브라우저에서 /api/search/price-compare?query=Kirkland+견과류 로 호출

import crypto from "crypto";

// ── 네이버 ────────────────────────────────────────────
async function searchNaver(query) {
  const res = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id":     process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
      },
    }
  );
  const data = await res.json();
  const items = data.items.map((i) => ({
    title: i.title.replace(/<[^>]+>/g, ""),
    price: Number(i.lprice),
    link:  i.link,
    image: i.image,
  }));
  return { items, lowestPrice: Math.min(...items.map((i) => i.price)) };
}

// ── 쿠팡 ─────────────────────────────────────────────
async function searchCoupang(query) {
  const { COUPANG_ACCESS_KEY: ak, COUPANG_SECRET_KEY: sk } = process.env;
  const params  = new URLSearchParams({ keyword: query, limit: "5" });
  const apiPath = `/v2/providers/affiliate_open_api/apis/openapi/products/search?${params}`;
  const datetime  = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const signature = crypto.createHmac("sha256", sk).update(datetime + "GET" + apiPath).digest("hex");
  const auth      = `CEA algorithm=HmacSHA256, access-key=${ak}, signed-date=${datetime}, signature=${signature}`;

  const res  = await fetch(`https://api-gateway.coupang.com${apiPath}`, {
    headers: { Authorization: auth, "Content-Type": "application/json" },
  });
  const data = await res.json();
  const items = (data.data?.productData || []).map((i) => ({
    title:    i.productName,
    price:    i.lowestPrice,
    link:     i.productUrl,
    image:    i.productImage,
    isRocket: i.isRocket,
  }));
  return { items, lowestPrice: Math.min(...items.map((i) => i.price)) };
}

// ── 통합 핸들러 ───────────────────────────────────────
export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  // 두 플랫폼 병렬 호출 — 하나가 실패해도 나머지는 반환
  const [naverResult, coupangResult] = await Promise.allSettled([
    searchNaver(query),
    searchCoupang(query),
  ]);

  const naver   = naverResult.status   === "fulfilled" ? naverResult.value   : { items: [], lowestPrice: null, error: naverResult.reason?.message };
  const coupang = coupangResult.status === "fulfilled" ? coupangResult.value : { items: [], lowestPrice: null, error: coupangResult.reason?.message };

  // 최저가 플랫폼 판정
  let winner = null;
  if (naver.lowestPrice && coupang.lowestPrice) {
    winner = naver.lowestPrice <= coupang.lowestPrice
      ? { platform: "naver",   name: "네이버", price: naver.lowestPrice,   saving: coupang.lowestPrice - naver.lowestPrice }
      : { platform: "coupang", name: "쿠팡",   price: coupang.lowestPrice, saving: naver.lowestPrice   - coupang.lowestPrice };
  }

  res.status(200).json({ query, naver, coupang, winner });
}
