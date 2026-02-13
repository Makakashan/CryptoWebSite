import { useEffect, useRef } from "react";
import type { MiniChartProps } from "../store/types/components.types";

const MiniChart = ({ data, color }: MiniChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for better quality
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values for scaling
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    // Calculate padding
    const padding = 4;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    // Create path
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y =
        padding + chartHeight - ((value - minValue) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [data, color]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-hover/30 rounded-lg">
        <div className="w-4 h-4 border-2 border-text-secondary/30 border-t-text-secondary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default MiniChart;
