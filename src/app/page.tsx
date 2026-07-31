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
import { formatRupiah, formatBulanTahun, maskNama } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FilterX,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Download,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Users,
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

  const loadFilterOptions = useCallback(async (angkatan: AngkatanType) => {
    const res = await getFilterOptions(angkatan);
    if (res.success && res.data) {
      setFilterOptions(res.data);
    }
  }, []);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filters.kelas, filters.bulan, filters.status, filters.search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFilterOptions(filters.angkatan);
    setFilters((prev) => ({ ...prev, kelas: "", bulan: "", status: "" }));
  }, [filters.angkatan, loadFilterOptions]);

  useEffect(() => {
    loadRecords(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadRecords]);

  const resetFilters = () => {
    setFilters((prev) => ({ ...prev, kelas: "", bulan: "", status: "", search: "" }));
  };

  const hasActiveFilter = Boolean(filters.kelas || filters.bulan || filters.status || filters.search);

  const confirmDeleteRecord = async () => {
    if (deleteModal.index < 0) return;

    setDeleting(true);
    const res = await deleteAttendanceRecord(filters.angkatan, deleteModal.index);
    setDeleting(false);

    if (res.success) {
      setToast({
        type: "success",
        message: `Catatan absensi berhasil dihapus.`,
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

  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = ["No,Tanggal,Nama,Kelas,Status_Absen,Nominal_Kas,Bulan_Tahun"];
    const rows = records.map(
      (r, i) =>
        `${i + 1},"${r.tanggal}","${maskNama(r.nama)}","${r.kelas}","${r.statusAbsen}",${r.nominalKas},"${r.bulanTahun}"`
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
    <div className="animate-page">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Rekapitulasi Absensi &amp; Kas
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Data Angkatan {filters.angkatan} — KTI SKAGARA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`btn px-3 py-1.5 text-xs ${
                viewMode === "table" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Tabel
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`btn px-3 py-1.5 text-xs ${
                viewMode === "stats" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              Statistik
            </button>
          </div>

          <Link href="/input" className="btn btn-primary py-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Input Data
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Catatan" value={stats.totalRecords.toString()} />
        <StatCard label="Total Kas" value={formatRupiah(stats.totalKas)} />
        <StatCard label="Kehadiran" value={`${stats.attendanceRate}%`} />
        <StatCard label="Hadir" value={stats.hadirCount.toString()} />
        <StatCard label="Sakit / Izin" value={(stats.sakitCount + stats.izinCount).toString()} />
        <StatCard label="Alfa" value={stats.alfaCount.toString()} />
      </div>

      {/* Filters */}
      <div className="card mt-5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-angkatan" className="label">
              Angkatan
            </label>
            <select
              id="filter-angkatan"
              className="select"
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

          <div>
            <label htmlFor="filter-kelas" className="label">
              Kelas
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

          <div>
            <label htmlFor="filter-bulan" className="label">
              Bulan
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

          <div>
            <label htmlFor="filter-search" className="label">
              Cari Nama Siswa
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="filter-search"
                type="text"
                className="input pl-8 uppercase"
                placeholder="Ketik nama..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1">
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
                className={`btn px-2.5 py-1 text-xs ${
                  filters.status === st.id
                    ? "bg-slate-900 text-white"
                    : "btn-ghost text-slate-600"
                }`}
              >
                {st.label}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="btn btn-ghost px-2 py-1 text-xs text-red-600"
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
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: TABLE */}
      {viewMode === "table" && (
        <div className="card mt-5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 className="mr-2.5 h-4 w-4 animate-spin text-navy-600" />
              Memuat data...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                Belum ada catatan data
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Belum ada data absensi/kas untuk Angkatan {filters.angkatan}.
              </p>
              <Link href="/input" className="btn btn-primary mt-4 text-xs">
                <PlusCircle className="h-3.5 w-3.5" />
                Input Data Sekarang
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-10 text-center">#</th>
                      <th>Tanggal</th>
                      <th>Nama Siswa</th>
                      <th>Kelas</th>
                      <th>Status</th>
                      <th>Kas</th>
                      <th>Bulan</th>
                      <th className="w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record, index) => {
                      const displayIndex = (page - 1) * PAGE_SIZE + index;
                      const sheetIndex = allRecords.indexOf(record);
                      return (
                        <tr key={`${record.tanggal}-${record.nama}-${index}`}>
                          <td className="text-center font-mono text-xs text-slate-400 tabular-nums">
                            {displayIndex + 1}
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-600 tabular-nums">
                            {record.tanggal}
                          </td>
                          <td className="font-medium text-slate-900 uppercase">
                            {maskNama(record.nama)}
                          </td>
                          <td className="whitespace-nowrap text-xs font-medium text-slate-600">
                            {record.kelas}
                          </td>
                          <td>
                            <span className={statusBadgeClass(record.statusAbsen)}>
                              {record.statusAbsen}
                            </span>
                          </td>
                          <td className="whitespace-nowrap font-medium text-slate-900 tabular-nums">
                            {formatRupiah(record.nominalKas)}
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-500">
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
                              className="btn btn-ghost p-1.5 text-slate-400 hover:text-red-600"
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

              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
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
                    className="btn btn-ghost p-1.5"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-medium text-slate-600 tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-ghost p-1.5"
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

      {/* VIEW: STATISTIK */}
      {viewMode === "stats" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Distribusi Kehadiran (Angkatan {filters.angkatan})
              </h2>

              {stats.totalRecords === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Belum ada data untuk ditampilkan.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <ProgressBarRow
                    label="Hadir"
                    count={stats.hadirCount}
                    total={stats.totalRecords}
                    fillClass="bg-emerald-500"
                  />
                  <ProgressBarRow
                    label="Sakit"
                    count={stats.sakitCount}
                    total={stats.totalRecords}
                    fillClass="bg-amber-500"
                  />
                  <ProgressBarRow
                    label="Izin"
                    count={stats.izinCount}
                    total={stats.totalRecords}
                    fillClass="bg-orange-500"
                  />
                  <ProgressBarRow
                    label="Alfa"
                    count={stats.alfaCount}
                    total={stats.totalRecords}
                    fillClass="bg-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Ringkasan Keuangan Kas
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Total Kas Terkumpul
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(stats.totalKas)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Rata-rata / Catatan
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(stats.avgKasPerStudent)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-700">
                    Tingkat Kehadiran Organisasi
                  </p>
                  <span className="text-base font-semibold text-slate-900 tabular-nums">
                    {stats.attendanceRate}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-navy-600"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Rekap Kas per Kelas (Angkatan {filters.angkatan})
            </h2>

            {stats.classSummaries.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Belum ada rekap per kelas.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
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
                        <td className="font-medium text-slate-900">{cs.kelas}</td>
                        <td className="text-slate-600 tabular-nums">{cs.totalRecords}</td>
                        <td className="text-slate-600 tabular-nums">{cs.hadirCount}</td>
                        <td className="font-medium text-slate-900 tabular-nums">
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

      {/* Delete confirmation modal */}
      {deleteModal.open && deleteModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Hapus catatan ini?
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-medium uppercase text-slate-900">
                {maskNama(deleteModal.record.nama)}
              </p>
              <p className="mt-1 text-slate-500">
                {deleteModal.record.kelas} • {deleteModal.record.tanggal} •{" "}
                {deleteModal.record.statusAbsen}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModal({ open: false, index: -1, record: null })}
                disabled={deleting}
                className="btn btn-secondary px-3 py-1.5 text-xs"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteRecord}
                disabled={deleting}
                className="btn bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`card flex items-center gap-2.5 px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ProgressBarRow({
  label,
  count,
  total,
  fillClass,
}: {
  label: string;
  count: number;
  total: number;
  fillClass: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
