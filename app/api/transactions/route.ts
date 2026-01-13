import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number(),
  currency: z.string().default('VND'),
  categoryId: z.string(),
  note: z.string().default(''),
  dateAt: z.string().datetime(),
  paymentMethod: z.enum(['CASH', 'BANK', 'EWALLET']).optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional()
});

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: { dateAt: 'desc' }
  });
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const data = await request.json();
  const parsed = transactionSchema.parse(data);

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed,
      dateAt: new Date(parsed.dateAt)
    }
  });

  return NextResponse.json(transaction, { status: 201 });
}
