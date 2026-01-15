import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Coins, LayoutDashboard, ListTodo, Settings } from 'lucide-react';
import QuickAddButton from './components/QuickAddButton';
import MobileMenu from './components/MobileMenu';
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

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
    <ClerkProvider>
      <html lang="vi">
        <body>
          <div className="flex min-h-screen bg-slate-950">
            {/* Desktop Sidebar - hidden on mobile */}
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
              {/* Header - responsive */}
              <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Menu Toggle */}
                  <MobileMenu />
                  
                  {/* Title - responsive */}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Xin chao</p>
                    <h1 className="text-base sm:text-xl font-semibold text-white truncate">
                      <span className="sm:hidden">Smart Calendar</span>
                      <span className="hidden sm:inline">Smart Calendar Planner + Finance</span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <SignedOut>
                    <SignInButton />
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                  <SignedIn>
                    <QuickAddButton />
                  </SignedIn>
                  <span className="badge hidden sm:inline-flex">Local-only mode</span>
                </div>
              </header>

              {/* Main content - responsive padding */}
              <main className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6 sm:px-6 sm:py-8">
                {children}
              </main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
