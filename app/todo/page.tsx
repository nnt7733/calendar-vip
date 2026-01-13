const inbox = [
  { title: 'Chuẩn bị slide học nhóm', priority: 'High' },
  { title: 'Mua sổ tay', priority: 'Low' }
];

const planned = [
  { title: 'IELTS Writing 2h', due: 'Thứ 5' },
  { title: 'Ôn từ vựng', due: 'Thứ 7' }
];

const done = [{ title: 'Review finance week', doneAt: 'Hôm qua' }];

export default function TodoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Todo Manager</h2>
        <p className="text-sm text-slate-400">Inbox, planned, done with priorities & tags.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Inbox</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            {inbox.map((item) => (
              <li key={item.title} className="flex items-center justify-between">
                <span>{item.title}</span>
                <span className="badge">{item.priority}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Planned</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            {planned.map((item) => (
              <li key={item.title} className="flex items-center justify-between">
                <span>{item.title}</span>
                <span className="text-xs text-slate-400">{item.due}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Done</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            {done.map((item) => (
              <li key={item.title} className="flex items-center justify-between">
                <span className="line-through">{item.title}</span>
                <span className="text-xs text-slate-400">{item.doneAt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Quick Add</h3>
        <p className="text-sm text-slate-400">Hỗ trợ nhập task và finance cùng một input.</p>
        <div className="mt-4 flex gap-3">
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200"
            placeholder="Ví dụ: Mua sách 120k mai 7pm"
          />
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            Parse
          </button>
        </div>
      </div>
    </div>
  );
}
