export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-300 bg-white p-8 text-center shadow-soft">
      <h3 className="font-heading text-xl text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
