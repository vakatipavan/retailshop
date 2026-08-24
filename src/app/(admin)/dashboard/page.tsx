import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { IndianRupee, Package, AlertCircle, ShoppingCart, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import DashboardCharts from '@/components/DashboardCharts';

export default async function Dashboard() {
  // Fetch summary data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    products,
    todaySales,
    allSales
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany(),
    prisma.sale.findMany({
      where: {
        saleDate: {
          gte: today,
        },
      },
    }),
    prisma.sale.findMany({
      include: { items: true }
    })
  ]);

  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStock && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;
  
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.stockQuantity), 0);
  
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Sales</h3>
            <div style={{ color: 'var(--primary-color)' }}><ShoppingCart size={20} /></div>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 700 }}>₹{todayRevenue.toFixed(2)}</p>
        </div>
        
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Profit</h3>
            <div style={{ color: 'var(--success-color)' }}><IndianRupee size={20} /></div>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 700, color: todayProfit >= 0 ? 'inherit' : 'var(--danger-color)' }}>
            ₹{todayProfit.toFixed(2)}
          </p>
        </div>
        
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Products</h3>
            <div style={{ color: 'var(--text-secondary)' }}><Package size={20} /></div>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 700 }}>{totalProducts}</p>
        </div>
        
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Inventory Value</h3>
            <div style={{ color: 'var(--warning-color)' }}><IndianRupee size={20} /></div>
          </div>
          <p style={{ fontSize: '1.875rem', fontWeight: 700 }}>₹{totalInventoryValue.toFixed(2)}</p>
        </div>
      </div>

      {/* AI Sales Predictor Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        color: 'white',
        marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(79,70,229,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
            <Sparkles size={24} color="#FDE047" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Smart Sales Predictor & AI Restock Advisor</h3>
            <p style={{ fontSize: '0.85rem', color: '#C7D2FE', margin: '0.1rem 0 0 0' }}>
              Groq AI predicts item sales, calculates 30-day demand, and tells you exact quantities to buy for every product.
            </p>
          </div>
        </div>
        <Link 
          href="/predictor"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'white', color: '#4F46E5',
            padding: '0.65rem 1.25rem', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none',
            whiteSpace: 'nowrap', transition: 'transform 0.15s'
          }}
        >
          View Sales Forecast & Reorder List <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="var(--danger-color)" /> Action Required
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--danger-color)' }}>Out of Stock Products</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{outOfStockCount} products need immediate restocking</p>
              </div>
              <Link href="/inventory" className="btn btn-danger">View</Link>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--warning-color)' }}>Low Stock Products</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lowStockCount} products are running low</p>
              </div>
              <Link href="/inventory" className="btn" style={{ backgroundColor: 'var(--warning-color)', color: 'white' }}>View</Link>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h3>
          <div className="grid grid-cols-2">
            <Link href="/billing" className="btn btn-primary" style={{ height: '100px', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ShoppingCart size={24} /> New Sale
            </Link>
            <Link href="/products/new" className="btn" style={{ backgroundColor: '#10B981', color: 'white', height: '100px', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Package size={24} /> Add Product
            </Link>
          </div>
        </div>
      </div>
      
      <DashboardCharts sales={allSales} products={products} />
    </div>
  );
}
