"use server";

import {
  type AngkatanType,
  type AttendanceRecord,
  type StatusAbsen,
  type FilterOptions,
  type DashboardStats,
  type StudentOption,
  type ClassSummary,
  type ApiResponse,
  STATUS_ABSEN_OPTIONS,
} from "@/types/attendance";
import {
  fetchRecords,
  appendRecord,
  deleteRecord,
  isGoogleSheetsConfigured,
} from "@/lib/google-sheets";
import { getTodayFormatted, getCurrentBulanTahun } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Read: get filtered records
// ---------------------------------------------------------------------------

export async function getAttendanceRecords(
  angkatan: AngkatanType,
  kelas?: string,
  bulan?: string,
  status?: string,
  search?: string
): Promise<ApiResponse<AttendanceRecord[]>> {
  try {
    let records = await fetchRecords(angkatan);

    // Apply filters
    if (kelas) {
      records = records.filter((r) => r.kelas === kelas);
    }
    if (bulan) {
      records = records.filter((r) => r.bulanTahun === bulan);
    }
    if (status) {
      records = records.filter((r) => r.statusAbsen === status);
    }
    if (search) {
      const q = search.toLowerCase();
      records = records.filter((r) => r.nama.toLowerCase().includes(q));
    }

    return { success: true, data: records };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data.",
    };
  }
}

// ---------------------------------------------------------------------------
// Read: get unique student list (in UPPERCASE)
// ---------------------------------------------------------------------------

export async function getExistingStudents(
  angkatan: AngkatanType
): Promise<ApiResponse<StudentOption[]>> {
  try {
    const records = await fetchRecords(angkatan);
    const studentMap = new Map<string, string>(); // nama -> kelas

    for (const r of records) {
      const upperName = (r.nama || "").toUpperCase().trim();
      if (upperName && !studentMap.has(upperName)) {
        studentMap.set(upperName, r.kelas);
      }
    }

    const students: StudentOption[] = Array.from(studentMap.entries())
      .map(([nama, kelas]) => ({ nama, kelas }))
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

    return { success: true, data: students };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil daftar siswa.",
    };
  }
}

// ---------------------------------------------------------------------------
// Read: get available filter options (classes & months)
// ---------------------------------------------------------------------------

export async function getFilterOptions(
  angkatan: AngkatanType
): Promise<ApiResponse<FilterOptions>> {
  try {
    const records = await fetchRecords(angkatan);

    const kelasSet = new Set<string>();
    const bulanSet = new Set<string>();

    for (const r of records) {
      if (r.kelas) kelasSet.add(r.kelas);
      if (r.bulanTahun) bulanSet.add(r.bulanTahun);
    }

    // Sort kelas alphabetically using localeCompare
    const kelasList = Array.from(kelasSet).sort((a, b) =>
      a.localeCompare(b, "id")
    );

    // Sort bulan chronologically
    const bulanList = Array.from(bulanSet).sort((a, b) => {
      const [am, ay] = a.split("-").map(Number);
      const [bm, by] = b.split("-").map(Number);
      return ay !== by ? ay - by : am - bm;
    });

    return { success: true, data: { kelasList, bulanList } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil opsi filter.",
    };
  }
}

// ---------------------------------------------------------------------------
// Read: compute rich dashboard statistics & class summaries
// ---------------------------------------------------------------------------

export async function getDashboardStats(
  records: AttendanceRecord[]
): Promise<DashboardStats> {
  const stats: DashboardStats = {
    totalRecords: records.length,
    totalKas: 0,
    hadirCount: 0,
    sakitCount: 0,
    izinCount: 0,
    alfaCount: 0,
    attendanceRate: 0,
    avgKasPerStudent: 0,
    classSummaries: [],
  };

  const classMap = new Map<string, { totalKas: number; totalRecords: number; hadirCount: number }>();

  for (const r of records) {
    stats.totalKas += r.nominalKas;
    switch (r.statusAbsen) {
      case "Hadir":
        stats.hadirCount++;
        break;
      case "Sakit":
        stats.sakitCount++;
        break;
      case "Izin":
        stats.izinCount++;
        break;
      case "Alfa":
        stats.alfaCount++;
        break;
    }

    // Class summary aggregation
    if (r.kelas) {
      const current = classMap.get(r.kelas) || { totalKas: 0, totalRecords: 0, hadirCount: 0 };
      current.totalKas += r.nominalKas;
      current.totalRecords += 1;
      if (r.statusAbsen === "Hadir") current.hadirCount += 1;
      classMap.set(r.kelas, current);
    }
  }

  if (stats.totalRecords > 0) {
    stats.attendanceRate = Math.round((stats.hadirCount / stats.totalRecords) * 1000) / 10;
    stats.avgKasPerStudent = Math.round(stats.totalKas / stats.totalRecords);
  }

  stats.classSummaries = Array.from(classMap.entries())
    .map(([kelas, summary]) => ({
      kelas,
      totalKas: summary.totalKas,
      totalRecords: summary.totalRecords,
      hadirCount: summary.hadirCount,
    }))
    .sort((a, b) => a.kelas.localeCompare(b.kelas, "id"));

  return stats;
}

// ---------------------------------------------------------------------------
// Write: submit a new attendance record (UPPERCASE conversion)
// ---------------------------------------------------------------------------

export async function submitAttendanceRecord(formData: {
  angkatan: AngkatanType;
  kelas: string;
  nama: string;
  statusAbsen: StatusAbsen;
  nominalKas: number;
}): Promise<ApiResponse> {
  try {
    const formattedNama = formData.nama ? formData.nama.trim().toUpperCase() : "";

    // Validation
    if (!formattedNama) {
      return { success: false, error: "Nama siswa wajib diisi." };
    }
    if (!formData.kelas || formData.kelas.trim().length === 0) {
      return { success: false, error: "Kelas wajib diisi." };
    }
    if (!STATUS_ABSEN_OPTIONS.includes(formData.statusAbsen)) {
      return { success: false, error: "Status absen tidak valid." };
    }
    if (
      formData.nominalKas < 0 ||
      isNaN(formData.nominalKas) ||
      !Number.isFinite(formData.nominalKas)
    ) {
      return {
        success: false,
        error: "Nominal kas harus berupa angka positif atau 0.",
      };
    }

    const record: AttendanceRecord = {
      tanggal: getTodayFormatted(),
      nama: formattedNama,
      kelas: formData.kelas.trim(),
      statusAbsen: formData.statusAbsen,
      nominalKas: formData.nominalKas,
      bulanTahun: getCurrentBulanTahun(),
    };

    await appendRecord(formData.angkatan, record);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menyimpan data.",
    };
  }
}

// ---------------------------------------------------------------------------
// Delete: delete an attendance record by index
// ---------------------------------------------------------------------------

export async function deleteAttendanceRecord(
  angkatan: AngkatanType,
  recordIndex: number
): Promise<ApiResponse> {
  try {
    await deleteRecord(angkatan, recordIndex);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus data.",
    };
  }
}

export async function runAutoSetupGoogleSheet(): Promise<ApiResponse<string>> {
  const { autoSetupGoogleSheet } = await import("@/lib/google-sheets");
  const res = await autoSetupGoogleSheet();
  return {
    success: res.success,
    error: res.success ? undefined : res.message,
    data: res.success ? res.message : undefined,
  };
}

export async function checkGoogleSheetsConnection(): Promise<boolean> {
  return isGoogleSheetsConfigured();
}
