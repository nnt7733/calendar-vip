'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, DollarSign, CheckSquare, AlertCircle } from 'lucide-react';
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
  amount?: number;
  category?: string;
  tags?: string[];
  confidence: 'high' | 'medium' | 'low';
  assumptions: string[];
}

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setParsedResult(null);
      setError(null);
    }
  }, [isOpen]);

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

      // Create preview
      const calendarItem = hasCalendarItems ? result.create.calendarItems[0] : null;
      const transaction = hasTransactions ? result.create.transactions[0] : null;

      const preview: ParsedResult = {
        type: hasTransactions ? 'TRANSACTION' : (calendarItem?.type as any || 'TASK'),
        title: calendarItem?.title || transaction?.note || input,
        description: calendarItem?.description || transaction?.note || '',
        date: calendarItem?.startAt || calendarItem?.dueAt || transaction?.dateAt 
          ? new Date(calendarItem?.startAt || calendarItem?.dueAt || transaction?.dateAt) 
          : new Date(),
        amount: transaction?.amount,
        category: transaction?.category,
        tags: calendarItem?.tags ? (Array.isArray(calendarItem.tags) ? calendarItem.tags : calendarItem.tags.split(',')) : [],
        confidence: result.assumptions?.length > 0 ? 'medium' : 'high',
        assumptions: result.assumptions || []
      };

      setParsedResult(preview);
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
      // Get categories for transactions
      const categoriesRes = await fetch('/api/categories');
      const categories = await categoriesRes.json();

      // Parse again to get full data
      const parseRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });

      if (!parseRes.ok) {
        const errorText = await parseRes.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to parse input: ${parseRes.status}`);
      }

      // Check if response is JSON
      const contentType = parseRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await parseRes.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      const result = await parseRes.json();

      // Create transactions
      if (result.create?.transactions?.length > 0) {
        for (const trans of result.create.transactions) {
          const matchedCategory = categories.find(
            (cat: any) =>
              cat.name.toLowerCase().includes(trans.category.toLowerCase()) ||
              trans.category.toLowerCase().includes(cat.name.toLowerCase())
          );
          
          let categoryId = matchedCategory?.id;
          if (!categoryId) {
            const defaultCategory = categories.find(
              (cat: any) => cat.type === trans.type || cat.type === 'BOTH'
            );
            categoryId = defaultCategory?.id || categories[0]?.id;
          }

          if (categoryId) {
            await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...trans,
                categoryId
              })
            });
          }
        }
      }

      // Create calendar items
      if (result.create?.calendarItems?.length > 0) {
        for (const item of result.create.calendarItems) {
          const response = await fetch('/api/calendar-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...item,
              tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',') : []
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create calendar item');
          }
        }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
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
                  if (parsedResult) {
                    handleConfirm();
                  } else {
                    handleParse();
                  }
                }
              }}
              placeholder='Ví dụ: "Thi lái xe sáng thứ 7 tuần này" hoặc "Chi 45k ăn sáng mai 7pm"'
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary focus:outline-none resize-none"
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

          {/* Parsed Result Preview */}
          {parsedResult && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Preview</h3>
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

              <div className="space-y-3">
                {/* Type */}
                <div className="flex items-center gap-2">
                  {parsedResult.type === 'TASK' && <CheckSquare className="h-4 w-4 text-blue-400" />}
                  {parsedResult.type === 'EVENT' && <Calendar className="h-4 w-4 text-purple-400" />}
                  {parsedResult.type === 'TRANSACTION' && <DollarSign className="h-4 w-4 text-green-400" />}
                  <span className="text-sm font-medium text-slate-300">{parsedResult.type}</span>
                </div>

                {/* Title */}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Tiêu đề</p>
                  <p className="text-sm font-semibold text-white">{parsedResult.title}</p>
                </div>

                {/* Date */}
                {parsedResult.date && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Thời gian</p>
                    <p className="text-sm text-slate-300">
                      {format(parsedResult.date, 'EEEE, MMMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}

                {/* Amount */}
                {parsedResult.amount && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Số tiền</p>
                    <p className="text-sm font-semibold text-green-400">
                      {new Intl.NumberFormat('vi-VN').format(parsedResult.amount)} VND
                    </p>
                  </div>
                )}

                {/* Category */}
                {parsedResult.category && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Danh mục</p>
                    <p className="text-sm text-slate-300">{parsedResult.category}</p>
                  </div>
                )}

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
          {!parsedResult ? (
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

