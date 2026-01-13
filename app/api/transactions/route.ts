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
    },
    include: { category: true }
  });

  // Automatically create finance reminder calendar item
  try {
    await prisma.calendarItem.create({
      data: {
        type: 'FINANCE_REMINDER',
        title: `${parsed.type === 'EXPENSE' ? 'Chi' : 'Thu'} ${new Intl.NumberFormat('vi-VN').format(parsed.amount)} ${parsed.currency} - ${transaction.category.name}`,
        description: parsed.note || '',
        startAt: new Date(parsed.dateAt),
        endAt: null,
        dueAt: new Date(parsed.dateAt),
        status: 'TODO',
        tags: 'finance',
        linkTransactionId: transaction.id
      }
    });
  } catch (error) {
    console.error('Failed to create finance reminder:', error);
    // Don't fail the transaction creation if reminder fails
  }

  return NextResponse.json(transaction, { status: 201 });
}
