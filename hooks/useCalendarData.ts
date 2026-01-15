'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface CalendarItem {
  id: string;
  type: string;
  title: string;
  description: string;
  startAt: string | null;
  endAt: string | null;
  dueAt: string | null;
  status: string;
  tags: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  note: string;
  dateAt: string;
  category: {
    id: string;
    name: string;
  } | null;
}

interface UseCalendarDataOptions {
  startDate?: Date;
  endDate?: Date;
}

interface UseCalendarDataReturn {
  items: CalendarItem[];
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function useCalendarData(options: UseCalendarDataOptions = {}): UseCalendarDataReturn {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current month key to use as dependency when no dates provided
  // This ensures the memo recomputes when the month changes
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Memoize ISO strings to prevent infinite re-renders
  // Default to current month if no dates provided
  const startDateISO = useMemo(() => {
    const date = options.startDate ?? startOfMonth(new Date());
    return date.toISOString();
  }, [options.startDate?.getTime(), currentMonthKey]);

  const endDateISO = useMemo(() => {
    const date = options.endDate ?? endOfMonth(new Date());
    return date.toISOString();
  }, [options.endDate?.getTime(), currentMonthKey]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate: startDateISO,
        endDate: endDateISO
      });

      const [itemsRes, transactionsRes] = await Promise.all([
        fetch(`/api/calendar-items?${params}`),
        fetch(`/api/transactions?${params}`)
      ]);

      // Validate HTTP responses before parsing
      if (!itemsRes.ok) {
        throw new Error(`Calendar items API error: ${itemsRes.status} ${itemsRes.statusText}`);
      }
      if (!transactionsRes.ok) {
        throw new Error(`Transactions API error: ${transactionsRes.status} ${transactionsRes.statusText}`);
      }

      const itemsData = await itemsRes.json();
      const transactionsData = await transactionsRes.json();

      setItems(Array.isArray(itemsData) ? itemsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Reset to empty arrays on error to avoid stale data
      setItems([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [startDateISO, endDateISO]);

  useEffect(() => {
    fetchData();

    // Listen for refresh event
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('refresh-data', handleRefresh);

    return () => {
      window.removeEventListener('refresh-data', handleRefresh);
    };
  }, [fetchData]);

  return {
    items,
    transactions,
    loading,
    refreshData: fetchData
  };
}

