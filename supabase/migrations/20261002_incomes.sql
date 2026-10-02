-- Pemasukan non-kas (sumber lain: penjualan, sponsor, sumbangan, dll.)

-- Kategori pemasukan
CREATE TABLE IF NOT EXISTS income_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  deskripsi TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pemasukan organisasi
CREATE TABLE IF NOT EXISTS incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal TEXT NOT NULL,
  bulan_tahun TEXT NOT NULL,
  category_id UUID REFERENCES income_categories(id) ON DELETE SET NULL,
  deskripsi TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal > 0),
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "income_categories_read" ON income_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "income_categories_write" ON income_categories FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "incomes_read" ON incomes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "incomes_write" ON incomes FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incomes_bulan_tahun ON incomes(bulan_tahun);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category_id);

-- Seed: default kategori pemasukan
INSERT INTO income_categories (nama, deskripsi) VALUES
  ('Penjualan', 'Penjualan stiker, produk, merchandise, dll.'),
  ('Sponsor', 'Dana sponsor dari pihak luar'),
  ('Sumbangan', 'Donasi atau sumbangan dari alumni, sekolah, dll.'),
  ('Dana Sekolah', 'Alokasi dana dari pihak sekolah'),
  ('Lainnya', 'Pemasukan dari sumber lain')
ON CONFLICT (nama) DO NOTHING;
