"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";
import { Lock, KeyRound, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan password admin terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await loginAdmin(password);

    setSubmitting(false);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "Password salah!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Akses Terbatas Admin KTI
          </h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Sistem Manajemen Absensi & Kas Rutin KTI SMK Negeri 3 Jepara
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="card-polished p-6 sm:p-8 space-y-5 animate-entry"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="admin-password" className="label !mb-0">
                Password / PIN Wewenang
              </label>
              <span className="text-[11px] text-blue-600 font-mono font-semibold">
                Admin Only
              </span>
            </div>

            <div className="relative mt-1">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                className={`input pl-9 pr-10 ${
                  error ? "!border-red-500 focus:!ring-red-500/20" : ""
                }`}
                placeholder="Masukkan password admin..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tampilkan password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium animate-entry">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-2.5 font-semibold text-sm shadow-md"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {submitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>

          {/* Dev Hint Box */}
          <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-center">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong className="font-semibold">Password Default:</strong>{" "}
              <code className="bg-blue-100/80 font-mono px-1.5 py-0.5 rounded text-blue-800 font-bold">
                ktiskagara2026
              </code>
            </p>
            <p className="text-[11px] text-blue-700 mt-1">
              (Dapat diubah lewat env <code className="font-mono">ADMIN_PASSWORD</code> di Vercel)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
