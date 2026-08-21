'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Product } from '@prisma/client';
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  Printer, CheckCircle2, X, Tag, Grid, List, AlertTriangle
} from 'lucide-react';

type CartItem = Product & { cartQuantity: number };
type Receipt = { id: string; cart: CartItem[]; total: number; date: Date };

type Category = 'All' | string;

export default function POSTerminal({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, [receipt]);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addToCart = useCallback((product: Product) => {
    if (product.stockQuantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stockQuantity) return prev;
        return prev.map(i => i.id === product.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    setSearchTerm('');
  }, []);

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return [item];
      const newQty = item.cartQuantity + delta;
      if (newQty <= 0) return [];
      if (newQty > item.stockQuantity) return [item];
      return [{ ...item, cartQuantity: newQty }];
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.cartQuantity, 0);

  const completeSale = async () => {
    if (!cart.length || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      // Update local product stock quantities
      setProducts(prev => prev.map(p => {
        const sold = cart.find(c => c.id === p.id);
        return sold ? { ...p, stockQuantity: p.stockQuantity - sold.cartQuantity } : p;
      }));

      setReceipt({ id: data.sale.id, cart: [...cart], total: subtotal, date: new Date(data.sale.saleDate) });
      setCart([]);
    } catch {
      alert('Error completing sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Receipt view ──
  if (receipt) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div id="receipt-printable" style={{
          background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
        }}>
          {/* Receipt Header */}
          <div style={{ background: '#4F46E5', padding: '1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="white" style={{ margin: '0 auto 0.5rem' }} />
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Sale Complete!</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
              Receipt #{receipt.id.split('-')[0].toUpperCase()}
            </p>
          </div>

          {/* Receipt Body */}
          <div style={{ padding: '1.5rem' }}>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {receipt.date.toLocaleString('en-IN')}
            </p>
            <div style={{ border: '1px dashed #E2E8F0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              {receipt.cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      ×{item.cartQuantity} {item.unit}
                    </span>
                  </div>
                  <span style={{ fontWeight: 600 }}>₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <span>Grand Total</span>
              <span style={{ color: '#4F46E5' }}>₹{receipt.total.toFixed(2)}</span>
            </div>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              🙏 Thank You! Please Visit Again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Printer size={18} /> Print
              </button>
              <button
                onClick={() => { setReceipt(null); }}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main POS terminal ──
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 55px)', overflow: 'hidden' }}>

      {/* LEFT: Product Browser */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1E293B', overflow: 'hidden' }}>

        {/* Search + Filters */}
        <div style={{ padding: '1rem', backgroundColor: '#1E293B', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search or scan barcode…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '8px',
                border: '1px solid #334155', backgroundColor: '#0F172A', color: 'white',
                fontSize: '1rem', outline: 'none', fontFamily: 'Inter, sans-serif'
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
                  backgroundColor: selectedCategory === cat ? '#4F46E5' : '#334155',
                  color: selectedCategory === cat ? 'white' : '#94A3B8',
                  transition: 'all 0.15s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid/List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#64748B' }}>
              <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No products found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
              {filtered.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                const outOfStock = product.stockQuantity === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    style={{
                      textAlign: 'left', padding: '0.9rem', borderRadius: '10px', border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
                      backgroundColor: inCart ? '#1E3A5F' : '#1E293B',
                      borderWidth: '2px', borderStyle: 'solid',
                      borderColor: inCart ? '#3B82F6' : outOfStock ? '#334155' : '#334155',
                      opacity: outOfStock ? 0.5 : 1, transition: 'all 0.15s',
                      position: 'relative'
                    }}
                  >
                    {inCart && (
                      <div style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%',
                        width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        {inCart.cartQuantity}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <Tag size={12} color="#64748B" />
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{product.category}</span>
                    </div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.2 }}>{product.name}</p>
                    <p style={{ color: '#4ADE80', fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>₹{product.sellingPrice}</p>
                    <p style={{ fontSize: '0.7rem', color: outOfStock ? '#EF4444' : product.stockQuantity <= product.minStock ? '#F59E0B' : '#64748B' }}>
                      {outOfStock ? '❌ Out of stock' : `${product.stockQuantity} ${product.unit} left`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart / Bill */}
      <div style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#1E293B' }}>

        {/* Cart Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} color="#94A3B8" />
            <span style={{ color: 'white', fontWeight: 600 }}>Current Bill</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              style={{ color: '#EF4444', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <X size={14} /> Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '3rem', color: '#475569' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p style={{ fontSize: '0.9rem' }}>Cart is empty</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Tap a product or scan barcode to add</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cart.map((item, idx) => (
                <div key={item.id} style={{
                  backgroundColor: '#0F172A', borderRadius: '10px', padding: '0.75rem 1rem',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{item.name}</p>
                      <p style={{ color: '#64748B', fontSize: '0.75rem' }}>₹{item.sellingPrice} / {item.unit}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', marginLeft: '0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => changeQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#334155', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ color: 'white', fontWeight: 700, width: '30px', textAlign: 'center' }}>{item.cartQuantity}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#334155', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '1rem' }}>
                      ₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary + Checkout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #334155', flexShrink: 0 }}>
          {/* Item breakdown */}
          {cart.length > 0 && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8' }}>
                  <span>{item.name} ×{item.cartQuantity}</span>
                  <span>₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #334155', marginTop: '0.3rem', paddingTop: '0.3rem' }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Subtotal</span>
            <span style={{ color: 'white', fontWeight: 500 }}>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>Grand Total</span>
            <span style={{ color: '#4ADE80', fontWeight: 800, fontSize: '1.5rem' }}>₹{subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={completeSale}
            disabled={cart.length === 0 || isProcessing}
            style={{
              width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 700,
              backgroundColor: cart.length === 0 ? '#334155' : '#4F46E5',
              color: cart.length === 0 ? '#64748B' : 'white',
              border: 'none', borderRadius: '10px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            {isProcessing ? (
              <span>Processing…</span>
            ) : (
              <>
                <CheckCircle2 size={20} />
                {cart.length === 0 ? 'Add items to bill' : `Complete Sale • ₹${subtotal.toFixed(2)}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
