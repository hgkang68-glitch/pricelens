// 📄 파일 위치: pages/api/search/naver.js
// 브라우저에서 /api/search/naver?query=견과류 로 호출됩니다

export default async function handler(req, res) {
  const { query, display = 5 } = req.query;
  if (!query) return res.status(400).json({ error: "query 필요" });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  const response = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id":     clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    }
  );

  const data = await response.json();

  // 필요한 필드만 골라서 반환
  const items = data.items.map((item) => ({
    title:    item.title.replace(/<[^>]+>/g, ""), // HTML태그 제거
    link:     item.link,
    image:    item.image,
    price:    Number(item.lprice),
    mallName: item.mallName,
  }));

  res.status(200).json({ platform: "naver", query, items });
}
