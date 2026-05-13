// 📄 pages/api/search/gmarket.js — G마켓 (eBay Korea) Finding API
// GET /api/search/gmarket?query=견과류&limit=5

export default async function handler(req, res) {
  const { query, limit = 5 } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  const appId = process.env.GMARKET_APP_ID;
  if (!appId) return res.status(500).json({ error: "G마켓 API 키 미설정" });

  try {
    const url = `http://svcs.gmarket.co.kr/services/search/FindingService/v1` +
      `?OPERATION-NAME=findItemsByKeywords` +
      `&SERVICE-VERSION=1.13.0` +
      `&SECURITY-APPNAME=${appId}` +
      `&RESPONSE-DATA-FORMAT=JSON` +
      `&REST-PAYLOAD` +
      `&keywords=${encodeURIComponent(query)}` +
      `&paginationInput.entriesPerPage=${limit}` +
      `&sortOrder=BestMatch`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`G마켓 API 오류: ${response.status}`);

    const data = await response.json();
    const searchResult = data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0];
    const rawItems = searchResult?.item || [];

    const items = rawItems.map(item => {
      const price      = Number(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
      const shipCost   = item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__;
      const isFreeShip = !shipCost || Number(shipCost) === 0;
      const shipFee    = isFreeShip ? 0 : Number(shipCost) || 3000;

      return {
        title:       item.title?.[0] || "",
        link:        item.viewItemURL?.[0] || "",
        image:       item.galleryURL?.[0] || "",
        price,
        shippingFee: shipFee,
        isFreeShip,
        total:       price + shipFee,
        seller:      item.sellerInfo?.[0]?.sellerUserName?.[0] || "G마켓",
      };
    }).filter(i => i.price > 0);

    const lowestTotal = items.length ? Math.min(...items.map(i => i.total)) : null;
    return res.status(200).json({ platform: "gmarket", query, items, lowestTotal });

  } catch (err) {
    console.error("G마켓 오류:", err);
    return res.status(500).json({ error: err.message, items: [], lowestTotal: null });
  }
}
