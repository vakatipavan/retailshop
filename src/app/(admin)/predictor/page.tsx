import Header from '@/components/Header';
import SalesPredictorClient from '@/components/SalesPredictorClient';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getPredictionData() {
  try {
    const host = headers().get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const res = await fetch(`${protocol}://${host}/api/predict`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Server side prediction fetch failed:', err);
  }

  return {
    summary: {
      totalProducts: 0,
      totalPredicted30DaySales: 0,
      totalRecommendedBuyItems: 0,
      totalRestockInvestmentRequired: 0,
      criticalRiskCount: 0,
      warningRiskCount: 0,
    },
    aiInsight: 'Loading initial predictions...',
    predictions: [],
  };
}

export default async function PredictorPage() {
  const data = await getPredictionData();

  return (
    <div>
      <Header title="Smart Sales Predictor & Restock Advisor" />
      <SalesPredictorClient initialData={data} />
    </div>
  );
}
