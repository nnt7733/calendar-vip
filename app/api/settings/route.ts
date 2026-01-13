import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getUserIdOrDev } from '@/lib/auth';

const settingsSchema = z.object({
  groqApiKey: z.string().optional().nullable(),
  theme: z.enum(['dark', 'light']).optional(),
  currency: z.string().optional(),
  language: z.string().optional()
});

export async function GET() {
  const userId = await getUserIdOrDev();
  if (!userId) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  try {

    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          theme: 'dark',
          currency: 'VND',
          language: 'Tiếng Việt'
        }
      });
    }

    // Don't return API key in response for security (only return if exists)
    return NextResponse.json({
      ...settings,
      groqApiKey: settings.groqApiKey ? '***' : null,
      dailyUsageCount: settings.dailyUsageCount || 0,
      lastUsageDate: settings.lastUsageDate || null
    });
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getUserIdOrDev();
    if (!userId) {
      return NextResponse.json('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const parsed = settingsSchema.parse(data);

    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          groqApiKey: parsed.groqApiKey || null,
          theme: parsed.theme || 'dark',
          currency: parsed.currency || 'VND',
          language: parsed.language || 'Tiếng Việt'
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { userId },
        data: {
          ...(parsed.groqApiKey !== undefined && { groqApiKey: parsed.groqApiKey }),
          ...(parsed.theme && { theme: parsed.theme }),
          ...(parsed.currency && { currency: parsed.currency }),
          ...(parsed.language && { language: parsed.language })
        }
      });
    }

    // Don't return API key in response
    return NextResponse.json({
      ...settings,
      groqApiKey: settings.groqApiKey ? '***' : null,
      dailyUsageCount: settings.dailyUsageCount || 0,
      lastUsageDate: settings.lastUsageDate || null
    });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update settings',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

