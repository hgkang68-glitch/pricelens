// 📄 pages/api/search/price-compare.js
// 네이버 + 쿠팡 + 11번가 + G마켓 동시 검색 — 배송비 포함 총 결제액 비교

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
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  const data = await res.json();

  const items = (data.items || []).map(i => {
    const price      = Number(i.lprice);
    // 네이버는 배송비 직접 제공 안 함 — mallName 기준 추정
    const isFreeShip = i.mallName?.includes("코스트코") ? false : true;
    const shipFee    = isFreeShip ? 0 : 3000;
    return {
      title:       i.title.replace(/<[^>]+>/g, ""),
      link:        i.link,
      image:       i.image,
      price,
      shippingFee: shipFee,
      isFreeShip,
      total:       price + shipFee,
      mallName:    i.mallName,
    };
  });

  const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
  return { platform: "naver", items, lowestTotal };
}

// ── 쿠팡 ─────────────────────────────────────────────
async function searchCoupang(query) {
  const ak = process.env.COUPANG_ACCESS_KEY;
  const sk = process.env.COUPANG_SECRET_KEY;
  if (!ak || !sk) throw new Error("쿠팡 API 키 미설정");

  const params  = new URLSearchParams({ keyword: query, limit: "5" });
  const apiPath = `/v2/providers/affiliate_open_api/apis/openapi/products/search?${params}`;
  const datetime  = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const signature = crypto.createHmac("sha256", sk).update(datetime + "GET" + apiPath).digest("hex");
  const auth      = `CEA algorithm=HmacSHA256, access-key=${ak}, signed-date=${datetime}, signature=${signature}`;

  const res  = await fetch(`https://api-gateway.coupang.com${apiPath}`, {
    headers: { Authorization: auth, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Coupang ${res.status}`);
  const data = await res.json();
  if (data.rCode !== "0") throw new Error(data.rMessage);

  const items = (data.data?.productData || []).map(i => {
    const price      = i.lowestPrice;
    const isFreeShip = i.isFreeShipping || i.isRocket;
    const shipFee    = isFreeShip ? 0 : 3000;
    return {
      title:       i.productName,
      link:        i.productUrl,
      image:       i.productImage,
      price,
      shippingFee: shipFee,
      isFreeShip,
      isRocket:    i.isRocket,
      total:       price + shipFee,
    };
  });

  const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
  return { platform: "coupang", items, lowestTotal };
}

// ── 11번가 ────────────────────────────────────────────
async function searchEleventh(query) {
  const apiKey = process.env.ELEVENTH_API_KEY;
  if (!apiKey) throw new Error("11번가 API 키 미설정");

  const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?` +
    `method=getProductSearchList&keyword=${encodeURIComponent(query)}&pageSize=5&sortCd=POPULAR&apiKey=${apiKey}`;

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`11번가 ${res.status}`);
  const text = await res.text();

  const items = [];
  const matches = text.matchAll(/<Product>([\s\S]*?)<\/Product>/g);
  for (const m of matches) {
    const b   = m[1];
    const get = (tag) => {
      const r = b.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}>([^<]*)<\/${tag}>`));
      return r ? (r[1] || r[2] || "").trim() : "";
    };
    const price      = Number(get("salePrice") || get("productPrice") || 0);
    const isFreeShip = get("delivery_condition_type") === "FREE";
    const shipFee    = isFreeShip ? 0 : Number(get("deliveryFee") || 3000);
    if (!price) continue;
    items.push({
      title:       get("productName"),
      link:        get("productLinkUrl"),
      image:       get("productImage"),
      price,
      shippingFee: shipFee,
      isFreeShip,
      total:       price + shipFee,
    });
    if (items.length >= 5) break;
  }

  const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
  return { platform: "eleventh", items, lowestTotal };
}

// ── G마켓 ─────────────────────────────────────────────
async function searchGmarket(query) {
  const appId = process.env.GMARKET_APP_ID;
  if (!appId) throw new Error("G마켓 API 키 미설정");

  const url = `http://svcs.gmarket.co.kr/services/search/FindingService/v1` +
    `?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.13.0` +
    `&SECURITY-APPNAME=${appId}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD` +
    `&keywords=${encodeURIComponent(query)}&paginationInput.entriesPerPage=5&sortOrder=BestMatch`;

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`G마켓 ${res.status}`);
  const data = await res.json();

  const rawItems = data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
  const items = rawItems.map(item => {
    const price      = Number(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
    const shipCost   = Number(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || 0);
    const isFreeShip = shipCost === 0;
    const shipFee    = isFreeShip ? 0 : shipCost || 3000;
    return {
      title:       item.title?.[0] || "",
      link:        item.viewItemURL?.[0] || "",
      image:       item.galleryURL?.[0] || "",
      price,
      shippingFee: shipFee,
      isFreeShip,
      total:       price + shipFee,
    };
  }).filter(i => i.price > 0);

  const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
  return { platform: "gmarket", items, lowestTotal };
}

// ── 통합 핸들러 ───────────────────────────────────────
export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  // 4개 플랫폼 병렬 호출
  const [naverR, coupangR, eleventhR, gmarketR] = await Promise.allSettled([
    searchNaver(query),
    searchCoupang(query),
    searchEleventh(query),
    searchGmarket(query),
  ]);

  const make = (r) => r.status === "fulfilled"
    ? r.value
    : { items: [], lowestTotal: null, error: r.reason?.message };

  const naver    = make(naverR);
  const coupang  = make(coupangR);
  const eleventh = make(eleventhR);
  const gmarket  = make(gmarketR);

  // 총 결제액 기준 최저가 플랫폼 판정
  const platforms = [
    { id: "naver",    name: "네이버 쇼핑", data: naver },
    { id: "coupang",  name: "쿠팡",        data: coupang },
    { id: "eleventh", name: "11번가",      data: eleventh },
    { id: "gmarket",  name: "G마켓",       data: gmarket },
  ].filter(p => p.data.lowestTotal !== null);

  let winner = null;
  if (platforms.length > 0) {
    const best = platforms.reduce((a, b) => a.data.lowestTotal <= b.data.lowestTotal ? a : b);
    const second = platforms.filter(p => p.id !== best.id)
      .reduce((a, b) => a ? (a.data.lowestTotal < b.data.lowestTotal ? a : b) : b, null);

    winner = {
      platform:  best.id,
      name:      best.name,
      price:     best.data.lowestTotal,
      saving:    second ? second.data.lowestTotal - best.data.lowestTotal : 0,
    };
  }

  return res.status(200).json({ query, naver, coupang, eleventh, gmarket, winner });
}
