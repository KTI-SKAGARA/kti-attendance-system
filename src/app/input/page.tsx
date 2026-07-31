"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type AngkatanType,
  type StatusAbsen,
  type StudentOption,
  ANGKATAN_OPTIONS,
  STATUS_ABSEN_OPTIONS,
  SKAGARA_CLASSES,
} from "@/types/attendance";
import {
  submitAttendanceRecord,
  getExistingStudents,
  getFilterOptions,
} from "@/app/actions/attendance";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function InputPage() {
  const [angkatan, setAngkatan] = useState<AngkatanType>("10");
  const [kelas, setKelas] = useState("");
  const [nama, setNama] = useState("");
  const [statusAbsen, setStatusAbsen] = useState<StatusAbsen>("Hadir");
  const [nominalKas, setNominalKas] = useState("");

  const [existingStudents, setExistingStudents] = useState<StudentOption[]>([]);
  const [existingClasses, setExistingClasses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Combine official SKAGARA classes with any custom classes from database
  const availableClasses = Array.from(
    new Set([...SKAGARA_CLASSES, ...existingClasses])
  ).sort((a, b) => a.localeCompare(b, "id"));

  // Fetch existing students and classes for current Angkatan
  const loadAngkatanData = useCallback(async (selectedAngkatan: AngkatanType) => {
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
  }, []);

  useEffect(() => {
    loadAngkatanData(angkatan);
  }, [angkatan, loadAngkatanData]);

  // Handle student name change & auto-fill class if matched
  const handleNamaChange = (val: string) => {
    const upperVal = val.toUpperCase();
    setNama(upperVal);
    if (errors.nama) setErrors((prev) => ({ ...prev, nama: "" }));

    // Auto-select class in dropdown if matched with existing student
    const matched = existingStudents.find(
      (s) => s.nama.toUpperCase().trim() === upperVal.trim()
    );
    if (matched && matched.kelas) {
      setKelas(matched.kelas);
      if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: "" }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama siswa wajib diisi.";
    if (!kelas.trim()) e.kelas = "Pilih kelas terlebih dahulu.";
    const kas = Number(nominalKas);
    if (nominalKas === "" || isNaN(kas) || kas < 0) {
      e.nominalKas = "Nominal kas harus berupa angka ≥ 0.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setToast(null);

    const savedNama = nama.trim().toUpperCase();

    const res = await submitAttendanceRecord({
      angkatan,
      kelas: kelas.trim(),
      nama: savedNama,
      statusAbsen,
      nominalKas: Number(nominalKas),
    });

    setSubmitting(false);

    if (res.success) {
      setToast({
        type: "success",
        message: `Data ${savedNama} (${kelas}) berhasil disimpan!`,
      });

      // Complete reset to blank for next entry
      setNama("");
      setKelas("");
      setNominalKas("");
      setStatusAbsen("Hadir");
      setErrors({});

      // Reload lists
      loadAngkatanData(angkatan);
    } else {
      setToast({
        type: "error",
        message: res.error ?? "Gagal menyimpan data.",
      });
    }

    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setAngkatan("10");
    setKelas("");
    setNama("");
    setStatusAbsen("Hadir");
    setNominalKas("");
    setErrors({});
    setToast(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-5 animate-entry">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="btn btn-secondary p-2.5 rounded-xl hover:-translate-x-0.5"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-slate-700" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
              Form Input Absensi & Kas
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Organisasi KTI SMK Negeri 3 Jepara (SKAGARA)
            </p>
          </div>
        </div>
        
        <span className="badge badge-hadir text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline-flex">
          LIVE SHEET
        </span>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="card-polished p-6 sm:p-8 space-y-6 animate-entry bg-white"
      >
        {/* Row: Angkatan + Dropdown Nama Kelas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Angkatan Dropdown */}
          <div>
            <label htmlFor="input-angkatan" className="label">
              Angkatan <span className="text-red-500">*</span>
            </label>
            <select
              id="input-angkatan"
              className="select font-semibold text-blue-700"
              value={angkatan}
              onChange={(e) => {
                const newAngkatan = e.target.value as AngkatanType;
                setAngkatan(newAngkatan);
                setKelas("");
                setNama("");
              }}
            >
              {ANGKATAN_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  Angkatan {a}
                </option>
              ))}
            </select>
          </div>

          {/* Nama Kelas Dropdown */}
          <div>
            <label htmlFor="input-kelas" className="label">
              Nama Kelas <span className="text-red-500">*</span>
            </label>
            <select
              id="input-kelas"
              className={`select font-medium ${
                errors.kelas ? "!border-red-500 focus:!ring-red-500/20" : ""
              }`}
              value={kelas}
              onChange={(e) => {
                setKelas(e.target.value);
                if (errors.kelas)
                  setErrors((prev) => ({ ...prev, kelas: "" }));
              }}
            >
              <option value="">-- Pilih Kelas --</option>
              {availableClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            {errors.kelas ? (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.kelas}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Pilih dari daftar kelas resmi SKAGARA
              </p>
            )}
          </div>
        </div>

        {/* Nama Lengkap Siswa with AUTO-UPPERCASE formatting */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="input-nama" className="label !mb-0">
              Nama Lengkap Siswa <span className="text-red-500">*</span>
            </label>
            {existingStudents.length > 0 && (
              <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <User className="h-3 w-3" /> {existingStudents.length} siswa terdaftar di Angkatan {angkatan}
              </span>
            )}
          </div>

          <input
            id="input-nama"
            type="text"
            list="student-suggestions"
            className={`input font-semibold tracking-wide uppercase ${
              errors.nama ? "!border-red-500 focus:!ring-red-500/20" : ""
            }`}
            placeholder="Ketik nama siswa..."
            value={nama}
            onChange={(e) => handleNamaChange(e.target.value)}
          />

          <datalist id="student-suggestions">
            {existingStudents.map((s) => (
              <option key={`${s.nama}-${s.kelas}`} value={s.nama}>
                {s.nama} ({s.kelas})
              </option>
            ))}
          </datalist>

          {errors.nama ? (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.nama}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              Format nama otomatis <strong>KAPITAL FULL</strong>. Memilih siswa yang ada akan otomatis memilih kelasnya.
            </p>
          )}
        </div>

        {/* Row: Status + Nominal Kas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="input-status" className="label">
              Status Kehadiran <span className="text-red-500">*</span>
            </label>
            <select
              id="input-status"
              className="select font-medium"
              value={statusAbsen}
              onChange={(e) =>
                setStatusAbsen(e.target.value as StatusAbsen)
              }
            >
              {STATUS_ABSEN_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="input-kas" className="label">
              Nominal Kas (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-kas"
              type="number"
              min="0"
              step="500"
              className={`input tabular-nums ${
                errors.nominalKas ? "!border-red-500 focus:!ring-red-500/20" : ""
              }`}
              placeholder="5000 (Isi 0 jika tidak bayar)"
              value={nominalKas}
              onChange={(e) => {
                setNominalKas(e.target.value);
                if (errors.nominalKas)
                  setErrors((prev) => ({ ...prev, nominalKas: "" }));
              }}
            />
            {errors.nominalKas && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.nominalKas}
              </p>
            )}
          </div>
        </div>

        {/* System info pill */}
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
          <Calendar className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900 font-semibold">Sistem Otomatis:</strong> Field{" "}
            <code className="text-slate-800 bg-slate-200/60 px-1 py-0.5 rounded">Tanggal</code>{" "}
            dan <code className="text-slate-800 bg-slate-200/60 px-1 py-0.5 rounded">Bulan_Tahun</code>{" "}
            akan terisi secara otomatis berdasarkan tanggal sistem saat form dikirim.
          </p>
        </div>

         {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary flex-1 py-3 text-sm font-bold shadow-lg shadow-blue-500/10"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Menyimpan ke Google Sheets..." : "Simpan Data Absensi"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary py-3 px-5 text-sm font-semibold hover:bg-slate-50 border border-slate-200"
            disabled={submitting}
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Reset
          </button>
        </div>
      </form>

      {/* Toast notification overlay */}
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
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
