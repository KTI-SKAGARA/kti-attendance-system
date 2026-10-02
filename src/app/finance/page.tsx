"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingDown,
  TrendingUp,
  Plus,
  Loader2,
  ArrowLeft,
  Calendar,
  PieChart,
  BarChart3,
  ArrowLeftRight,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import type { Gen } from "@/types/attendance";
import type { Expense, ExpenseCategory, Income, IncomeCategory, Budget, MonthlyReport, KasPayment } from "@/types/finance";
import {
  getExpenseCategories,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getIncomeCategories,
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  getBudgets,
  upsertBudget,
  deleteBudget,
  getFinanceSummary,
  getMonthlyReport,
  getKasPayments,
} from "@/app/actions/finance";
import { getGenList } from "@/app/actions/attendance";
import { formatRupiah, getBulanTahunFromDate, getTodayFormatted } from "@/lib/utils";
import { APP_NAME, TOAST_DURATION } from "@/lib/constants";
import { calculateAllStudentsKas } from "@/lib/kas-allocation";
import { exportFinanceWorkbook } from "@/lib/export-finance";
import Toast from "@/components/Toast";
import FinanceSummaryCard from "@/components/finance/FinanceSummaryCard";
import ExpenseTable from "@/components/finance/ExpenseTable";
import ExpenseFormModal from "@/components/finance/ExpenseFormModal";
import IncomeTable from "@/components/finance/IncomeTable";
import IncomeFormModal from "@/components/finance/IncomeFormModal";
import BudgetView from "@/components/finance/BudgetView";
import MonthlyReportView from "@/components/finance/MonthlyReportView";
import KasDashboard from "@/components/finance/KasDashboard";
import { useTaggedRecords } from "@/hooks/useAttendanceData";

type MainView = "cashflow" | "siswa";
type CashflowTab = "ringkasan" | "pemasukan" | "pengeluaran" | "budget" | "laporan";

export default function FinancePage() {
  const [mainView, setMainView] = useState<MainView>(() => {
    if (typeof window === "undefined") return "cashflow";
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "siswa" || view === "kas") return "siswa";
    const tabParam = params.get("tab");
    if (tabParam === "kas") return "siswa";
    return "cashflow";
  });

  const [cashflowTab, setCashflowTab] = useState<CashflowTab>(() => {
    if (typeof window === "undefined") return "ringkasan";
    const t = new URLSearchParams(window.location.search).get("tab") as CashflowTab | null;
    if (t && ["ringkasan", "pemasukan", "pengeluaran", "budget", "laporan"].includes(t)) {
      return t;
    }
    return "ringkasan";
  });

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Gen list
  const [gens, setGens] = useState<Gen[]>([]);

  // Finance summary
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    incomeByGen: { gen: string; total: number }[];
    nonKasIncomeByCategory: { category: string; total: number }[];
    totalNonKasIncome: number;
  } | null>(null);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Incomes (pemasukan non-kas)
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Budget
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);

  // Monthly report
  const [reportMonth, setReportMonth] = useState(getBulanTahunFromDate(getTodayFormatted()));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Kas payments
  const [kasPayments, setKasPayments] = useState<KasPayment[]>([]);
  const [kasLoading, setKasLoading] = useState(true);
  const [kasFilterGen, setKasFilterGen] = useState<string>("");
  const [kasFilterBulan, setKasFilterBulan] = useState<string>("");
  const [backfillLoading, setBackfillLoading] = useState(false);

  // Full financial Excel export state
  const [exportingAllExcel, setExportingAllExcel] = useState(false);

  // Tagged records for Kas Dashboard
  const {
    records: taggedRecords,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useTaggedRecords(gens);

  // --- Loaders ---

  const loadGens = useCallback(async () => {
    const res = await getGenList();
    if (res.success && res.data) {
      setGens(res.data.map((g) => g.gen as Gen));
    }
  }, []);

  const loadSummary = useCallback(async (genList: Gen[]) => {
    if (genList.length === 0) return;
    const res = await getFinanceSummary(genList);
    if (res.success && res.data) {
      setSummary({
        totalIncome: res.data.totalIncome,
        totalExpenses: res.data.totalExpenses,
        balance: res.data.balance,
        incomeByGen: res.data.incomeByGen,
        nonKasIncomeByCategory: res.data.nonKasIncomeByCategory,
        totalNonKasIncome: res.data.totalNonKasIncome,
      });
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    setExpenseLoading(true);
    const res = await getExpenses();
    if (res.success && res.data) setExpenses(res.data);
    setExpenseLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await getExpenseCategories();
    if (res.success && res.data) setCategories(res.data);
  }, []);

  const loadIncomes = useCallback(async () => {
    setIncomeLoading(true);
    const res = await getIncomes();
    if (res.success && res.data) setIncomes(res.data);
    setIncomeLoading(false);
  }, []);

  const loadIncomeCategories = useCallback(async () => {
    const res = await getIncomeCategories();
    if (res.success && res.data) setIncomeCategories(res.data);
  }, []);

  const loadBudgets = useCallback(async (bulanTahun: string) => {
    setBudgetLoading(true);
    const res = await getBudgets(bulanTahun);
    if (res.success && res.data) setBudgets(res.data);
    setBudgetLoading(false);
  }, []);

  const loadReport = useCallback(async (bulanTahun: string, genList: Gen[]) => {
    if (genList.length === 0) return;
    setReportLoading(true);
    const res = await getMonthlyReport(bulanTahun, genList);
    if (res.success && res.data) setReport(res.data);
    setReportLoading(false);
  }, []);

  const loadKasPayments = useCallback(async (gen?: string, bulan?: string) => {
    setKasLoading(true);
    const res = await getKasPayments(gen || undefined, bulan || undefined);
    if (res.success && res.data) setKasPayments(res.data);
    setKasLoading(false);
  }, []);

  const handleBackfill = useCallback(async () => {
    setBackfillLoading(true);
    const { backfillKasPaymentsFromRecords } = await import("@/app/actions/finance");
    const res = await backfillKasPaymentsFromRecords();
    if (res.success && res.data) {
      setToast({
        type: "success",
        message: `Berhasil import ${res.data.inserted} data kas (${res.data.skipped} sudah ada)`,
      });
      loadKasPayments(kasFilterGen || undefined, kasFilterBulan || undefined);
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error || "Gagal import data" });
    }
    setBackfillLoading(false);
  }, [gens, kasFilterGen, kasFilterBulan, loadKasPayments, loadSummary]);

  useEffect(() => {
    loadGens(); // eslint-disable-line react-hooks/set-state-in-effect
    loadExpenses();
    loadCategories();
    loadIncomes();
    loadIncomeCategories();
  }, [loadGens, loadExpenses, loadCategories, loadIncomes, loadIncomeCategories]);

  useEffect(() => {
    if (gens.length > 0) loadSummary(gens); // eslint-disable-line react-hooks/set-state-in-effect
  }, [gens, loadSummary]);

  useEffect(() => {
    const bt = getBulanTahunFromDate(getTodayFormatted());
    loadBudgets(bt); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadBudgets]);

  useEffect(() => {
    if (gens.length > 0) loadReport(reportMonth, gens); // eslint-disable-line react-hooks/set-state-in-effect
  }, [reportMonth, gens, loadReport]);

  useEffect(() => {
    loadKasPayments(kasFilterGen || undefined, kasFilterBulan || undefined); // eslint-disable-line react-hooks/set-state-in-effect
  }, [kasFilterGen, kasFilterBulan, loadKasPayments]);

  // --- Expense CRUD ---

  const handleAddExpense = async (data: {
    deskripsi: string;
    nominal: number;
    category_id: string;
    tanggal: string;
    bulan_tahun: string;
  }) => {
    const res = await addExpense(data.deskripsi, data.nominal, data.category_id, data.tanggal, data.bulan_tahun);
    if (res.success) {
      setToast({ type: "success", message: "Pengeluaran ditambahkan." });
      setShowExpenseModal(false);
      loadExpenses();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menambah pengeluaran." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleEditExpense = async (data: {
    deskripsi: string;
    nominal: number;
    category_id: string;
    tanggal: string;
    bulan_tahun: string;
  }) => {
    if (!editingExpense) return;
    const res = await updateExpense(editingExpense.id, {
      deskripsi: data.deskripsi,
      nominal: data.nominal,
      category_id: data.category_id,
      tanggal: data.tanggal,
      bulan_tahun: data.bulan_tahun,
    });
    if (res.success) {
      setToast({ type: "success", message: "Pengeluaran diupdate." });
      setShowExpenseModal(false);
      setEditingExpense(null);
      loadExpenses();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal update." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await deleteExpense(id);
    if (res.success) {
      setToast({ type: "success", message: "Pengeluaran dihapus." });
      loadExpenses();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menghapus." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // --- Income CRUD ---

  const handleAddIncome = async (data: {
    deskripsi: string;
    nominal: number;
    category_id: string;
    tanggal: string;
    bulan_tahun: string;
  }) => {
    const res = await addIncome(data.deskripsi, data.nominal, data.category_id, data.tanggal, data.bulan_tahun);
    if (res.success) {
      setToast({ type: "success", message: "Pemasukan ditambahkan." });
      setShowIncomeModal(false);
      loadIncomes();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menambah pemasukan." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleEditIncome = async (data: {
    deskripsi: string;
    nominal: number;
    category_id: string;
    tanggal: string;
    bulan_tahun: string;
  }) => {
    if (!editingIncome) return;
    const res = await updateIncome(editingIncome.id, {
      deskripsi: data.deskripsi,
      nominal: data.nominal,
      category_id: data.category_id,
      tanggal: data.tanggal,
      bulan_tahun: data.bulan_tahun,
    });
    if (res.success) {
      setToast({ type: "success", message: "Pemasukan diupdate." });
      setShowIncomeModal(false);
      setEditingIncome(null);
      loadIncomes();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal update." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleDeleteIncome = async (id: string) => {
    const res = await deleteIncome(id);
    if (res.success) {
      setToast({ type: "success", message: "Pemasukan dihapus." });
      loadIncomes();
      if (gens.length > 0) loadSummary(gens);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menghapus." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // --- Budget CRUD ---

  const handleAddBudget = async (categoryId: string, target: number) => {
    const bt = getBulanTahunFromDate(getTodayFormatted());
    const res = await upsertBudget(bt, categoryId, target);
    if (res.success) {
      setToast({ type: "success", message: "Budget disimpan." });
      loadBudgets(bt);
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menyimpan budget." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  const handleDeleteBudget = async (id: string) => {
    const res = await deleteBudget(id);
    if (res.success) {
      setToast({ type: "success", message: "Budget dihapus." });
      loadBudgets(getBulanTahunFromDate(getTodayFormatted()));
    } else {
      setToast({ type: "error", message: res.error ?? "Gagal menghapus budget." });
    }
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // --- View Switchers ---
  const handleSwitchView = (v: MainView) => {
    setMainView(v);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (v === "siswa") {
        url.searchParams.set("view", "siswa");
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("view", "cashflow");
        url.searchParams.set("tab", cashflowTab);
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleSwitchTab = (t: CashflowTab) => {
    setCashflowTab(t);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "cashflow");
      url.searchParams.set("tab", t);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const cashflowTabs: { key: CashflowTab; label: string; icon: React.ReactNode }[] = [
    { key: "ringkasan", label: "Ringkasan Arus Kas", icon: <PieChart className="h-3.5 w-3.5" /> },
    { key: "pemasukan", label: "Pemasukan (Non-Kas)", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { key: "pengeluaran", label: "Pengeluaran (Cash Out)", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { key: "budget", label: "Target Anggaran", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "laporan", label: "Laporan Bulanan (LPJ)", icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  const expenseCatTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category_nama || "Lainnya";
    acc[cat] = (acc[cat] || 0) + e.nominal;
    return acc;
  }, {});

  // Export entire organizational financial workbook (.xlsx)
  const handleExportFullFinance = async () => {
    setExportingAllExcel(true);
    try {
      const { students, meetingDates } = calculateAllStudentsKas(taggedRecords);
      await exportFinanceWorkbook({
        summary,
        expenses,
        students,
        meetingDates,
        budgets,
        expenseCatTotals,
        selectedGen: "semua",
      });
      setToast({ type: "success", message: "Buku Keuangan Excel berhasil diunduh!" });
    } catch {
      setToast({ type: "error", message: "Gagal mengunduh file Excel." });
    } finally {
      setExportingAllExcel(false);
      setTimeout(() => setToast(null), TOAST_DURATION);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 animate-page">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn btn-secondary min-h-[44px] min-w-[44px] p-2 rounded-xl"
              aria-label="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  {APP_NAME}
                </span>
                <span className="text-muted">•</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {mainView === "cashflow" ? "Buku Kas & Cashflow" : "Iuran Anggota"}
                </span>
              </div>
              <h1 className="mt-0.5 font-display text-2xl font-extrabold uppercase tracking-tight text-foreground flex items-center gap-2">
                <span>Keuangan &amp;</span>
                <span className="text-accent">{mainView === "cashflow" ? "Arus Kas" : "Kas Siswa"}</span>
              </h1>
              <p className="text-xs text-muted">
                {mainView === "cashflow"
                  ? "Monitoring Cash In (Pemasukan), Cash Out (Pengeluaran), dan Saldo Bersih KTI"
                  : "Rekap iuran kas siswa, saldo lebih (rollover), tunggakan, dan penagihan WhatsApp"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFullFinance}
              disabled={exportingAllExcel}
              className="btn btn-secondary min-h-[44px] px-3.5 text-xs font-bold shadow-2xs flex items-center gap-1.5 border border-border"
              title="Unduh seluruh data keuangan dalam format Excel (.xlsx)"
            >
              {exportingAllExcel ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <Link
              href="/input"
              className="btn btn-primary min-h-[44px] px-3.5 text-xs font-bold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Input Absensi &amp; Kas</span>
            </Link>
          </div>
        </div>

        {/* Top-Level Mode Switcher (Arus Kas vs Iuran Siswa) */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border-2 border-border/80 bg-surface-2 p-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSwitchView("cashflow")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-extrabold transition-all min-h-[46px] ${
              mainView === "cashflow"
                ? "bg-surface text-accent shadow-xs border border-border/80 scale-101"
                : "text-muted hover:text-foreground"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>Arus Kas (Cash In / Out)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchView("siswa")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-extrabold transition-all min-h-[46px] ${
              mainView === "siswa"
                ? "bg-surface text-accent shadow-xs border border-border/80 scale-101"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Iuran Kas Siswa</span>
          </button>
        </div>

        {/* ================= VIEW 1: ARUS KAS ORGANISASI (CASH IN / OUT) ================= */}
        {mainView === "cashflow" && (
          <div className="space-y-6">
            {/* KPI Summary Cards (Cash In, Cash Out, Saldo Bersih) */}
            {summary && (
              <FinanceSummaryCard
                totalIncome={summary.totalIncome}
                totalExpenses={summary.totalExpenses}
                balance={summary.balance}
              />
            )}

            {/* Cashflow Sub-Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b-2 border-border pb-2">
              {cashflowTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleSwitchTab(t.key)}
                  className={`chip min-h-[44px] whitespace-nowrap ${cashflowTab === t.key ? "chip-on" : ""}`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-tab 1: Ringkasan Arus Kas */}
            {cashflowTab === "ringkasan" && (
              <div className="space-y-4">
                {/* Per-gen Cash In */}
                {summary && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xs font-bold uppercase tracking-wide text-foreground">
                          Cash In: Pemasukan per Angkatan (Gen)
                        </h3>
                        <p className="text-[11px] text-muted">
                          Total setoran kas yang berhasil dikumpulkan per angkatan
                        </p>
                      </div>
                      <span className="badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                        Total {formatRupiah(summary.totalIncome)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {gens.map((g) => {
                        const genIncome = summary.incomeByGen?.find((item) => item.gen === g);
                        const total = genIncome?.total ?? 0;
                        const pct = summary.totalIncome > 0 ? (total / summary.totalIncome) * 100 : 0;

                        return (
                          <div key={g} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">GEN {g}</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {total > 0 ? formatRupiah(total) : "Rp 0"}
                                <span className="ml-1.5 text-[10px] text-muted font-normal">
                                  ({pct.toFixed(0)}%)
                                </span>
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cash Out: Expense Breakdown */}
                <div className="card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xs font-bold uppercase tracking-wide text-foreground">
                        Cash Out: Pengeluaran per Kategori
                      </h3>
                      <p className="text-[11px] text-muted">
                        Alokasi dana kas keluar untuk keperluan organisasi
                      </p>
                    </div>
                    {summary && (
                      <span className="badge bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 text-xs font-bold">
                        Total {formatRupiah(summary.totalExpenses)}
                      </span>
                    )}
                  </div>

                  {Object.keys(expenseCatTotals).length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {Object.entries(expenseCatTotals)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, total]) => {
                          const pct =
                            summary && summary.totalExpenses > 0
                              ? (total / summary.totalExpenses) * 100
                              : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">{cat}</span>
                                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                  {formatRupiah(total)}
                                  <span className="ml-1.5 text-[10px] text-muted font-normal">
                                    ({pct.toFixed(0)}%)
                                  </span>
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                                <div
                                  className="h-full rounded-full bg-red-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="mt-4 text-center py-6 text-xs text-muted">
                      Belum ada catatan pengeluaran (Cash Out). Klik tab &ldquo;Pengeluaran&rdquo; untuk mencatat belanja organisasi.
                    </p>
                  )}
                </div>

                {/* Non-Kas Income Breakdown */}
                {summary && summary.nonKasIncomeByCategory && summary.nonKasIncomeByCategory.length > 0 && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xs font-bold uppercase tracking-wide text-foreground">
                          Cash In: Pemasukan Non-Kas
                        </h3>
                        <p className="text-[11px] text-muted">
                          Pendapatan dari penjualan, sponsor, sumbangan, dan sumber lain
                        </p>
                      </div>
                      <span className="badge bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold">
                        Total {formatRupiah(summary.totalNonKasIncome)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {summary.nonKasIncomeByCategory
                        .sort((a, b) => b.total - a.total)
                        .map((item) => {
                          const pct = summary.totalNonKasIncome > 0 ? (item.total / summary.totalNonKasIncome) * 100 : 0;
                          return (
                            <div key={item.category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">{item.category}</span>
                                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                                  {formatRupiah(item.total)}
                                  <span className="ml-1.5 text-[10px] text-muted font-normal">
                                    ({pct.toFixed(0)}%)
                                  </span>
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                                <div
                                  className="h-full rounded-full bg-teal-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Pemasukan (Non-Kas) */}
            {cashflowTab === "pemasukan" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Daftar Pemasukan Non-Kas
                    </p>
                    <p className="text-[11px] text-muted">
                      {incomes.length} transaksi pemasukan tercatat (penjualan, sponsor, sumbangan, dll.)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingIncome(null);
                      setShowIncomeModal(true);
                    }}
                    className="btn btn-primary min-h-[44px] shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Catat Pemasukan</span>
                  </button>
                </div>
                <IncomeTable
                  incomes={incomes}
                  loading={incomeLoading}
                  onEdit={(inc) => {
                    setEditingIncome(inc);
                    setShowIncomeModal(true);
                  }}
                  onDelete={handleDeleteIncome}
                />
              </div>
            )}

            {/* Sub-tab 2: Pengeluaran (Cash Out) */}
            {cashflowTab === "pengeluaran" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Daftar Pengeluaran Organisasi (Cash Out)
                    </p>
                    <p className="text-[11px] text-muted">
                      {expenses.length} transaksi pengeluaran tercatat
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setShowExpenseModal(true);
                    }}
                    className="btn btn-primary min-h-[44px] shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Catat Pengeluaran</span>
                  </button>
                </div>
                <ExpenseTable
                  expenses={expenses}
                  loading={expenseLoading}
                  onEdit={(e) => {
                    setEditingExpense(e);
                    setShowExpenseModal(true);
                  }}
                  onDelete={handleDeleteExpense}
                />
              </div>
            )}

            {/* Sub-tab 3: Target Anggaran (Budget) */}
            {cashflowTab === "budget" && (
              <BudgetView
                budgets={budgets}
                categories={categories}
                bulanTahun={getBulanTahunFromDate(getTodayFormatted())}
                expensesByCategory={Object.entries(expenseCatTotals).map(([category, total]) => ({
                  category,
                  total,
                }))}
                loading={budgetLoading}
                onAdd={handleAddBudget}
                onDelete={handleDeleteBudget}
              />
            )}

            {/* Sub-tab 4: Laporan Bulanan (LPJ) */}
            {cashflowTab === "laporan" && (
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div>
                    <label className="label">Pilih Periode Bulan</label>
                    <input
                      type="month"
                      className="input"
                      value={reportMonth.split("-").reverse().join("-")}
                      onChange={(e) => {
                        const [y, m] = e.target.value.split("-");
                        setReportMonth(`${m}-${y}`);
                      }}
                    />
                  </div>
                </div>
                <MonthlyReportView report={report} loading={reportLoading} />
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: IURAN KAS SISWA ================= */}
        {mainView === "siswa" && (
          <KasDashboard
            gens={gens}
            records={taggedRecords}
            loading={recordsLoading}
            expenses={expenses}
            summary={summary}
            budgets={budgets}
            expenseCatTotals={expenseCatTotals}
            onRefresh={async () => {
              await refreshRecords({ force: true });
              if (gens.length > 0) loadSummary(gens);
            }}
          />
        )}
      </div>

      {/* Expense form modal */}
      <ExpenseFormModal
        open={showExpenseModal}
        expense={editingExpense}
        categories={categories}
        loading={expenseLoading}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
      />

      {/* Income form modal */}
      <IncomeFormModal
        open={showIncomeModal}
        income={editingIncome}
        categories={incomeCategories}
        loading={incomeLoading}
        onSubmit={editingIncome ? handleEditIncome : handleAddIncome}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
      />
    </div>
  );
}
