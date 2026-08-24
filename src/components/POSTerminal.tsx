'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Product, ProductVariant } from '@prisma/client';
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  Printer, CheckCircle2, X, Tag, Layers
} from 'lucide-react';

type ProductWithVariants = Product & { variants?: ProductVariant[] };

type CartItem = {
  cartId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  cartQuantity: number;
  unit: string;
};

type Receipt = { id: string; cart: CartItem[]; total: number; date: Date };
type Category = 'All' | string;

export default function POSTerminal({ products: initialProducts }: { products: ProductWithVariants[] }) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');
  const searchRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, [receipt]);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants?.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addVariantToCart = useCallback((product: ProductWithVariants, variant: ProductVariant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (variant.stockQuantity <= 0) {
      alert('This packet size is out of stock!');
      return;
    }

    const cartId = `${product.id}_${variant.id}`;
    const displayName = `${product.name} (${variant.name})`;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        if (existing.cartQuantity >= variant.stockQuantity) return prev;
        return prev.map(i => i.cartId === cartId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, {
        cartId,
        productId: product.id,
        variantId: variant.id,
        name: displayName,
        sku: variant.sku,
        category: product.category,
        purchasePrice: variant.purchasePrice,
        sellingPrice: variant.sellingPrice,
        stockQuantity: variant.stockQuantity,
        cartQuantity: 1,
        unit: product.unit
      }];
    });

    setSearchTerm('');
  }, []);

  const addStandardProductToCart = useCallback((product: ProductWithVariants) => {
    if (product.stockQuantity <= 0) return;
    const cartId = product.id;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        if (existing.cartQuantity >= product.stockQuantity) return prev;
        return prev.map(i => i.cartId === cartId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, {
        cartId,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        cartQuantity: 1,
        unit: product.unit
      }];
    });

    setSearchTerm('');
  }, []);

  const changeQty = (cartId: string, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.cartId !== cartId) return [item];
      const newQty = item.cartQuantity + delta;
      if (newQty <= 0) return [];
      if (newQty > item.stockQuantity) return [item];
      return [{ ...item, cartQuantity: newQty }];
    }));
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(i => i.cartId !== cartId));

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

      // Local stock deduction update
      setProducts(prev => prev.map(p => {
        let updatedP = { ...p };
        if (p.variants && p.variants.length > 0) {
          updatedP.variants = p.variants.map(v => {
            const sold = cart.find(c => c.variantId === v.id);
            return sold ? { ...v, stockQuantity: v.stockQuantity - sold.cartQuantity } : v;
          });
        } else {
          const sold = cart.find(c => c.productId === p.id && !c.variantId);
          if (sold) updatedP.stockQuantity = p.stockQuantity - sold.cartQuantity;
        }
        return updatedP;
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
          <div style={{ background: '#4F46E5', padding: '1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="white" style={{ margin: '0 auto 0.5rem' }} />
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Sale Complete!</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
              Receipt #{receipt.id.split('-')[0].toUpperCase()}
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {receipt.date.toLocaleString('en-IN')}
            </p>
            <div style={{ border: '1px dashed #E2E8F0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              {receipt.cart.map(item => (
                <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      ×{item.cartQuantity}
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

  return (
    <>
      <style>{`
        .pos-container {
          display: flex;
          height: calc(100vh - 55px);
          overflow: hidden;
          background-color: #0F172A;
        }
        .pos-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #1E293B;
          overflow: hidden;
          min-width: 0;
        }
        .pos-right {
          width: 360px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background-color: #1E293B;
        }
        .pos-mobile-nav {
          display: none;
        }
        .pos-mobile-cart-bar {
          display: none;
        }

        .variant-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.6rem;
          border-radius: 8px;
          border: 1px solid #334155;
          background-color: #0F172A;
          color: white;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .variant-chip:hover {
          border-color: #4F46E5;
          background-color: #1E1B4B;
        }
        .variant-chip.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .pos-container {
            flex-direction: column;
            height: calc(100vh - 55px);
          }
          .pos-mobile-nav {
            display: flex;
            background-color: #1E293B;
            border-bottom: 1px solid #334155;
            padding: 0.5rem;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .pos-mobile-nav button {
            flex: 1;
            padding: 0.6rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.875rem;
            color: #94A3B8;
            background: transparent;
            border: 1px solid #334155;
          }
          .pos-mobile-nav button.active {
            background: #4F46E5;
            color: white;
            border-color: #4F46E5;
          }
          .pos-left {
            display: ${mobileTab === 'products' ? 'flex' : 'none'};
            border-right: none;
            height: 100%;
          }
          .pos-right {
            display: ${mobileTab === 'cart' ? 'flex' : 'none'};
            width: 100%;
            height: 100%;
          }
          .pos-mobile-cart-bar {
            display: ${mobileTab === 'products' && cart.length > 0 ? 'flex' : 'none'};
            position: fixed;
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            background: #4F46E5;
            color: white;
            padding: 0.85rem 1.25rem;
            border-radius: 12px;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 100;
            font-weight: 600;
          }
        }
      `}</style>

      <div className="pos-container">
        {/* Mobile Tab Switcher */}
        <div className="pos-mobile-nav">
          <button
            className={mobileTab === 'products' ? 'active' : ''}
            onClick={() => setMobileTab('products')}
          >
            📦 Products ({filtered.length})
          </button>
          <button
            className={mobileTab === 'cart' ? 'active' : ''}
            onClick={() => setMobileTab('cart')}
          >
            🛒 Cart ({cart.length}) • ₹{subtotal.toFixed(0)}
          </button>
        </div>

        {/* LEFT: Product Browser */}
        <div className="pos-left">
          {/* Search + Filters */}
          <div style={{ padding: '0.85rem 1rem', backgroundColor: '#1E293B', borderBottom: '1px solid #334155', flexShrink: 0 }}>
            <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search product, size (50g), or barcode…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 1rem 0.65rem 2.75rem', borderRadius: '8px',
                  border: '1px solid #334155', backgroundColor: '#0F172A', color: 'white',
                  fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif'
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

          {/* Product Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', paddingBottom: cart.length > 0 ? '5rem' : '0.85rem' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#64748B' }}>
                <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No products found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                {filtered.map(product => {
                  const hasVar = product.variants && product.variants.length > 0;
                  const inCartCount = cart
                    .filter(i => i.productId === product.id)
                    .reduce((acc, i) => acc + i.cartQuantity, 0);

                  if (hasVar && product.variants) {
                    return (
                      <div
                        key={product.id}
                        style={{
                          padding: '0.85rem', borderRadius: '12px',
                          backgroundColor: '#1E293B', border: '2px solid #334155',
                          display: 'flex', flexDirection: 'column', gap: '0.6rem',
                          position: 'relative'
                        }}
                      >
                        {inCartCount > 0 && (
                          <div style={{
                            position: 'absolute', top: '0.4rem', right: '0.4rem',
                            backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%',
                            width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700
                          }}>
                            {inCartCount}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                            <Tag size={11} color="#64748B" />
                            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{product.category}</span>
                          </div>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>{product.name}</p>
                          <span style={{ fontSize: '0.7rem', color: '#818CF8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <Layers size={11} /> Tap packet size to add:
                          </span>
                        </div>

                        {/* Direct Size Chips (Instant Add) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {product.variants.map(v => {
                            const outOfStock = v.stockQuantity <= 0;
                            const variantInCart = cart.find(c => c.variantId === v.id);

                            return (
                              <button
                                key={v.id}
                                disabled={outOfStock}
                                onClick={(e) => addVariantToCart(product, v, e)}
                                className={`variant-chip ${outOfStock ? 'disabled' : ''}`}
                                style={{
                                  backgroundColor: variantInCart ? '#1E3A5F' : '#0F172A',
                                  borderColor: variantInCart ? '#3B82F6' : '#334155',
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <span>{v.name}</span>
                                  {variantInCart && (
                                    <span style={{ backgroundColor: '#3B82F6', color: 'white', padding: '0.05rem 0.4rem', borderRadius: '10px', fontSize: '0.68rem' }}>
                                      {variantInCart.cartQuantity}
                                    </span>
                                  )}
                                </span>

                                <span style={{ color: outOfStock ? '#EF4444' : '#4ADE80', fontWeight: 700 }}>
                                  {outOfStock ? 'Out' : `₹${v.sellingPrice}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Single Standard Product
                  const outOfStock = product.stockQuantity <= 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addStandardProductToCart(product)}
                      disabled={outOfStock}
                      style={{
                        textAlign: 'left', padding: '0.85rem', borderRadius: '12px', border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
                        backgroundColor: inCartCount > 0 ? '#1E3A5F' : '#1E293B',
                        borderWidth: '2px', borderStyle: 'solid',
                        borderColor: inCartCount > 0 ? '#3B82F6' : outOfStock ? '#334155' : '#334155',
                        opacity: outOfStock ? 0.5 : 1, transition: 'all 0.15s',
                        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}
                    >
                      {inCartCount > 0 && (
                        <div style={{
                          position: 'absolute', top: '0.4rem', right: '0.4rem',
                          backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%',
                          width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700
                        }}>
                          {inCartCount}
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                          <Tag size={11} color="#64748B" />
                          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{product.category}</span>
                        </div>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.2 }}>{product.name}</p>
                      </div>

                      <div>
                        <p style={{ color: '#4ADE80', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>₹{product.sellingPrice}</p>
                        <p style={{ fontSize: '0.68rem', color: outOfStock ? '#EF4444' : product.stockQuantity <= product.minStock ? '#F59E0B' : '#64748B' }}>
                          {outOfStock ? '❌ Out of stock' : `${product.stockQuantity} ${product.unit} left`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Mobile Cart Bar */}
          <div className="pos-mobile-cart-bar" onClick={() => setMobileTab('cart')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} />
              <span>{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
            </div>
            <div>
              <span>View Cart • ₹{subtotal.toFixed(2)} →</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Cart / Bill */}
        <div className="pos-right">
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
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Tap a product to add</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {cart.map((item) => (
                  <div key={item.cartId} style={{
                    backgroundColor: '#0F172A', borderRadius: '10px', padding: '0.75rem 1rem',
                    border: '1px solid #334155'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{item.name}</p>
                        <p style={{ color: '#64748B', fontSize: '0.75rem' }}>₹{item.sellingPrice}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.cartId)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', marginLeft: '0.5rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => changeQty(item.cartId, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#334155', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ color: 'white', fontWeight: 700, width: '30px', textAlign: 'center' }}>{item.cartQuantity}</span>
                        <button onClick={() => changeQty(item.cartId, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#334155', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            {cart.length > 0 && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {cart.map(item => (
                  <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8' }}>
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
    </>
  );
}
