import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

const tagsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

const dateTimeSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  const hasOffset = /[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed);
  if (!hasOffset && !Number.isNaN(Date.parse(trimmed))) {
    return new Date(trimmed).toISOString();
  }
  return trimmed;
}, z.string().datetime({ offset: true }).nullable().optional());

const calendarItemSchema = z.object({
  type: z.enum(['TASK', 'NOTE', 'EVENT', 'FINANCE_REMINDER']),
  title: z.string(),
  description: z.string().default(''),
  startAt: dateTimeSchema,
  endAt: dateTimeSchema,
  dueAt: dateTimeSchema,
  status: z.enum(['TODO', 'DONE']).optional(),
  tags: tagsSchema.optional(),
  linkTransactionId: z.string().nullable().optional()
});

export async function GET() {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const items = await prisma.calendarItem.findMany({
    where: { userId },
    orderBy: { startAt: 'asc' }
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();
    const parsed = calendarItemSchema.parse(data);
    const { linkTransactionId, ...parsedData } = parsed;

    const item = await prisma.calendarItem.create({
      data: {
        ...parsedData,
        startAt: parsed.startAt ? new Date(parsed.startAt) : null,
        endAt: parsed.endAt ? new Date(parsed.endAt) : null,
        dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
        tags: parsed.tags?.join(',') ?? '',
        status: parsed.status || 'TODO',
        userId,
        transaction: linkTransactionId ? { connect: { id: linkTransactionId } } : undefined
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create calendar item:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const updatePayload: any = {};
  if (updateData.status) {
    updatePayload.status = updateData.status;
  }
  if (updateData.title) {
    updatePayload.title = updateData.title;
  }
  if (updateData.description !== undefined) {
    updatePayload.description = updateData.description;
  }
  if (updateData.startAt) {
    updatePayload.startAt = new Date(updateData.startAt);
  }
  if (updateData.endAt) {
    updatePayload.endAt = new Date(updateData.endAt);
  }
  if (updateData.dueAt) {
    updatePayload.dueAt = new Date(updateData.dueAt);
  }
  if (updateData.tags) {
    updatePayload.tags = Array.isArray(updateData.tags) ? updateData.tags.join(',') : updateData.tags;
  }

  const updateResult = await prisma.calendarItem.updateMany({
    where: { id, userId },
    data: updatePayload
  });
  if (updateResult.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const item = await prisma.calendarItem.findFirst({
    where: { id, userId }
  });

  return NextResponse.json(item);
}
