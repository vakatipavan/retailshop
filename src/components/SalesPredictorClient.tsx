'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, AlertTriangle, CheckCircle, 
  Sparkles, RefreshCw, IndianRupee, ArrowRight, ShieldAlert, PackagePlus, Filter
} from 'lucide-react';

type PredictionItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  unit: string;
  unitsSold30Days: number;
  dailySalesRate: number;
  predicted7DayDemand: number;
  predicted30DayDemand: number;
  recommendedBuyQty: number;
  estimatedRestockCost: number;
  daysOfStockLeft: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
};

type PredictorData = {
  summary: {
    totalProducts: number;
    totalPredicted30DaySales: number;
    totalRecommendedBuyItems: number;
    totalRestockInvestmentRequired: number;
    criticalRiskCount: number;
    warningRiskCount: number;
  };
  aiInsight: string;
  predictions: PredictionItem[];
};

export default function SalesPredictorClient({ initialData }: { initialData: PredictorData }) {
  const [data, setData] = useState<PredictorData>(initialData);
  const [loading, setLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'REORDER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to refresh prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = data.predictions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterRisk === 'CRITICAL') return p.riskLevel === 'CRITICAL';
    if (filterRisk === 'WARNING') return p.riskLevel === 'WARNING';
    if (filterRisk === 'REORDER') return p.recommendedBuyQty > 0;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* AI Smart Executive Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
        borderRadius: '16px',
        padding: '1.75rem',
        color: 'white',
        boxShadow: '0 10px 30px rgba(79,70,229,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
              <Sparkles size={22} color="#FDE047" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Groq AI Sales Forecaster & Buying Advisor</h2>
              <p style={{ fontSize: '0.85rem', color: '#C7D2FE', margin: 0 }}>Real-time demand prediction & intelligent purchasing recommendations</p>
            </div>
          </div>
          <button 
            onClick={refreshData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px',
              color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing Store Data...' : 'Refresh AI Insights'}
          </button>
        </div>

        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '1.25rem',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.92rem',
          lineHeight: 1.6
        }}>
          <div style={{ color: '#E0E7FF', whiteSpace: 'pre-line' }}>
            {data.aiInsight}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
        
        {/* Forecasted Sales */}
        <div className="card" style={{ borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Predicted 30-Day Sales</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#EEF2FF', borderRadius: '8px', color: '#4F46E5' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            ₹{data.summary.totalPredicted30DaySales.toFixed(2)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on 30-day sales velocity</span>
        </div>

        {/* Recommended Buy Items */}
        <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Units To Reorder</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#ECFDF5', borderRadius: '8px', color: '#10B981' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', margin: 0 }}>
            {data.summary.totalRecommendedBuyItems} <span style={{ fontSize: '1rem', fontWeight: 500 }}>units</span>
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Optimal quantity to buy now</span>
        </div>

        {/* Reorder Investment Budget */}
        <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Est. Purchasing Cost</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#FEF3C7', borderRadius: '8px', color: '#D97706' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', margin: 0 }}>
            ₹{data.summary.totalRestockInvestmentRequired.toFixed(2)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated cost at cost price</span>
        </div>

        {/* Critical Stockout Alert */}
        <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Critical Stockout Risk</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#EF4444' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', margin: 0 }}>
            {data.summary.criticalRiskCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>items</span>
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Needs immediate restocking</span>
        </div>

      </div>

      {/* Main Prediction & Purchase Recommendation Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Controls Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Item Sales Forecast & Purchase Recommendations</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Calculates predicted demand and exact number of items to buy to maintain optimal inventory
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <input 
              type="text"
              placeholder="Search product..."
              className="input"
              style={{ width: '200px', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            {/* Filter Pills */}
            <div style={{ display: 'flex', backgroundColor: '#F3F4F6', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                onClick={() => setFilterRisk('ALL')}
                style={{
                  padding: '0.35rem 0.75rem', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filterRisk === 'ALL' ? 'white' : 'transparent',
                  color: filterRisk === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: filterRisk === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                All ({data.predictions.length})
              </button>

              <button
                onClick={() => setFilterRisk('REORDER')}
                style={{
                  padding: '0.35rem 0.75rem', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filterRisk === 'REORDER' ? 'white' : 'transparent',
                  color: filterRisk === 'REORDER' ? '#059669' : 'var(--text-secondary)',
                  boxShadow: filterRisk === 'REORDER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Needs Reorder ({data.predictions.filter(p => p.recommendedBuyQty > 0).length})
              </button>

              <button
                onClick={() => setFilterRisk('CRITICAL')}
                style={{
                  padding: '0.35rem 0.75rem', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filterRisk === 'CRITICAL' ? 'white' : 'transparent',
                  color: filterRisk === 'CRITICAL' ? '#DC2626' : 'var(--text-secondary)',
                  boxShadow: filterRisk === 'CRITICAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Critical Risk ({data.summary.criticalRiskCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)' }}>
                {['Item & Category', 'Current Stock', 'Sales Velocity', '30-Day Demand Forecast', 'Recommended To Buy 🛒', 'Est. Purchase Cost', 'Stock Risk', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '0.85rem 1.25rem', color: 'var(--text-secondary)',
                    fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No products match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredPredictions.map(item => {
                  return (
                    <tr 
                      key={item.id} 
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Product Name & SKU */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.1rem' }}>
                          <span style={{ backgroundColor: '#F3F4F6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{item.category}</span>
                          <span>SKU: {item.sku}</span>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: item.stockQuantity === 0 ? '#DC2626' : 'inherit' }}>
                          {item.stockQuantity} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{item.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min stock: {item.minStock}</div>
                      </td>

                      {/* Sales Velocity */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {item.dailySalesRate} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>units/day</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.unitsSold30Days} sold in last 30d
                        </div>
                      </td>

                      {/* 30-Day Forecasted Demand */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#4F46E5' }}>
                          ~{item.predicted30DayDemand} {item.unit}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ~{item.predicted7DayDemand} units / 7 days
                        </div>
                      </td>

                      {/* RECOMMENDED BUY QUANTITY */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {item.recommendedBuyQty > 0 ? (
                          <div style={{
                            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                            backgroundColor: '#ECFDF5', border: '1.5px solid #059669',
                            padding: '0.35rem 0.85rem', borderRadius: '10px'
                          }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>
                              + {item.recommendedBuyQty} {item.unit}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>
                              Recommended To Buy
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            backgroundColor: '#F3F4F6', color: '#6B7280',
                            padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600
                          }}>
                            <CheckCircle size={14} color="#10B981" /> Stock Sufficient
                          </span>
                        )}
                      </td>

                      {/* Est. Purchase Cost */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: item.estimatedRestockCost > 0 ? '#D97706' : 'var(--text-secondary)' }}>
                          ₹{item.estimatedRestockCost.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          @ ₹{item.purchasePrice.toFixed(2)}/unit
                        </div>
                      </td>

                      {/* Stock Risk Indicator */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {item.riskLevel === 'CRITICAL' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5',
                            padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700
                          }}>
                            <ShieldAlert size={14} /> Out of Stock ({item.daysOfStockLeft}d left)
                          </span>
                        )}

                        {item.riskLevel === 'WARNING' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D',
                            padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700
                          }}>
                            <AlertTriangle size={14} /> Low Stock ({item.daysOfStockLeft}d left)
                          </span>
                        )}

                        {item.riskLevel === 'HEALTHY' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #6EE7B7',
                            padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600
                          }}>
                            <CheckCircle size={14} /> Healthy ({item.daysOfStockLeft}d left)
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <Link
                          href={`/inventory/${item.id}/add`}
                          className="btn btn-primary"
                          style={{
                            padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            textDecoration: 'none', borderRadius: '8px', whiteSpace: 'nowrap'
                          }}
                        >
                          <PackagePlus size={15} /> Buy / Restock
                        </Link>
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
  );
}
