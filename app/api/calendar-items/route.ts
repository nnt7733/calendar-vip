import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const calendarItemSchema = z.object({
  type: z.enum(['TASK', 'NOTE', 'EVENT', 'FINANCE_REMINDER']),
  title: z.string(),
  description: z.string().default(''),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  status: z.enum(['TODO', 'DONE']).optional(),
  tags: z.array(z.string()).optional(),
  linkTransactionId: z.string().nullable().optional()
});

export async function GET() {
  const items = await prisma.calendarItem.findMany({
    orderBy: { startAt: 'asc' }
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const data = await request.json();
  const parsed = calendarItemSchema.parse(data);

  const item = await prisma.calendarItem.create({
    data: {
      ...parsed,
      startAt: parsed.startAt ? new Date(parsed.startAt) : null,
      endAt: parsed.endAt ? new Date(parsed.endAt) : null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      tags: parsed.tags?.join(',') ?? '',
      status: parsed.status || 'TODO'
    }
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(request: Request) {
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

  const item = await prisma.calendarItem.update({
    where: { id },
    data: updatePayload
  });

  return NextResponse.json(item);
}
