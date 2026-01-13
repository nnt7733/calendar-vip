import { addDays, formatISO, parse } from 'date-fns';

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

function detectDate(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('hôm nay')) {
    return new Date();
  }
  if (lower.includes('mai')) {
    return addDays(new Date(), 1);
  }
  const match = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const [day, month] = match.slice(1, 3).map(Number);
    const year = new Date().getFullYear();
    return parse(`${day}/${month}/${year}`, 'd/M/yyyy', new Date());
  }
  return new Date();
}

export function quickAddParser(input: string) {
  const type = detectType(input);
  const amount = detectAmount(input);
  const date = detectDate(input);
  const category = detectCategory(input);

  const transactions =
    type && amount
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

  const calendarItems = type
    ? []
    : [
        {
          type: 'TASK',
          title: input,
          description: 'Tạo từ Quick Add',
          startAt: null,
          endAt: null,
          dueAt: formatISO(date),
          tags: ['quick-add']
        }
      ];

  return {
    clarifyingQuestion: null,
    assumptions: [
      'Nếu không nhận diện là thu/chi thì sẽ tạo task mặc định.',
      'Ngày mặc định là hôm nay nếu không tìm thấy.'
    ],
    create: {
      calendarItems,
      transactions
    }
  };
}
