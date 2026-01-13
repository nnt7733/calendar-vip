import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const settingsSchema = z.object({
  groqApiKey: z.string().optional().nullable(),
  theme: z.enum(['dark', 'light']).optional(),
  currency: z.string().optional(),
  language: z.string().optional()
});

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'settings',
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
    // Return defaults on error
    return NextResponse.json({
      id: 'settings',
      groqApiKey: null,
      theme: 'dark',
      currency: 'VND',
      language: 'Tiếng Việt',
      updatedAt: new Date().toISOString()
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const parsed = settingsSchema.parse(data);

    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'settings',
          groqApiKey: parsed.groqApiKey || null,
          theme: parsed.theme || 'dark',
          currency: parsed.currency || 'VND',
          language: parsed.language || 'Tiếng Việt'
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: 'settings' },
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

