'use client';

import { useState } from 'react';
import { Router, useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@prisma/client';
import { Plus, Trash2, Layers, Package, Scale } from 'lucide-react';

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
  const [productType, setProductType] = useState<'single' | 'variants'>(
    initialData?.variants && initialData.variants.length > 0 ? 'variants' : 'single'
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
          { name: '50g Packet', sku: '', purchasePrice: '', sellingPrice: '', stockQuantity: '' },
          { name: '100g Packet', sku: '', purchasePrice: '', sellingPrice: '', stockQuantity: '' },
          { name: '250g Packet', sku: '', purchasePrice: '', sellingPrice: '', stockQuantity: '' },
        ]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-update base SKU if name changes and SKU is blank/default
      if (name === 'name' && (!prev.sku || prev.sku.startsWith('SKU'))) {
        const cleanName = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
        if (cleanName) updated.sku = `${cleanName}-001`;
      }
      return updated;
    });
  };

  const handleVariantChange = (index: number, field: keyof VariantForm, value: string) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addPresetVariant = (presetName: string) => {
    const baseSKU = formData.sku || 'SKU';
    const cleanPreset = presetName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const newSku = `${baseSKU}-${cleanPreset}`;

    // Don't add duplicate presets if already present
    if (variants.some(v => v.name.toLowerCase() === presetName.toLowerCase())) {
      return;
    }

    setVariants(prev => [
      ...prev,
      { name: presetName, sku: newSku, purchasePrice: '', sellingPrice: '', stockQuantity: '' }
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

      const payloadVariants = productType === 'variants'
        ? variants.filter(v => v.name.trim() !== '' && v.sellingPrice !== '')
        : [];

      if (productType === 'variants' && payloadVariants.length === 0) {
        throw new Error('Please enter at least one weighted packet size with a selling price.');
      }

      // Auto assign variant SKUs if left empty
      const finalVariants = payloadVariants.map((v, idx) => {
        const baseSKU = formData.sku || 'SKU';
        const cleanName = v.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return {
          ...v,
          sku: v.sku.trim() || `${baseSKU}-${cleanName || (idx + 1)}`
        };
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice || '0'),
          sellingPrice: parseFloat(formData.sellingPrice || '0'),
          stockQuantity: parseInt(formData.stockQuantity || '0', 10),
          minStock: parseInt(formData.minStock || '5', 10),
          variants: finalVariants,
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
      
      {/* Product Type Selector Tabs */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <label style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
          Select Product Pricing & Weight Type:
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Single Standard Product Option */}
          <div
            onClick={() => setProductType('single')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: `2px solid ${productType === 'single' ? 'var(--primary-color)' : 'var(--border-color)'}`,
              backgroundColor: productType === 'single' ? '#EEF2FF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <input
                type="radio"
                name="productTypeRadio"
                checked={productType === 'single'}
                onChange={() => setProductType('single')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
              />
              <Package size={20} color={productType === 'single' ? 'var(--primary-color)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: productType === 'single' ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                Single Price Product
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '2rem', margin: 0 }}>
              Fixed price & unit (e.g. Soap 1pc, Detergent 1L bottle)
            </p>
          </div>

          {/* Multi-Weight Packets Option */}
          <div
            onClick={() => setProductType('variants')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: `2px solid ${productType === 'variants' ? '#059669' : 'var(--border-color)'}`,
              backgroundColor: productType === 'variants' ? '#ECFDF5' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <input
                type="radio"
                name="productTypeRadio"
                checked={productType === 'variants'}
                onChange={() => setProductType('variants')}
                style={{ width: '18px', height: '18px', accentColor: '#059669' }}
              />
              <Scale size={20} color={productType === 'variants' ? '#059669' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: productType === 'variants' ? '#047857' : 'var(--text-primary)' }}>
                Multi-Weight Packets (Different Prices)
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '2rem', margin: 0 }}>
              Weighted sizes (e.g. Mirchi Powder: 50g, 100g, 250g, 1kg packets)
            </p>
          </div>
        </div>
      </div>

      {/* Main Product Info Card */}
      <div className="card grid grid-cols-2" style={{ gap: '1.5rem' }}>
        <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Basic Product Details
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
            placeholder="e.g. Mirchi Powder / Red Chilli Powder"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>Main SKU / Barcode Prefix</label>
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
          <label style={{ fontWeight: 500 }}>Default Unit</label>
          <select required name="unit" value={formData.unit} onChange={handleChange} className="input">
            <option value="packets">Packets</option>
            <option value="grams">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="pieces">Pieces</option>
            <option value="litres">Litres (L)</option>
            <option value="boxes">Boxes</option>
          </select>
        </div>

        {/* Single product specific fields */}
        {productType === 'single' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Cost Price / Purchase (₹)</label>
              <input required type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input" placeholder="0.00" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Selling Price / MRP (₹)</label>
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
          </>
        )}
      </div>

      {/* Multi-Weight Packets Builder Section */}
      {productType === 'variants' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderColor: '#A7F3D0' }}>
          
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={22} /> Add Weighted Packets & Individual Prices
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Enter each packet weight (50g, 100g, 250g, 500g, 1kg) along with its cost price, selling price, and initial stock quantity.
            </p>

            {/* Quick Add Weight Preset Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.85rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quick add packet sizes:</span>
              {['50g Packet', '100g Packet', '250g Packet', '500g Packet', '1kg Packet'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addPresetVariant(preset)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid #059669',
                    backgroundColor: '#ECFDF5',
                    color: '#047857',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#D1FAE5'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid #A7F3D0' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>Packet Size / Weight</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>Cost Price (₹)</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>Selling Price / MRP (₹)</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>Initial Stock Qty</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>SKU / Barcode</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#065F46', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 50g Packet"
                        className="input"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontWeight: 600 }}
                        value={variant.name}
                        onChange={e => handleVariantChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="12.00"
                        className="input"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                        value={variant.purchasePrice}
                        onChange={e => handleVariantChange(idx, 'purchasePrice', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        className="input"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}
                        value={variant.sellingPrice}
                        onChange={e => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input
                        required
                        type="number"
                        placeholder="50"
                        className="input"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                        value={variant.stockQuantity}
                        onChange={e => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <input
                        type="text"
                        placeholder="MIRCHI-50G"
                        className="input"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}
                        value={variant.sku}
                        onChange={e => handleVariantChange(idx, 'sku', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          style={{ color: 'var(--danger-color)', padding: '0.35rem' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={() => addPresetVariant(`Custom Size ${variants.length + 1}`)}
              className="btn"
              style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', gap: '0.4rem', fontWeight: 600 }}
            >
              <Plus size={16} /> Add Custom Packet Row
            </button>
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
        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
          {isSubmitting ? 'Saving Product...' : 'Save Product & Packet Sizes'}
        </button>
      </div>

    </form>
  );
}
