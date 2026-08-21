'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@prisma/client';

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    purchasePrice: initialData?.purchasePrice || '',
    sellingPrice: initialData?.sellingPrice || '',
    stockQuantity: initialData?.stockQuantity || '',
    unit: initialData?.unit || 'pieces',
    minStock: initialData?.minStock || '5',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice as string),
          sellingPrice: parseFloat(formData.sellingPrice as string),
          stockQuantity: parseInt(formData.stockQuantity as string, 10),
          minStock: parseInt(formData.minStock as string, 10),
        })
      });

      if (!res.ok) throw new Error('Failed to save product');

      router.push('/products');
      router.refresh();
    } catch (error) {
      alert('Error saving product. Please check SKU uniqueness.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-2" style={{ gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Product Name</label>
        <input required name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. Aashirvaad Atta" />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>SKU / Barcode</label>
        <input required name="sku" value={formData.sku} onChange={handleChange} className="input" placeholder="e.g. ATTA-001" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Category</label>
        <input required name="category" value={formData.category} onChange={handleChange} className="input" placeholder="e.g. Groceries" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Unit</label>
        <select required name="unit" value={formData.unit} onChange={handleChange} className="input">
          <option value="pieces">Pieces</option>
          <option value="kg">Kilograms (kg)</option>
          <option value="grams">Grams (g)</option>
          <option value="litres">Litres (L)</option>
          <option value="packets">Packets</option>
          <option value="boxes">Boxes</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Purchase Price (₹)</label>
        <input required type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input" placeholder="0.00" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Selling Price (₹)</label>
        <input required type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="input" placeholder="0.00" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Initial Stock Quantity</label>
        <input required type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="input" placeholder="0" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 500 }}>Low Stock Alert Level</label>
        <input required type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="input" placeholder="5" />
      </div>

      <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
