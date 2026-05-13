// 📄 pages/api/search/eleventh.js — 11번가 Open API
// GET /api/search/eleventh?query=견과류&limit=5

export default async function handler(req, res) {
  const { query, limit = 5 } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  const apiKey = process.env.ELEVENTH_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "11번가 API 키 미설정" });

  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?` +
      `method=getProductSearchList` +
      `&keyword=${encodeURIComponent(query)}` +
      `&pageSize=${limit}` +
      `&sortCd=POPULAR` +
      `&apiKey=${apiKey}`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) throw new Error(`11번가 API 오류: ${response.status}`);

    const text = await response.text();

    // XML 파싱 (11번가는 XML 반환)
    const items = [];
    const productMatches = text.matchAll(/<Product>([\s\S]*?)<\/Product>/g);

    for (const match of productMatches) {
      const block = match[1];
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}>([^<]*)<\/${tag}>`));
        return m ? (m[1] || m[2] || "").trim() : "";
      };

      const price     = Number(get("salePrice") || get("productPrice") || 0);
      const shipFee   = Number(get("delivery_condition_type") === "FREE" ? 0 : get("deliveryFee") || 3000);
      const isFree    = get("delivery_condition_type") === "FREE" || shipFee === 0;

      if (!price) continue;

      items.push({
        title:       get("productName"),
        link:        get("productLinkUrl"),
        image:       get("productImage"),
        price,
        shippingFee: isFree ? 0 : shipFee,
        isFreeShip:  isFree,
        total:       price + (isFree ? 0 : shipFee),
        seller:      get("sellerNickname") || "11번가",
      });

      if (items.length >= limit) break;
    }

    const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
    return res.status(200).json({ platform: "eleventh", query, items, lowestTotal });

  } catch (err) {
    console.error("11번가 오류:", err);
    return res.status(500).json({ error: err.message, items: [], lowestTotal: null });
  }
}
