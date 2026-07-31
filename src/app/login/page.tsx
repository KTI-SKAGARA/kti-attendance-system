"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

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
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm animate-page">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Login Admin KTI SKAGARA
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Absensi &amp; Kas Rutin — SMK Negeri 3 Jepara
          </p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <div className="relative">
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
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
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-2.5 text-sm font-semibold"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
