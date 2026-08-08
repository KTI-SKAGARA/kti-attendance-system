"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Terjadi kesalahan
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {error.message || "App mengalami error yang tidak terduga."}
      </p>
      <button onClick={reset} className="btn btn-primary mt-5 min-h-[44px] px-4 py-2 text-sm">
        Coba Lagi
      </button>
    </div>
  );
}
