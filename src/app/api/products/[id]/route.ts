import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // Check if price changed to record price history
    const existingProduct = await prisma.product.findUnique({ where: { id: params.id } });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        minStock: data.minStock,
      }
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
