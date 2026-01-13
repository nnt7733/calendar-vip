'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  note: string;
  dateAt: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    note: '',
    amount: '',
    categoryId: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    dateAt: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

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
      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories').catch(() => null) // Categories endpoint might not exist
      ]);

      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      // Try to get categories from transactions or create default list
      if (categoriesRes) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } else {
        // Extract unique categories from transactions
        const uniqueCategories = Array.from(
          new Map(transactionsData.map((t: Transaction) => [t.category.id, t.category])).values()
        );
        setCategories(uniqueCategories as any);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.note || !formData.amount || !formData.categoryId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          amount: Number(formData.amount),
          currency: 'VND',
          categoryId: formData.categoryId,
          note: formData.note,
          dateAt: new Date(formData.dateAt).toISOString()
        })
      });

      if (res.ok) {
        setFormData({
          note: '',
          amount: '',
          categoryId: '',
          type: 'EXPENSE',
          dateAt: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
        await fetchData();
        alert('Đã thêm transaction thành công! Transaction sẽ hiển thị trên calendar.');
      } else {
        const errorData = await res.json();
        alert(`Failed to create transaction: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading finance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Finance Manager</h2>
        <p className="text-sm text-slate-400">Thu/Chi + Budget + Report.</p>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Total Income</h3>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Total Expense</h3>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Balance</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Transaction List</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{item.note}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400">{item.category.name}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(item.dateAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {item.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </p>
                    <span
                      className={`badge mt-1 ${
                        item.type === 'INCOME'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Add Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-200"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Note</label>
              <input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-200 placeholder:text-slate-500"
                placeholder="What is this transaction?"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-200 placeholder:text-slate-500"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-200"
                required
              >
                <option value="">Select category</option>
                {categories
                  .filter((cat) => cat.type === formData.type || cat.type === 'BOTH')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Date & Time</label>
              <input
                type="datetime-local"
                value={formData.dateAt}
                onChange={(e) => setFormData({ ...formData, dateAt: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-200"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-3 py-2 font-semibold text-white hover:bg-primary/90"
            >
              Save
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">Monthly Report</h3>
          <p className="text-sm text-slate-400">
            Income: {formatCurrency(totalIncome)} • Expense: {formatCurrency(totalExpense)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Income</span>
              <span className="text-green-400">{((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">Top Categories</h3>
          <div className="space-y-2 text-sm">
            {Array.from(
              new Map(
                transactions
                  .filter((t) => t.type === 'EXPENSE')
                  .map((t) => [t.category.id, { name: t.category.name, total: 0 }])
              ).values()
            )
              .map((cat) => {
                const total = transactions
                  .filter((t) => t.category.id === cat.name && t.type === 'EXPENSE')
                  .reduce((sum, t) => sum + t.amount, 0);
                return { name: cat.name, total };
              })
              .sort((a, b) => b.total - a.total)
              .slice(0, 3)
              .map((cat) => (
                <div key={cat.name} className="flex justify-between">
                  <span className="text-slate-400">{cat.name}</span>
                  <span className="text-white font-semibold">{formatCurrency(cat.total)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold text-white">Insights</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              Average expense: {formatCurrency(Math.round(totalExpense / Math.max(transactions.filter(t => t.type === 'EXPENSE').length, 1)))}
            </li>
            <li>
              Transactions this month: {transactions.length}
            </li>
            <li>
              Balance status: {balance >= 0 ? 'Positive' : 'Negative'}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
