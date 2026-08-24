import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    let totalAmount = 0;
    let totalCost = 0;

    // Calculate totals
    for (const item of items) {
      totalAmount += item.sellingPrice * item.cartQuantity;
      totalCost += item.purchasePrice * item.cartQuantity;
    }

    const profit = totalAmount - totalCost;

    // Run in a transaction to ensure all or nothing
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create sale
      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          totalCost,
          profit,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || item.id,
              variantId: item.variantId || undefined,
              quantity: item.cartQuantity,
              price: item.sellingPrice,
              cost: item.purchasePrice
            }))
          }
        }
      });

      // 2. Update inventory
      for (const item of items) {
        if (item.variantId) {
          // Decrement variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.cartQuantity
              }
            }
          });
        } else {
          // Decrement main product stock
          await tx.product.update({
            where: { id: item.productId || item.id },
            data: {
              stockQuantity: {
                decrement: item.cartQuantity
              }
            }
          });
        }
      }

      return newSale;
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error('Sale error:', error);
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 });
  }
}
