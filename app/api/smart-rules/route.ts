import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

const smartRuleSchema = z.object({
  keyword: z.string().trim().min(1),
  type: z.enum(['TRANSACTION', 'TASK', 'EVENT']),
  category: z.string().trim().optional()
});

export async function POST(request: Request) {
  try {
    const userId = await getUserIdOrDev();
    if (!userId) {
      return NextResponse.json('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const parsed = smartRuleSchema.parse(data);
    const keyword = parsed.keyword;
    const mappedCategory = parsed.category && parsed.category.length > 0 ? parsed.category : null;

    const existing = await prisma.smartKeyword.findUnique({
      where: { keyword }
    });
    if (existing && existing.userId !== userId) {
      return NextResponse.json(
        { message: 'Keyword already belongs to another user.' },
        { status: 409 }
      );
    }

    const record = await prisma.smartKeyword.upsert({
      where: { keyword },
      update: {
        mappedType: parsed.type,
        mappedCategory
      },
      create: {
        keyword,
        mappedType: parsed.type,
        mappedCategory,
        userId
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Smart rule API error:', error);
    return NextResponse.json({ message: 'Failed to save smart rule.' }, { status: 500 });
  }
}

