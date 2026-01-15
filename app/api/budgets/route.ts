import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  categoryId: z.string().nullable().optional(),
  limitAmount: z.number().positive('Limit amount must be positive'),
  alertPercent: z.number().min(1).max(100).default(80)
});

export async function GET(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');

  // Default to current month if no param provided
  const month = monthParam ?? new Date().toISOString().slice(0, 7);

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month
    },
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(budgets);
}

export async function POST(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const parsed = budgetSchema.parse(data);

    // Check if budget already exists for this month and category
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId,
        month: parsed.month,
        categoryId: parsed.categoryId ?? null
      }
    });

    let budget;
    if (existingBudget) {
      // Update existing budget
      budget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          limitAmount: parsed.limitAmount,
          alertPercent: parsed.alertPercent
        },
        include: { category: true }
      });
    } else {
      // Create new budget
      budget = await prisma.budget.create({
        data: {
          userId,
          month: parsed.month,
          categoryId: parsed.categoryId ?? null,
          limitAmount: parsed.limitAmount,
          alertPercent: parsed.alertPercent
        },
        include: { category: true }
      });
    }

    return NextResponse.json(budget, { status: existingBudget ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create/update budget:', error);
    return NextResponse.json(
      { error: 'Failed to create/update budget' },
      { status: 500 }
    );
  }
}

