import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quickAddParser } from '@/lib/ai';
import { prisma } from '@/lib/db';

const planSchema = z.object({
  input: z.string().min(1)
});

// Giới hạn sử dụng AI mỗi ngày (có thể điều chỉnh)
const DAILY_AI_LIMIT = 1000; // Giới hạn 1000 lần/ngày (Groq free tier: 14,400/ngày)

async function checkAndUpdateUsage(): Promise<{ allowed: boolean; remaining: number; dailyCount: number }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' }
    });

    if (!settings) {
      // Tạo default settings nếu chưa có
      await prisma.settings.create({
        data: {
          id: 'settings',
          theme: 'dark',
          currency: 'VND',
          language: 'Tiếng Việt',
          dailyUsageCount: 0,
          lastUsageDate: today
        }
      });
      return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0 };
    }

    // Reset counter nếu là ngày mới
    if (settings.lastUsageDate !== today) {
      await prisma.settings.update({
        where: { id: 'settings' },
        data: {
          dailyUsageCount: 0,
          lastUsageDate: today
        }
      });
      return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0 };
    }

    // Kiểm tra giới hạn
    const dailyCount = settings.dailyUsageCount || 0;
    const remaining = Math.max(0, DAILY_AI_LIMIT - dailyCount);
    const allowed = dailyCount < DAILY_AI_LIMIT;

    if (allowed) {
      // Tăng counter
      await prisma.settings.update({
        where: { id: 'settings' },
        data: {
          dailyUsageCount: dailyCount + 1,
          lastUsageDate: today
        }
      });
    }

    return { allowed, remaining: Math.max(0, remaining - 1), dailyCount: dailyCount + 1 };
  } catch (error) {
    console.error('Usage check error:', error);
    // Nếu có lỗi, vẫn cho phép sử dụng (fallback)
    return { allowed: true, remaining: DAILY_AI_LIMIT, dailyCount: 0 };
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const parsed = planSchema.parse(data);

    // Kiểm tra giới hạn sử dụng
    const usage = await checkAndUpdateUsage();
    
    if (!usage.allowed) {
      return NextResponse.json(
        {
          clarifyingQuestion: null,
          assumptions: [`Đã đạt giới hạn sử dụng AI hôm nay (${usage.dailyCount}/${DAILY_AI_LIMIT}). Vui lòng thử lại vào ngày mai hoặc sử dụng rule-based parsing.`],
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

    const result = await quickAddParser(parsed.input);
    
    // Thêm thông tin usage vào response
    return NextResponse.json({
      ...result,
      usage: {
        dailyCount: usage.dailyCount,
        limit: DAILY_AI_LIMIT,
        remaining: usage.remaining
      }
    });
  } catch (error: any) {
    console.error('Plan API error:', error);
    return NextResponse.json(
      {
        clarifyingQuestion: null,
        assumptions: ['Có lỗi xảy ra khi parse input.'],
        create: {
          calendarItems: [],
          transactions: []
        }
      },
      { status: 500 }
    );
  }
}
