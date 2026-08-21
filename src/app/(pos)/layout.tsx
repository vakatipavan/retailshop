import { ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingCart, LayoutDashboard, LogIn } from 'lucide-react';

export default function POSLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      {/* POS Top Bar */}
      <header style={{
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #334155',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#4F46E5', borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={20} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>ShopManager POS</p>
            <p style={{ color: '#94A3B8', fontSize: '0.7rem', lineHeight: 1.2 }}>Billing Terminal</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: '#94A3B8', fontSize: '0.875rem', padding: '0.4rem 0.9rem',
            border: '1px solid #334155', borderRadius: '6px',
            transition: 'all 0.2s'
          }}>
            <LayoutDashboard size={15} /> Admin
          </Link>
        </div>
      </header>

      {/* Main POS Content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
