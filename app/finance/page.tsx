const transactions = [
  { title: 'Ăn sáng', type: 'EXPENSE', amount: '45k', category: 'Food' },
  { title: 'Lương', type: 'INCOME', amount: '2tr', category: 'Salary' },
  { title: 'Mua sách', type: 'EXPENSE', amount: '120k', category: 'Study' }
];

const categories = ['Food', 'Transport', 'Study', 'Fun', 'Bills'];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Finance Manager</h2>
        <p className="text-sm text-slate-400">Thu/Chi + Budget + Report.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Transaction List</h3>
          <div className="space-y-3">
            {transactions.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-800 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{item.amount}</p>
                  <span className="badge">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Add Transaction</h3>
          <form className="space-y-3 text-sm">
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2"
              placeholder="Note"
            />
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2"
              placeholder="Amount"
            />
            <select className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <button className="w-full rounded-xl bg-primary px-3 py-2 font-semibold text-white">
              Save
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Monthly Report</h3>
          <p className="text-sm text-slate-400">Chart placeholder (income vs expense).</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Budget Setup</h3>
          <p className="text-sm text-slate-400">Set limit per category + alerts.</p>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Insights</h3>
          <p className="text-sm text-slate-400">Top spending category + month compare.</p>
        </div>
      </section>
    </div>
  );
}
