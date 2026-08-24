'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, IndianRupee, ShoppingCart } from 'lucide-react';
import { Product } from '@prisma/client';

type CartItem = Product & { cartQuantity: number };

export default function BillingInterface({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<{ cart: CartItem[], saleId: string, total: number, date: Date } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setStoreSettings(data);
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stockQuantity) {
          alert('Cannot exceed available stock');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      if (product.stockQuantity <= 0) {
        alert('Product is out of stock');
        return prev;
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (newQty > item.stockQuantity) {
          alert('Cannot exceed available stock');
          return item;
        }
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0);

  const completeSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });
      
      if (!res.ok) throw new Error('Sale failed');
      const data = await res.json();
      
      setReceiptData({
        cart: [...cart],
        saleId: data.sale.id,
        total: totalAmount,
        date: new Date(data.sale.saleDate)
      });
      
      setCart([]);
    } catch (err) {
      alert('Error processing sale');
    } finally {
      setIsProcessing(false);
    }
  };

  if (receiptData) {
    return (
      <>
        {/* Hidden print-only receipt — identical to Sales History */}
        <div className="print-only" style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {storeSettings?.storeName || 'RETAIL SHOP'}
            </h2>
            {storeSettings?.address && (
              <p style={{ fontSize: '0.8rem', whiteSpace: 'pre-line' }}>{storeSettings.address}</p>
            )}
            {storeSettings?.phone && (
              <p style={{ fontSize: '0.8rem' }}>Ph: {storeSettings.phone}</p>
            )}
            {storeSettings?.gstNumber && (
              <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>GSTIN: {storeSettings.gstNumber}</p>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', margin: '0.75rem 0' }}>
            <p style={{ fontSize: '0.8rem' }}>Receipt #: {receiptData.saleId.split('-')[0].toUpperCase()}</p>
            <p style={{ fontSize: '0.8rem' }}>Date: {receiptData.date.toLocaleString()}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.3rem' }}>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.cart.map(item => (
                <tr key={item.id}>
                  <td style={{ paddingTop: '0.3rem' }}>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.cartQuantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.sellingPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
            <span>GRAND TOTAL:</span>
            <span>₹{receiptData.total.toFixed(2)}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem' }}>
            <p>*** Thank You! Visit Again! ***</p>
          </div>
        </div>

        {/* On-screen preview modal — identical to Sales History */}
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <span style={{ fontSize: '1.75rem' }}>✅</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {storeSettings?.storeName || 'RETAIL SHOP'}
              </h2>
              {storeSettings?.address && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{storeSettings.address}</p>}
              {storeSettings?.phone && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ph: {storeSettings.phone}</p>}
              {storeSettings?.gstNumber && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GSTIN: {storeSettings.gstNumber}</p>}
            </div>

            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Receipt #</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{receiptData.saleId.split('-')[0].toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                <span>{receiptData.date.toLocaleString()}</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.cart.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0' }}>{item.name}</td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0', color: 'var(--text-secondary)' }}>{item.cartQuantity}</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0', color: 'var(--text-secondary)' }}>₹{item.sellingPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0', fontWeight: 600 }}>₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, padding: '0.75rem 0', borderTop: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{receiptData.total.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                New Sale
              </button>
              <button
                onClick={() => window.print()}
                style={{ flex: 2, padding: '0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .billing-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          height: calc(100vh - 150px);
        }
        .billing-products-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .billing-cart-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #F9FAFB;
        }
        .billing-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          align-content: start;
        }
        @media (max-width: 768px) {
          .billing-layout {
            grid-template-columns: 1fr;
            height: auto;
          }
          .billing-products-panel {
            height: auto;
            max-height: 55vh;
          }
          .billing-cart-panel {
            height: auto;
            max-height: 60vh;
          }
          .billing-product-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
        @media (max-width: 480px) {
          .billing-product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="billing-layout">
        {/* Products Section */}
        <div className="card billing-products-panel">
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="input"
              style={{ paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="billing-product-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    backgroundColor: product.stockQuantity === 0 ? '#F3F4F6' : 'white',
                    opacity: product.stockQuantity === 0 ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (product.stockQuantity > 0) e.currentTarget.style.borderColor = 'var(--primary-color)';
                  }}
                  onMouseOut={(e) => {
                    if (product.stockQuantity > 0) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{product.category}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success-color)', fontSize: '0.9rem' }}>₹{product.sellingPrice}</span>
                    <span style={{ fontSize: '0.78rem', color: product.stockQuantity <= product.minStock ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                      {product.stockQuantity} {product.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Cart Section */}
        <div className="card billing-cart-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Current Bill
            {cart.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem' }}>
                {cart.length}
              </span>
            )}
          </h3>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto', opacity: 0.2 }} />
                <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₹{item.sellingPrice} × {item.cartQuantity}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                    <button className="btn" onClick={() => updateQuantity(item.id, -1)} style={{ padding: '0.25rem', backgroundColor: '#F3F4F6' }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center', fontSize: '0.875rem' }}>{item.cartQuantity}</span>
                    <button className="btn" onClick={() => updateQuantity(item.id, 1)} style={{ padding: '0.25rem', backgroundColor: '#F3F4F6' }}><Plus size={14} /></button>
                    <button className="btn" onClick={() => removeFromCart(item.id)} style={{ padding: '0.25rem', color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grand Total</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
              onClick={completeSale}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale & Print Bill'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
