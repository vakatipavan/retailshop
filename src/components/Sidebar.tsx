'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  History,
  TrendingUp,
  Tags,
  Tag,
  ExternalLink,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Inventory', icon: Tags, href: '/inventory' },
  { name: 'Update Prices', icon: Tag, href: '/prices' },
  { name: 'Sales History', icon: History, href: '/history' },
  { name: 'Profit & Loss', icon: TrendingUp, href: '/reports' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={22} />
          ShopManager
        </h2>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem', paddingLeft: '1.8rem' }}>Admin Portal</p>
      </div>

      {/* POS Quick-launch button */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <Link
          href="/pos"
          target="_blank"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#4F46E5', color: 'white',
            padding: '0.6rem 1rem', borderRadius: '8px',
            fontSize: '0.875rem', fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#4338CA'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#4F46E5'}
        >
          <ShoppingCart size={16} />
          Open POS Terminal
          <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map(item => {
            const active = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.65rem 1.25rem',
                    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: active ? '#EEF2FF' : 'transparent',
                    borderRight: active ? '3px solid var(--primary-color)' : '3px solid transparent',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s',
                    fontSize: '0.9rem',
                  }}
                  onMouseOver={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.color = 'var(--primary-color)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          © 2026 ShopManager
        </p>
      </div>
    </aside>
  );
}
