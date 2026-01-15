'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, DollarSign, CheckSquare, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedResult {
  type: 'TASK' | 'EVENT' | 'FINANCE_REMINDER' | 'TRANSACTION';
  title: string;
  description?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date | null;
  amount?: number;
  category?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringRule?: string | null;
  confidence: 'high' | 'medium' | 'low';
  assumptions: string[];
}

interface ParsedItem {
  id: string;
  title: string;
  type: 'TASK' | 'EVENT' | 'TRANSACTION';
  priority: number;
  date: string;
  startDate?: string;
  endDate?: string | null;
  amount?: number;
  category?: string;
  isRecurring?: boolean;
  recurringRule?: string | null;
}

type FormType = 'TASK' | 'EVENT' | 'TRANSACTION';

interface QuickAddFormData {
  title: string;
  type: FormType;
  amount: string;
  category: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  recurringRule: string;
}

// Normalize ParsedResult type to FormType (FINANCE_REMINDER -> TRANSACTION)
const normalizeToFormType = (type: ParsedResult['type']): FormType => {
  if (type === 'FINANCE_REMINDER' || type === 'TRANSACTION') {
    return 'TRANSACTION';
  }
  if (type === 'TASK' || type === 'EVENT') {
    return type;
  }
  return 'TASK'; // default fallback
};

const detectTransactionType = (text: string) => {
  const lower = text.toLowerCase();
  if (/\b(thu|nhan|luong)\b/i.test(lower)) return 'INCOME';
  if (/\b(chi|mua|tra|uong|an|cafe)\b/i.test(lower)) return 'EXPENSE';
  return null;
};

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [originalParsed, setOriginalParsed] = useState<ParsedResult | null>(null);
  const [reviewList, setReviewList] = useState<ParsedItem[]>([]);
  const [mode, setMode] = useState<'INPUT' | 'REVIEW'>('INPUT');
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<QuickAddFormData>({
    title: '',
    type: 'TASK',
    amount: '',
    category: '',
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurringRule: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setParsedResult(null);
      setOriginalParsed(null);
      setReviewList([]);
      setMode('INPUT');
      setReviewErrors({});
      setFormData({
        title: '',
        type: 'TASK',
        amount: '',
        category: '',
        startDate: '',
        endDate: '',
        isRecurring: false,
        recurringRule: ''
      });
      setError(null);
    }
  }, [isOpen]);

  const formatDateInput = (date?: Date | null) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const toDate = (value: string) => {
    if (!value) return null;
    return new Date(`${value}T00:00:00`);
  };

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, 'dd/MM/yyyy');
  };

  const formatDateInputValue = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return format(parsed, 'yyyy-MM-dd');
  };

  const normalizeDateTimeString = (value?: string | null) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T00:00:00.000Z`;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return null;
  };

  const mapItemsToReviewList = (items: any[]): ParsedItem[] => {
    return items.map((item: any, idx: number) => ({
      id: `temp-${idx}`,
      title: item.title || input,
      type: item.type === 'TRANSACTION' ? 'TRANSACTION' : item.type === 'EVENT' ? 'EVENT' : 'TASK',
      priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 3,
      date: item.startDate || item.date || '',
      startDate: item.startDate || item.date || '',
      endDate: item.endDate || null,
      amount: typeof item.amount === 'number' ? item.amount : undefined,
      category: item.category || '',
      isRecurring: Boolean(item.isRecurring),
      recurringRule: item.recurringRule || null
    }));
  };

  const mapCreateToReviewList = (result: any): ParsedItem[] => {
    const list: ParsedItem[] = [];
    const calendarItems = result.create?.calendarItems || [];
    const transactions = result.create?.transactions || [];

    calendarItems.forEach((item: any) => {
      if (!item || item.type === 'FINANCE_REMINDER') return;
      list.push({
        id: `temp-${list.length}`,
        title: item.title || input,
        type: item.type === 'EVENT' ? 'EVENT' : 'TASK',
        priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 3,
        date: item.startAt || item.dueAt || '',
        startDate: item.startAt || item.dueAt || '',
        endDate: item.endAt || (item.type === 'TASK' ? item.dueAt : null) || null,
        isRecurring: Boolean(item.isRecurring),
        recurringRule: item.recurringRule || null
      });
    });

    transactions.forEach((trans: any) => {
      list.push({
        id: `temp-${list.length}`,
        title: trans.note || input,
        type: 'TRANSACTION',
        priority: 3,
        date: trans.dateAt || '',
        startDate: trans.dateAt || '',
        amount: typeof trans.amount === 'number' ? trans.amount : undefined,
        category: trans.category || '',
        isRecurring: Boolean(trans.isRecurring),
        recurringRule: trans.recurringRule || null
      });
    });

    return list;
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: any) => {
    const id = reviewList[index]?.id;
    setReviewList((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextItem = { ...item, [field]: value };
        if (field === 'isRecurring' && !value) {
          nextItem.recurringRule = null;
        }
        return nextItem;
      })
    );
    if (id && reviewErrors[id]) {
      setReviewErrors((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const removeItem = (index: number) => {
    const id = reviewList[index]?.id;
    setReviewList((prev) => prev.filter((_, idx) => idx !== index));
    if (id && reviewErrors[id]) {
      setReviewErrors((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateReviewItem = (item: ParsedItem) => {
    const startDate = normalizeDateTimeString(item.startDate || item.date);
    if (!startDate) return 'Ngày bắt đầu không hợp lệ.';
    if (item.isRecurring && !item.recurringRule?.trim()) {
      return 'Vui lòng nhập recurring rule khi bật Repeat.';
    }
    if (item.type === 'TRANSACTION') {
      const amount = Number(item.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return 'Số tiền phải lớn hơn 0.';
      return null;
    }
    if (item.endDate) {
      const endDate = normalizeDateTimeString(item.endDate);
      if (!endDate) return 'Ngày kết thúc không hợp lệ.';
      if (new Date(endDate) < new Date(startDate)) {
        return 'Ngày kết thúc phải sau ngày bắt đầu.';
      }
    }
    return null;
  };

  const handleParse = async () => {
    if (!input.trim()) return;

    setParsing(true);
    setError(null);
    setParsedResult(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to parse input: ${res.status}`);
      }

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const result = await res.json();
      
      // Check if rate limited
      if (res.status === 429) {
        setError(result.assumptions?.[0] || 'Đã đạt giới hạn sử dụng AI hôm nay. Vui lòng thử lại vào ngày mai.');
        setParsing(false);
        return;
      }
      
      // Analyze the parsed result
      const hasTransactions = result.create?.transactions?.length > 0;
      const hasCalendarItems = result.create?.calendarItems?.length > 0;
      
      if (!hasTransactions && !hasCalendarItems) {
        setError('Không thể nhận diện được loại item. Vui lòng thử lại với format rõ ràng hơn.');
        setParsing(false);
        return;
      }
      
      // Log usage stats if available
      if (result.usage) {
        console.log('AI Usage:', result.usage);
      }

      if (Array.isArray(result.items) && result.items.length > 0) {
        const mappedItems = mapItemsToReviewList(result.items);
        setReviewList(mappedItems);
        setMode('REVIEW');
        setParsedResult(null);
        return;
      }

      const createReviewItems = mapCreateToReviewList(result);
      if (createReviewItems.length > 1) {
        setReviewList(createReviewItems);
        setMode('REVIEW');
        setParsedResult(null);
        return;
      }

      // Create preview
      const calendarItem = hasCalendarItems ? result.create.calendarItems[0] : null;
      const transaction = hasTransactions ? result.create.transactions[0] : null;
      const previewTitle = hasTransactions
        ? (transaction?.note || input)
        : (calendarItem?.title || input);

      const preview: ParsedResult = {
        type: hasTransactions ? 'TRANSACTION' : (calendarItem?.type as any || 'TASK'),
        title: previewTitle,
        description: calendarItem?.description || transaction?.note || '',
        date: calendarItem?.startAt || calendarItem?.dueAt || transaction?.dateAt
          ? new Date(calendarItem?.startAt || calendarItem?.dueAt || transaction?.dateAt)
          : new Date(),
        startDate: calendarItem?.startAt
          ? new Date(calendarItem.startAt)
          : calendarItem?.dueAt
            ? new Date(calendarItem.dueAt)
            : transaction?.dateAt
              ? new Date(transaction.dateAt)
              : new Date(),
        endDate: calendarItem?.endAt
          ? new Date(calendarItem.endAt)
          : calendarItem?.dueAt
            ? new Date(calendarItem.dueAt)
            : null,
        amount: transaction?.amount,
        category: transaction?.category,
        tags: calendarItem?.tags ? (Array.isArray(calendarItem.tags) ? calendarItem.tags : calendarItem.tags.split(',')) : [],
        isRecurring: calendarItem?.isRecurring ?? transaction?.isRecurring ?? false,
        recurringRule: calendarItem?.recurringRule ?? transaction?.recurringRule ?? null,
        confidence: result.assumptions?.length > 0 ? 'medium' : 'high',
        assumptions: result.assumptions || []
      };

      setParsedResult(preview);
      setOriginalParsed(preview);
      setFormData({
        title: preview.title || input,
        type: normalizeToFormType(preview.type),
        amount: typeof preview.amount === 'number' ? String(preview.amount) : '',
        category: preview.category || '',
        startDate: formatDateInput(preview.startDate || preview.date),
        endDate: formatDateInput(preview.endDate),
        isRecurring: Boolean(preview.isRecurring),
        recurringRule: preview.recurringRule || ''
      });
    } catch (err: any) {
      console.error('Parse error:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi phân tích';
      if (errorMessage.includes('non-JSON') || errorMessage.includes('DOCTYPE')) {
        setError('Lỗi kết nối server. Vui lòng kiểm tra lại hoặc thử lại sau.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult) return;

    setParsing(true);
    try {
      const finalType = formData.type; // Already FormType, safe to use
      const finalCategory = formData.category.trim();
      const validationMessage = validateReviewItem({
        id: 'single',
        title: formData.title,
        type: finalType,
        priority: 3,
        date: formData.startDate,
        startDate: formData.startDate,
        endDate: finalType === 'TRANSACTION' ? null : formData.endDate || null,
        amount: finalType === 'TRANSACTION' ? Number(formData.amount || 0) : undefined,
        category: finalType === 'TRANSACTION' ? finalCategory : undefined,
        isRecurring: formData.isRecurring,
        recurringRule: formData.recurringRule
      });
      if (validationMessage) {
        setError(validationMessage);
        setParsing(false);
        return;
      }
      const startDate = toDate(formData.startDate) || new Date();
      const endDate = toDate(formData.endDate);

      // Normalize original type for comparison (FINANCE_REMINDER -> TRANSACTION)
      const originalType = originalParsed ? normalizeToFormType(originalParsed.type) : null;
      const originalCategory = originalParsed?.category || '';
      const typeChanged = originalType ? finalType !== originalType : false;
      const categoryChanged =
        originalParsed &&
        finalType === 'TRANSACTION' &&
        finalCategory.toLowerCase() !== originalCategory.toLowerCase();
      const shouldLearn = Boolean(originalParsed && (typeChanged || categoryChanged));

      if (shouldLearn && formData.title.trim()) {
        // finalType is already FormType (TRANSACTION | TASK | EVENT), safe to send
        await fetch('/api/smart-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: formData.title.trim(),
            type: finalType,
            category: finalType === 'TRANSACTION' ? finalCategory || undefined : undefined
          })
        });
      }

      if (finalType === 'TRANSACTION') {
        const categoriesRes = await fetch('/api/categories');
        const categories = await categoriesRes.json();
        const amount = Number(formData.amount || 0);
        const matchedCategory = categories.find(
          (cat: any) =>
            finalCategory &&
            (cat.name.toLowerCase().includes(finalCategory.toLowerCase()) ||
              finalCategory.toLowerCase().includes(cat.name.toLowerCase()))
        );
        let categoryId = matchedCategory?.id;
        if (!categoryId) {
          const detectedType = detectTransactionType(input) || 'EXPENSE';
          const defaultCategory = categories.find(
            (cat: any) => cat.type === detectedType || cat.type === 'BOTH'
          );
          categoryId = defaultCategory?.id || categories[0]?.id;
        }

        if (categoryId) {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: detectTransactionType(input) || 'EXPENSE',
              amount,
              currency: 'VND',
              categoryId,
              note: formData.title.trim() || input,
              dateAt: startDate.toISOString(),
              isRecurring: formData.isRecurring,
              recurringRule: formData.isRecurring ? formData.recurringRule.trim() : undefined
            })
          });
        }
      } else {
        await fetch('/api/calendar-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: finalType,
            title: formData.title.trim() || input,
            description: 'Tạo từ Quick Add',
            startAt: startDate.toISOString(),
            endAt: finalType === 'EVENT' ? (endDate || startDate).toISOString() : null,
            dueAt: finalType === 'TASK' ? (endDate || startDate).toISOString() : null,
            tags: parsedResult.tags || [],
            status: finalType === 'TASK' ? 'TODO' : undefined,
            isRecurring: formData.isRecurring,
            recurringRule: formData.isRecurring ? formData.recurringRule.trim() : undefined
          })
        });
      }

      // Refresh data
      onSuccess();
      onClose();
      setInput('');
      setParsedResult(null);
    } catch (err: any) {
      console.error('Create error:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo item';
      if (errorMessage.includes('non-JSON') || errorMessage.includes('DOCTYPE')) {
        setError('Lỗi kết nối server. Vui lòng kiểm tra lại hoặc thử lại sau.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmAll = async () => {
    if (reviewList.length === 0) return;
    setParsing(true);
    setError(null);
    setReviewErrors({});

    try {
      const errors: Record<string, string> = {};
      reviewList.forEach((item) => {
        const message = validateReviewItem(item);
        if (message) errors[item.id] = message;
      });
      if (Object.keys(errors).length > 0) {
        setReviewErrors(errors);
        setParsing(false);
        return;
      }
      const hasTransactions = reviewList.some((item) => item.type === 'TRANSACTION');
      const categories = hasTransactions ? await (await fetch('/api/categories')).json() : [];

      for (const item of reviewList) {
        if (item.type === 'TRANSACTION') {
          const amount = Number(item.amount || 0);
          const categoryLabel = item.category || '';
          const matchedCategory = categories.find(
            (cat: any) =>
              categoryLabel &&
              (cat.name.toLowerCase().includes(categoryLabel.toLowerCase()) ||
                categoryLabel.toLowerCase().includes(cat.name.toLowerCase()))
          );
          let categoryId = matchedCategory?.id;
          if (!categoryId) {
            const detectedType = detectTransactionType(item.title) || 'EXPENSE';
            const defaultCategory = categories.find(
              (cat: any) => cat.type === detectedType || cat.type === 'BOTH'
            );
            categoryId = defaultCategory?.id || categories[0]?.id;
          }

          if (categoryId) {
            const dateAt = normalizeDateTimeString(item.startDate);
            if (!dateAt) return;
            await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: detectTransactionType(item.title) || 'EXPENSE',
                amount,
                currency: 'VND',
                categoryId,
                note: item.title.trim() || input,
                dateAt,
                isRecurring: item.isRecurring,
                recurringRule: item.recurringRule || undefined
              })
            });
          }
        } else {
          const startDate = normalizeDateTimeString(item.startDate);
          if (!startDate) return;
          const endDate = item.endDate || null;
          await fetch('/api/calendar-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: item.type,
              title: item.title.trim() || input,
              description: 'Tạo từ Quick Add',
              startAt: startDate,
              endAt: item.type === 'EVENT' ? endDate : null,
              dueAt: item.type === 'TASK' ? endDate || startDate : null,
              tags: ['quick-add'],
              status: item.type === 'TASK' ? 'TODO' : undefined,
              priority: item.priority,
              isRecurring: item.isRecurring,
              recurringRule: item.recurringRule || undefined
            })
          });
        }
      }

      onSuccess();
      onClose();
      setInput('');
      setParsedResult(null);
      setReviewList([]);
      setMode('INPUT');
    } catch (err: any) {
      console.error('Create error:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo item';
      if (errorMessage.includes('non-JSON') || errorMessage.includes('DOCTYPE')) {
        setError('Lỗi kết nối server. Vui lòng kiểm tra lại hoặc thử lại sau.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setParsing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-black/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Quick Add</h2>
              <p className="text-sm text-slate-400">Nhập tự nhiên, AI sẽ tự động nhận diện</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nhập mô tả của bạn
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && !parsing) {
                  if (mode === 'REVIEW') {
                    handleConfirmAll();
                  } else if (parsedResult) {
                    handleConfirm();
                  } else {
                    handleParse();
                  }
                }
              }}
              placeholder='Ví dụ: "Thi lái xe sáng thứ 7 tuần này" hoặc "Chi 45k ăn sáng mai 7pm"'
              className="w-full rounded-xl border border-slate-800 bg-black/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none resize-none"
              rows={3}
              disabled={parsing}
            />
            <p className="mt-2 text-xs text-slate-500">
              Nhấn Ctrl+Enter để parse hoặc confirm
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Lỗi</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {mode === 'REVIEW' && reviewList.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-black/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Duyệt lại ({reviewList.length} items)
                </h3>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {reviewList.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-black/70 p-3 rounded-xl border border-slate-800"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-700 focus:border-primary text-slate-100 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={item.priority}
                          onChange={(e) => updateItem(index, 'priority', Number(e.target.value))}
                          className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                        >
                          {[1, 2, 3, 4, 5].map((p) => (
                            <option key={p} value={p}>
                              Mức {p}
                            </option>
                          ))}
                        </select>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(index, 'type', e.target.value)}
                          className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                        >
                          <option value="TASK">Task</option>
                          <option value="EVENT">Event</option>
                          <option value="TRANSACTION">Finance</option>
                        </select>
                        <input
                          type="date"
                          value={formatDateInputValue(item.startDate || item.date)}
                          onChange={(e) => {
                            updateItem(index, 'startDate', e.target.value);
                            updateItem(index, 'date', e.target.value);
                          }}
                          className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                        />
                      </div>
                      {item.type === 'TRANSACTION' && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            type="number"
                            value={item.amount ?? ''}
                            onChange={(e) =>
                              updateItem(
                                index,
                                'amount',
                                e.target.value === '' ? undefined : Number(e.target.value)
                              )
                            }
                            placeholder="Amount"
                            className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                          />
                          <input
                            value={item.category ?? ''}
                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                            placeholder="Category"
                            className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {item.type !== 'TRANSACTION' && (
                          <input
                            type="date"
                            value={formatDateInputValue(item.endDate || '')}
                            onChange={(e) => updateItem(index, 'endDate', e.target.value)}
                            className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                          />
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isRecurring)}
                            onChange={(e) => updateItem(index, 'isRecurring', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                          />
                          <span>Repeat</span>
                          {item.isRecurring && (
                            <input
                              value={item.recurringRule ?? ''}
                              onChange={(e) => updateItem(index, 'recurringRule', e.target.value)}
                              placeholder="DAILY / WEEKLY"
                              className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                            />
                          )}
                        </div>
                      </div>
                      {reviewErrors[item.id] && (
                        <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/60 rounded px-2 py-1">
                          {reviewErrors[item.id]}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:bg-red-900/20 p-2 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Result Preview */}
          {mode !== 'REVIEW' && parsedResult && (
            <div className="rounded-xl border border-slate-800 bg-black/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Chỉnh sửa kết quả</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    parsedResult.confidence === 'high'
                      ? 'bg-green-500/20 text-green-300'
                      : parsedResult.confidence === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {parsedResult.confidence === 'high' ? 'Độ chính xác cao' : 'Cần xác nhận'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Title</label>
                  <input
                    value={formData.title}
                    onChange={(e) => {
                      setError(null);
                      setFormData({ ...formData, title: e.target.value });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Type</label>
                  <div className="flex items-center gap-2">
                    {formData.type === 'TASK' && <CheckSquare className="h-4 w-4 text-blue-400" />}
                    {formData.type === 'EVENT' && <Calendar className="h-4 w-4 text-purple-400" />}
                    {formData.type === 'TRANSACTION' && <DollarSign className="h-4 w-4 text-green-400" />}
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setError(null);
                        setFormData({ ...formData, type: e.target.value as FormType });
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                    >
                      <option value="TASK">Task</option>
                      <option value="EVENT">Event</option>
                      <option value="TRANSACTION">Finance</option>
                    </select>
                  </div>
                </div>

                {/* Amount */}
                {formData.type === 'TRANSACTION' && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Amount</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        setError(null);
                        setFormData({ ...formData, amount: e.target.value });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {/* Category */}
                {formData.type === 'TRANSACTION' && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Category</label>
                    <input
                      value={formData.category}
                      onChange={(e) => {
                        setError(null);
                        setFormData({ ...formData, category: e.target.value });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      {formData.type === 'TRANSACTION' ? 'Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setError(null);
                        setFormData({ ...formData, startDate: e.target.value });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                    />
                  </div>
                  {formData.type !== 'TRANSACTION' && (
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        {formData.type === 'EVENT' ? 'End Date' : 'Due Date'}
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                          setError(null);
                          setFormData({ ...formData, endDate: e.target.value });
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => {
                      setError(null);
                      setFormData({
                        ...formData,
                        isRecurring: e.target.checked,
                        recurringRule: e.target.checked ? formData.recurringRule : ''
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                  />
                  <span>Repeat</span>
                  {formData.isRecurring && (
                    <input
                      value={formData.recurringRule}
                      onChange={(e) => {
                        setError(null);
                        setFormData({ ...formData, recurringRule: e.target.value });
                      }}
                      placeholder="DAILY / WEEKLY"
                      className="bg-black/80 text-xs rounded px-2 py-1 text-slate-200"
                    />
                  )}
                </div>

                {/* Tags */}
                {parsedResult.tags && parsedResult.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {parsedResult.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assumptions */}
                {parsedResult.assumptions.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Giả định</p>
                    <ul className="space-y-1">
                      {parsedResult.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-xs text-slate-400">• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 p-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            disabled={parsing}
          >
            Hủy
          </button>
          {mode === 'REVIEW' ? (
            <button
              onClick={handleConfirmAll}
              disabled={parsing || reviewList.length === 0}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Xác nhận tạo {reviewList.length} items
                </>
              )}
            </button>
          ) : !parsedResult ? (
            <button
              onClick={handleParse}
              disabled={parsing || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Phân tích với AI
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={parsing}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Xác nhận và tạo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

