import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quickAddParser } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

const planSchema = z.object({
  input: z.string().min(1)
});

// Giới hạn sử dụng AI mỗi ngày (có thể điều chỉnh)
const DAILY_AI_LIMIT = 1000; // Giới hạn 1000 lần/ngày (Groq free tier: 14,400/ngày)

async function checkAndUpdateUsage(
  userId: string
): Promise<{ allowed: boolean; remaining: number; dailyCount: number; today: string }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Tạo default settings nếu chưa có
      await prisma.settings.create({
        data: {
          userId,
          theme: 'dark',
          currency: 'VND',
          language: 'Tiếng Việt',
          dailyUsageCount: 0,
          lastUsageDate: today
        }
      });
      return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0, today };
    }

    // Reset counter nếu là ngày mới
    if (settings.lastUsageDate !== today) {
      await prisma.settings.update({
        where: { userId },
        data: {
          dailyUsageCount: 0,
          lastUsageDate: today
        }
      });
      return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0, today };
    }

    // Kiểm tra giới hạn
    const dailyCount = settings.dailyUsageCount || 0;
    const remaining = Math.max(0, DAILY_AI_LIMIT - dailyCount);
    const allowed = dailyCount < DAILY_AI_LIMIT;
    return { allowed, remaining, dailyCount, today };
  } catch (error) {
    console.error('Usage check error:', error);
    // Nếu có lỗi, vẫn cho phép sử dụng (fallback)
    return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0, today: new Date().toISOString().split('T')[0] };
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdOrDev();
    if (!userId) {
      return NextResponse.json('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const parsed = planSchema.parse(data);

    // Kiểm tra giới hạn sử dụng
    const usage = await checkAndUpdateUsage(userId);
    
    if (!usage.allowed) {
      return NextResponse.json(
        {
          clarifyingQuestion: null,
          assumptions: [`Da dat gioi han su dung AI hom nay (${usage.dailyCount}/${DAILY_AI_LIMIT}). Vui long thu lai vao ngay mai hoac su dung rule-based parsing.`],
          create: {
            calendarItems: [],
            transactions: []
          },
          usage: {
            dailyCount: usage.dailyCount,
            limit: DAILY_AI_LIMIT,
            remaining: 0
          }
        },
        { status: 429 } // Too Many Requests
      );
    }
    const reserveResult = await prisma.settings.updateMany({
      where: {
        userId,
        lastUsageDate: usage.today,
        dailyUsageCount: { lt: DAILY_AI_LIMIT }
      },
      data: {
        dailyUsageCount: { increment: 1 },
        lastUsageDate: usage.today
      }
    });

    if (reserveResult.count === 0) {
      return NextResponse.json(
        {
          clarifyingQuestion: null,
          assumptions: [`Da dat gioi han su dung AI hom nay (${usage.dailyCount}/${DAILY_AI_LIMIT}). Vui long thu lai vao ngay mai hoac su dung rule-based parsing.`],
          create: {
            calendarItems: [],
            transactions: []
          },
          usage: {
            dailyCount: usage.dailyCount,
            limit: DAILY_AI_LIMIT,
            remaining: 0
          }
        },
        { status: 429 }
      );
    }

    let result;
    try {
      result = await quickAddParser(parsed.input);
    } catch (error) {
      await prisma.settings.update({
        where: { userId },
        data: { dailyUsageCount: { decrement: 1 } }
      });
      throw error;
    }

    const settingsAfter = await prisma.settings.findUnique({
      where: { userId }
    });
    const dailyCount = settingsAfter?.dailyUsageCount ?? usage.dailyCount + 1;
    const remaining = Math.max(0, DAILY_AI_LIMIT - dailyCount);

    return NextResponse.json({
      ...result,
      usage: {
        dailyCount,
        limit: DAILY_AI_LIMIT,
        remaining
      }
    });
  } catch (error: any) {
    console.error('Plan API error:', error);
    return NextResponse.json(
      {
        clarifyingQuestion: null,
        assumptions: ['Co loi xay ra khi parse input.'],
        create: {
          calendarItems: [],
          transactions: []
        }
      },
      { status: 500 }
    );
  }
}
