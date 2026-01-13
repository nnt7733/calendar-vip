const settings = [
  { label: 'Working hours', value: '08:00 - 18:00' },
  { label: 'Default session time', value: '30 phút' },
  { label: 'Currency', value: 'VND' },
  { label: 'Month start day', value: 'Monday' },
  { label: 'AI mode', value: 'On (rule-based fallback)' }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Configure planner + finance preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((item) => (
          <div key={item.label} className="card">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="mb-2 text-lg font-semibold">Privacy</h3>
        <p className="text-sm text-slate-400">
          Local-only mode, optional encryption, and AI toggles.
        </p>
      </div>
    </div>
  );
}
