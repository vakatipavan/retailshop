import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PriceUpdater from '@/components/PriceUpdater';

export default async function PricesPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  const priceHistory = await prisma.priceHistory.findMany({
    orderBy: { updateDate: 'desc' },
    take: 20,
    include: {
      product: true
    }
  });

  return (
    <div>
      <Header title="Daily Price Management" />
      <PriceUpdater products={products} priceHistory={priceHistory} />
    </div>
  );
}
