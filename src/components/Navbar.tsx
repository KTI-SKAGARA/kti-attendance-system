"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAdmin, checkAuth } from "@/app/actions/auth";
import { checkGoogleSheetsConnection } from "@/app/actions/attendance";
import { LogOut, Database, ShieldCheck, PlusCircle, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState(false);

  useEffect(() => {
    async function verify() {
      const auth = await checkAuth();
      setIsAuthenticated(auth);
      const conn = await checkGoogleSheetsConnection();
      setIsSheetsConnected(conn);
    }
    verify();
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  };

  // Don't show full navigation if on login page
  if (pathname === "/login") {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-sm">
              K
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                KTI SKAGARA
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                SMK Negeri 3 Jepara
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-sm transition-transform group-hover:scale-105">
            K
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
              KTI SKAGARA
            </span>
            <span className="text-[10px] font-medium text-slate-400 leading-tight">
              SMK Negeri 3 Jepara
            </span>
          </div>
        </Link>

        {/* Center: Google Sheets status badge & Auto-Setup */}
        <div className="hidden md:flex items-center gap-2">
          {isSheetsConnected ? (
            <div className="flex items-center gap-2">
              <span className="badge badge-hadir text-[11px] font-mono">
                <Database className="h-3 w-3 text-emerald-600" /> Google Sheets Connected
              </span>
              <button
                onClick={async () => {
                  const { runAutoSetupGoogleSheet } = await import("@/app/actions/attendance");
                  const res = await runAutoSetupGoogleSheet();
                  if (res.success) {
                    alert(res.data || "⚡ Google Sheet berhasil di-setup!");
                  } else {
                    alert(res.error || "Gagal setup Google Sheet.");
                  }
                }}
                className="btn btn-ghost text-[11px] py-1 px-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md font-medium"
                title="Format otomatis tab GEN 10, GEN 11, GEN 12 dan header di Google Sheet Anda"
              >
                ⚡ Auto Setup Sheet
              </button>
            </div>
          ) : (
            <span className="badge badge-sakit text-[11px] font-mono" title="Isi .env.local untuk menghubungkan ke live Google Sheets">
              <Database className="h-3 w-3 text-amber-600" /> Mode Demo (Belum Connect Sheet)
            </span>
          )}
        </div>

        {/* Right Navigation */}
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`btn text-xs px-3 py-1.5 rounded-lg ${
              pathname === "/" ? "btn-secondary border-blue-200 bg-blue-50/50 text-blue-700 font-semibold" : "btn-ghost"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/input"
            className={`btn text-xs px-3 py-1.5 rounded-lg ${
              pathname === "/input" ? "btn-primary shadow-sm font-semibold" : "btn-secondary"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            + Input Data
          </Link>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="btn btn-ghost text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 ml-1"
              title="Keluar dari sesi Admin"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
