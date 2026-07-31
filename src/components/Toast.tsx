"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ToastProps {
  type: "success" | "error";
  message: string;
}

export default function Toast({ type, message }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`card flex items-center gap-2.5 px-4 py-3 text-sm font-medium ${
          type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-red-600" />
        )}
        {message}
      </div>
    </div>
  );
}
