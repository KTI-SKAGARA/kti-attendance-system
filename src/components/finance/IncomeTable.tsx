"use client";

import { useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import type { Income } from "@/types/finance";
import { formatRupiah } from "@/lib/utils";

interface Props {
  incomes: Income[];
  loading: boolean;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export default function IncomeTable({ incomes, loading, onEdit, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pemasukan ini?")) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (incomes.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted">
        Belum ada pemasukan non-kas tercatat. Klik &ldquo;Catat Pemasukan&rdquo; untuk menambah.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Deskripsi</th>
            <th className="text-right">Nominal</th>
            <th className="w-20">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((inc) => (
            <tr key={inc.id}>
              <td className="text-xs">{inc.tanggal}</td>
              <td>
                <span className="badge bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px]">
                  {inc.category_nama || "-"}
                </span>
              </td>
              <td className="max-w-[200px] truncate text-xs">{inc.deskripsi}</td>
              <td className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatRupiah(inc.nominal)}
              </td>
              <td>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(inc)}
                    className="rounded p-1 hover:bg-surface-2"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    disabled={deletingId === inc.id}
                    className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-500/10"
                    title="Hapus"
                  >
                    {deletingId === inc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
