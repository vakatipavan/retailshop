import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AlertCircle, PlusCircle, CheckCircle, Scale } from 'lucide-react';

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: { variants: true }
  });

  const getStatus = (stockQty: number, minStock: number) => {
    if (stockQty === 0) return { label: 'Out of Stock', color: 'var(--danger-color)', icon: AlertCircle };
    if (stockQty <= minStock) return { label: 'Low Stock Alert', color: 'var(--warning-color)', icon: AlertCircle };
    return { label: 'In Stock', color: 'var(--success-color)', icon: CheckCircle };
  };

  // Flatten items list (product or product variant rows) for inventory view
  const inventoryItems: any[] = [];
  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        inventoryItems.push({
          id: p.id,
          variantId: v.id,
          displayName: `${p.name} (${v.name})`,
          category: p.category,
          sku: v.sku,
          stockQuantity: v.stockQuantity,
          minStock: v.minStock,
          purchasePrice: v.purchasePrice,
          sellingPrice: v.sellingPrice,
          unit: 'packets',
          isVariant: true,
          variantName: v.name,
        });
      });
    } else {
      inventoryItems.push({
        id: p.id,
        variantId: null,
        displayName: p.name,
        category: p.category,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        minStock: p.minStock,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        unit: p.unit,
        isVariant: false,
      });
    }
  });

  return (
    <div>
      <Header title="Inventory & Low Stock Alerts" />
      
      <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>All Products & Packet Sizes</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: '#F3F4F6', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 600 }}>
            {inventoryItems.length} inventory items
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Product / Packet Size</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Stock Status</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Current Stock</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Alert Level (Min)</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Stock Value</th>
              <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item, idx) => {
              const status = getStatus(item.stockQuantity, item.minStock);
              return (
                <tr key={`${item.id}_${item.variantId || idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.isVariant && <Scale size={16} color="#059669" />}
                      <p style={{ fontWeight: 600, margin: 0 }}>{item.displayName}</p>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', margin: 0 }}>{item.sku}</p>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ backgroundColor: '#EEF2FF', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 500 }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: status.color,
                      backgroundColor: `${status.color}15`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <status.icon size={14} />
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '1.05rem', color: status.color }}>
                    {item.stockQuantity} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>{item.unit}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ≤ {item.minStock} {item.unit}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₹{(item.purchasePrice * item.stockQuantity).toFixed(2)}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Link href={`/inventory/${item.id}/add`} className="btn" style={{ padding: '0.45rem 0.85rem', border: '1px solid var(--border-color)', display: 'inline-flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}>
                      <PlusCircle size={15} /> Add Stock
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
