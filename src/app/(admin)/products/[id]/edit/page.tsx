import Header from '@/components/Header';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Header title={`Edit: ${product.name}`} />
      <div style={{ maxWidth: '800px' }}>
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}
