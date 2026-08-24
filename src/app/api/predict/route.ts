import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [products, salesInLast30Days] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: { variants: true }
      }),
      prisma.sale.findMany({
        where: {
          saleDate: { gte: thirtyDaysAgo },
        },
        include: {
          items: true,
        },
      }),
    ]);

    // Map sales items by product ID or variant ID
    const sales30DaysByProduct: Record<string, { quantity: number; revenue: number }> = {};
    const sales30DaysByVariant: Record<string, { quantity: number; revenue: number }> = {};

    salesInLast30Days.forEach(sale => {
      sale.items.forEach(item => {
        if (item.variantId) {
          if (!sales30DaysByVariant[item.variantId]) {
            sales30DaysByVariant[item.variantId] = { quantity: 0, revenue: 0 };
          }
          sales30DaysByVariant[item.variantId].quantity += item.quantity;
          sales30DaysByVariant[item.variantId].revenue += item.price * item.quantity;
        } else {
          if (!sales30DaysByProduct[item.productId]) {
            sales30DaysByProduct[item.productId] = { quantity: 0, revenue: 0 };
          }
          sales30DaysByProduct[item.productId].quantity += item.quantity;
          sales30DaysByProduct[item.productId].revenue += item.price * item.quantity;
        }
      });
    });

    const predictions: any[] = [];

    products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(v => {
          const salesData = sales30DaysByVariant[v.id] || { quantity: 0, revenue: 0 };
          const unitsSold30Days = salesData.quantity;

          const dailySalesRate = unitsSold30Days > 0 ? unitsSold30Days / 30 : 0.1;
          const predicted7DayDemand = Math.ceil(dailySalesRate * 7);
          const predicted30DayDemand = Math.ceil(dailySalesRate * 30);

          const targetStockLevel = Math.max(v.minStock * 2, v.minStock + predicted30DayDemand);
          const recommendedBuyQty = Math.max(0, targetStockLevel - v.stockQuantity);
          const estimatedRestockCost = recommendedBuyQty * v.purchasePrice;

          const daysOfStockLeft = v.stockQuantity === 0 
            ? 0 
            : Math.round((v.stockQuantity / dailySalesRate) * 10) / 10;

          let riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
          if (v.stockQuantity === 0 || daysOfStockLeft <= 3) {
            riskLevel = 'CRITICAL';
          } else if (v.stockQuantity <= v.minStock || daysOfStockLeft <= 7) {
            riskLevel = 'WARNING';
          }

          predictions.push({
            id: `${product.id}_${v.id}`,
            name: `${product.name} (${v.name})`,
            sku: v.sku,
            category: product.category,
            purchasePrice: v.purchasePrice,
            sellingPrice: v.sellingPrice,
            stockQuantity: v.stockQuantity,
            minStock: v.minStock,
            unit: 'packets',
            unitsSold30Days,
            dailySalesRate: Math.round(dailySalesRate * 100) / 100,
            predicted7DayDemand,
            predicted30DayDemand,
            recommendedBuyQty,
            estimatedRestockCost,
            daysOfStockLeft,
            riskLevel,
          });
        });
      } else {
        const salesData = sales30DaysByProduct[product.id] || { quantity: 0, revenue: 0 };
        const unitsSold30Days = salesData.quantity;

        const dailySalesRate = unitsSold30Days > 0 ? unitsSold30Days / 30 : 0.1;
        const predicted7DayDemand = Math.ceil(dailySalesRate * 7);
        const predicted30DayDemand = Math.ceil(dailySalesRate * 30);

        const targetStockLevel = Math.max(product.minStock * 2, product.minStock + predicted30DayDemand);
        const recommendedBuyQty = Math.max(0, targetStockLevel - product.stockQuantity);
        const estimatedRestockCost = recommendedBuyQty * product.purchasePrice;

        const daysOfStockLeft = product.stockQuantity === 0 
          ? 0 
          : Math.round((product.stockQuantity / dailySalesRate) * 10) / 10;

        let riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
        if (product.stockQuantity === 0 || daysOfStockLeft <= 3) {
          riskLevel = 'CRITICAL';
        } else if (product.stockQuantity <= product.minStock || daysOfStockLeft <= 7) {
          riskLevel = 'WARNING';
        }

        predictions.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          stockQuantity: product.stockQuantity,
          minStock: product.minStock,
          unit: product.unit,
          unitsSold30Days,
          dailySalesRate: Math.round(dailySalesRate * 100) / 100,
          predicted7DayDemand,
          predicted30DayDemand,
          recommendedBuyQty,
          estimatedRestockCost,
          daysOfStockLeft,
          riskLevel,
        });
      }
    });

    const totalPredicted30DaySales = predictions.reduce((sum, p) => sum + (p.predicted30DayDemand * p.sellingPrice), 0);
    const totalRecommendedBuyItems = predictions.reduce((sum, p) => sum + p.recommendedBuyQty, 0);
    const totalRestockInvestmentRequired = predictions.reduce((sum, p) => sum + p.estimatedRestockCost, 0);
    const criticalRiskCount = predictions.filter(p => p.riskLevel === 'CRITICAL').length;
    const warningRiskCount = predictions.filter(p => p.riskLevel === 'WARNING').length;

    let aiInsight = '';
    const apiKey = process.env.GROQ_API_KEY;

    if (apiKey) {
      try {
        const topReorderItems = predictions
          .filter(p => p.recommendedBuyQty > 0)
          .sort((a, b) => b.recommendedBuyQty - a.recommendedBuyQty)
          .slice(0, 5)
          .map(p => `${p.name} (Current Stock: ${p.stockQuantity} ${p.unit}, Rec. Buy: ${p.recommendedBuyQty} ${p.unit}, Est. Cost: ₹${p.estimatedRestockCost})`)
          .join('; ');

        const groqPrompt = `You are an expert AI retail inventory & sales forecaster for an Indian grocery/retail shop.
Current Store Summary:
- Total Products & Sizes: ${predictions.length}
- Predicted 30-Day Store Revenue: ₹${totalPredicted30DaySales.toFixed(2)}
- Items Need Restocking: ${predictions.filter(p => p.recommendedBuyQty > 0).length}
- Critical Risk Items (Stockout imminent): ${criticalRiskCount}
- Estimated Total Restock Budget Required: ₹${totalRestockInvestmentRequired.toFixed(2)}
- Top Priority Reorder Items: ${topReorderItems || 'None'}

Provide a 3-bullet point executive buying recommendation strategy for the shop owner:
1. Urgent Purchasing Priority: Which exact items to order first and why.
2. Budget & Working Capital Tip: How to allocate purchasing budget efficiently.
3. Profit Opportunity: How restocking these items will prevent missed sales revenue.
Keep answers concise, clear, professional, and formatted in clean markdown. Use ₹ for currency.`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an elite retail sales predictor and inventory optimization AI advisor.' },
              { role: 'user', content: groqPrompt },
            ],
            temperature: 0.5,
            max_tokens: 350,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          aiInsight = groqData.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('Groq AI error:', err);
      }
    }

    if (!aiInsight) {
      aiInsight = `### 💡 AI Restock Insights\n- **Urgent Priority:** You have ${criticalRiskCount} item size(s) critically low or out of stock. Prioritize ordering these to prevent lost sales.\n- **Budget Allocation:** Total estimated investment required for restocking is **₹${totalRestockInvestmentRequired.toFixed(2)}**.\n- **Sales Forecast:** Predicted store sales for the next 30 days is **₹${totalPredicted30DaySales.toFixed(2)}**. Reordering recommended stock ensures continuous customer supply.`;
    }

    return NextResponse.json({
      summary: {
        totalProducts: predictions.length,
        totalPredicted30DaySales,
        totalRecommendedBuyItems,
        totalRestockInvestmentRequired,
        criticalRiskCount,
        warningRiskCount,
      },
      aiInsight,
      predictions,
    });
  } catch (error) {
    console.error('Prediction API Error:', error);
    return NextResponse.json({ error: 'Failed to generate sales predictions' }, { status: 500 });
  }
}
