import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true }
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Run update in transaction
    const product = await prisma.$transaction(async (tx) => {
      // Delete old variants and recreate if variants provided
      if (data.variants && Array.isArray(data.variants)) {
        await tx.productVariant.deleteMany({
          where: { productId: params.id }
        });
      }

      const updated = await tx.product.update({
        where: { id: params.id },
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          purchasePrice: data.purchasePrice || 0,
          sellingPrice: data.sellingPrice || 0,
          stockQuantity: data.stockQuantity || 0,
          unit: data.unit,
          minStock: data.minStock,
          variants: data.variants && data.variants.length > 0 ? {
            create: data.variants.map((v: any) => ({
              name: v.name,
              sku: v.sku,
              purchasePrice: parseFloat(v.purchasePrice),
              sellingPrice: parseFloat(v.sellingPrice),
              stockQuantity: parseInt(v.stockQuantity, 10),
            }))
          } : undefined
        },
        include: { variants: true }
      });

      return updated;
    });

    if (existingProduct.sellingPrice !== data.sellingPrice) {
      await prisma.priceHistory.create({
        data: {
          productId: params.id,
          previousPrice: existingProduct.sellingPrice,
          newPrice: data.sellingPrice
        }
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
