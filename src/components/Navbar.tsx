"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { logoutAdmin, checkAuth } from "@/app/actions/auth";
import { APP_NAME, SCHOOL_NAME } from "@/lib/constants";
import {
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    checkAuth().then(setIsAuthenticated);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = mounted
    ? theme === "light"
      ? Sun
      : theme === "dark"
        ? Moon
        : Monitor
    : Monitor;

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/input", label: "Input Data", icon: PlusCircle },
    ...(isAuthenticated
      ? [{ href: "/admin", label: "Admin", icon: Settings }]
      : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={pathname === "/login" ? "/login" : "/"}
          className="flex items-center"
        >
          <img
            src="/logo-kti.jpg"
            alt={APP_NAME}
            className="h-8 w-8 rounded"
          />
          <span className="ml-2.5 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {APP_NAME}
          </span>
          <span className="ml-2 hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
            {SCHOOL_NAME}
          </span>
        </Link>

        {pathname !== "/login" && (
          <>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`btn min-h-[44px] px-3 py-2 text-sm ${
                    isActive(link.href)
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      : "btn-ghost text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <button
                onClick={cycleTheme}
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2 text-slate-500 dark:text-slate-400"
                title="Ganti tema"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost min-h-[44px] px-3 py-2 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400"
                  title="Keluar dari sesi Admin"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              )}
            </nav>

            {/* Mobile hamburger */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={cycleTheme}
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2 text-slate-500 dark:text-slate-400"
                title="Ganti tema"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2 text-slate-600 dark:text-slate-400"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && pathname !== "/login" && (
        <div className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <nav className="flex flex-col p-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`btn min-h-[48px] justify-start px-4 py-3 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "btn-ghost text-slate-600 dark:text-slate-400"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="btn btn-ghost min-h-[48px] justify-start px-4 py-3 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
