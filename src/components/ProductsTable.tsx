'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@prisma/client';
import Link from 'next/link';
import { Edit, Trash2, Plus, Search, Package, Layers } from 'lucide-react';

type ProductWithVariants = Product & { variants?: ProductVariant[] };

export default function ProductsTable({ products: initialProducts }: { products: ProductWithVariants[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants?.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete product. It may be linked to sales history.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search product, variant size (e.g. 50g), or SKU…"
            className="input"
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/products/new" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
              {['Name & SKU', 'Category', 'Packet Sizes / Variants', 'Price Range', 'Stock Qty', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Package size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>{searchTerm ? 'No products match your search.' : 'No products yet. Click "Add Product" to get started.'}</p>
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const hasVar = product.variants && product.variants.length > 0;
                
                let priceDisplay = `₹${product.sellingPrice.toFixed(2)}`;
                let totalStock = product.stockQuantity;

                if (hasVar && product.variants) {
                  const prices = product.variants.map(v => v.sellingPrice);
                  const minP = Math.min(...prices);
                  const maxP = Math.max(...prices);
                  priceDisplay = minP === maxP ? `₹${minP.toFixed(2)}` : `₹${minP.toFixed(2)} - ₹${maxP.toFixed(2)}`;
                  totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
                }

                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.1rem' }}>{product.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{product.sku}</p>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ backgroundColor: '#EEF2FF', color: 'var(--primary-color)', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 500 }}>
                        {product.category}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {hasVar && product.variants ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {product.variants.map(v => (
                            <span key={v.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
                              padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600
                            }}>
                              <Layers size={11} /> {v.name} (₹{v.sellingPrice})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Standard ({product.unit})</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--success-color)' }}>
                      {priceDisplay}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontWeight: 700,
                        color: totalStock === 0 ? 'var(--danger-color)' : totalStock <= product.minStock ? 'var(--warning-color)' : 'var(--text-primary)'
                      }}>
                        {totalStock} {hasVar ? 'units (total)' : product.unit}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          href={`/products/${product.id}/edit`}
                          title="Edit"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem', color: 'var(--primary-color)', backgroundColor: '#EEF2FF', borderRadius: 'var(--radius-md)', border: 'none' }}
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(product.id, product.name)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem', color: 'var(--danger-color)', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}
