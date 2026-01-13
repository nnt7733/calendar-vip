import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

export async function GET() {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(categories);
}

