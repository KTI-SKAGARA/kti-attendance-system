export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">{value}</p>
    </div>
  );
}
