'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import Link from 'next/link';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useBudgets } from '@/hooks/useBudgets';

interface BudgetWithSpending {
  id: string;
  categoryId: string | null;
  categoryName: string;
  limitAmount: number;
  alertPercent: number;
  spent: number;
  percentUsed: number;
}

export default function DashboardPage() {
  // Fetch data for current month (default behavior)
  const { items, transactions, loading: dataLoading } = useCalendarData();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const loading = dataLoading || budgetsLoading;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
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

  // Calculate spending per category and match with budgets
  const budgetsWithSpending: BudgetWithSpending[] = useMemo(() => {
    return budgets.map((budget) => {
      let spent = 0;
      
      if (budget.categoryId) {
        // Budget for specific category
        spent = transactions
          .filter((t) => t.type === 'EXPENSE' && t.category && t.category.id === budget.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
      } else {
        // Total budget (all expenses)
        spent = transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
      }

      const percentUsed = budget.limitAmount > 0 
        ? Math.min((spent / budget.limitAmount) * 100, 100) 
        : 0;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name ?? 'Total Budget',
        limitAmount: budget.limitAmount,
        alertPercent: budget.alertPercent,
        spent,
        percentUsed
      };
    });
  }, [budgets, transactions]);

  const getProgressBarColor = (percentUsed: number, alertPercent: number) => {
    if (percentUsed >= 100) return 'bg-red-500';
    if (percentUsed >= alertPercent) return 'bg-yellow-500';
    if (percentUsed >= alertPercent * 0.8) return 'bg-orange-400';
    return 'bg-accent';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
            {budgetsWithSpending.length === 0 ? (
              <p className="text-sm text-slate-400">No budgets set for this month</p>
            ) : (
              budgetsWithSpending.map((budget) => (
                <div key={budget.id}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-300">{budget.categoryName}</span>
                    <span className="text-slate-400">{formatCurrency(budget.limitAmount)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(
                        budget.percentUsed,
                        budget.alertPercent
                      )}`}
                      style={{ width: `${budget.percentUsed}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500">
                      {budget.percentUsed.toFixed(1)}% used ({formatCurrency(budget.spent)})
                    </p>
                    {budget.percentUsed >= budget.alertPercent && (
                      <span className={`text-xs font-medium ${
                        budget.percentUsed >= 100 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {budget.percentUsed >= 100 ? 'Over budget!' : 'Alert'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/finance"
            className="mt-4 block text-xs text-primary hover:underline"
          >
            Manage budgets →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
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
