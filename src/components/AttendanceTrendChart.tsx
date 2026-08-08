"use client";

import { useMemo } from "react";
import type { AttendanceRecord } from "@/types/attendance";

interface AttendanceTrendChartProps {
  records: AttendanceRecord[];
}

interface MonthData {
  bulan: string;
  total: number;
  hadir: number;
  rate: number;
}

export default function AttendanceTrendChart({
  records,
}: AttendanceTrendChartProps) {
  const monthData = useMemo<MonthData[]>(() => {
    const map = new Map<string, { total: number; hadir: number }>();
    for (const r of records) {
      if (!r.bulanTahun) continue;
      const cur = map.get(r.bulanTahun) || { total: 0, hadir: 0 };
      cur.total += 1;
      if (r.statusAbsen === "Hadir") cur.hadir += 1;
      map.set(r.bulanTahun, cur);
    }

    return Array.from(map.entries())
      .map(([bulan, { total, hadir }]) => ({
        bulan,
        total,
        hadir,
        rate: total > 0 ? Math.round((hadir / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => {
        const [am, ay] = a.bulan.split("-").map(Number);
        const [bm, by] = b.bulan.split("-").map(Number);
        return ay !== by ? ay - by : am - bm;
      });
  }, [records]);

  if (monthData.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted">Belum ada data trend.</p>
    );
  }

  const maxTotal = Math.max(...monthData.map((d) => d.total), 1);
  const chartW = 480;
  const chartH = 200;
  const padL = 36;
  const padR = 12;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barW = Math.min(36, (innerW / monthData.length) * 0.55);
  const gap = innerW / monthData.length;

  const barH = (val: number) => (val / maxTotal) * innerH;

  const linePoints = monthData
    .map((d, i) => {
      const x = padL + gap * i + gap / 2;
      const y = padT + innerH - (d.rate / 100) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        style={{ minWidth: monthData.length > 6 ? 320 : 200 }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padT + innerH - (pct / 100) * innerH;
          return (
            <line
              key={pct}
              x1={padL}
              y1={y}
              x2={chartW - padR}
              y2={y}
              className="stroke-border"
              strokeWidth={0.8}
              strokeDasharray={pct === 0 ? undefined : "3,3"}
            />
          );
        })}

        {/* Bars */}
        {monthData.map((d, i) => {
          const x = padL + gap * i + gap / 2 - barW / 2;
          const h = barH(d.total);
          return (
            <rect
              key={d.bulan}
              x={x}
              y={padT + innerH - h}
              width={barW}
              height={h}
              rx={3}
              className="fill-accent opacity-20"
            />
          );
        })}

        {/* Line: % kehadiran */}
        <polyline
          points={linePoints}
          fill="none"
          className="stroke-accent"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots on line */}
        {monthData.map((d, i) => {
          const x = padL + gap * i + gap / 2;
          const y = padT + innerH - (d.rate / 100) * innerH;
          return (
            <circle
              key={d.bulan}
              cx={x}
              cy={y}
              r={4}
              className="fill-accent stroke-surface"
              strokeWidth={2}
            />
          );
        })}

        {/* Y-axis labels (right side: % kehadiran) */}
        {[0, 50, 100].map((pct) => {
          const y = padT + innerH - (pct / 100) * innerH;
          return (
            <text
              key={pct}
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-muted"
              fontSize={9}
              fontWeight={600}
            >
              {pct}%
            </text>
          );
        })}

        {/* X-axis labels */}
        {monthData.map((d, i) => {
          const x = padL + gap * i + gap / 2;
          const y = padT + innerH + 14;
          const parts = d.bulan.split("-");
          const shortMonth = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
          const label = shortMonth[Number(parts[0])] || parts[0];
          return (
            <text
              key={d.bulan}
              x={x}
              y={y}
              textAnchor="middle"
              className="fill-muted"
              fontSize={9}
              fontWeight={600}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
