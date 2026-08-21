import { prisma } from '@/lib/prisma';
import SalesHistoryClient from '@/components/SalesHistoryClient';
import Header from '@/components/Header';

export default async function HistoryPage() {
  const [sales, settings] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        items: {
          include: { product: true }
        }
      }
    }),
    prisma.storeSettings.findUnique({ where: { id: 'default' } })
  ]);

  return (
    <div>
      <Header title="Sales History" />
      <SalesHistoryClient sales={JSON.parse(JSON.stringify(sales))} storeSettings={settings} />
    </div>
  );
}
