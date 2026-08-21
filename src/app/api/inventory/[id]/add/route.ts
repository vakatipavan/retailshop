import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { quantity, reason } = await req.json();

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Increment stock
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        stockQuantity: {
          increment: quantity,
        },
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error('Add stock error:', error);
    return NextResponse.json({ error: 'Failed to add stock' }, { status: 500 });
  }
}
