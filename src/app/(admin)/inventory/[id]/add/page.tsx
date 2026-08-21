import Header from '@/components/Header';
import { prisma } from '@/lib/prisma';
import StockAddForm from '@/components/StockAddForm';
import { notFound } from 'next/navigation';

export default async function AddStockPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Header title={`Add Stock: ${product.name}`} />
      <div style={{ maxWidth: '600px' }}>
        <StockAddForm product={product} />
      </div>
    </div>
  );
}
