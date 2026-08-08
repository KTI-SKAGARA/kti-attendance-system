"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import type { AttendanceRecord, Gen } from "@/types/attendance";

type TaggedRecord = AttendanceRecord & { _gen: Gen };

interface DeleteConfirmModalProps {
  record: TaggedRecord;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  record,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hapus catatan ini?</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
          <p className="font-medium uppercase text-slate-900 dark:text-slate-100">{record.nama}</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Gen {record._gen} • {record.kelas} • {record.tanggal} • {record.statusAbsen}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onCancel} disabled={deleting} className="btn btn-secondary min-h-[44px] px-4 py-2 text-sm">
            Batal
          </button>
          <button onClick={onConfirm} disabled={deleting} className="btn min-h-[44px] bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
