'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

export interface Budget {
  id: string;
  month: string;
  categoryId: string | null;
  limitAmount: number;
  alertPercent: number;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  } | null;
}

interface UseBudgetsOptions {
  month?: string;
}

interface UseBudgetsReturn {
  budgets: Budget[];
  loading: boolean;
  refreshBudgets: () => Promise<void>;
}

export function useBudgets(options: UseBudgetsOptions = {}): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current month key to use as dependency when no month provided
  // This ensures the memo recomputes when the month changes
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Default to current month
  const month = useMemo(() => {
    return options.month ?? currentMonthKey;
  }, [options.month, currentMonthKey]);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ month });
      const response = await fetch(`/api/budgets?${params}`);

      if (!response.ok) {
        throw new Error(`Budgets API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();

    // Listen for refresh event
    const handleRefresh = () => {
      fetchBudgets();
    };
    window.addEventListener('refresh-budgets', handleRefresh);
    window.addEventListener('refresh-data', handleRefresh);

    return () => {
      window.removeEventListener('refresh-budgets', handleRefresh);
      window.removeEventListener('refresh-data', handleRefresh);
    };
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    refreshBudgets: fetchBudgets
  };
}

