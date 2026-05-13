# 🏷️ PriceLens — 코스트코 가격 비교 앱

네이버 쇼핑 + 쿠팡 파트너스 API로 실시간 가격을 비교합니다.

---

## 📁 최종 폴더 구조

```
pricelens/
├── pages/
│   ├── index.js                    ← 메인 화면 (검색 UI)
│   └── api/
│       └── search/
│           ├── naver.js            ← 네이버만 검색할 때
│           ├── coupang.js          ← 쿠팡만 검색할 때
│           └── price-compare.js    ← 둘 다 동시 검색 (주로 이걸 씀)
├── .env.local                      ← ★ API 키 입력 (직접 만들어야 함)
├── .env.local.example              ← 키 입력 양식 예시
├── .gitignore
└── package.json
```

---

## 🚀 설치 & 실행 (딱 3단계)

### 1단계 — 패키지 설치

터미널에서 이 폴더로 이동 후:

```bash
npm install
```

### 2단계 — API 키 입력

`.env.local.example` 파일을 복사해서 `.env.local` 로 이름을 바꾸고,
발급받은 API 키를 입력합니다:

```
NAVER_CLIENT_ID=abc123...
NAVER_CLIENT_SECRET=xyz456...

COUPANG_ACCESS_KEY=ABCDEFGHIJ...
COUPANG_SECRET_KEY=XXXXXXXX...
```

> 💡 API 키 발급 방법은 아래 "API 키 발급" 섹션 참고

### 3단계 — 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 검색창에 "Kirkland 견과류" 입력!

---

## 🔑 API 키 발급 방법

### 네이버 쇼핑 검색 API (무료, 일 25,000회)

1. https://developers.naver.com/apps/#/register 접속
2. 로그인 → "Application 등록" 클릭
3. 애플리케이션 이름: `PriceLens` (아무거나 OK)
4. 사용 API: **검색** 선택
5. 환경: **WEB** → 서비스 URL: `http://localhost:3000`
6. 등록 → `Client ID` + `Client Secret` 복사 → `.env.local`에 붙여넣기

### 쿠팡 파트너스 API (무료, 시간당 10회 검색)

1. https://partners.coupang.com 접속 → 가입/로그인
2. 승인 후 → 상단 메뉴 **"링크 관리"** → **"API"** 클릭
3. `Access Key` + `Secret Key` 복사 → `.env.local`에 붙여넣기

> ⚠️ 쿠팡 파트너스는 신청 후 심사가 1~3일 걸릴 수 있습니다

---

## 🌐 API 직접 호출 테스트

서버 실행 중에 브라우저 주소창에 바로 쳐볼 수 있습니다:

```
# 네이버만 검색
http://localhost:3000/api/search/naver?query=Kirkland+견과류

# 쿠팡만 검색
http://localhost:3000/api/search/coupang?query=Kirkland+견과류

# 네이버 + 쿠팡 동시 비교 (이걸 주로 씁니다)
http://localhost:3000/api/search/price-compare?query=Kirkland+견과류
```

---

## 🔧 자주 묻는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| `네이버 API 키 미설정` 오류 | `.env.local` 파일이 없음 | `.env.local.example` 복사해서 만들기 |
| `401 Unauthorized` (쿠팡) | Secret Key 오타 | 키 재확인 및 재발급 |
| `429 Too Many Requests` (쿠팡) | 시간당 10회 초과 | 1시간 후 재시도 |
| 검색 결과가 비어있음 | 검색어가 너무 구체적 | 키워드를 단순하게 (예: "견과류") |

---

## 📌 다음 단계 아이디어

- [ ] 11번가 / G마켓 API 추가
- [ ] 가격 변동 알림 (DB 저장 + 크론잡)
- [ ] 코스트코 상품 DB 구축 (Supabase 연동)
- [ ] Vercel 배포 (`npm run build` → Vercel 연결)
