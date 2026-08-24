'use client';

import Link from 'next/link';
import { ShoppingCart, LayoutDashboard, Package, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', backgroundColor: '#4F46E5', borderRadius: '20px', marginBottom: '1rem', boxShadow: '0 0 40px rgba(79,70,229,0.4)' }}>
          <ShoppingCart size={36} color="white" />
        </div>
        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          ShopManager
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>
          Complete Retail Billing & Inventory Management
        </p>
      </div>

      {/* Portal Cards */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px', width: '100%' }}>

        {/* Billing / POS Portal */}
        <Link href="/pos" style={{ textDecoration: 'none', flex: '1 1 300px', maxWidth: '360px' }}>
          <div style={{
            backgroundColor: '#4F46E5',
            borderRadius: '20px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 10px 30px rgba(79,70,229,0.4)',
            textAlign: 'center',
            border: '2px solid transparent'
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(79,70,229,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(79,70,229,0.4)';
            }}
          >
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <ShoppingCart size={32} color="white" />
            </div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Billing Portal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Fast POS terminal for the cashier.<br />
              Scan products, build bills & complete sales in seconds.
            </p>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.65rem 1.25rem', color: 'white', fontWeight: 700, display: 'inline-block' }}>
              Open POS Terminal →
            </div>
          </div>
        </Link>

        {/* Admin Portal */}
        <Link href="/login" style={{ textDecoration: 'none', flex: '1 1 300px', maxWidth: '360px' }}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center',
            border: '2px solid #334155'
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)';
              e.currentTarget.style.borderColor = '#4F46E5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            <div style={{ width: '64px', height: '64px', backgroundColor: '#334155', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <LayoutDashboard size={32} color="#94A3B8" />
            </div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Admin Portal
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              For the shop owner. Manage products, inventory, prices, view profit & loss reports and analytics.
            </p>
            <div style={{ backgroundColor: '#334155', borderRadius: '8px', padding: '0.65rem 1.25rem', color: '#94A3B8', fontWeight: 700, display: 'inline-block' }}>
              Sign In to Admin →
            </div>
          </div>
        </Link>
      </div>

      {/* Feature Highlights */}
      <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: ShoppingCart, label: 'Fast Billing' },
          { icon: Package, label: 'Inventory Tracking' },
          { icon: TrendingUp, label: 'Profit & Loss' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
            <Icon size={16} /> {label}
          </div>
        ))}
      </div>

      <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: '2rem' }}>
        ShopManager © 2026 — Retail Management System
      </p>
    </div>
  );
}
