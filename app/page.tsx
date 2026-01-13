const upcomingTasks = [
  { title: 'IELTS Reading 2h', due: 'Hôm nay, 19:00' },
  { title: 'Viết plan tuần mới', due: 'Thứ 2, 09:00' },
  { title: 'Hoàn thành chapter 3', due: 'Cuối tuần' }
];

const todayFinance = [
  { label: 'Thu nhập', value: '2.000.000 VND' },
  { label: 'Chi tiêu', value: '120.000 VND' },
  { label: 'Còn lại', value: '1.880.000 VND' }
];

const budgets = [
  { name: 'Food & Drink', used: 65, limit: '1.500.000 VND' },
  { name: 'Transport', used: 40, limit: '500.000 VND' },
  { name: 'Study', used: 80, limit: '2.000.000 VND' }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Upcoming Tasks</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            {upcomingTasks.map((task) => (
              <li key={task.title} className="flex items-center justify-between">
                <span>{task.title}</span>
                <span className="text-xs text-slate-500">{task.due}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Today Finance</h2>
          <div className="space-y-3">
            {todayFinance.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-base font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Budget Status</h2>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{budget.name}</span>
                  <span className="text-slate-400">{budget.limit}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${budget.used}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-white hover:border-primary">
              Quick Add Task
            </button>
            <button className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-white hover:border-primary">
              Quick Add Expense
            </button>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Insights</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Top spending category: Food & Drink (45%).</li>
            <li>So sánh tháng này vs tháng trước: +12% thu nhập.</li>
            <li>Streak: 3 ngày không chi tiêu lớn.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
