'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  format,
  formatISO,
  parse,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isPast,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Star, DollarSign, CheckSquare } from 'lucide-react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useCalendarData, CalendarItem, Transaction } from '@/hooks/useCalendarData';

type ViewMode = 'all' | 'tasks' | 'finance';

const getItemColor = (type: string, status: string, daysUntilDue: number | null, priority: string) => {
  if (status === 'DONE') {
    return 'bg-slate-700/50 border-slate-600 text-slate-400';
  }

  // Deadline countdown colors
  if (daysUntilDue !== null && daysUntilDue >= 0) {
    if (daysUntilDue === 0) {
      return 'bg-red-500/30 border-red-500/70 text-red-200'; // Due today
    } else if (daysUntilDue <= 2) {
      return 'bg-orange-500/30 border-orange-500/70 text-orange-200'; // Due soon
    } else if (daysUntilDue <= 7) {
      return 'bg-yellow-500/30 border-yellow-500/70 text-yellow-200'; // Due this week
    }
  }

  switch (type) {
    case 'TASK':
      return priority === 'high'
        ? 'bg-blue-600/30 border-blue-500/70 text-blue-200'
        : 'bg-blue-500/20 border-blue-500/50 text-blue-300';
    case 'EVENT':
      return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
    case 'FINANCE_REMINDER':
      return 'bg-slate-700/40 border-slate-600 text-slate-300';
    case 'NOTE':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
    default:
      return 'bg-slate-700/50 border-slate-600 text-slate-300';
  }
};

const getItemPriority = (tags: string) => {
  const tagList = tags.toLowerCase().split(',');
  if (tagList.some((t) => t.includes('urgent') || t.includes('high'))) return 'high';
  if (tagList.some((t) => t.includes('low'))) return 'low';
  return 'medium';
};

const getDaysUntilDue = (dueAt: string | null): number | null => {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = differenceInDays(due, today);
  return diff;
};

type DraggableCalendarItemProps = {
  item: CalendarItem;
  className: string;
  title?: string;
  children: React.ReactNode;
};

function DraggableCalendarItem({ item, className, title, children }: DraggableCalendarItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.6 : 1 }}
      className={`${className} ${isDragging ? 'ring-1 ring-primary/60' : ''} cursor-grab active:cursor-grabbing`}
      title={title}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

type DroppableDayCellProps = {
  id: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
};

function DroppableDayCell({ id, className, onClick, children }: DroppableDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`${className} ${isOver ? 'ring-2 ring-primary/40' : ''}`}
      data-day-id={id}
    >
      {children}
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Memoize date range calculations to prevent infinite re-renders
  const { calendarStart, calendarEnd, days } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return {
      calendarStart: start,
      calendarEnd: end,
      days: eachDayOfInterval({ start, end })
    };
  }, [currentDate]);

  // Fetch data for the visible calendar range
  const { items, transactions, loading, refreshData } = useCalendarData({
    startDate: calendarStart,
    endDate: calendarEnd
  });

  const getItemsForDate = (date: Date) => {
    let filteredItems = items.filter((item) => {
      if (viewMode === 'finance') {
        return item.type === 'FINANCE_REMINDER';
      }
      if (viewMode === 'tasks') {
        return item.type !== 'FINANCE_REMINDER';
      }
      return true;
    });

    return filteredItems.filter((item) => {
      if (item.startAt) {
        return isSameDay(new Date(item.startAt), date);
      }
      if (item.dueAt) {
        return isSameDay(new Date(item.dueAt), date);
      }
      return false;
    });
  };

  const getTransactionsForDate = (date: Date) => {
    if (viewMode === 'tasks') return [];
    return transactions.filter((trans) => {
      return isSameDay(new Date(trans.dateAt), date);
    });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}k`;
    }
    return `${amount}`;
  };

  const mergeDateWithTime = (sourceIso: string | null, targetDate: Date) => {
    if (!sourceIso) return null;
    const source = new Date(sourceIso);
    const merged = new Date(targetDate);
    merged.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
    return formatISO(merged);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const item = items.find((i) => i.id === active.id);
      if (!item) return;

      const targetDayId = String(over.id);
      const targetDate = parse(targetDayId, 'yyyy-MM-dd', new Date());
      if (Number.isNaN(targetDate.getTime())) return;

      const currentDateSource = item.startAt ?? item.dueAt;
      if (currentDateSource) {
        const currentDayId = format(new Date(currentDateSource), 'yyyy-MM-dd');
        if (currentDayId === targetDayId) return;
      }

      const payload: Record<string, any> = { id: item.id };
      const hasStart = Boolean(item.startAt);
      const hasDue = Boolean(item.dueAt);

      if (hasStart) payload.startAt = mergeDateWithTime(item.startAt, targetDate);
      if (hasDue) payload.dueAt = mergeDateWithTime(item.dueAt, targetDate);

      if (!hasStart && !hasDue) {
        const iso = formatISO(targetDate);
        if (item.type === 'EVENT') {
          payload.startAt = iso;
        } else {
          payload.dueAt = iso;
        }
      }

      try {
        await fetch('/api/calendar-items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await refreshData();
      } catch (error) {
        console.error('Failed to update item date:', error);
      }
    },
    [items, refreshData]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="space-y-4">
        {/* Title and Add Button Row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Calendar Planner</h2>
            <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Month view with task + finance overlay.</p>
          </div>
          <button
            onClick={async () => {
              const title = prompt('Event title:');
              if (title) {
                const dateStr = prompt('Date & Time (YYYY-MM-DD HH:mm) or press Enter for today:');
                const date = dateStr ? new Date(dateStr) : new Date();
                try {
                  await fetch('/api/calendar-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'EVENT',
                      title,
                      description: '',
                      startAt: date.toISOString(),
                      endAt: null,
                      dueAt: null,
                      tags: ['event']
                    })
                  });
                  await refreshData();
                  alert('Event đã được tạo thành công!');
                } catch (error) {
                  alert('Failed to create event');
                }
              }
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Controls Row - Scrollable on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-1 sm:gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-1 overflow-x-auto">
            <button
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'tasks'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="h-3 w-3" />
              Tasks
            </button>
            <button
              onClick={() => setViewMode('finance')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'finance'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="h-3 w-3" />
              Finance
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <button
              onClick={prevMonth}
              className="rounded-full border border-slate-700 p-2 hover:bg-slate-800 active:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4 text-slate-300" />
            </button>
            <h3 className="text-base sm:text-lg font-semibold text-white min-w-[140px] sm:min-w-[180px] text-center">
              {format(currentDate, 'MMM yyyy')}
            </h3>
            <button
              onClick={nextMonth}
              className="rounded-full border border-slate-700 p-2 hover:bg-slate-800 active:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="card p-2 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400">Loading calendar...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 pb-2">
            <DndContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-xl overflow-hidden min-w-[600px] sm:min-w-[700px]">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="bg-slate-900/80 p-2 text-center">
                    <p className="text-xs font-semibold text-slate-400">{day}</p>
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, idx) => {
                  const dayItems = getItemsForDate(day);
                  const dayTransactions = getTransactionsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const dayId = format(day, 'yyyy-MM-dd');

                  return (
                    <DroppableDayCell
                      key={idx}
                      id={dayId}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[90px] sm:min-h-[120px] bg-slate-900/60 p-1.5 sm:p-2 border border-slate-800 hover:bg-slate-800/80 active:bg-slate-700/80 transition-colors cursor-pointer ${
                        !isCurrentMonth ? 'opacity-40' : ''
                      } ${isTodayDate ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-slate-900' : ''} ${
                        isSelected ? 'bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            isTodayDate
                              ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center'
                              : isCurrentMonth
                                ? 'text-slate-300'
                                : 'text-slate-600'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {/* Calendar Items */}
                        {dayItems.slice(0, 3).map((item) => {
                          const priority = getItemPriority(item.tags);
                          const daysUntilDue = getDaysUntilDue(item.dueAt);
                          const isHighPriority = priority === 'high';
                          return (
                            <DraggableCalendarItem
                              key={item.id}
                              item={item}
                              className={`text-xs px-2 py-1 rounded border truncate flex items-center gap-1 ${getItemColor(
                                item.type,
                                item.status,
                                daysUntilDue,
                                priority
                              )} ${isHighPriority ? 'font-semibold' : ''}`}
                              title={item.title}
                            >
                              {isHighPriority && (
                                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                              )}
                              {item.type === 'FINANCE_REMINDER' && <DollarSign className="h-2.5 w-2.5" />}
                              {item.title}
                              {daysUntilDue !== null && daysUntilDue >= 0 && (
                                <span className="ml-auto text-[10px] opacity-75">
                                  {daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d`}
                                </span>
                              )}
                            </DraggableCalendarItem>
                          );
                        })}
                        {/* Transactions (if finance view) */}
                        {viewMode !== 'tasks' &&
                          dayTransactions.slice(0, dayItems.length < 3 ? 3 - dayItems.length : 0).map((trans) => {
                            const isExpense = trans.type === 'EXPENSE';
                            return (
                              <div
                                key={trans.id}
                                className="text-xs px-2 py-1 rounded border truncate flex items-center gap-1 bg-slate-800/60 border-slate-700 text-slate-300"
                                title={trans.note}
                              >
                                <DollarSign className="h-2.5 w-2.5" />
                                {isExpense ? '-' : '+'}
                                {formatCurrency(trans.amount)}
                              </div>
                            );
                          })}
                        {(dayItems.length + (viewMode !== 'tasks' ? dayTransactions.length : 0)) > 3 && (
                          <div className="text-xs text-slate-500 px-2">
                            +{dayItems.length + (viewMode !== 'tasks' ? dayTransactions.length : 0) - 3} more
                          </div>
                        )}
                      </div>
                    </DroppableDayCell>
                  );
                })}
              </div>
            </DndContext>
          </div>
        )}
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {/* Calendar Items */}
            {getItemsForDate(selectedDate).length === 0 &&
            getTransactionsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-slate-400">No items for this date</p>
            ) : (
              <>
                {getItemsForDate(selectedDate).map((item) => {
                  const priority = getItemPriority(item.tags);
                  const daysUntilDue = getDaysUntilDue(item.dueAt);
                  const isHighPriority = priority === 'high';
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 ${getItemColor(
                        item.type,
                        item.status,
                        daysUntilDue,
                        priority
                      )}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.type !== 'FINANCE_REMINDER' && (
                              <input
                                type="checkbox"
                                checked={item.status === 'DONE'}
                                onChange={async () => {
                                  const newStatus = item.status === 'DONE' ? 'TODO' : 'DONE';
                                  try {
                                    await fetch('/api/calendar-items', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        id: item.id,
                                        status: newStatus
                                      })
                                    });
                                    await refreshData();
                                  } catch (error) {
                                    console.error('Failed to update status:', error);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                              />
                            )}
                            {isHighPriority && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                            <span className="text-xs font-semibold uppercase">{item.type}</span>
                            {item.status === 'DONE' && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                Done
                              </span>
                            )}
                            {daysUntilDue !== null && daysUntilDue >= 0 && (
                              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                                {daysUntilDue === 0
                                  ? 'Due Today'
                                  : daysUntilDue === 1
                                    ? 'Due Tomorrow'
                                    : `${daysUntilDue} days left`}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-slate-300 mb-2">{item.description}</p>
                          )}
                          {item.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags
                                .split(',')
                                .filter((t) => t.trim())
                                .map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-slate-800/50 text-slate-300 px-2 py-0.5 rounded"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 ml-4">
                          {item.startAt && (
                            <div>Start: {format(new Date(item.startAt), 'HH:mm')}</div>
                          )}
                          {item.dueAt && <div>Due: {format(new Date(item.dueAt), 'HH:mm')}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Transactions */}
                {getTransactionsForDate(selectedDate).map((trans) => (
                  <div
                    key={trans.id}
                    className="rounded-xl border p-4 bg-green-500/20 border-green-500/50 text-green-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase">{trans.type}</span>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{trans.note}</h4>
                        <p className="text-sm text-slate-300">{trans.category?.name ?? 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {trans.type === 'EXPENSE' ? '-' : '+'}
                          {formatCurrency(trans.amount)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(trans.dateAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">This Month</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Tasks</span>
              <span className="text-white font-semibold">
                {items.filter((i) => i.type === 'TASK').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Events</span>
              <span className="text-white font-semibold">
                {items.filter((i) => i.type === 'EVENT').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Finance</span>
              <span className="text-white font-semibold">
                {transactions.length} transactions
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">Completed</h3>
          <p className="text-3xl font-bold text-green-400">
            {items.filter((i) => i.status === 'DONE').length}
          </p>
          <p className="text-sm text-slate-400 mt-1">out of {items.length} total items</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">Upcoming</h3>
          <p className="text-sm text-slate-400">
            {items.filter((i) => {
              if (!i.dueAt && !i.startAt) return false;
              const date = i.dueAt ? new Date(i.dueAt) : new Date(i.startAt!);
              return date > new Date() && i.status !== 'DONE';
            }).length}{' '}
            items coming up
          </p>
        </div>
      </section>
    </div>
  );
}
