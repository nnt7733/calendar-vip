import { addDays, formatISO, parse, startOfWeek, nextSaturday, nextSunday, setHours, setMinutes } from 'date-fns';

// Lazy import Groq to avoid errors if package is not installed
let Groq: any = null;
try {
  Groq = require('groq-sdk').default || require('groq-sdk');
} catch (error) {
  // Groq SDK not available, will use rule-based parsing only
  console.log('Groq SDK not available, using rule-based parsing');
}

const expenseKeywords = ['chi', 'mua', 'trả', 'ăn', 'cafe'];
const incomeKeywords = ['thu', 'nhận', 'lương'];

const categoryMap: Record<string, string> = {
  'ăn': 'Food',
  'cafe': 'Food',
  'xe': 'Transport',
  'xăng': 'Transport',
  'sách': 'Study',
  'course': 'Study',
  'điện': 'Bills',
  'nước': 'Bills'
};

function detectType(text: string) {
  const lower = text.toLowerCase();
  if (expenseKeywords.some((key) => lower.includes(key))) {
    return 'EXPENSE';
  }
  if (incomeKeywords.some((key) => lower.includes(key))) {
    return 'INCOME';
  }
  return null;
}

function detectCategory(text: string) {
  const lower = text.toLowerCase();
  const match = Object.keys(categoryMap).find((key) => lower.includes(key));
  return match ? categoryMap[match] : 'General';
}

function detectAmount(text: string) {
  const match = text.match(/(\d+[,.]?\d*)/);
  if (!match) return null;
  const raw = match[1].replace(/,/g, '');
  return Number(raw);
}

function detectDate(text: string, isEvent: boolean = false) {
  const lower = text.toLowerCase();
  let date = new Date();
  
  // Detect "hôm nay", "mai", "ngày mai"
  if (lower.includes('hôm nay')) {
    date = new Date();
  } else if (lower.includes('mai') || lower.includes('ngày mai')) {
    date = addDays(new Date(), 1);
  } else {
    // Detect day of week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Vietnamese day names
    const dayMap: Record<string, number> = {
      'chủ nhật': 0,
      'cn': 0,
      'thứ 2': 1,
      'thứ hai': 1,
      'thứ 3': 2,
      'thứ ba': 2,
      'thứ 4': 3,
      'thứ tư': 3,
      'thứ 5': 4,
      'thứ năm': 4,
      'thứ 6': 5,
      'thứ sáu': 5,
      'thứ 7': 6,
      'thứ bảy': 6
    };
    
    // Check for "tuần này" or "tuần sau"
    const isThisWeek = lower.includes('tuần này') || lower.includes('tuần tới');
    const isNextWeek = lower.includes('tuần sau');
    
    for (const [key, targetDay] of Object.entries(dayMap)) {
      if (lower.includes(key)) {
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && !lower.includes('tuần này')) {
          // If today is that day, assume next week
          date = addDays(today, 7);
        } else if (isNextWeek) {
          date = addDays(today, 7 + daysUntilTarget);
        } else {
          date = addDays(today, daysUntilTarget);
        }
        break;
      }
    }
    
    // Detect date format DD/MM or DD/MM/YYYY
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dateMatch) {
      const [day, month, year] = dateMatch.slice(1, 4).map(Number);
      const targetYear = year || new Date().getFullYear();
      date = parse(`${day}/${month}/${targetYear}`, 'd/M/yyyy', new Date());
    }
  }
  
  // For events (non-deadline), don't set specific time - just keep the date
  if (isEvent) {
    // Reset to start of day (00:00:00) for events
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  // For tasks (deadlines), set specific time
  let hours = date.getHours();
  let minutes = date.getMinutes();
  
  // Time of day keywords - only for tasks with deadlines
  if (lower.includes('sáng') || lower.includes('buổi sáng')) {
    hours = 8; // Default morning
    minutes = 0;
  } else if (lower.includes('trưa') || lower.includes('buổi trưa')) {
    hours = 12;
    minutes = 0;
  } else if (lower.includes('chiều') || lower.includes('buổi chiều')) {
    hours = 14; // Default afternoon
    minutes = 0;
  } else if (lower.includes('tối') || lower.includes('buổi tối')) {
    hours = 19; // Default evening
    minutes = 0;
  }
  
  // Detect specific time like "7pm", "19:00", "7 giờ" - only for tasks
  const timeMatch = text.match(/(\d{1,2})(?:pm|am|giờ|:(\d{2}))/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    if (text.toLowerCase().includes('pm') && hours < 12) hours += 12;
    if (timeMatch[2]) minutes = parseInt(timeMatch[2]);
  }
  
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function extractCleanTitle(text: string): string {
  // Remove time-related keywords to get clean title
  const timeKeywords = [
    'hôm nay', 'mai', 'ngày mai', 'tuần này', 'tuần sau', 'tuần tới',
    'sáng', 'buổi sáng', 'trưa', 'buổi trưa', 'chiều', 'buổi chiều', 'tối', 'buổi tối',
    'thứ 2', 'thứ hai', 'thứ 3', 'thứ ba', 'thứ 4', 'thứ tư', 'thứ 5', 'thứ năm',
    'thứ 6', 'thứ sáu', 'thứ 7', 'thứ bảy', 'chủ nhật', 'cn',
    /\d{1,2}\/\d{1,2}(?:\/\d{4})?/g, // Date format
    /\d{1,2}(?:pm|am|giờ|:\d{2})/gi // Time format
  ];
  
  let cleanTitle = text;
  
  // Remove time keywords
  timeKeywords.forEach(keyword => {
    if (typeof keyword === 'string') {
      cleanTitle = cleanTitle.replace(new RegExp(keyword, 'gi'), '');
    } else {
      cleanTitle = cleanTitle.replace(keyword, '');
    }
  });
  
  // Clean up extra spaces
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  
  return cleanTitle || text; // Fallback to original if empty
}

function detectTags(text: string) {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  
  // Priority detection
  if (lower.includes('urgent') || lower.includes('khẩn cấp') || lower.includes('gấp')) {
    tags.push('urgent', 'high');
  } else if (lower.includes('quan trọng') || lower.includes('important') || lower.includes('high')) {
    tags.push('high');
  } else if (lower.includes('low') || lower.includes('thấp')) {
    tags.push('low');
  }
  
  // Other tags
  if (lower.includes('study') || lower.includes('học') || lower.includes('ielts') || lower.includes('thi')) {
    tags.push('study');
  }
  if (lower.includes('work') || lower.includes('công việc')) {
    tags.push('work');
  }
  if (lower.includes('personal') || lower.includes('cá nhân')) {
    tags.push('personal');
  }
  if (lower.includes('lái xe') || lower.includes('xe')) {
    tags.push('transport');
  }
  
  return tags.length > 0 ? tags : ['quick-add'];
}

// Initialize Groq client lazily (optional, only if API key is provided)
async function getGroqClient(): Promise<any> {
  try {
    if (!Groq) return null;
    
    // Try to get API key from database first
    let apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      try {
        const { prisma } = await import('@/lib/db');
        // Try to get from database (Settings model)
        const prismaClient = prisma as any;
        if (prismaClient.settings) {
          const settings = await prismaClient.settings.findUnique({
            where: { id: 'settings' }
          });
          if (settings?.groqApiKey) {
            apiKey = settings.groqApiKey;
          }
        }
      } catch (error) {
        // Database might not have settings yet, use env var only
        console.log('Could not read API key from database, using env var');
      }
    }
    
    if (!apiKey) return null;
    
    return new Groq({
      apiKey: apiKey
    });
  } catch (error) {
    console.error('Failed to initialize Groq client:', error);
    return null;
  }
}

async function parseWithAI(input: string): Promise<any | null> {
  const groqClient = await getGroqClient();
  if (!groqClient) return null;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Parse Vietnamese input to JSON:
{"type":"TASK|EVENT|TRANSACTION","title":"clean title","date":"ISO-8601","amount":number,"category":"string","tags":["string"],"isEvent":boolean}
Examples:
"thi lái xe sáng thứ 7"→{"type":"TASK","title":"thi lái xe","date":"...","tags":["study","transport"],"isEvent":false}
"chi 45k ăn sáng mai"→{"type":"TRANSACTION","title":"ăn sáng","amount":45000,"date":"...","category":"Food","isEvent":false}`
        },
        {
          role: 'user',
          content: input
        }
      ],
      model: 'llama-3.1-8b-instant', // Free and fast model
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
}

export async function quickAddParser(input: string) {
  // Try AI parsing first (if available)
  const aiResult = await parseWithAI(input);
  
  if (aiResult && aiResult.type) {
    // Use AI result
    const isFinance = aiResult.type === 'TRANSACTION';
    const isEvent = aiResult.isEvent || false;
    
    const transactions = isFinance
      ? [
          {
            type: aiResult.amount > 0 ? 'EXPENSE' : 'INCOME',
            amount: Math.abs(aiResult.amount || 0),
            currency: 'VND',
            category: aiResult.category || 'General',
            note: aiResult.description || input,
            dateAt: aiResult.date || formatISO(new Date())
          }
        ]
      : [];

    const calendarItems = isFinance
      ? [
          {
            type: 'FINANCE_REMINDER',
            title: `${aiResult.amount > 0 ? 'Chi' : 'Thu'} ${new Intl.NumberFormat('vi-VN').format(Math.abs(aiResult.amount || 0))} VND - ${aiResult.category || 'General'}`,
            description: aiResult.description || input,
            startAt: aiResult.date || formatISO(new Date()),
            endAt: null,
            dueAt: aiResult.date || formatISO(new Date()),
            tags: (aiResult.tags || []).join(',')
          }
        ]
      : [
          {
            type: isEvent ? 'EVENT' : 'TASK',
            title: aiResult.title || extractCleanTitle(input),
            description: aiResult.description || 'Tạo từ Quick Add',
            startAt: aiResult.date || formatISO(new Date()),
            endAt: null,
            // For events, don't set dueAt (no deadline)
            // For tasks, set dueAt (has deadline)
            dueAt: isEvent ? null : (aiResult.date || formatISO(new Date())),
            tags: (aiResult.tags || []).join(','),
            status: 'TODO'
          }
        ];

    return {
      clarifyingQuestion: null,
      assumptions: ['Đã sử dụng AI để parse.'],
      create: {
        calendarItems,
        transactions
      }
    };
  }

  // Fallback to rule-based parsing
  const type = detectType(input);
  const amount = detectAmount(input);
  const category = detectCategory(input);
  const tags = detectTags(input);

  // Determine if it's a finance transaction or task/event
  const isFinance = type && amount;
  const isEvent = input.toLowerCase().includes('event') || input.toLowerCase().includes('sự kiện');
  
  // Detect date with isEvent flag
  const date = detectDate(input, isEvent);
  
  const transactions = isFinance
      ? [
          {
            type,
            amount,
            currency: 'VND',
            category,
            note: input,
            dateAt: formatISO(date)
          }
        ]
      : [];

  const calendarItems = isFinance
    ? [
        // Create finance reminder for transactions
        {
          type: 'FINANCE_REMINDER',
          title: `${type === 'EXPENSE' ? 'Chi' : 'Thu'} ${new Intl.NumberFormat('vi-VN').format(amount)} VND - ${category}`,
          description: input,
          startAt: formatISO(date),
          endAt: null,
          dueAt: formatISO(date),
          tags: tags.join(',')
        }
      ]
    : [
        {
          type: isEvent ? 'EVENT' : 'TASK',
          title: extractCleanTitle(input),
          description: 'Tạo từ Quick Add',
          startAt: formatISO(date),
          endAt: null,
          // For events, don't set dueAt (no deadline)
          // For tasks, set dueAt (has deadline)
          dueAt: isEvent ? null : formatISO(date),
          tags: Array.isArray(tags) ? tags.join(',') : tags,
          status: 'TODO'
        }
      ];

  return {
    clarifyingQuestion: null,
    assumptions: [
      'Đã sử dụng rule-based parsing (fallback).',
      'Nếu nhận diện là thu/chi thì sẽ tạo transaction và finance reminder.',
      'Nếu không thì sẽ tạo task hoặc event.',
      'Ngày mặc định là hôm nay nếu không tìm thấy.'
    ],
    create: {
      calendarItems,
      transactions
    }
  };
}
