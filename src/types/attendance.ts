// TypeScript types for KTI SKAGARA Attendance & Cash Management

export type AngkatanType = "10" | "11" | "12";

export type FilterAngkatan = AngkatanType | "semua";

export type StatusAbsen = "Hadir" | "Sakit" | "Izin" | "Alfa";

export const ANGKATAN_OPTIONS: AngkatanType[] = ["10", "11", "12"];

export const FILTER_ANGKATAN_OPTIONS: FilterAngkatan[] = ["semua", "10", "11", "12"];

export const STATUS_ABSEN_OPTIONS: StatusAbsen[] = [
  "Hadir",
  "Sakit",
  "Izin",
  "Alfa",
];

// Official Classes at SMK Negeri 3 Jepara (SKAGARA)
export const SKAGARA_CLASSES = [
  "AKL 1",
  "AKL 2",
  "AKL 3",
  "AKL 4",
  "MP 1",
  "MP 2",
  "DKV 1",
  "DKV 2",
  "TKJ 1",
  "TKJ 2",
  "PSPT",
  "PM 1",
  "PM 2",
] as const;

// Nominal kas rutin default per pertemuan (Rp)
export const KAS_RUTIN_DEFAULT = 2000;

export const SHEET_TAB_MAP: Record<AngkatanType, string> = {
  "10": "GEN 10",
  "11": "GEN 11",
  "12": "GEN 12",
};

export interface AttendanceRecord {
  tanggal: string; // DD/MM/YYYY
  nama: string;
  kelas: string; // e.g. "TKJ 1"
  statusAbsen: StatusAbsen;
  nominalKas: number;
  bulanTahun: string; // MM-YYYY
}

export interface StudentOption {
  nama: string;
  kelas: string;
}

export interface FilterState {
  angkatan: FilterAngkatan;
  kelas: string; // "" means all
  bulan: string; // "" means all (format: MM-YYYY)
  status: string; // "" means all ("Hadir" | "Sakit" | "Izin" | "Alfa")
  search: string;
}

export interface FilterOptions {
  kelasList: string[];
  bulanList: string[];
}

export interface ClassSummary {
  kelas: string;
  totalKas: number;
  totalRecords: number;
  hadirCount: number;
}

export interface DashboardStats {
  totalRecords: number;
  totalKas: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alfaCount: number;
  attendanceRate: number; // 0 - 100%
  avgKasPerStudent: number;
  classSummaries: ClassSummary[];
}

export interface FormInput {
  angkatan: AngkatanType;
  kelas: string;
  nama: string;
  statusAbsen: StatusAbsen;
  nominalKas: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
