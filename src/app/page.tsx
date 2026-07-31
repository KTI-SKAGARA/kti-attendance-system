"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  type AngkatanType,
  type AttendanceRecord,
  type FilterState,
  type FilterOptions,
  type DashboardStats,
  ANGKATAN_OPTIONS,
  SKAGARA_CLASSES,
} from "@/types/attendance";
import {
  getAttendanceRecords,
  getFilterOptions,
  getDashboardStats,
  deleteAttendanceRecord,
} from "@/app/actions/attendance";
import { formatRupiah, formatBulanTahun } from "@/lib/utils";
import {
  Users,
  Wallet,
  CheckCircle2,
  ThermometerSun,
  ShieldAlert,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Database,
  FilterX,
  Sparkles,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Download,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Building2,
  Percent,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 15;

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"table" | "stats">("table");

  const [filters, setFilters] = useState<FilterState>({
    angkatan: "10",
    kelas: "",
    bulan: "",
    status: "",
    search: "",
  });

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    kelasList: [],
    bulanList: [],
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    totalKas: 0,
    hadirCount: 0,
    sakitCount: 0,
    izinCount: 0,
    alfaCount: 0,
    attendanceRate: 0,
    avgKasPerStudent: 0,
    classSummaries: [],
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    index: number;
    record: AttendanceRecord | null;
  }>({ open: false, index: -1, record: null });
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch filter options when angkatan changes
  const loadFilterOptions = useCallback(async (angkatan: AngkatanType) => {
    const res = await getFilterOptions(angkatan);
    if (res.success && res.data) {
      setFilterOptions(res.data);
    }
  }, []);

  // Fetch all records for the chosen angkatan to compute overall stats
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const res = await getAttendanceRecords(filters.angkatan);
    if (res.success && res.data) {
      setAllRecords(res.data);
      const s = await getDashboardStats(res.data);
      setStats(s);
    } else {
      setAllRecords([]);
      setStats({
        totalRecords: 0,
        totalKas: 0,
        hadirCount: 0,
        sakitCount: 0,
        izinCount: 0,
        alfaCount: 0,
        attendanceRate: 0,
        avgKasPerStudent: 0,
        classSummaries: [],
      });
    }
    setLoading(false);
    setPage(1);
  }, [filters.angkatan]);

  // Filter records locally for the table presentation
  const records = useMemo(() => {
    let result = allRecords;
    if (filters.kelas) {
      result = result.filter((r) => r.kelas === filters.kelas);
    }
    if (filters.bulan) {
      result = result.filter((r) => r.bulanTahun === filters.bulan);
    }
    if (filters.status) {
      result = result.filter((r) => r.statusAbsen === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) => r.nama.toLowerCase().includes(q));
    }
    return result;
  }, [allRecords, filters.kelas, filters.bulan, filters.status, filters.search]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters.kelas, filters.bulan, filters.status, filters.search]);

  useEffect(() => {
    loadFilterOptions(filters.angkatan);
    setFilters((prev) => ({ ...prev, kelas: "", bulan: "", status: "" }));
  }, [filters.angkatan, loadFilterOptions]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Reset filters
  const resetFilters = () => {
    setFilters((prev) => ({ ...prev, kelas: "", bulan: "", status: "", search: "" }));
  };

  const hasActiveFilter = Boolean(filters.kelas || filters.bulan || filters.status || filters.search);

  // Handle Record Deletion
  const confirmDeleteRecord = async () => {
    if (deleteModal.index < 0) return;

    setDeleting(true);
    const res = await deleteAttendanceRecord(filters.angkatan, deleteModal.index);
    setDeleting(false);

    if (res.success) {
      setToast({
        type: "success",
        message: `Catatan absensi ${deleteModal.record?.nama || ""} berhasil dihapus.`,
      });
      setDeleteModal({ open: false, index: -1, record: null });
      loadRecords();
    } else {
      setToast({
        type: "error",
        message: res.error || "Gagal menghapus data.",
      });
    }

    setTimeout(() => setToast(null), 4000);
  };

  // CSV Export feature
  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = ["No,Tanggal,Nama,Kelas,Status_Absen,Nominal_Kas,Bulan_Tahun"];
    const rows = records.map(
      (r, i) =>
        `${i + 1},"${r.tanggal}","${r.nama}","${r.kelas}","${r.statusAbsen}",${r.nominalKas},"${r.bulanTahun}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_KTI_SKAGARA_Angkatan_${filters.angkatan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paginatedRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [records, page]
  );

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "Hadir": return "badge badge-hadir";
      case "Sakit": return "badge badge-sakit";
      case "Izin": return "badge badge-izin";
      case "Alfa": return "badge badge-alfa";
      default: return "badge";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Banner */}
      <div className="card-polished bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 border-none shadow-md overflow-hidden relative animate-entry">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        {/* Glowing aura decoration */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Dashboard KTI SKAGARA
              </h1>
              <span className="bg-white/10 text-blue-200 border border-white/10 backdrop-blur-md px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-300" /> SMK Negeri 3 Jepara
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 font-medium">
              Sistem rekapitulasi kehadiran & kas rutin organisasi
            </p>
          </div>

          {/* View mode toggle & Input shortcut */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg bg-white/5 backdrop-blur-md p-1 border border-white/5">
              <button
                onClick={() => setViewMode("table")}
                className={`btn px-3 py-1.5 text-xs font-bold rounded-md transition-all border-none ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "btn-ghost text-slate-300 hover:text-white"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Tabel Data
              </button>
              <button
                onClick={() => setViewMode("stats")}
                className={`btn px-3 py-1.5 text-xs font-bold rounded-md transition-all border-none ${
                  viewMode === "stats"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "btn-ghost text-slate-300 hover:text-white"
                }`}
              >
                <PieChartIcon className="h-3.5 w-3.5" />
                Statistik
              </button>
            </div>

            <Link 
              href="/input" 
              className="btn bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3.5 font-bold shadow-md shadow-blue-900/20 border border-blue-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              + Input Data
            </Link>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
        <SummaryCard
          icon={<Database className="h-4 w-4" />}
          label="Total Catatan"
          value={stats.totalRecords.toString()}
          color="slate"
          staggerClass="stagger-1"
        />
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Kas"
          value={formatRupiah(stats.totalKas)}
          color="emerald"
          staggerClass="stagger-2"
        />
        <SummaryCard
          icon={<Percent className="h-4 w-4" />}
          label="Kehadiran"
          value={`${stats.attendanceRate}%`}
          color="blue"
          staggerClass="stagger-3"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Hadir"
          value={stats.hadirCount.toString()}
          color="green"
          staggerClass="stagger-4"
        />
        <SummaryCard
          icon={<ThermometerSun className="h-4 w-4" />}
          label="Sakit / Izin"
          value={(stats.sakitCount + stats.izinCount).toString()}
          color="amber"
          staggerClass="stagger-5"
        />
        <SummaryCard
          icon={<XCircle className="h-4 w-4" />}
          label="Alfa"
          value={stats.alfaCount.toString()}
          color="rose"
          staggerClass="stagger-6"
        />
      </div>

      {/* Filter Controls Bar */}
      <div className="card-polished p-4 animate-entry">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Angkatan Filter */}
          <div>
            <label htmlFor="filter-angkatan" className="label">
              Angkatan
            </label>
            <select
              id="filter-angkatan"
              className="select font-semibold text-blue-700 bg-blue-50/40 border-blue-200"
              value={filters.angkatan}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  angkatan: e.target.value as AngkatanType,
                }))
              }
            >
              {ANGKATAN_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  Angkatan {a}
                </option>
              ))}
            </select>
          </div>

          {/* Kelas Filter */}
          <div>
            <label htmlFor="filter-kelas" className="label">
              Filter Kelas
            </label>
            <select
              id="filter-kelas"
              className="select"
              value={filters.kelas}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, kelas: e.target.value }))
              }
            >
              <option value="">Semua Kelas</option>
              {Array.from(new Set([...SKAGARA_CLASSES, ...filterOptions.kelasList]))
                .sort((a, b) => a.localeCompare(b, "id"))
                .map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
            </select>
          </div>

          {/* Bulan Filter */}
          <div>
            <label htmlFor="filter-bulan" className="label">
              Filter Bulan
            </label>
            <select
              id="filter-bulan"
              className="select"
              value={filters.bulan}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, bulan: e.target.value }))
              }
            >
              <option value="">Semua Bulan</option>
              {filterOptions.bulanList.map((b) => (
                <option key={b} value={b}>
                  {formatBulanTahun(b)}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label htmlFor="filter-search" className="label">
              Cari Nama Siswa
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="filter-search"
                type="text"
                className="input pl-8 uppercase font-medium"
                placeholder="Ketik nama..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Status Quick Filter Pills */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            {[
              { id: "", label: "Semua" },
              { id: "Hadir", label: "Hadir" },
              { id: "Sakit", label: "Sakit" },
              { id: "Izin", label: "Izin" },
              { id: "Alfa", label: "Alfa" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilters((prev) => ({ ...prev, status: st.id }))}
                className={`btn text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  filters.status === st.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "btn-ghost text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st.label}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="btn btn-ghost text-xs text-red-600 hover:bg-red-50 py-1 px-2 rounded-full"
              >
                <FilterX className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DATA TABLE */}
      {viewMode === "table" && (
        <div className="card-polished overflow-hidden animate-entry">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="ml-2.5 text-sm font-medium">Memuat data dari Google Sheets...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Belum ada catatan data
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Belum ada data absensi/kas untuk Angkatan {filters.angkatan}. Silakan klik tombol di bawah untuk menambah data baru.
              </p>
              <Link href="/input" className="btn btn-primary text-xs mt-4">
                <PlusCircle className="h-4 w-4" />
                Input Data Sekarang
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">#</th>
                      <th>Tanggal</th>
                      <th>Nama Siswa (FULL KAPITAL)</th>
                      <th>Kelas</th>
                      <th>Status Absen</th>
                      <th>Nominal Kas</th>
                      <th>Bulan</th>
                      <th className="w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record, index) => {
                      const displayIndex = (page - 1) * PAGE_SIZE + index;
                      const sheetIndex = allRecords.indexOf(record);
                      return (
                        <tr
                          key={`${record.tanggal}-${record.nama}-${index}`}
                          className="animate-entry"
                          style={{ animationDelay: `${index * 15}ms` }}
                        >
                          <td className="text-center text-xs font-mono text-slate-400 tabular-nums">
                            {displayIndex + 1}
                          </td>
                          <td className="tabular-nums text-xs font-medium text-slate-600 whitespace-nowrap">
                            {record.tanggal}
                          </td>
                          <td className="font-bold text-slate-900 uppercase tracking-wide">
                            {record.nama}
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-600 font-semibold">
                            {record.kelas}
                          </td>
                          <td>
                            <span className={statusBadgeClass(record.statusAbsen)}>
                              {record.statusAbsen}
                            </span>
                          </td>
                          <td className="tabular-nums font-bold text-slate-900 whitespace-nowrap">
                            {formatRupiah(record.nominalKas)}
                          </td>
                          <td className="text-xs text-slate-500 whitespace-nowrap">
                            {formatBulanTahun(record.bulanTahun)}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  index: sheetIndex,
                                  record,
                                })
                              }
                              className="btn btn-ghost p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus catatan ini"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, records.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {records.length}
                  </span>{" "}
                  data
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-ghost p-1.5 rounded-md"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2.5 text-xs font-medium text-slate-600 tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-ghost p-1.5 rounded-md"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW MODE 2: STATISTIK & ANALISIS */}
      {viewMode === "stats" && (
        <div className="space-y-6 animate-entry">
          {/* Status Breakdown & Progress Bars */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Status Distribution Progress */}
            <div className="card-polished p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Distribusi Kehadiran (Angkatan {filters.angkatan})
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Total: {stats.totalRecords}
                </span>
              </div>

              {stats.totalRecords === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada data untuk ditampilkan dalam grafik.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Hadir */}
                  <ProgressBarRow
                    label="Hadir"
                    count={stats.hadirCount}
                    total={stats.totalRecords}
                    colorClass="bg-emerald-500"
                    badgeClass="badge-hadir"
                  />
                  {/* Sakit */}
                  <ProgressBarRow
                    label="Sakit"
                    count={stats.sakitCount}
                    total={stats.totalRecords}
                    colorClass="bg-amber-500"
                    badgeClass="badge-sakit"
                  />
                  {/* Izin */}
                  <ProgressBarRow
                    label="Izin"
                    count={stats.izinCount}
                    total={stats.totalRecords}
                    colorClass="bg-blue-500"
                    badgeClass="badge-izin"
                  />
                  {/* Alfa */}
                  <ProgressBarRow
                    label="Alfa"
                    count={stats.alfaCount}
                    total={stats.totalRecords}
                    colorClass="bg-rose-500"
                    badgeClass="badge-alfa"
                  />
                </div>
              )}
            </div>

            {/* Financial Overview Card */}
            <div className="card-polished p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Ringkasan Keuangan Kas
              </h2>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3.5">
                  <p className="text-[11px] font-medium text-emerald-700 uppercase">
                    Total Kas Terkumpul
                  </p>
                  <p className="text-xl font-bold text-emerald-900 mt-1 tabular-nums">
                    {formatRupiah(stats.totalKas)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5">
                  <p className="text-[11px] font-medium text-slate-500 uppercase">
                    Rata-rata / Catatan
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                    {formatRupiah(stats.avgKasPerStudent)}
                  </p>
                </div>
              </div>

              {/* Attendance Rate gauge indicator */}
              <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-900">
                    Tingkat Kehadiran Organisasi
                  </p>
                  <span className="text-base font-extrabold text-blue-700 tabular-nums">
                    {stats.attendanceRate}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-blue-200/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-Class Summary Table */}
          <div className="card-polished p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              Rekap Kas per Kelas (Angkatan {filters.angkatan})
            </h2>

            {stats.classSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada rekap per kelas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Kelas</th>
                      <th>Jumlah Catatan</th>
                      <th>Jumlah Hadir</th>
                      <th>Total Kas Terkumpul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.classSummaries.map((cs) => (
                      <tr key={cs.kelas}>
                        <td className="font-bold text-slate-900">{cs.kelas}</td>
                        <td className="tabular-nums text-slate-600">{cs.totalRecords}</td>
                        <td className="tabular-nums text-slate-600">{cs.hadirCount}</td>
                        <td className="font-bold text-emerald-700 tabular-nums">
                          {formatRupiah(cs.totalKas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-entry">
          <div className="card-polished max-w-sm w-full p-6 space-y-4 shadow-2xl bg-white">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 border border-red-100 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Hapus Data
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <p>
                <strong className="text-slate-700">Nama:</strong>{" "}
                <span className="font-bold uppercase text-slate-900">{deleteModal.record.nama}</span>
              </p>
              <p>
                <strong className="text-slate-700">Kelas:</strong> {deleteModal.record.kelas}
              </p>
              <p>
                <strong className="text-slate-700">Tanggal:</strong> {deleteModal.record.tanggal}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, index: -1, record: null })}
                disabled={deleting}
                className="btn btn-secondary text-xs py-2 px-3"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteRecord}
                disabled={deleting}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3.5 font-semibold"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {deleting ? "Menghapus..." : "Ya, Hapus Catatan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-entry">
          <div
            className={`card-polished flex items-center gap-2.5 px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Progress Bar Row
function ProgressBarRow({
  label,
  count,
  total,
  colorClass,
  badgeClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
  badgeClass: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  // Map simple bg class to beautiful gradient class
  const gradientClass = (() => {
    if (colorClass.includes("bg-emerald-500")) return "bg-gradient-to-r from-emerald-400 to-emerald-500";
    if (colorClass.includes("bg-amber-500")) return "bg-gradient-to-r from-amber-400 to-amber-500";
    if (colorClass.includes("bg-blue-500")) return "bg-gradient-to-r from-blue-400 to-blue-500";
    if (colorClass.includes("bg-rose-500")) return "bg-gradient-to-r from-rose-400 to-rose-500";
    return colorClass;
  })();

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className={badgeClass}>{label}</span>
        <span className="font-semibold text-slate-700 tabular-nums">
          {count} <span className="text-slate-400 font-normal">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/30">
        <div
          className={`h-full rounded-full ${gradientClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Sub-component for Summary Card
function SummaryCard({
  icon,
  label,
  value,
  color,
  staggerClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  staggerClass: string;
}) {
  const colorStyles: Record<string, { bg: string; text: string; gradient: string; border: string }> = {
    slate: { 
      bg: "bg-slate-100/90", 
      text: "text-slate-700", 
      gradient: "from-slate-50/50 to-slate-100/30",
      border: "border-slate-200/60"
    },
    emerald: { 
      bg: "bg-emerald-100/90", 
      text: "text-emerald-600", 
      gradient: "from-emerald-50/60 to-emerald-100/20",
      border: "border-emerald-200/50"
    },
    green: { 
      bg: "bg-green-100/90", 
      text: "text-green-600", 
      gradient: "from-green-50/60 to-green-100/20",
      border: "border-green-200/50"
    },
    amber: { 
      bg: "bg-amber-100/90", 
      text: "text-amber-600", 
      gradient: "from-amber-50/60 to-amber-100/20",
      border: "border-amber-200/50"
    },
    blue: { 
      bg: "bg-blue-100/90", 
      text: "text-blue-600", 
      gradient: "from-blue-50/60 to-blue-100/20",
      border: "border-blue-200/50"
    },
    rose: { 
      bg: "bg-rose-100/90", 
      text: "text-rose-600", 
      gradient: "from-rose-50/60 to-rose-100/20",
      border: "border-rose-200/50"
    },
  };

  const style = colorStyles[color] ?? colorStyles.slate;

  return (
    <div 
      className={`card-polished bg-gradient-to-br ${style.gradient} border ${style.border} p-4 animate-entry ${staggerClass} hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-md ${style.bg} ${style.text}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}
