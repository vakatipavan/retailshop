import Header from '@/components/Header';
import { prisma } from '@/lib/prisma';
import BillingInterface from '@/components/BillingInterface';

export default async function BillingPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <Header title="New Sale" />
      <BillingInterface products={products} />
    </div>
  );
}
