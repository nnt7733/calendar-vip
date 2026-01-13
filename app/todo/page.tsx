'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface CalendarItem {
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

export default function TodoPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    
    // Listen for refresh event
    const handleRefresh = () => {
      fetchItems();
    };
    window.addEventListener('refresh-data', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-data', handleRefresh);
    };
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/calendar-items');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await fetch(`/api/calendar-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      });
      await fetchItems();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const inbox = items.filter((item) => item.type === 'TASK' && !item.dueAt && item.status === 'TODO');
  const planned = items.filter(
    (item) => item.type === 'TASK' && item.dueAt && item.status === 'TODO'
  );
  const done = items.filter((item) => item.status === 'DONE');

  const getPriority = (tags: string) => {
    const tagList = tags.toLowerCase().split(',');
    if (tagList.some((t) => t.includes('urgent') || t.includes('high'))) return 'High';
    if (tagList.some((t) => t.includes('low'))) return 'Low';
    return 'Medium';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'Low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Todo Manager</h2>
        <p className="text-sm text-slate-400">Inbox, planned, done with priorities & tags.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Inbox</h3>
          {inbox.length === 0 ? (
            <p className="text-sm text-slate-400">No items in inbox</p>
          ) : (
            <ul className="space-y-3">
              {inbox.map((item) => {
                const priority = getPriority(item.tags);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={item.status === 'DONE'}
                      onChange={() => toggleStatus(item.id, item.status)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className={`text-sm ${item.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                        {item.title}
                      </span>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      )}
                    </div>
                    <span className={`badge ${getPriorityColor(priority)}`}>{priority}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Planned</h3>
          {planned.length === 0 ? (
            <p className="text-sm text-slate-400">No planned items</p>
          ) : (
            <ul className="space-y-3">
              {planned.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                >
                  <input
                    type="checkbox"
                    checked={item.status === 'DONE'}
                    onChange={() => toggleStatus(item.id, item.status)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className={`text-sm ${item.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                      {item.title}
                    </span>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {item.dueAt ? format(new Date(item.dueAt), 'EEE, MMM d') : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-white">Done</h3>
          {done.length === 0 ? (
            <p className="text-sm text-slate-400">No completed items</p>
          ) : (
            <ul className="space-y-3">
              {done.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-700/50 p-3 opacity-60"
                >
                  <input
                    type="checkbox"
                    checked={item.status === 'DONE'}
                    onChange={() => toggleStatus(item.id, item.status)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-slate-400 line-through">{item.title}</span>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-600 line-through">{item.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-green-400">✓</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
