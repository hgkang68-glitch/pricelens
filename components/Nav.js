// 📄 components/Nav.js
import { useRouter } from 'next/router'

const LINKS = [
  { href: '/',        label: '가격 비교',   key: 'compare' },
  { href: '/saved',   label: '저장된 비교', key: 'saved' },
  { href: '/history', label: '가격 이력',   key: 'history' },
  { href: '/admin',   label: '상품 관리',   key: 'admin' },
]

export default function Nav({ active }) {
  const router  = useRouter()
  const current = active || LINKS.find(l => l.href === router.pathname)?.key

  return (
    <div style={S.nav}>
      <div style={S.inner}>
        <a href="/" style={S.logo}>
          <span>🏷️</span>
          <span style={S.logoText}>PriceLens</span>
          <span style={S.badge}>v2</span>
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
  nav:       { borderBottom: '1px solid #E5E7EB', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100 },
  inner:     { maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center' },
  logo:      { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' },
  logoText:  { fontSize: 16, fontWeight: 600, color: '#111827' },
  badge:     { fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 7px', borderRadius: 4, fontWeight: 500 },
  links:     { display: 'flex' },
  link:      { padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', fontSize: 13, color: '#6B7280', textDecoration: 'none', borderBottom: '2px solid transparent' },
  linkActive:{ color: '#111827', borderBottom: '2px solid #2563EB', fontWeight: 500 },
}
