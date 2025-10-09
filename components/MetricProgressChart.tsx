"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { LargeNumberLike } from "crypto";

interface Props {
    total: number;
    target: number;
}

export default function MetricProgressChart({ total, target }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const percentage = target > 0 ? Math.min((total / target) * 100, 999) : 0;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [percentage, 100 - percentage],
            backgroundColor: ["#fbbf24", "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "70%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });

    return () => chart.destroy();
  }, [percentage]);

  return (
    <div className="relative w-16 h-16 mx-auto">
      <canvas ref={canvasRef}></canvas>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
        {Math.round(percentage)}%
      </div>
    </div>
  );
}
