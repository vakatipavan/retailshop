'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardCharts({ sales, products }: { sales: any[], products: any[] }) {
  // Process data for charts
  
  // 1. Last 7 Days Sales (Line Chart)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailySalesData = last7Days.map(day => {
    return sales
      .filter(s => {
        const d = new Date(s.saleDate);
        return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
      })
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  });

  const lineChartData = {
    labels: last7Days.map(d => format(d, 'MMM dd')),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: dailySalesData,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // 2. Revenue vs Cost (Bar Chart) - overall
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
  
  const barChartData = {
    labels: ['Financial Overview'],
    datasets: [
      {
        label: 'Revenue',
        data: [totalRevenue],
        backgroundColor: '#4F46E5',
      },
      {
        label: 'Cost',
        data: [totalCost],
        backgroundColor: '#F59E0B',
      },
      {
        label: 'Profit',
        data: [totalRevenue - totalCost],
        backgroundColor: '#10B981',
      },
    ],
  };

  // 3. Inventory by Category (Doughnut Chart)
  const categories = Array.from(new Set(products.map(p => p.category)));
  const categoryData = categories.map(cat => 
    products.filter(p => p.category === cat).reduce((sum, p) => sum + p.stockQuantity, 0)
  );

  const colors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'
  ];

  const doughnutData = {
    labels: categories,
    datasets: [
      {
        data: categoryData,
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Last 7 Days Sales</h3>
        <div style={{ height: '300px' }}>
          <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
      
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Revenue vs Cost vs Profit</h3>
        <div style={{ height: '300px' }}>
          <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Inventory by Category</h3>
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
          <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
