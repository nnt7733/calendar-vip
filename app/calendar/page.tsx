const views = ['Month', 'Week', 'Day'];
const filters = ['Tasks/Notes', 'Finance', 'Both'];

const schedule = [
  { time: '09:00', title: 'IELTS Reading', tag: 'Task' },
  { time: '12:30', title: 'Chi ăn trưa 45k', tag: 'Expense' },
  { time: '18:00', title: 'Gym session', tag: 'Task' }
];

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Calendar Planner</h2>
          <p className="text-sm text-slate-400">Month/Week/Day view with task + finance overlay.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200"
              >
                {filter}
              </button>
            ))}
          </div>
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
            Add Event
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Calendar grid placeholder (month/week/day)
          </div>
          <div className="space-y-4">
            {schedule.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                  <span className="badge">{item.tag}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Daily Finance Summary</h3>
          <p className="text-sm text-slate-400">Expense: 120k • Income: 2tr</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Finance Drawer</h3>
          <p className="text-sm text-slate-400">Tap a day to open transaction list.</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">AI Auto Plan</h3>
          <p className="text-sm text-slate-400">Split tasks into sessions, avoid conflicts.</p>
        </div>
      </section>
    </div>
  );
}
