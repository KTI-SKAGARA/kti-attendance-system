"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAdmin, checkAuth } from "@/app/actions/auth";
import { LogOut, PlusCircle, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth().then(setIsAuthenticated);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href={pathname === "/login" ? "/login" : "/"} className="flex items-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-600 text-sm font-bold text-white">
            K
          </span>
          <span className="ml-2.5 text-sm font-semibold tracking-tight text-slate-900">
            KTI SKAGARA
          </span>
          <span className="ml-2 hidden text-xs text-slate-400 sm:inline">
            SMK Negeri 3 Jepara
          </span>
        </Link>

        {pathname !== "/login" && (
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`btn px-3 py-1.5 text-xs ${
                pathname === "/"
                  ? "bg-slate-100 text-slate-900"
                  : "btn-ghost text-slate-600"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link
              href="/input"
              className={`btn px-3 py-1.5 text-xs ${
                pathname === "/input"
                  ? "bg-slate-100 text-slate-900"
                  : "btn-ghost text-slate-600"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Input Data
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="btn btn-ghost ml-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
