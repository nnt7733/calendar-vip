import { NextResponse } from 'next/server';
import { z } from 'zod';

const testApiKeySchema = z.object({
  apiKey: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const parsed = testApiKeySchema.parse(data);
    const { apiKey } = parsed;

    // Validate format: Groq API key should start with "gsk_"
    if (!apiKey.startsWith('gsk_')) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'API key không đúng format. Groq API key phải bắt đầu bằng "gsk_"' 
        },
        { status: 400 }
      );
    }

    // Test with Groq API
    try {
      const Groq = require('groq-sdk').default || require('groq-sdk');
      const groqClient = new Groq({ apiKey });

      // Make a simple test request
      const completion = await groqClient.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 5
      });

      if (completion.choices && completion.choices.length > 0) {
        return NextResponse.json({
          valid: true,
          message: 'API key hợp lệ và hoạt động tốt!'
        });
      } else {
        return NextResponse.json(
          { 
            valid: false,
            error: 'API key không trả về kết quả hợp lệ' 
          },
          { status: 400 }
        );
      }
    } catch (groqError: any) {
      console.error('Groq API test error:', groqError);
      
      // Check specific error types
      if (groqError.status === 401 || groqError.status === 403) {
        return NextResponse.json(
          { 
            valid: false,
            error: 'API key không hợp lệ hoặc đã hết hạn' 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          valid: false,
          error: `Lỗi khi kiểm tra API key: ${groqError.message || 'Unknown error'}` 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test API key error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: error.message || 'Có lỗi xảy ra khi kiểm tra API key' 
      },
      { status: 500 }
    );
  }
}

