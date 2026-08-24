import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import POSTerminal from '@/components/POSTerminal';

export default async function POSPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  });

  return <POSTerminal products={products} />;
}
