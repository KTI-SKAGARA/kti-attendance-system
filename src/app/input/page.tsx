"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type AngkatanType,
  type StatusAbsen,
  type StudentOption,
  ANGKATAN_OPTIONS,
  STATUS_ABSEN_OPTIONS,
  SKAGARA_CLASSES,
  KAS_RUTIN_DEFAULT,
} from "@/types/attendance";
import {
  submitAttendanceRecord,
  submitBulkAttendance,
  getExistingStudents,
  getFilterOptions,
} from "@/app/actions/attendance";
import { getTodayISO, parseISOTanggal, normalizeName, formatRupiah } from "@/lib/utils";
import { APP_NAME, SCHOOL_NAME, TOAST_DURATION } from "@/lib/constants";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  User,
  ListChecks,
  PenLine,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

type InputMode = "normal" | "cepat";

interface QuickStudent {
  nama: string;
  kelas: string;
  checked: boolean;
  nominalKas: number;
}

export default function InputPage() {
  const [mode, setMode] = useState<InputMode>("normal");
  const [angkatan, setAngkatan] = useState<AngkatanType>("10");
  const [kelas, setKelas] = useState("");
  const [tanggal, setTanggal] = useState(getTodayISO());

  // Normal mode state
  const [nama, setNama] = useState("");
  const [statusAbsen, setStatusAbsen] = useState<StatusAbsen>("Hadir");
  const [bayarKas, setBayarKas] = useState(true);
  const [nominalKas, setNominalKas] = useState(`${KAS_RUTIN_DEFAULT}`);

  // Shared state
  const [existingStudents, setExistingStudents] = useState<StudentOption[]>([]);
  const [existingClasses, setExistingClasses] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Quick mode state
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [kasMap, setKasMap] = useState<Record<string, number>>({});

  const availableClasses = Array.from(
    new Set([...SKAGARA_CLASSES, ...existingClasses])
  ).sort((a, b) => a.localeCompare(b, "id"));

  const loadAngkatanData = useCallback(async (selectedAngkatan: AngkatanType) => {
    try {
      const [studentRes, filterRes] = await Promise.all([
        getExistingStudents(selectedAngkatan),
        getFilterOptions(selectedAngkatan),
      ]);

      if (studentRes.success && studentRes.data) {
        setExistingStudents(studentRes.data);
      } else {
        setExistingStudents([]);
      }

      if (filterRes.success && filterRes.data) {
        setExistingClasses(filterRes.data.kelasList);
      } else {
        setExistingClasses([]);
      }
    } catch {
      setExistingStudents([]);
      setExistingClasses([]);
    }
  }, []);

  useEffect(() => {
    loadAngkatanData(angkatan); // eslint-disable-line react-hooks/set-state-in-effect
  }, [angkatan, loadAngkatanData]);

  // When kelas changes in quick mode, populate the checklist
  const studentsForKelas = useMemo(() => {
    if (!kelas) return [];
    return existingStudents
      .filter((s) => s.kelas === kelas)
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [existingStudents, kelas]);

  // When kelas changes in quick mode, derive the checklist
  const quickStudents: QuickStudent[] = useMemo(() => {
    if (mode !== "cepat" || !kelas) return [];
    return studentsForKelas.map((s) => ({
      nama: s.nama,
      kelas: s.kelas,
      checked: checkedMap[s.nama] ?? false,
      nominalKas: kasMap[s.nama] ?? KAS_RUTIN_DEFAULT,
    }));
  }, [mode, kelas, studentsForKelas, checkedMap, kasMap]);

  // Kas rules (normal mode)
  const kasRules = useMemo(() => {
    switch (statusAbsen) {
      case "Hadir":
        return { wajib: true, catatan: "Anggota yang hadir wajib membayar kas." };
      case "Alfa":
        return { wajib: false, catatan: "Tidak membayar kas (status Alfa)." };
      default:
        return { wajib: false, catatan: "Opsional — centang jika tetap membayar kas." };
    }
  }, [statusAbsen]);

  // Quick mode stats
  const quickStats = useMemo(() => {
    const hadir = quickStudents.filter((s) => s.checked);
    const totalKas = hadir.reduce((sum, s) => sum + s.nominalKas, 0);
    return { hadirCount: hadir.length, totalStudents: quickStudents.length, totalKas };
  }, [quickStudents]);

  // ---- Normal mode handlers ----

  const handleStatusChange = (s: StatusAbsen) => {
    setStatusAbsen(s);
    if (s === "Hadir") {
      setBayarKas(true);
    } else {
      setBayarKas(false);
    }
  };

  const handleNamaChange = (val: string) => {
    const upperVal = val.toUpperCase();
    setNama(upperVal);
    setShowSuggestions(true);
    if (errors.nama) setErrors((prev) => ({ ...prev, nama: "" }));

    const matched = existingStudents.find(
      (s) => normalizeName(s.nama) === upperVal.trim()
    );
    if (matched && matched.kelas) {
      setKelas(matched.kelas);
      if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: "" }));
    }
  };

  const suggestions = useMemo(() => {
    if (!nama.trim()) return [];
    const q = nama.toLowerCase();
    return existingStudents
      .filter((s) => s.nama.toLowerCase().includes(q))
      .slice(0, 8);
  }, [existingStudents, nama]);

  const pickSuggestion = (s: StudentOption) => {
    setNama(s.nama);
    setKelas(s.kelas);
    setShowSuggestions(false);
    setErrors((prev) => ({ ...prev, nama: "", kelas: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama siswa wajib diisi.";
    if (!kelas.trim()) e.kelas = "Pilih kelas terlebih dahulu.";
    if (kasRules.wajib && !bayarKas) {
      e.kas = "Anggota yang hadir wajib membayar kas.";
    } else if (bayarKas) {
      const kas = Number(nominalKas);
      if (nominalKas === "" || isNaN(kas) || kas < 0) {
        e.kas = "Nominal kas harus berupa angka ≥ 0.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setToast(null);

    const savedNama = normalizeName(nama);

    const res = await submitAttendanceRecord({
      angkatan,
      kelas: kelas.trim(),
      nama: savedNama,
      tanggal: parseISOTanggal(tanggal),
      statusAbsen,
      nominalKas: bayarKas ? Number(nominalKas) : 0,
    });

    setSubmitting(false);

    if (res.success) {
      setToast({
        type: "success",
        message: `Data ${savedNama} (${kelas}) berhasil disimpan!`,
      });

      setNama("");
      setKelas("");
      setTanggal(getTodayISO());
      setStatusAbsen("Hadir");
      setBayarKas(true);
      setNominalKas(`${KAS_RUTIN_DEFAULT}`);
      setErrors({});

      loadAngkatanData(angkatan);
    } else {
      setToast({
        type: "error",
        message: res.error ?? "Gagal menyimpan data.",
      });
    }

    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // ---- Quick mode handlers ----

  const toggleQuickStudent = (idx: number) => {
    const student = quickStudents[idx];
    if (!student) return;
    setCheckedMap((prev) => ({ ...prev, [student.nama]: !prev[student.nama] }));
    if (errors.quick) setErrors((prev) => ({ ...prev, quick: "" }));
  };

  const updateQuickKas = (idx: number, val: number) => {
    const student = quickStudents[idx];
    if (!student) return;
    setKasMap((prev) => ({ ...prev, [student.nama]: val }));
  };

  const toggleAllQuick = (checked: boolean) => {
    const map: Record<string, boolean> = {};
    for (const s of quickStudents) {
      map[s.nama] = checked;
    }
    setCheckedMap((prev) => {
      const next = { ...prev };
      for (const s of quickStudents) {
        next[s.nama] = checked;
      }
      return next;
    });
    if (errors.quick) setErrors((prev) => ({ ...prev, quick: "" }));
  };

  const handleQuickSubmit = async () => {
    const hadir = quickStudents.filter((s) => s.checked);
    if (hadir.length === 0) {
      setErrors({ quick: "Pilih minimal 1 siswa yang hadir." });
      return;
    }
    if (!kelas.trim()) {
      setErrors({ quick: "Pilih kelas terlebih dahulu." });
      return;
    }

    setSubmitting(true);
    setToast(null);

    const res = await submitBulkAttendance(
      angkatan,
      kelas.trim(),
      parseISOTanggal(tanggal),
      hadir.map((s) => ({
        nama: s.nama,
        statusAbsen: "Hadir" as StatusAbsen,
        nominalKas: s.nominalKas,
      }))
    );

    setSubmitting(false);

    if (res.success) {
      const count = res.data?.saved ?? hadir.length;
      setToast({
        type: "success",
        message: `${count} data absensi berhasil disimpan!`,
      });
      setCheckedMap({});
      setKasMap({});
      loadAngkatanData(angkatan);
    } else {
      setToast({
        type: "error",
        message: res.error ?? "Gagal menyimpan data.",
      });
    }

    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // ---- Shared handlers ----

  const resetForm = () => {
    setAngkatan("10");
    setKelas("");
    setNama("");
    setTanggal(getTodayISO());
    setStatusAbsen("Hadir");
    setBayarKas(true);
    setNominalKas(`${KAS_RUTIN_DEFAULT}`);
    setCheckedMap({});
    setKasMap({});
    setErrors({});
    setToast(null);
  };

  const handleAngkatanChange = (newAngkatan: AngkatanType) => {
    setAngkatan(newAngkatan);
    setKelas("");
    setNama("");
    setCheckedMap({});
    setKasMap({});
  };

  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: "" }));
  };

  return (
    <div className="mx-auto max-w-2xl animate-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="btn btn-secondary p-2"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Input Absensi &amp; Kas
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {APP_NAME} — {SCHOOL_NAME}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mt-5 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
        <button
          onClick={() => setMode("normal")}
          className={`btn flex-1 px-3 py-2 text-xs font-medium ${
            mode === "normal" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          Input Manual
        </button>
        <button
          onClick={() => setMode("cepat")}
          className={`btn flex-1 px-3 py-2 text-xs font-medium ${
            mode === "cepat" ? "bg-slate-900 text-white" : "btn-ghost text-slate-600"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Mode Cepat
        </button>
      </div>

      {/* Shared: Angkatan + Kelas + Tanggal */}
      <div className="card mt-4 p-6 space-y-4 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="input-angkatan" className="label">
              Angkatan <span className="text-red-500">*</span>
            </label>
            <select
              id="input-angkatan"
              className="select"
              value={angkatan}
              onChange={(e) => handleAngkatanChange(e.target.value as AngkatanType)}
            >
              {ANGKATAN_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  Angkatan {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="input-kelas" className="label">
              Nama Kelas <span className="text-red-500">*</span>
            </label>
            <select
              id="input-kelas"
              className={`select ${
                errors.kelas ? "!border-red-500 focus:!ring-red-500/20" : ""
              }`}
              value={kelas}
              onChange={(e) => handleKelasChange(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {availableClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            {errors.kelas && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.kelas}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="input-tanggal" className="label">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              id="input-tanggal"
              type="date"
              className="input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
        </div>

        {/* ---- NORMAL MODE ---- */}
        {mode === "normal" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama siswa dengan saran */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="input-nama" className="label !mb-0">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                {existingStudents.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <User className="h-3 w-3" /> {existingStudents.length} siswa terdaftar
                  </span>
                )}
              </div>

              <div className="relative mt-1.5">
                <input
                  id="input-nama"
                  type="text"
                  className={`input font-medium uppercase ${
                    errors.nama ? "!border-red-500 focus:!ring-red-500/20" : ""
                  }`}
                  placeholder="Ketik nama siswa..."
                  value={nama}
                  onChange={(e) => handleNamaChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-sm">
                    {suggestions.map((s) => (
                      <li key={`${s.nama}-${s.kelas}`}>
                        <button
                          type="button"
                          onClick={() => pickSuggestion(s)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="truncate text-sm font-medium uppercase text-slate-800">
                            {s.nama}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">{s.kelas}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {errors.nama ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nama}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Nama otomatis dikonversi ke huruf kapital. Nama siswa yang sudah pernah
                  tercatat akan muncul sebagai saran.
                </p>
              )}
            </div>

            {/* Status + Kas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="input-status" className="label">
                  Status Kehadiran <span className="text-red-500">*</span>
                </label>
                <select
                  id="input-status"
                  className="select"
                  value={statusAbsen}
                  onChange={(e) => handleStatusChange(e.target.value as StatusAbsen)}
                >
                  {STATUS_ABSEN_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="label">Kas Rutin</span>
                <div
                  className={`rounded-lg border p-3.5 ${
                    errors.kas ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  <label
                    className={`flex items-center gap-3 ${
                      statusAbsen === "Alfa" ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bayarKas}
                      disabled={statusAbsen === "Alfa"}
                      onChange={(e) => {
                        setBayarKas(e.target.checked);
                        if (errors.kas) setErrors((prev) => ({ ...prev, kas: "" }));
                      }}
                      className="h-4 w-4 rounded border-slate-300 accent-navy-600"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      Bayar kas rutin ({formatRupiah(KAS_RUTIN_DEFAULT)})
                    </span>
                  </label>

                  {bayarKas && (
                    <div className="mt-3">
                      <label htmlFor="input-kas" className="label !mb-0 !text-[11px]">
                        Nominal (Rp)
                      </label>
                      <input
                        id="input-kas"
                        type="number"
                        min="0"
                        step="500"
                        className="input mt-1 tabular-nums"
                        value={nominalKas}
                        onChange={(e) => {
                          setNominalKas(e.target.value);
                          if (errors.kas) setErrors((prev) => ({ ...prev, kas: "" }));
                        }}
                      />
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-slate-500">{kasRules.catatan}</p>
                  {errors.kas && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.kas}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1 py-3 text-sm font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Menyimpan..." : "Simpan Data"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary px-4 py-3 text-sm font-medium"
                disabled={submitting}
              >
                <RotateCcw className="h-4 w-4 text-slate-500" />
                Reset
              </button>
            </div>
          </form>
        )}

        {/* ---- QUICK MODE ---- */}
        {mode === "cepat" && (
          <div className="space-y-4">
            {!kelas ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                <ListChecks className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  Pilih kelas untuk menampilkan daftar siswa.
                </p>
              </div>
            ) : quickStudents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                <User className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  Belum ada data siswa di kelas <span className="font-semibold">{kelas}</span>.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Input manual dulu untuk kelas ini di mode &quot;Input Manual&quot;.
                </p>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">
                      <span className="font-semibold text-slate-900">{quickStats.totalStudents}</span> siswa
                    </span>
                    <span className="text-slate-500">
                      Hadir: <span className="font-semibold text-emerald-600">{quickStats.hadirCount}</span>
                    </span>
                    <span className="text-slate-500">
                      Kas: <span className="font-semibold text-slate-900">{formatRupiah(quickStats.totalKas)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAllQuick(true)}
                      className="btn px-2 py-1 text-[11px] text-slate-600"
                    >
                      <Check className="h-3 w-3" /> Semua
                    </button>
                    <button
                      onClick={() => toggleAllQuick(false)}
                      className="btn px-2 py-1 text-[11px] text-slate-600"
                    >
                      <X className="h-3 w-3" /> Batal
                    </button>
                  </div>
                </div>

                {/* Checklist table */}
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-10"></th>
                        <th>Nama</th>
                        <th className="w-28 text-right">Kas (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quickStudents.map((s, idx) => (
                        <tr
                          key={s.nama}
                          className={s.checked ? "bg-emerald-50/50" : ""}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={s.checked}
                              onChange={() => toggleQuickStudent(idx)}
                              className="h-4 w-4 rounded border-slate-300 accent-navy-600"
                            />
                          </td>
                          <td className="font-medium uppercase text-slate-900">
                            {s.nama}
                          </td>
                          <td className="text-right">
                            {s.checked ? (
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={s.nominalKas}
                                onChange={(e) =>
                                  updateQuickKas(idx, Number(e.target.value) || 0)
                                }
                                className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right text-xs tabular-nums focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.quick && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.quick}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleQuickSubmit}
                    disabled={submitting || quickStats.hadirCount === 0}
                    className="btn btn-primary flex-1 py-3 text-sm font-semibold"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting
                      ? "Menyimpan..."
                      : `Simpan ${quickStats.hadirCount} Data Absensi`}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary px-4 py-3 text-sm font-medium"
                    disabled={submitting}
                  >
                    <RotateCcw className="h-4 w-4 text-slate-500" />
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
