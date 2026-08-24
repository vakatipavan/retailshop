import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        purchasePrice: data.purchasePrice || 0,
        sellingPrice: data.sellingPrice || 0,
        stockQuantity: data.stockQuantity || 0,
        unit: data.unit,
        minStock: data.minStock || 5,
        variants: data.variants && data.variants.length > 0 ? {
          create: data.variants.map((v: any) => ({
            name: v.name,
            sku: v.sku,
            purchasePrice: parseFloat(v.purchasePrice),
            sellingPrice: parseFloat(v.sellingPrice),
            stockQuantity: parseInt(v.stockQuantity, 10),
            minStock: parseInt(v.minStock || '5', 10),
          }))
        } : undefined
      },
      include: { variants: true }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product. Check SKU uniqueness.' }, { status: 500 });
  }
}
