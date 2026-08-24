import Header from '@/components/Header';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import ProductsTable from '@/components/ProductsTable';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <Header title="Products" />
      <ProductsTable products={products} />
    </div>
  );
}
