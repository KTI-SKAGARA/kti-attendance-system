"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ToastProps {
  type: "success" | "error";
  message: string;
}

export default function Toast({ type, message }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-[calc(100vw-3rem)]">
      <div
        className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-[3px_3px_0_0_var(--color-shadow)] ${
          type === "success"
            ? "border-emerald-500/40 bg-surface text-emerald-600 dark:text-emerald-300"
            : "border-danger/40 bg-surface text-danger"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-danger" />
        )}
        <span className="break-words">{message}</span>
      </div>
    </div>
  );
}