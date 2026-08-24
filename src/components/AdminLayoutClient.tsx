'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, ShoppingCart } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar (desktop: sticky, mobile: off-canvas) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right side: mobile topbar + main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile-only top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <ShoppingCart size={20} color="var(--primary-color)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-color)' }}>
              ShopManager
            </span>
          </div>

          <LogoutButton />
        </div>

        {/* Page content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
