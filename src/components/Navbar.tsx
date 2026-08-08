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
    <header className="sticky top-0 z-30 border-b-2 border-accent/10 bg-glass-bg backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={pathname === "/login" ? "/login" : "/"}
          className="flex items-center"
        >
          <img
            src="/logo-kti.jpg"
            alt={APP_NAME}
            className="h-8 w-8 rounded-lg border-2 border-foreground/20"
          />
          <span className="ml-2.5 font-display text-sm font-extrabold uppercase tracking-tight text-foreground">
            KTI SKAGARA
          </span>
          <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-widest text-muted sm:inline">
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
                  className={`relative min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    isActive(link.href)
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {isActive(link.href) && (
                    <span className="absolute inset-x-1 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent" />
                  )}
                  <span className="flex items-center gap-1.5">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </span>
                </Link>
              ))}
              <button
                onClick={cycleTheme}
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2"
                title="Ganti tema"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost min-h-[44px] px-3 py-2 text-sm text-muted hover:!text-danger"
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
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2"
                title="Ganti tema"
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn btn-ghost min-h-[44px] min-w-[44px] px-2 py-2"
                aria-label="Menu"
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
        <div className="border-t-2 border-border bg-surface md:hidden">
          <nav className="flex flex-col p-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide ${
                  isActive(link.href)
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
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
                className="flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:!text-danger"
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