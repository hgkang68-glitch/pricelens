// 📄 components/Nav.js — 공통 네비게이션
import { useRouter } from 'next/router'

const LINKS = [
  { href: '/',        label: '가격 비교',    key: 'compare' },
  { href: '/saved',   label: '저장된 비교',  key: 'saved' },
  { href: '/history', label: '가격 이력',    key: 'history' },
  { href: '/admin',   label: '상품 관리',    key: 'admin' },
]

export default function Nav({ active }) {
  const router = useRouter()
  const current = active || LINKS.find(l => l.href === router.pathname)?.key

  return (
    <div style={S.nav}>
      <div style={S.inner}>
        <a href="/" style={S.logo}>
          <span>🏷️</span>
          <span style={S.logoText}>PriceLens</span>
          <span style={S.beta}>v2</span>
        </a>
        <div style={S.links}>
          {LINKS.map(l => (
            <a key={l.key} href={l.href} style={{ ...S.link, ...(current === l.key ? S.linkActive : {}) }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

const S = {
  nav:       { borderBottom: '1px solid #1E1E26', background: '#0D0D0F', position: 'sticky', top: 0, zIndex: 100 },
  inner:     { maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 0 },
  logo:      { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' },
  logoText:  { fontSize: 16, fontWeight: 700, color: '#F0EDE8' },
  beta:      { fontSize: 10, background: '#1E2A10', color: '#C8F250', padding: '2px 7px', borderRadius: 4, fontWeight: 500 },
  links:     { display: 'flex' },
  link:      { padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', fontSize: 13, color: '#555', textDecoration: 'none', borderBottom: '2px solid transparent', transition: 'color .15s' },
  linkActive:{ color: '#F0EDE8', borderBottom: '2px solid #C8F250' },
}
