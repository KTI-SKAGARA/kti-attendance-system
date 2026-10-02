export interface ExpenseCategory {
  id: string;
  nama: string;
  deskripsi: string;
  is_active: boolean;
  created_at: string;
}

export interface IncomeCategory {
  id: string;
  nama: string;
  deskripsi: string;
  is_active: boolean;
  created_at: string;
}

export interface Income {
  id: string;
  tanggal: string;
  bulan_tahun: string;
  category_id: string;
  deskripsi: string;
  nominal: number;
  submitted_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  category_nama?: string;
}

export interface Expense {
  id: string;
  tanggal: string;
  bulan_tahun: string;
  category_id: string;
  deskripsi: string;
  nominal: number;
  status: "draft" | "disetujui" | "ditolak";
  submitted_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  category_nama?: string;
}

export interface Budget {
  id: string;
  bulan_tahun: string;
  category_id: string;
  target_nominal: number;
  catatan: string;
  created_at: string;
  // Joined
  category_nama?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeByGen: { gen: string; total: number }[];
  /** Pemasukan non-kas per kategori (penjualan, sponsor, dll.) */
  nonKasIncomeByCategory: { category: string; total: number }[];
  /** Total pemasukan non-kas */
  totalNonKasIncome: number;
  expensesByCategory: { category: string; total: number }[];
  monthlyTrend: {
    bulan_tahun: string;
    income: number;
    expenses: number;
  }[];
}

export interface MonthlyReport {
  bulan_tahun: string;
  income: number;
  expenses: number;
  balance: number;
  expenseBreakdown: { category: string; nominal: number }[];
  attendanceCount: number;
  expenseItems?: { tanggal: string; deskripsi: string; category: string; nominal: number }[];
  incomeByGen?: { gen: string; total: number }[];
  /** Pemasukan non-kas untuk bulan ini */
  nonKasIncome?: number;
  nonKasIncomeItems?: { tanggal: string; deskripsi: string; category: string; nominal: number }[];
}

export interface KasPayment {
  id: string;
  nama: string;
  gen: string;
  kelas: string;
  bulan_tahun: string;
  tanggal: string;
  nominal: number;
  created_at: string;
}
