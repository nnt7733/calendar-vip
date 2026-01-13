import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quickAddParser } from '@/lib/ai';

const planSchema = z.object({
  input: z.string().min(1)
});

export async function POST(request: Request) {
  const data = await request.json();
  const parsed = planSchema.parse(data);
  const result = quickAddParser(parsed.input);
  return NextResponse.json(result);
}
