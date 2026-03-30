export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center">
      <div className="flex items-center gap-3 text-brand-700">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  );
}
