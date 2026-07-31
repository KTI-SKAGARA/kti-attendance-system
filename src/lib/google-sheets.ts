import {
  type AngkatanType,
  type AttendanceRecord,
  type StatusAbsen,
  SHEET_TAB_MAP,
} from "@/types/attendance";
import { normalizeName } from "@/lib/utils";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Store for demo/development (used when env vars are not configured)
// Default is empty; records added via form will persist in-memory.
// ---------------------------------------------------------------------------

const MOCK_DATA: AttendanceRecord[] = [];

function getMockDataForAngkatan(angkatan: AngkatanType): AttendanceRecord[] {
  const prefix = `${angkatan} `;
  return MOCK_DATA.filter((r) => r.kelas.startsWith(prefix));
}

// In-memory store so appends persist during the dev session
const mockAppended: Record<string, AttendanceRecord[]> = {
  "10": [],
  "11": [],
  "12": [],
};

// ---------------------------------------------------------------------------
// Google Sheets credentials loader (supports service-account.json & .env.local)
// ---------------------------------------------------------------------------

function getFormattedPrivateKey(): string {
  let key = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!key) return "";
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function getServiceAccountCredentials(): { email: string; key: string } {
  // Option A: Read directly from service-account.json in project root
  const jsonPath = path.join(process.cwd(), "service-account.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const fileContent = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (parsed.client_email && parsed.private_key) {
        return {
          email: parsed.client_email,
          key: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (e) {
      console.warn("Error reading service-account.json:", e);
    }
  }

  // Option B: Fallback to environment variables (.env.local)
  return {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    key: getFormattedPrivateKey(),
  };
}

function isGoogleSheetsConfigured(): boolean {
  const creds = getServiceAccountCredentials();
  return !!(
    creds.email &&
    creds.key &&
    process.env.GOOGLE_SPREADSHEET_ID
  );
}

async function getSheet(tabName: string) {
  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");

  const creds = getServiceAccountCredentials();

  const serviceAccountAuth = new JWT({
    email: creds.email,
    key: creds.key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SPREADSHEET_ID!,
    serviceAccountAuth
  );
  await doc.loadInfo();

  // Try exact tab name first (e.g. "GEN 10"), then alternatives
  let sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    const num = tabName.replace(/\D/g, "");
    const possibleNames = [`GEN ${num}`, `GEN_${num}`, `Kelas_${num}`, `Kelas ${num}`, num];
    for (const name of possibleNames) {
      if (doc.sheetsByTitle[name]) {
        sheet = doc.sheetsByTitle[name];
        break;
      }
    }
  }

  if (!sheet) {
    const idx = tabName.includes("10") ? 0 : tabName.includes("11") ? 1 : 2;
    if (doc.sheetsByIndex[idx]) {
      sheet = doc.sheetsByIndex[idx];
    }
  }

  if (!sheet) {
    throw new Error(`Tab sheet untuk "${tabName}" tidak ditemukan di Google Spreadsheet Anda.`);
  }

  return sheet;
}

// ---------------------------------------------------------------------------
// Automatic Google Sheet Setup & Professional Formatting
// ---------------------------------------------------------------------------

export async function autoSetupGoogleSheet(): Promise<{ success: boolean; message: string }> {
  if (!isGoogleSheetsConfigured()) {
    return {
      success: false,
      message: "GOOGLE_SPREADSHEET_ID atau Kunci Service Account belum diisi.",
    };
  }

  try {
    const { GoogleSpreadsheet } = await import("google-spreadsheet");
    const { JWT } = await import("google-auth-library");

    const creds = getServiceAccountCredentials();

    const serviceAccountAuth = new JWT({
      email: creds.email,
      key: creds.key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SPREADSHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    const requiredTabs = ["GEN 10", "GEN 11", "GEN 12"];
    const headers = ["Tanggal", "Nama", "Kelas", "Status_Absen", "Nominal_Kas", "Bulan_Tahun"];

    for (const tabName of requiredTabs) {
      let sheet = doc.sheetsByTitle[tabName];
      if (!sheet) {
        sheet = await doc.addSheet({ title: tabName, headerValues: headers });
      } else {
        await sheet.setHeaderRow(headers);
      }

      // Format Header Row A1:F1 (Dark Navy #1E293B, Bold White Text)
      try {
        await sheet.loadCells("A1:F1");
        for (let col = 0; col < headers.length; col++) {
          const cell = sheet.getCell(0, col);
          cell.backgroundColor = { red: 0.118, green: 0.161, blue: 0.231, alpha: 1 };
          cell.textFormat = {
            bold: true,
            foregroundColor: { red: 1, green: 1, blue: 1, alpha: 1 },
            fontSize: 10,
          };
        }
        await sheet.saveUpdatedCells();

        // Freeze top header row
        await sheet.updateProperties({
          gridProperties: {
            rowCount: sheet.rowCount || 100,
            columnCount: sheet.columnCount || 20,
            frozenRowCount: 1,
          },
        });
      } catch (formatErr) {
        console.warn("Could not apply cell style:", formatErr);
      }
    }

    return {
      success: true,
      message: "⚡ Google Sheet berhasil di-format profesional! Warna header (Dark Navy), teks putih tebal, & freeze baris 1 telah diterapkan.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal setup Google Sheet.",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API (used by Server Actions)
// ---------------------------------------------------------------------------

export async function fetchRecords(
  angkatan: AngkatanType
): Promise<AttendanceRecord[]> {
  if (!isGoogleSheetsConfigured()) {
    return [
      ...getMockDataForAngkatan(angkatan),
      ...(mockAppended[angkatan] || []),
    ];
  }

  const tabName = SHEET_TAB_MAP[angkatan] || `GEN ${angkatan}`;
  const sheet = await getSheet(tabName);
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    tanggal: row.get("Tanggal") ?? "",
    nama: normalizeName(row.get("Nama") ?? ""),
    kelas: row.get("Kelas") ?? "",
    statusAbsen: (row.get("Status_Absen") ?? "Hadir") as StatusAbsen,
    nominalKas: Number(row.get("Nominal_Kas") ?? 0),
    bulanTahun: row.get("Bulan_Tahun") ?? "",
  }));
}

export async function appendRecord(
  angkatan: AngkatanType,
  record: AttendanceRecord
): Promise<void> {
  const formattedRecord: AttendanceRecord = {
    ...record,
    nama: normalizeName(record.nama),
  };

  if (!isGoogleSheetsConfigured()) {
    if (!mockAppended[angkatan]) mockAppended[angkatan] = [];
    mockAppended[angkatan].push(formattedRecord);
    return;
  }

  const tabName = SHEET_TAB_MAP[angkatan] || `GEN ${angkatan}`;
  const sheet = await getSheet(tabName);

  await sheet.addRow({
    Tanggal: formattedRecord.tanggal,
    Nama: formattedRecord.nama,
    Kelas: formattedRecord.kelas,
    Status_Absen: formattedRecord.statusAbsen,
    Nominal_Kas: formattedRecord.nominalKas,
    Bulan_Tahun: formattedRecord.bulanTahun,
  });
}

export async function appendRecords(
  angkatan: AngkatanType,
  records: AttendanceRecord[]
): Promise<void> {
  const formatted = records.map((r) => ({
    ...r,
    nama: normalizeName(r.nama),
  }));

  if (!isGoogleSheetsConfigured()) {
    if (!mockAppended[angkatan]) mockAppended[angkatan] = [];
    mockAppended[angkatan].push(...formatted);
    return;
  }

  const tabName = SHEET_TAB_MAP[angkatan] || `GEN ${angkatan}`;
  const sheet = await getSheet(tabName);

  const rows = formatted.map((r) => ({
    Tanggal: r.tanggal,
    Nama: r.nama,
    Kelas: r.kelas,
    Status_Absen: r.statusAbsen,
    Nominal_Kas: r.nominalKas,
    Bulan_Tahun: r.bulanTahun,
  }));

  await sheet.addRows(rows);
}

export async function deleteRecord(
  angkatan: AngkatanType,
  recordIndex: number
): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
    const mockList = getMockDataForAngkatan(angkatan);
    const mockLen = mockList.length;
    if (recordIndex < mockLen) return;
    const appendedIdx = recordIndex - mockLen;
    if (mockAppended[angkatan] && appendedIdx >= 0 && appendedIdx < mockAppended[angkatan].length) {
      mockAppended[angkatan].splice(appendedIdx, 1);
    }
    return;
  }

  const tabName = SHEET_TAB_MAP[angkatan] || `GEN ${angkatan}`;
  const sheet = await getSheet(tabName);
  const rows = await sheet.getRows();

  if (recordIndex >= 0 && recordIndex < rows.length) {
    await rows[recordIndex].delete();
  }
}

export { isGoogleSheetsConfigured };
