import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import BillingInterface from '@/components/BillingInterface';

export default async function BillingPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: { variants: true }
  });

  return (
    <div>
      <Header title="New Sale" />
      <BillingInterface products={products} />
    </div>
  );
}
