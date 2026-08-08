"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  type Gen,
  type FilterGen,
  type AttendanceRecord,
  type FilterState,
  type FilterOptions,
  type DashboardStats,
  type GenConfig,
  SKAGARA_CLASSES,
} from "@/types/attendance";
import {
  getAttendanceRecords,
  getFilterOptions,
  getDashboardStats,
  deleteAttendanceRecord,
  getGenList,
} from "@/app/actions/attendance";
import { formatRupiah, formatBulanTahun } from "@/lib/utils";
import { APP_NAME, PAGE_SIZE, TOAST_DURATION } from "@/lib/constants";
import {
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
  Users,
  Archive,
} from "lucide-react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import Toast from "@/components/Toast";
import StatCard from "@/components/StatCard";
import ProgressBarRow from "@/components/ProgressBarRow";

type TaggedRecord = AttendanceRecord & { _gen: Gen };

const EMPTY_STATS: DashboardStats = {
  totalRecords: 0,
  totalKas: 0,
  hadirCount: 0,
  sakitCount: 0,
  izinCount: 0,
  alfaCount: 0,
  attendanceRate: 0,
  avgKasPerStudent: 0,
  classSummaries: [],
};

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"table" | "stats">("table");

  const [genList, setGenList] = useState<GenConfig[]>([]);
  const [showLulus, setShowLulus] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    gen: "semua",
    kelas: "",
    bulan: "",
    status: "",
    search: "",
  });

  const [allRecords, setAllRecords] = useState<TaggedRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    kelasList: [],
    bulanList: [],
  });
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    index: number;
    record: TaggedRecord | null;
  }>({ open: false, index: -1, record: null });
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Gens to iterate based on showLulus toggle
  const iterGens = useMemo(() => {
    if (showLulus) return genList.map((g) => g.gen);
    return genList.filter((g) => g.status === "aktif").map((g) => g.gen);
  }, [genList, showLulus]);

  const activeGens = useMemo(
    () => genList.filter((g) => g.status === "aktif").map((g) => g.gen),
    [genList]
  );

  // Load gen list
  const loadGenList = useCallback(async () => {
    try {
      const res = await getGenList();
      if (res.success && res.data) {
        setGenList(res.data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadGenList(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadGenList]);

  // Load filter options
  const loadFilterOptions = useCallback(async (genFilter: FilterGen) => {
    try {
      if (genFilter === "semua") {
        const results = await Promise.all(
          iterGens.map((g) => getFilterOptions(g))
        );
        const kelasSet = new Set<string>();
        const bulanSet = new Set<string>();
        for (const res of results) {
          if (res.success && res.data) {
            res.data.kelasList.forEach((k) => kelasSet.add(k));
            res.data.bulanList.forEach((b) => bulanSet.add(b));
          }
        }
        setFilterOptions({
          kelasList: Array.from(kelasSet).sort((a, b) => a.localeCompare(b, "id")),
          bulanList: Array.from(bulanSet).sort((a, b) => {
            const [am, ay] = a.split("-").map(Number);
            const [bm, by] = b.split("-").map(Number);
            return ay !== by ? ay - by : am - bm;
          }),
        });
      } else {
        const res = await getFilterOptions(genFilter);
        if (res.success && res.data) setFilterOptions(res.data);
      }
    } catch {
      setFilterOptions({ kelasList: [], bulanList: [] });
    }
  }, [iterGens]);

  // Load records
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const tagged: TaggedRecord[] = [];

      if (filters.gen === "semua") {
        const results = await Promise.all(
          iterGens.map((g) => getAttendanceRecords(g))
        );
        iterGens.forEach((g, i) => {
          if (results[i].success && results[i].data) {
            results[i].data!.forEach((r) => tagged.push({ ...r, _gen: g }));
          }
        });
      } else {
        const res = await getAttendanceRecords(filters.gen);
        if (res.success && res.data) {
          res.data.forEach((r) => tagged.push({ ...r, _gen: filters.gen as Gen }));
        }
      }

      setAllRecords(tagged);
      const s = await getDashboardStats(tagged);
      setStats(s);
      setPage(1);
    } catch {
      setAllRecords([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [filters.gen, iterGens]);

  // Client-side filtering
  const records = useMemo(() => {
    let result = allRecords;
    if (filters.kelas) result = result.filter((r) => r.kelas === filters.kelas);
    if (filters.bulan) result = result.filter((r) => r.bulanTahun === filters.bulan);
    if (filters.status) result = result.filter((r) => r.statusAbsen === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) => r.nama.toLowerCase().includes(q));
    }
    return result;
  }, [allRecords, filters.kelas, filters.bulan, filters.status, filters.search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1); // eslint-disable-line react-hooks/set-state-in-effect
  }, [filters.gen, filters.kelas, filters.bulan, filters.status, filters.search]);

  // Load data on gen change or showLulus toggle
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (iterGens.length > 0) {
      loadFilterOptions(filters.gen);
      loadRecords();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [filters.gen, iterGens, loadFilterOptions, loadRecords, showLulus]);

  // Delete handler
  const confirmDeleteRecord = async () => {
    if (deleteModal.index < 0 || !deleteModal.record) return;
    setDeleting(true);
    try {
      const res = await deleteAttendanceRecord(deleteModal.record._gen, deleteModal.index);
      if (res.success) {
        setToast({ type: "success", message: "Catatan absensi berhasil dihapus." });
        setDeleteModal({ open: false, index: -1, record: null });
        loadRecords();
      } else {
        setToast({ type: "error", message: res.error || "Gagal menghapus data." });
      }
    } catch {
      setToast({ type: "error", message: "Gagal menghapus data." });
    } finally {
      setDeleting(false);
      setTimeout(() => setToast(null), TOAST_DURATION);
    }
  };

  // Export per gen per bulan
  const exportToCSV = () => {
    if (records.length === 0) return;

    if (filters.gen === "semua") {
      // Export 1 file per gen
      for (const g of iterGens) {
        const genRecords = records.filter((r) => r._gen === g);
        if (genRecords.length === 0) continue;

        const headers = ["No,Tanggal,Nama,Kelas,Status_Absen,Nominal_Kas,Bulan_Tahun"];
        const rows = genRecords.map(
          (r, i) =>
            `${i + 1},"${r.tanggal}","${r.nama}","${r.kelas}","${r.statusAbsen}",${r.nominalKas},"${r.bulanTahun}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        const bulanSlug = filters.bulan ? `_${filters.bulan.replace("-", "")}` : "";
        link.setAttribute("download", `Rekap_Gen${g}${bulanSlug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Single gen
      const headers = ["No,Tanggal,Nama,Kelas,Status_Absen,Nominal_Kas,Bulan_Tahun"];
      const rows = records.map(
        (r, i) =>
          `${i + 1},"${r.tanggal}","${r.nama}","${r.kelas}","${r.statusAbsen}",${r.nominalKas},"${r.bulanTahun}"`
      );
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      const bulanSlug = filters.bulan ? `_${filters.bulan.replace("-", "")}` : "";
      link.setAttribute("download", `Rekap_Gen${filters.gen}${bulanSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paginatedRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [records, page]
  );

  // Stats per gen (when "semua")
  const genSummaries = useMemo(() => {
    if (filters.gen !== "semua") return [];
    const map = new Map<Gen, { total: number; hadir: number; kas: number }>();
    for (const r of allRecords) {
      const cur = map.get(r._gen) || { total: 0, hadir: 0, kas: 0 };
      cur.total += 1;
      if (r.statusAbsen === "Hadir") cur.hadir += 1;
      cur.kas += r.nominalKas;
      map.set(r._gen, cur);
    }
    return Array.from(map.entries())
      .map(([g, s]) => ({
        gen: g,
        ...s,
        isLulus: genList.find((gc) => gc.gen === g)?.status === "lulus",
      }))
      .sort((a, b) => Number(a.gen) - Number(b.gen));
  }, [allRecords, filters.gen, genList]);

  const hasActiveFilter =
    filters.kelas || filters.bulan || filters.status || filters.search;

  const genLabel = (g: Gen) => {
    const gc = genList.find((x) => x.gen === g);
    if (!gc) return `Gen ${g}`;
    return `Gen ${g}${gc.status === "lulus" ? " (Lulus)" : ""}`;
  };

  return (
    <div className="mx-auto max-w-5xl animate-page">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Rekapitulasi Absensi &amp; Kas
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {filters.gen === "semua" ? "Semua Gen" : genLabel(filters.gen as Gen)} — {APP_NAME}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`btn px-3 py-1.5 text-xs ${viewMode === "table" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"}`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Tabel
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`btn px-3 py-1.5 text-xs ${viewMode === "stats" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"}`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              Statistik
            </button>
          </div>
          <Link href="/input" className="btn btn-primary px-3 py-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Input Data
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mt-5 p-4 sm:p-5">
        {/* Gen filter */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setFilters((f) => ({ ...f, gen: "semua" }))}
            className={`btn px-2.5 py-1 text-xs ${
              filters.gen === "semua" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
            }`}
          >
            Semua Gen
          </button>
          {activeGens.map((g) => (
            <button
              key={g}
              onClick={() => setFilters((f) => ({ ...f, gen: g }))}
              className={`btn px-2.5 py-1 text-xs ${
                filters.gen === g ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
              }`}
            >
              Gen {g}
            </button>
          ))}
          {/* Archive toggle */}
          <button
            onClick={() => setShowLulus((v) => !v)}
            className={`btn px-2.5 py-1 text-xs ${
              showLulus ? "bg-amber-100 text-amber-800" : "btn-ghost text-slate-400"
            }`}
            title="Tampilkan gen lulus"
          >
            <Archive className="h-3.5 w-3.5" />
            Arsip
          </button>
        </div>

        {/* Secondary filters */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1">
            {([
              { id: "" as const, label: "Semua" },
              { id: "Hadir" as const, label: "Hadir" },
              { id: "Sakit" as const, label: "Sakit" },
              { id: "Izin" as const, label: "Izin" },
              { id: "Alfa" as const, label: "Alfa" },
            ]).map((st) => (
              <button
                key={st.id}
                onClick={() => setFilters((prev) => ({ ...prev, status: st.id }))}
                className={`btn px-2.5 py-1 text-xs ${filters.status === st.id ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"}`}
              >
                {st.label}
              </button>
            ))}

            <select
              className="select ml-1 py-1 text-xs"
              value={filters.kelas}
              onChange={(e) => setFilters((f) => ({ ...f, kelas: e.target.value }))}
            >
              <option value="">Semua Kelas</option>
              {Array.from(new Set([...SKAGARA_CLASSES, ...filterOptions.kelasList]))
                .sort((a, b) => a.localeCompare(b, "id"))
                .map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
            </select>

            <select
              className="select ml-1 py-1 text-xs"
              value={filters.bulan}
              onChange={(e) => setFilters((f) => ({ ...f, bulan: e.target.value }))}
            >
              <option value="">Semua Bulan</option>
              {filterOptions.bulanList.map((b) => (
                <option key={b} value={b}>{formatBulanTahun(b)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama..."
                className="input py-1 pl-8 pr-3 text-xs"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            {hasActiveFilter && (
              <button
                onClick={() =>
                  setFilters({ gen: filters.gen, kelas: "", bulan: "", status: "", search: "" })
                }
                className="btn btn-ghost px-2 py-1 text-xs text-slate-500"
              >
                <FilterX className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                loadRecords();
                loadFilterOptions(filters.gen);
              }}
              className="btn btn-ghost px-2 py-1 text-xs text-slate-500"
              title="Muat ulang data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="btn btn-ghost px-2 py-1 text-xs text-slate-500"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: TABLE */}
      {viewMode === "table" && (
        <div className="card mt-4 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Belum ada data.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-10">No</th>
                      <th>Tanggal</th>
                      <th>Nama</th>
                      <th>Kelas</th>
                      <th>Status</th>
                      <th className="text-right">Kas</th>
                      {filters.gen === "semua" && <th>Gen</th>}
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((r, i) => (
                      <tr key={`${r._gen}-${r.tanggal}-${r.nama}-${i}`}>
                        <td className="text-slate-400 tabular-nums">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="whitespace-nowrap text-slate-600">{r.tanggal}</td>
                        <td className="font-medium uppercase text-slate-900">{r.nama}</td>
                        <td className="text-slate-600">{r.kelas}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.statusAbsen === "Hadir"
                                ? "bg-emerald-50 text-emerald-700"
                                : r.statusAbsen === "Sakit"
                                ? "bg-amber-50 text-amber-700"
                                : r.statusAbsen === "Izin"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {r.statusAbsen}
                          </span>
                        </td>
                        <td className="text-right tabular-nums">
                          {r.nominalKas > 0 ? formatRupiah(r.nominalKas) : "—"}
                        </td>
                        {filters.gen === "semua" && (
                          <td>
                            <span className="badge bg-slate-50 text-slate-600">
                              {r._gen}
                            </span>
                          </td>
                        )}
                        <td className="text-right">
                          <button
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                index: (page - 1) * PAGE_SIZE + i,
                                record: r,
                              })
                            }
                            className="btn btn-ghost p-1 text-slate-400 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <>
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      Menampilkan{" "}
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, records.length)}
                      </span>{" "}
                      dari{" "}
                      <span className="font-semibold text-slate-700 tabular-nums">{records.length}</span>{" "}
                      data
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-ghost p-1.5" aria-label="Halaman sebelumnya">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-medium text-slate-600 tabular-nums">
                        {page} / {totalPages}
                      </span>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn btn-ghost p-1.5" aria-label="Halaman berikutnya">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW: STATS */}
      {viewMode === "stats" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Distribusi Kehadiran
              </h2>
              {stats.totalRecords === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Belum ada data.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  <ProgressBarRow label="Hadir" count={stats.hadirCount} total={stats.totalRecords} fillClass="bg-emerald-500" />
                  <ProgressBarRow label="Sakit" count={stats.sakitCount} total={stats.totalRecords} fillClass="bg-amber-500" />
                  <ProgressBarRow label="Izin" count={stats.izinCount} total={stats.totalRecords} fillClass="bg-orange-500" />
                  <ProgressBarRow label="Alfa" count={stats.alfaCount} total={stats.totalRecords} fillClass="bg-rose-500" />
                </div>
              )}
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">Ringkasan Keuangan Kas</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatCard label="Total Kas Terkumpul" value={formatRupiah(stats.totalKas)} />
                <StatCard label="Rata-rata / Catatan" value={formatRupiah(stats.avgKasPerStudent)} />
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-700">Tingkat Kehadiran</p>
                  <span className="text-base font-semibold text-slate-900 tabular-nums">{stats.attendanceRate}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-navy-600" style={{ width: `${stats.attendanceRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900">Rekap Kas per Kelas</h2>
            {stats.classSummaries.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Belum ada rekap per kelas.</p>
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
                        <td className="font-medium text-slate-900 tabular-nums">{formatRupiah(cs.totalKas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filters.gen === "semua" && genSummaries.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">Rekap per Gen</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Gen</th>
                      <th>Status</th>
                      <th>Total Catatan</th>
                      <th>Jumlah Hadir</th>
                      <th>Total Kas Terkumpul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genSummaries.map((gs) => (
                      <tr key={gs.gen} className={gs.isLulus ? "opacity-60" : ""}>
                        <td className="font-medium text-slate-900">Gen {gs.gen}</td>
                        <td>
                          {gs.isLulus ? (
                            <span className="badge bg-amber-50 text-amber-700">Lulus</span>
                          ) : (
                            <span className="badge bg-emerald-50 text-emerald-700">Aktif</span>
                          )}
                        </td>
                        <td className="text-slate-600 tabular-nums">{gs.total}</td>
                        <td className="text-slate-600 tabular-nums">{gs.hadir}</td>
                        <td className="font-medium text-slate-900 tabular-nums">{formatRupiah(gs.kas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete modal */}
      {deleteModal.open && deleteModal.record && (
        <DeleteConfirmModal
          record={deleteModal.record}
          deleting={deleting}
          onConfirm={confirmDeleteRecord}
          onCancel={() => setDeleteModal({ open: false, index: -1, record: null })}
        />
      )}

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}
