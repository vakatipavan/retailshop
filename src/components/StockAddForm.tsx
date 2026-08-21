'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@prisma/client';
import { PackagePlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StockAddForm({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Stock Refill');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/${product.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add stock');
      }

      router.push('/inventory');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error adding stock. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Link href="/inventory" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back to Inventory
      </Link>

      {/* Current Stock Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '1rem' }}>Current Stock Information</h3>
        <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>SKU</p>
            <p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{product.sku}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Category</p>
            <p style={{ fontWeight: 600 }}>{product.category}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Stock</p>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: product.stockQuantity <= product.minStock ? 'var(--danger-color)' : 'var(--success-color)' }}>
              {product.stockQuantity} {product.unit}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Purchase Price</p>
            <p style={{ fontWeight: 600 }}>₹{product.purchasePrice.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Selling Price</p>
            <p style={{ fontWeight: 600 }}>₹{product.sellingPrice.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Min Stock Level</p>
            <p style={{ fontWeight: 600 }}>{product.minStock} {product.unit}</p>
          </div>
        </div>
      </div>

      {/* Add Stock Form */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PackagePlus size={20} color="var(--primary-color)" /> Add New Stock
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 500 }}>Quantity to Add ({product.unit})</label>
            <input
              type="number"
              min="1"
              required
              className="input"
              placeholder={`Enter quantity in ${product.unit}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
            />
            {quantity && parseInt(quantity) > 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--success-color)', fontWeight: 500 }}>
                New stock after adding: {product.stockQuantity + parseInt(quantity)} {product.unit}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 500 }}>Reason / Notes</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="Stock Refill">Stock Refill</option>
              <option value="Initial Stock">Initial Stock</option>
              <option value="Return from Customer">Return from Customer</option>
              <option value="Correction / Adjustment">Correction / Adjustment</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              {isSubmitting ? 'Adding Stock...' : 'Confirm Add Stock'}
            </button>
            <Link href="/inventory" className="btn" style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border-color)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
