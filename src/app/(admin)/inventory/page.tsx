import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AlertCircle, PlusCircle, CheckCircle } from 'lucide-react';

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  const getStatus = (product: any) => {
    if (product.stockQuantity === 0) return { label: 'Out of Stock', color: 'var(--danger-color)', icon: AlertCircle };
    if (product.stockQuantity <= product.minStock) return { label: 'Low Stock', color: 'var(--warning-color)', icon: AlertCircle };
    return { label: 'In Stock', color: 'var(--success-color)', icon: CheckCircle };
  };

  return (
    <div>
      <Header title="Inventory Management" />
      
      <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Product</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Category</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stock Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Current Qty</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Min Qty</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stock Value</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = getStatus(product);
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ fontWeight: 600 }}>{product.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{product.sku}</p>
                  </td>
                  <td style={{ padding: '1rem' }}>{product.category}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: status.color,
                      backgroundColor: `${status.color}15`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      <status.icon size={14} />
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>
                    {product.stockQuantity} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>{product.unit}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{product.minStock}</td>
                  <td style={{ padding: '1rem' }}>₹{(product.purchasePrice * product.stockQuantity).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <Link href={`/inventory/${product.id}/add`} className="btn" style={{ padding: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <PlusCircle size={16} /> Add Stock
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
