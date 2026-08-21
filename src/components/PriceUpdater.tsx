'use client';

import { useState } from 'react';
import { Product } from '@prisma/client';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

type Toast = { id: string; type: 'success' | 'error'; message: string };

export default function PriceUpdater({
  products: initialProducts,
  priceHistory: initialHistory,
}: {
  products: Product[];
  priceHistory: any[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [priceHistory, setPriceHistory] = useState<any[]>(initialHistory);
  const [newPrices, setNewPrices] = useState<Record<string, string>>({});
  const [newCosts, setNewCosts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleUpdate = async (product: Product) => {
    const rawPrice = newPrices[product.id];
    const rawCost = newCosts[product.id];
    
    if ((!rawPrice || rawPrice.trim() === '') && (!rawCost || rawCost.trim() === '')) {
      showToast('error', 'Please enter a new price or cost first.');
      return;
    }

    const newPrice = rawPrice ? parseFloat(rawPrice) : undefined;
    const newCost = rawCost ? parseFloat(rawCost) : undefined;

    if (newPrice !== undefined && (isNaN(newPrice) || newPrice <= 0)) {
      showToast('error', 'Selling price must be a positive number.');
      return;
    }
    
    if (newCost !== undefined && (isNaN(newCost) || newCost <= 0)) {
      showToast('error', 'Cost price must be a positive number.');
      return;
    }

    if (newPrice === product.sellingPrice && newCost === product.purchasePrice) {
      showToast('error', 'Prices are already at the given values.');
      return;
    }

    setUpdatingId(product.id);
    try {
      const payload: any = {};
      if (newPrice !== undefined) payload.sellingPrice = newPrice;
      if (newCost !== undefined) payload.purchasePrice = newCost;

      const res = await fetch(`/api/products/${product.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }

      const { product: updated } = await res.json();

      // Update local state so UI reflects new price immediately
      setProducts(prev =>
        prev.map(p => {
          if (p.id === product.id) {
            return { 
              ...p, 
              sellingPrice: newPrice !== undefined ? newPrice : p.sellingPrice,
              purchasePrice: newCost !== undefined ? newCost : p.purchasePrice 
            };
          }
          return p;
        })
      );

      // Prepend to local price history only if selling price changed
      if (newPrice !== undefined && newPrice !== product.sellingPrice) {
        setPriceHistory(prev => [
          {
            id: Date.now().toString(),
            product: { name: product.name },
            previousPrice: product.sellingPrice,
            newPrice,
            updateDate: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // Clear the inputs
      setNewPrices(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setNewCosts(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });

      showToast('success', `${product.name} prices updated successfully!`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update price');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.75rem 1.25rem', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            backgroundColor: t.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${t.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: t.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: 500, fontSize: '0.875rem',
            animation: 'fadeIn 0.2s ease',
          }}>
            {t.type === 'success'
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />}
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Price Update Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Update Today's Prices</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              {products.length} products
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
                  {['Product Name', 'Category', 'Current Price', 'Stock', 'New Cost (₹)', 'New Selling (₹)', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const draft = newPrices[product.id];
                  const draftNum = draft ? parseFloat(draft) : NaN;
                  const isHigher = !isNaN(draftNum) && draftNum > product.sellingPrice;
                  const isLower = !isNaN(draftNum) && draftNum < product.sellingPrice;
                  const isUpdating = updatingId === product.id;

                  return (
                    <tr key={product.id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600 }}>{product.name}</td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{ backgroundColor: '#EEF2FF', color: 'var(--primary-color)', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 500 }}>
                          {product.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>₹{product.sellingPrice.toFixed(2)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cost: ₹{product.purchasePrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {product.stockQuantity} {product.unit}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder={product.purchasePrice.toFixed(2)}
                            value={newCosts[product.id] || ''}
                            onChange={e => setNewCosts(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleUpdate(product)}
                            style={{
                              width: '100px', padding: '0.55rem 0.75rem 0.55rem 1.6rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px', fontSize: '0.9rem', outline: 'none',
                              fontFamily: 'inherit', backgroundColor: 'white',
                              transition: 'border-color 0.15s'
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder={product.sellingPrice.toFixed(2)}
                              value={newPrices[product.id] || ''}
                              onChange={e => setNewPrices(prev => ({ ...prev, [product.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleUpdate(product)}
                              style={{
                                width: '100px', padding: '0.55rem 0.75rem 0.55rem 1.6rem',
                                border: `2px solid ${draft ? (isHigher ? '#10B981' : isLower ? '#EF4444' : 'var(--primary-color)') : 'var(--border-color)'}`,
                                borderRadius: '8px', fontSize: '0.9rem', outline: 'none',
                                fontFamily: 'inherit', backgroundColor: 'white',
                                transition: 'border-color 0.15s'
                              }}
                            />
                          </div>
                          {/* Price direction indicator */}
                          {!isNaN(draftNum) && draft && (
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, color: isHigher ? 'var(--success-color)' : isLower ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                              {isHigher ? <TrendingUp size={14} /> : isLower ? <TrendingDown size={14} /> : null}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <button
                          onClick={() => handleUpdate(product)}
                          disabled={updatingId !== null}
                          style={{
                            padding: '0.55rem 1.25rem',
                            backgroundColor: updatingId !== null ? '#E5E7EB' : 'var(--primary-color)',
                            color: updatingId !== null ? '#9CA3AF' : 'white',
                            border: 'none', borderRadius: '8px', fontWeight: 600,
                            cursor: updatingId !== null ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem', transition: 'background 0.15s', whiteSpace: 'nowrap'
                          }}
                        >
                          {isUpdating ? 'Saving…' : 'Update Price'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No products found. Add products first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            💡 Tip: Press <kbd style={{ padding: '0.1rem 0.4rem', border: '1px solid #E5E7EB', borderRadius: '4px', backgroundColor: 'white' }}>Enter</kbd> in the price field to update quickly. Updated prices reflect immediately in the Billing / POS terminal.
          </div>
        </div>

        {/* Price History */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Price Update History</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
                  {['Date & Time', 'Product', 'Previous Price', 'New Price', 'Change'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No price updates recorded yet.
                    </td>
                  </tr>
                ) : (
                  priceHistory.map(h => {
                    const diff = h.newPrice - h.previousPrice;
                    const pct = ((diff / h.previousPrice) * 100).toFixed(1);
                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {format(new Date(h.updateDate), 'dd MMM yyyy, h:mm a')}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600 }}>{h.product.name}</td>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)' }}>₹{h.previousPrice.toFixed(2)}</td>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--success-color)' }}>₹{h.newPrice.toFixed(2)}</td>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '1rem',
                            color: diff >= 0 ? '#065F46' : '#991B1B',
                            backgroundColor: diff >= 0 ? '#ECFDF5' : '#FEF2F2'
                          }}>
                            {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {diff >= 0 ? '+' : ''}{pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
