'use client';

import { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import Link from 'next/link';

interface CalendarItem {
  id: string;
  type: string;
  title: string;
  dueAt: string | null;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  dateAt: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, transactionsRes] = await Promise.all([
        fetch('/api/calendar-items'),
        fetch('/api/transactions')
      ]);
      const itemsData = await itemsRes.json();
      const transactionsData = await transactionsRes.json();
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}k`;
    }
    return `${amount}`;
  };

  const today = new Date();
  const upcomingTasks = items
    .filter((item) => {
      if (item.status === 'DONE') return false;
      if (!item.dueAt) return false;
      const dueDate = new Date(item.dueAt);
      return dueDate >= today && dueDate <= addDays(today, 7);
    })
    .slice(0, 3)
    .map((item) => ({
      title: item.title,
      due: item.dueAt ? format(new Date(item.dueAt), 'MMM d, HH:mm') : 'No due date'
    }));

  const todayTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.dateAt);
    return format(transactionDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  const todayIncome = todayTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayBalance = todayIncome - todayExpense;

  const allIncome = transactions.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const allExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  // Calculate budget usage (simplified - would need actual budget data)
  const foodExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0); // Simplified - should filter by category
  const foodBudget = 1500000;
  const foodUsed = Math.min((foodExpense / foodBudget) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Upcoming Tasks</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming tasks</p>
          ) : (
            <ul className="space-y-3 text-sm text-slate-300">
              {upcomingTasks.map((task, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{task.title}</span>
                  <span className="text-xs text-slate-500">{task.due}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/todo"
            className="mt-4 block text-xs text-primary hover:underline"
          >
            View all tasks →
          </Link>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Today Finance</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Thu nhập</span>
              <span className="text-base font-semibold text-green-400">
                {formatCurrency(todayIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Chi tiêu</span>
              <span className="text-base font-semibold text-red-400">
                {formatCurrency(todayExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-sm text-slate-400">Còn lại</span>
              <span
                className={`text-base font-semibold ${todayBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {formatCurrency(todayBalance)}
              </span>
            </div>
          </div>
          <Link
            href="/finance"
            className="mt-4 block text-xs text-primary hover:underline"
          >
            View all transactions →
          </Link>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Budget Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-300">Food & Drink</span>
                <span className="text-slate-400">{formatCurrency(foodBudget)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div
                  className={`h-2 rounded-full ${
                    foodUsed >= 80 ? 'bg-red-500' : foodUsed >= 50 ? 'bg-yellow-500' : 'bg-accent'
                  }`}
                  style={{ width: `${foodUsed}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {foodUsed.toFixed(1)}% used ({formatCurrency(foodExpense)})
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/todo"
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-white hover:border-primary transition-colors text-center"
            >
              Quick Add Task
            </Link>
            <Link
              href="/finance"
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-white hover:border-primary transition-colors text-center"
            >
              Quick Add Expense
            </Link>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Insights</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              Total income: <span className="text-green-400 font-semibold">{formatCurrency(allIncome)}</span>
            </li>
            <li>
              Total expense: <span className="text-red-400 font-semibold">{formatCurrency(allExpense)}</span>
            </li>
            <li>
              Active tasks: <span className="text-white font-semibold">
                {items.filter((i) => i.status === 'TODO').length}
              </span>
            </li>
            <li>
              Completed tasks: <span className="text-green-400 font-semibold">
                {items.filter((i) => i.status === 'DONE').length}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
