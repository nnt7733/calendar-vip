import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  formatISO,
  parse,
  startOfMonth,
  startOfWeek,
  nextSaturday,
  nextSunday,
  setHours,
  setMinutes
} from 'date-fns';

// Lazy import Groq to avoid errors if package is not installed
let Groq: any = null;
try {
  Groq = require('groq-sdk').default || require('groq-sdk');
} catch (error) {
  // Groq SDK not available, will use rule-based parsing only
  console.log('Groq SDK not available, using rule-based parsing');
}

const expenseKeywords = ['chi', 'mua', 'tra', 'an', 'uong', 'cafe'];
const incomeKeywords = ['thu', 'nhan', 'luong'];

const categoryMap: Record<string, string> = {
  'an': 'Food',
  'cafe': 'Food',
  'xe': 'Transport',
  'xang': 'Transport',
  'sach': 'Study',
  'course': 'Study',
  'dien': 'Bills',
  'nuoc': 'Bills'
};

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}


function detectType(text: string) {
  const lower = normalizeText(text);
  if (expenseKeywords.some((key) => lower.includes(key))) {
    return 'EXPENSE';
  }
  if (incomeKeywords.some((key) => lower.includes(key))) {
    return 'INCOME';
  }
  return null;
}


function detectCategory(text: string) {
  const lower = normalizeText(text);
  const match = Object.keys(categoryMap).find((key) => lower.includes(key));
  return match ? categoryMap[match] : 'General';
}


function detectAmount(text: string) {
  const match = text.match(/(\d+[,.]?\d*)/);
  if (!match) return null;
  const raw = match[1].replace(/,/g, '');
  return Number(raw);
}

function inferTransactionType(input: string, aiResult: any) {
  const lower = normalizeText(input);
  if (incomeKeywords.some((key) => lower.includes(key))) return 'INCOME';
  if (expenseKeywords.some((key) => lower.includes(key))) return 'EXPENSE';
  if (typeof aiResult?.amount === 'number' && aiResult.amount < 0) return 'INCOME';
  return 'EXPENSE';
}

function detectDate(text: string, isEvent: boolean = false) {
  const lower = normalizeText(text);
  let date = new Date();
  const today = new Date();

  if (lower.includes('hom nay')) {
    date = today;
  } else if (lower.includes('mai') || lower.includes('ngay mai')) {
    date = addDays(today, 1);
  } else if (lower.includes('cuoi thang sau')) {
    date = endOfMonth(addMonths(today, 1));
  } else if (lower.includes('cuoi thang nay') || lower.includes('cuoi thang hien tai')) {
    date = endOfMonth(today);
  } else if (lower.includes('dau thang sau')) {
    date = startOfMonth(addMonths(today, 1));
  } else if (lower.includes('dau thang nay') || lower.includes('dau thang hien tai')) {
    date = startOfMonth(today);
  } else if (lower.includes('cuoi tuan sau')) {
    date = addDays(startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }), 5);
  } else if (lower.includes('cuoi tuan nay')) {
    date = addDays(startOfWeek(today, { weekStartsOn: 1 }), 5);
  } else {
    const currentDay = today.getDay();

    const dayMap: Record<string, number> = {
      'chu nhat': 0,
      'cn': 0,
      'thu 2': 1,
      'thu hai': 1,
      't2': 1,
      'thu 3': 2,
      'thu ba': 2,
      't3': 2,
      'thu 4': 3,
      'thu tu': 3,
      't4': 3,
      'thu 5': 4,
      'thu nam': 4,
      't5': 4,
      'thu 6': 5,
      'thu sau': 5,
      't6': 5,
      'thu 7': 6,
      'thu bay': 6,
      't7': 6
    };

    const isThisWeek = lower.includes('tuan nay') || lower.includes('tuan toi');
    const isNextWeek = lower.includes('tuan sau');

    for (const [key, targetDay] of Object.entries(dayMap)) {
      if (lower.includes(key)) {
        if (isThisWeek || isNextWeek) {
          const baseWeek = isNextWeek ? addWeeks(today, 1) : today;
          const weekStart = startOfWeek(baseWeek, { weekStartsOn: 1 });
          const dayOffset = targetDay === 0 ? 6 : targetDay - 1;
          date = addDays(weekStart, dayOffset);
        } else {
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          date = daysUntilTarget === 0 ? addDays(today, 7) : addDays(today, daysUntilTarget);
        }
        break;
      }
    }

    const dateMatch = lower.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dateMatch) {
      const [day, month, year] = dateMatch.slice(1, 4).map(Number);
      const targetYear = year || new Date().getFullYear();
      date = parse(`${day}/${month}/${targetYear}`, 'd/M/yyyy', new Date());
    }
  }

  if (isEvent) {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  let hours = date.getHours();
  let minutes = date.getMinutes();

  if (lower.includes('sang') || lower.includes('buoi sang')) {
    hours = 8;
    minutes = 0;
  } else if (lower.includes('trua') || lower.includes('buoi trua')) {
    hours = 12;
    minutes = 0;
  } else if (lower.includes('chieu') || lower.includes('buoi chieu')) {
    hours = 14;
    minutes = 0;
  } else if (lower.includes('toi') || lower.includes('buoi toi')) {
    hours = 19;
    minutes = 0;
  }

  const timeMatch = lower.match(/(\d{1,2})(?:pm|am|h|gio|:(\d{2}))/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    if (lower.includes('pm') && hours < 12) hours += 12;
    if (timeMatch[2]) minutes = parseInt(timeMatch[2], 10);
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}


function extractCleanTitle(text: string): string {
  const timeKeywords = [
    'hom nay', 'mai', 'ngay mai', 'tuan nay', 'tuan sau', 'tuan toi',
    'sang', 'buoi sang', 'trua', 'buoi trua', 'chieu', 'buoi chieu', 'toi', 'buoi toi',
    'thu 2', 'thu hai', 't2', 'thu 3', 'thu ba', 't3', 'thu 4', 'thu tu', 't4', 'thu 5', 'thu nam',
    't5', 'thu 6', 'thu sau', 't6', 'thu 7', 'thu bay', 't7', 'chu nhat', 'cn',
    /\d{1,2}\/\d{1,2}(?:\/\d{4})?/g,
    /\d{1,2}(?:pm|am|gio|h|:\d{2})/gi
  ];

  let cleanTitle = normalizeText(text);

  timeKeywords.forEach(keyword => {
    if (typeof keyword === 'string') {
      cleanTitle = cleanTitle.replace(new RegExp(keyword, 'gi'), '');
    } else {
      cleanTitle = cleanTitle.replace(keyword, '');
    }
  });

  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  return cleanTitle || text;
}


function detectTags(text: string) {
  const lower = normalizeText(text);
  const tags: string[] = [];

  if (lower.includes('urgent') || lower.includes('khan cap') || lower.includes('gap')) {
    tags.push('urgent', 'high');
  } else if (lower.includes('quan trong') || lower.includes('important') || lower.includes('high')) {
    tags.push('high');
  } else if (lower.includes('low') || lower.includes('thap')) {
    tags.push('low');
  }

  if (lower.includes('study') || lower.includes('hoc') || lower.includes('ielts') || lower.includes('thi')) {
    tags.push('study');
  }
  if (lower.includes('work') || lower.includes('cong viec')) {
    tags.push('work');
  }
  if (lower.includes('personal') || lower.includes('ca nhan')) {
    tags.push('personal');
  }
  if (lower.includes('lai xe') || lower.includes('xe')) {
    tags.push('transport');
  }

  return tags.length > 0 ? tags : ['quick-add'];
}


function hasDateCue(input: string) {
  const lower = normalizeText(input);
  if (/(\bthu\s*[2-7]\b|\bt[2-7]\b|\bcn\b|chu\s*nhat)/i.test(lower)) return true;
  if (/(\bhom\s*nay\b|\bngay\s*mai\b|\bmai\b|\btuan\s*nay\b|\btuan\s*sau\b)/i.test(lower)) return true;
  if (/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/.test(lower)) return true;
  return false;
}

function shouldTreatAsFinance(input: string, aiResult: any) {
  const lower = normalizeText(input);
  const hasDayOfWeek = /\b(thu\s*[2-7]|t[2-7]|cn|chu\s*nhat)\b/i.test(lower);
  const hasCurrency = /\b\d+[,.]?\d*\s*(k|vnd|d|\$)\b/i.test(lower);
  const hasMoneyVerb = /\b(chi|mua|tra|uong|an|cafe|luong|nhan)\b/i.test(lower);
  const explicitFinance = hasCurrency || hasMoneyVerb;

  if (hasDayOfWeek && !explicitFinance) return false;
  if (!aiResult?.amount && !explicitFinance) return false;

  return true;
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
          const { getUserIdOrDev } = await import('@/lib/auth');
          const userId = await getUserIdOrDev();
          if (!userId) return null;
          const settings = await prismaClient.settings.findUnique({
            where: { userId }
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
          content: `You are a strict JSON parser for Vietnamese quick-add input.
Return ONLY valid JSON (no markdown, no extra text).

Output schema:
{"type":"TASK|EVENT|TRANSACTION","title":"string","date":"ISO-8601","amount":number,"category":"string","tags":["string"],"isEvent":boolean}

Classification rules:
- If input contains a monetary amount AND a spending verb (chi, mua, trả, thanh toán, ăn, uống), classify as TRANSACTION with type "TRANSACTION".
- If input contains a monetary amount AND an income verb (thu, nhận, lương), classify as TRANSACTION with type "TRANSACTION".
- If input has day-of-week/time but no money cues, classify as TASK or EVENT.
- If input is a reminder without money, classify as TASK/EVENT (not TRANSACTION).

IMPORTANT - Amount rules:
- Always return positive numbers for the "amount" field (never negative).
- The transaction type (income vs expense) is determined by the verb in the input, NOT by the amount sign.
- For expenses: return positive amount (e.g., "chi 45k" -> amount: 45000)
- For income: return positive amount (e.g., "thu 2tr" -> amount: 2000000)

Examples:
"thi lái xe sáng thứ 7" -> {"type":"TASK","title":"thi lái xe","date":"...","tags":["study","transport"],"isEvent":false}
"chi 45k ăn sáng mai" -> {"type":"TRANSACTION","title":"ăn sáng","amount":45000,"date":"...","category":"Food","isEvent":false}
"thu 2tr lương" -> {"type":"TRANSACTION","title":"lương","amount":2000000,"date":"...","category":"Salary","isEvent":false}`
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

    const rawContent = completion.choices[0].message.content || '{}';
    try {
      const result = JSON.parse(rawContent);
      return result;
    } catch (parseError) {
      console.error('AI JSON parse error:', parseError);
      return { __parseError: true };
    }
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
}

type SmartRuleMatch = {
  mappedType: 'TRANSACTION' | 'TASK' | 'EVENT';
  mappedCategory: string | null;
};

async function findSmartRuleMatch(
  input: string,
  userId?: string
): Promise<SmartRuleMatch | null> {
  if (!userId) return null;
  try {
    const { prisma } = await import('@/lib/db');
    const rules = await prisma.smartKeyword.findMany({
      where: { userId }
    });
    if (!rules.length) return null;
    const normalizedInput = normalizeText(input);
    const matched = rules
      .map((rule) => ({
        rule,
        normalizedKeyword: normalizeText(rule.keyword)
      }))
      .filter((entry) => entry.normalizedKeyword.length > 0)
      .filter((entry) => normalizedInput.includes(entry.normalizedKeyword))
      .sort((a, b) => b.normalizedKeyword.length - a.normalizedKeyword.length)[0];

    if (!matched) return null;
    return {
      mappedType: matched.rule.mappedType as SmartRuleMatch['mappedType'],
      mappedCategory: matched.rule.mappedCategory
    };
  } catch (error) {
    console.error('Smart rule lookup error:', error);
    return null;
  }
}

export async function quickAddParser(input: string, userId?: string) {
  const smartRule = await findSmartRuleMatch(input, userId);
  if (smartRule) {
    const amount = detectAmount(input);
    const tags = detectTags(input);
    const isEvent = smartRule.mappedType === 'EVENT';
    const date = detectDate(input, isEvent);
    const formattedAmount = Math.round((amount || 0) / 1000);
    const category = smartRule.mappedCategory || detectCategory(input);

    const isFinance = smartRule.mappedType === 'TRANSACTION';
    const transactionType = detectType(input) || 'EXPENSE';

    const transactions = isFinance
      ? [
          {
            type: transactionType,
            amount: amount || 0,
            currency: 'VND',
            category,
            note: input,
            dateAt: formatISO(date)
          }
        ]
      : [];

    const calendarItems = isFinance
      ? [
          {
            type: 'FINANCE_REMINDER',
            title: `${formattedAmount}k`,
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
            description: 'Tạo từ Smart Learning',
            startAt: formatISO(date),
            endAt: null,
            dueAt: isEvent ? null : formatISO(date),
            tags: Array.isArray(tags) ? tags.join(',') : tags,
            status: 'TODO'
          }
        ];

    return {
      clarifyingQuestion: null,
      assumptions: ['Đã sử dụng Smart Learning để parse.'],
      create: {
        calendarItems,
        transactions
      }
    };
  }

  // Try AI parsing first (if available)
  const aiResult = await parseWithAI(input);
  
  if (aiResult && aiResult.type && !aiResult.__parseError) {
    const isEvent = aiResult.isEvent || false;
    const aiDate =
      typeof aiResult.date === 'string' && !Number.isNaN(Date.parse(aiResult.date))
        ? aiResult.date
        : formatISO(new Date());
    const finalDate = hasDateCue(input) ? formatISO(detectDate(input, isEvent)) : aiDate;

    // Use AI result
    const isFinance = aiResult.type === 'TRANSACTION' && shouldTreatAsFinance(input, aiResult);
    
    const inferredType = inferTransactionType(input, aiResult);
    const normalizedAmount = Math.abs(aiResult.amount || 0);
    const formattedAmount = Math.round(normalizedAmount / 1000);

    const transactions = isFinance
      ? [
          {
            type: inferredType,
            amount: normalizedAmount,
            currency: 'VND',
            category: aiResult.category || 'General',
            note: aiResult.description || input,
            dateAt: finalDate
          }
        ]
      : [];

    const calendarItems = isFinance
      ? [
          {
            type: 'FINANCE_REMINDER',
            title: `${formattedAmount}k`,
            description: aiResult.description || input,
            startAt: finalDate,
            endAt: null,
            dueAt: finalDate,
            tags: (aiResult.tags || []).join(',')
          }
        ]
      : [
          {
            type: isEvent ? 'EVENT' : 'TASK',
            title: aiResult.title || extractCleanTitle(input),
            description: aiResult.description || 'Tạo từ Quick Add',
            startAt: finalDate,
            endAt: null,
            // For events, don't set dueAt (no deadline)
            // For tasks, set dueAt (has deadline)
            dueAt: isEvent ? null : finalDate,
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
  
  const formattedAmount = Math.round((amount || 0) / 1000);

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
          title: `${formattedAmount}k`,
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
