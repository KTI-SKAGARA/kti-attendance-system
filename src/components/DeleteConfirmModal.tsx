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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Hapus catatan ini?</h3>
            <p className="mt-0.5 text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <p className="font-medium uppercase text-slate-900">{record.nama}</p>
          <p className="mt-1 text-slate-500">
            Gen {record._gen} • {record.kelas} • {record.tanggal} • {record.statusAbsen}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onCancel} disabled={deleting} className="btn btn-secondary px-3 py-1.5 text-xs">
            Batal
          </button>
          <button onClick={onConfirm} disabled={deleting} className="btn bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700">
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
