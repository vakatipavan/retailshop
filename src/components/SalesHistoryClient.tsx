'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Printer, X, ChevronUp, ChevronDown, ArrowUpDown, Calendar } from 'lucide-react';

type SaleItem = {
  id: string;
  quantity: number;
  price: number;
  cost: number;
  product: { name: string; unit: string };
};

type Sale = {
  id: string;
  totalAmount: number;
  totalCost: number;
  profit: number;
  saleDate: string;
  items: SaleItem[];
};

type StoreSettings = {
  storeName: string;
  address: string;
  phone: string;
  gstNumber: string;
} | null;

type SortKey = 'saleDate' | 'totalAmount' | 'profit';
type SortDir = 'asc' | 'desc';

export default function SalesHistoryClient({
  sales,
  storeSettings,
}: {
  sales: Sale[];
  storeSettings: StoreSettings;
}) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('saleDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...sales];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.items.some(i => i.product.name.toLowerCase().includes(q))
      );
    }

    if (filterDate) {
      result = result.filter(s => {
        const sDate = format(new Date(s.saleDate), 'yyyy-MM-dd');
        return sDate === filterDate;
      });
    }

    result.sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'saleDate') {
        av = new Date(a.saleDate).getTime();
        bv = new Date(b.saleDate).getTime();
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return result;
  }, [sales, search, filterDate, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const thStyle = (col: SortKey): React.CSSProperties => ({
    padding: '0.85rem 1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: sortKey === col ? '#F0F4FF' : '#F9FAFB',
  });

  const handlePrint = (sale: Sale) => {
    setPrintSale(sale);
    // Trigger print after a tick for the modal to render
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      {/* Print-only receipt */}
      {printSale && (
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
            <p style={{ fontSize: '0.8rem' }}>Receipt #: {printSale.id.split('-')[0].toUpperCase()}</p>
            <p style={{ fontSize: '0.8rem' }}>Date: {format(new Date(printSale.saleDate), 'dd MMM yyyy, h:mm a')}</p>
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
              {printSale.items.map(item => (
                <tr key={item.id}>
                  <td style={{ paddingTop: '0.3rem' }}>{item.product.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
            <span>GRAND TOTAL:</span>
            <span>₹{printSale.totalAmount.toFixed(2)}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem' }}>
            <p>*** Thank You! Visit Again! ***</p>
          </div>
        </div>
      )}

      {/* Print receipt modal (visible on screen only) */}
      {printSale && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setPrintSale(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Printer size={28} color="var(--primary-color)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{storeSettings?.storeName || 'RETAIL SHOP'}</h2>
              {storeSettings?.address && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{storeSettings.address}</p>}
              {storeSettings?.phone && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ph: {storeSettings.phone}</p>}
              {storeSettings?.gstNumber && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GSTIN: {storeSettings.gstNumber}</p>}
            </div>

            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Receipt #</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{printSale.id.split('-')[0].toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                <span>{format(new Date(printSale.saleDate), 'dd MMM yyyy, h:mm a')}</span>
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
                {printSale.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 0' }}>{item.product.name}</td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0', color: 'var(--text-secondary)' }}>₹{item.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0', fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, padding: '0.75rem 0', borderTop: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{printSale.totalAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setPrintSale(null)}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ flex: 2, padding: '0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Printer size={18} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="no-print card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by Bill ID or product name..."
              className="input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="date"
              className="input"
              style={{ width: 'auto', fontSize: '0.875rem' }}
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {filtered.length} sale{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th onClick={() => handleSort('saleDate')} style={thStyle('saleDate')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Date & Time <SortIcon col="saleDate" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, backgroundColor: '#F9FAFB' }}>
                  Bill ID
                </th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, backgroundColor: '#F9FAFB' }}>
                  Items
                </th>
                <th onClick={() => handleSort('totalAmount')} style={thStyle('totalAmount')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Total <SortIcon col="totalAmount" />
                  </div>
                </th>
                <th onClick={() => handleSort('profit')} style={thStyle('profit')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Profit <SortIcon col="profit" />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, backgroundColor: '#F9FAFB' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No sales found.
                  </td>
                </tr>
              ) : (
                filtered.map(sale => (
                  <tr
                    key={sale.id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      {format(new Date(sale.saleDate), 'dd MMM yyyy')}<br />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{format(new Date(sale.saleDate), 'h:mm a')}</span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {sale.id.split('-')[0].toUpperCase()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {sale.items.map(item => (
                        <div key={item.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {item.product.name} <span style={{ color: '#6B7280' }}>× {item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, fontSize: '1rem' }}>
                      ₹{sale.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '1rem',
                        fontSize: '0.85rem', fontWeight: 600,
                        color: sale.profit >= 0 ? '#065F46' : '#991B1B',
                        backgroundColor: sale.profit >= 0 ? '#ECFDF5' : '#FEF2F2'
                      }}>
                        ₹{sale.profit.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <button
                        onClick={() => handlePrint(sale)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.5rem 1rem',
                          background: 'var(--primary-color)', color: 'white',
                          border: 'none', borderRadius: '8px',
                          cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <Printer size={14} /> Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
