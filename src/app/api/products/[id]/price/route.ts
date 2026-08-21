import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sellingPrice, purchasePrice } = await req.json();

    if (sellingPrice === undefined && purchasePrice === undefined) {
      return NextResponse.json({ error: 'No prices provided' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const newSellingPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : existingProduct.sellingPrice;
    if (isNaN(newSellingPrice) || newSellingPrice <= 0) {
      return NextResponse.json({ error: 'Invalid selling price' }, { status: 400 });
    }

    const newPurchasePrice = purchasePrice !== undefined ? parseFloat(purchasePrice) : existingProduct.purchasePrice;
    if (isNaN(newPurchasePrice) || newPurchasePrice <= 0) {
      return NextResponse.json({ error: 'Invalid cost price' }, { status: 400 });
    }

    // Update product price
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        sellingPrice: newSellingPrice,
        purchasePrice: newPurchasePrice,
      },
    });

    // Record price history only if selling price actually changed
    if (existingProduct.sellingPrice !== newSellingPrice) {
      await prisma.priceHistory.create({
        data: {
          productId: params.id,
          previousPrice: existingProduct.sellingPrice,
          newPrice: newSellingPrice,
        },
      });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Price update error:', error);
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 });
  }
}
