// 📄 파일 위치: pages/api/search/coupang.js
// 브라우저에서 /api/search/coupang?query=견과류 로 호출됩니다

import crypto from "crypto";

// 쿠팡 공식 HMAC-SHA256 서명 방식
function buildAuthorization(accessKey, secretKey, method, path) {
  const datetime = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14); // "20250513143022" 형태

  const message   = datetime + method + path;
  const signature = crypto.createHmac("sha256", secretKey).update(message).digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export default async function handler(req, res) {
  const { query, limit = 5 } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;

  const params  = new URLSearchParams({ keyword: query, limit: String(limit) });
  const apiPath = `/v2/providers/affiliate_open_api/apis/openapi/products/search?${params}`;

  const response = await fetch(`https://api-gateway.coupang.com${apiPath}`, {
    headers: {
      Authorization:  buildAuthorization(accessKey, secretKey, "GET", apiPath),
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (data.rCode !== "0") {
    return res.status(400).json({ error: data.rMessage });
  }

  const items = (data.data?.productData || []).map((item) => ({
    title:         item.productName,
    link:          item.productUrl,
    image:         item.productImage,
    price:         item.lowestPrice,
    isRocket:      item.isRocket,
    isFreeShipping: item.isFreeShipping,
  }));

  res.status(200).json({ platform: "coupang", query, items });
}
