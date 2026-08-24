'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@prisma/client';
import { Plus, Trash2, Layers } from 'lucide-react';

type ProductWithVariants = Product & { variants?: ProductVariant[] };

interface VariantForm {
  id?: string;
  name: string;
  sku: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
}

export default function ProductForm({ initialData }: { initialData?: ProductWithVariants }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVariants, setHasVariants] = useState(
    initialData?.variants && initialData.variants.length > 0 ? true : false
  );

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    purchasePrice: initialData?.purchasePrice ? String(initialData.purchasePrice) : '',
    sellingPrice: initialData?.sellingPrice ? String(initialData.sellingPrice) : '',
    stockQuantity: initialData?.stockQuantity ? String(initialData.stockQuantity) : '',
    unit: initialData?.unit || 'packets',
    minStock: initialData?.minStock ? String(initialData.minStock) : '5',
  });

  const [variants, setVariants] = useState<VariantForm[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          purchasePrice: String(v.purchasePrice),
          sellingPrice: String(v.sellingPrice),
          stockQuantity: String(v.stockQuantity),
        }))
      : [
          { name: '50g', sku: '', purchasePrice: '', sellingPrice: '', stockQuantity: '' },
          { name: '100g', sku: '', purchasePrice: '', sellingPrice: '', stockQuantity: '' },
        ]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index: number, field: keyof VariantForm, value: string) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addVariantRow = () => {
    const baseSKU = formData.sku || 'SKU';
    const nextNum = variants.length + 1;
    setVariants(prev => [
      ...prev,
      { name: '', sku: `${baseSKU}-V${nextNum}`, purchasePrice: '', sellingPrice: '', stockQuantity: '' }
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
      const method = initialData ? 'PUT' : 'POST';

      const payloadVariants = hasVariants
        ? variants.filter(v => v.name.trim() !== '' && v.sellingPrice !== '')
        : [];

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice || '0'),
          sellingPrice: parseFloat(formData.sellingPrice || '0'),
          stockQuantity: parseInt(formData.stockQuantity || '0', 10),
          minStock: parseInt(formData.minStock || '5', 10),
          variants: payloadVariants,
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save product');
      }

      router.push('/products');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error saving product. Check SKU uniqueness.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Main Info Card */}
      <div className="card grid grid-cols-2" style={{ gap: '1.5rem' }}>
        <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Basic Product Information
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>Product Name</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="e.g. Mirchi Powder / Chilli Powder"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>Base SKU / Barcode</label>
          <input
            required
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="input"
            placeholder="e.g. MIRCHI-001"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>Category</label>
          <input
            required
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
            placeholder="e.g. Spices & Powders"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>Unit</label>
          <select required name="unit" value={formData.unit} onChange={handleChange} className="input">
            <option value="packets">Packets</option>
            <option value="grams">Grams / Packets</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="pieces">Pieces</option>
            <option value="litres">Litres (L)</option>
            <option value="boxes">Boxes</option>
          </select>
        </div>

        {!hasVariants && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Purchase Price (₹)</label>
              <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input" placeholder="0.00" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Selling Price (₹)</label>
              <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="input" placeholder="0.00" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Stock Quantity</label>
              <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="input" placeholder="0" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Low Stock Alert Level</label>
              <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="input" placeholder="5" />
            </div>
          </>
        )}
      </div>

      {/* Sub-Products / Packet Sizes Toggle Banner */}
      <div className="card" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '8px' }}>
              <Layers size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#1E1B4B' }}>
                Does this product have Sub-Sizes / Packet Variants?
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#4338CA', margin: '0.1rem 0 0 0' }}>
                Enable this to add 50g, 100g, 250g, 1kg packets with individual prices & stock.
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#3730A3' }}>
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={e => setHasVariants(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }}
            />
            Yes, add packet sizes / variants
          </label>
        </div>
      </div>

      {/* Packet Variants Builder Section */}
      {hasVariants && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sub-Products / Packet Sizes (e.g. 50g, 100g, 250g)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Set prices and stock for each weight or packet size
              </p>
            </div>

            <button
              type="button"
              onClick={addVariantRow}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.35rem' }}
            >
              <Plus size={16} /> Add Packet Size
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Size / Name</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SKU / Barcode</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cost Price (₹)</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Selling Price (₹)</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Stock Qty</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 50g Packet"
                        className="input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                        value={variant.name}
                        onChange={e => handleVariantChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        required
                        type="text"
                        placeholder="MIRCHI-50G"
                        className="input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                        value={variant.sku}
                        onChange={e => handleVariantChange(idx, 'sku', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        className="input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                        value={variant.purchasePrice}
                        onChange={e => handleVariantChange(idx, 'purchasePrice', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                        className="input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                        value={variant.sellingPrice}
                        onChange={e => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        placeholder="50"
                        className="input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                        value={variant.stockQuantity}
                        onChange={e => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          style={{ color: 'var(--danger-color)', padding: '0.35rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Submission Controls */}
      <div className="card" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn"
          style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Product & Packet Sizes'}
        </button>
      </div>

    </form>
  );
}
