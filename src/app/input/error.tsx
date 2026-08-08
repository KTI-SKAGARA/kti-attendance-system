"use client";

export default function InputError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-foreground">
        Gagal memuat form input
      </h2>
      <p className="mt-2 max-w-md text-sm font-medium text-muted">
        {error.message || "Terjadi error saat memuat halaman input."}
      </p>
      <button onClick={reset} className="btn btn-primary mt-5 min-h-[44px] px-4 py-2 text-sm">
        Coba Lagi
      </button>
    </div>
  );
}
