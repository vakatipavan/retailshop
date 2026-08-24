import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { IndianRupee, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function ReportsPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { saleDate: 'desc' },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalCost = sales.reduce((acc, sale) => acc + sale.totalCost, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);

  return (
    <div>
      <Header title="Profit & Loss Reports" />
      
      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>Total Revenue</h3>
            <div><IndianRupee size={20} /></div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>₹{totalRevenue.toFixed(2)}</p>
        </div>

        <div className="card" style={{ backgroundColor: '#F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Cost</h3>
            <div style={{ color: 'var(--text-secondary)' }}><Activity size={20} /></div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>₹{totalCost.toFixed(2)}</p>
        </div>

        <div className="card" style={{ backgroundColor: totalProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 600 }}>Net Profit / Loss</h3>
            <div style={{ color: totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {totalProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
            ₹{totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Transactions</h3>
          <Link href="/history" className="btn" style={{ border: '1px solid var(--border-color)' }}>View All History</Link>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date & Time</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Bill ID</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Items</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Revenue</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cost</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Profit</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 10).map((sale) => (
              <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{format(new Date(sale.saleDate), 'dd MMM yyyy, p')}</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{sale.id.split('-')[0]}</td>
                <td style={{ padding: '1rem' }}>
                  {sale.items.map(item => (
                    <div key={item.id} style={{ fontSize: '0.875rem' }}>
                      {item.product.name} ({item.quantity})
                    </div>
                  ))}
                </td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>₹{sale.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>₹{sale.totalCost.toFixed(2)}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: sale.profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  ₹{sale.profit.toFixed(2)}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
