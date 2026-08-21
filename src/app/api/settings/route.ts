import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          storeName: 'My Retail Shop',
          address: '',
          phone: '',
          gstNumber: ''
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        storeName: data.storeName,
        address: data.address,
        phone: data.phone,
        gstNumber: data.gstNumber
      },
      create: {
        id: 'default',
        storeName: data.storeName || 'My Retail Shop',
        address: data.address || '',
        phone: data.phone || '',
        gstNumber: data.gstNumber || ''
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
