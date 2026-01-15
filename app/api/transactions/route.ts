import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

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

export async function GET(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // Default to current month if no params provided
  const now = new Date();
  const startDate = startDateParam 
    ? new Date(startDateParam) 
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = endDateParam 
    ? new Date(endDateParam) 
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      dateAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: { category: true },
    orderBy: { dateAt: 'desc' }
  });
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  const parsed = transactionSchema.parse(data);

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed,
      userId,
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
        userId,
        transaction: { connect: { id: transaction.id } }
      }
    });
  } catch (error) {
    console.error('Failed to create finance reminder:', error);
    // Don't fail the transaction creation if reminder fails
  }

  return NextResponse.json(transaction, { status: 201 });
}
