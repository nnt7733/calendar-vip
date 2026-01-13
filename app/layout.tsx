import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Coins, LayoutDashboard, ListTodo, Settings } from 'lucide-react';
import QuickAddButton from './components/QuickAddButton';

export const metadata: Metadata = {
  title: 'Smart Calendar Planner + Finance',
  description: 'Calendar planner and finance manager with AI quick add.'
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/todo', label: 'Todo', icon: ListTodo },
  { href: '/finance', label: 'Finance', icon: Coins },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen bg-slate-950">
          <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/80 p-6 lg:flex">
            <div className="mb-8">
              <p className="text-lg font-semibold text-white">Smart Calendar</p>
              <p className="text-sm text-slate-400">Planner + Finance</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <div>
                <p className="text-sm text-slate-400">Xin chào 👋</p>
                <h1 className="text-xl font-semibold text-white">Smart Calendar Planner + Finance</h1>
              </div>
              <div className="flex items-center gap-4">
                <QuickAddButton />
                <span className="badge">Local-only mode</span>
              </div>
            </header>
            <main className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
