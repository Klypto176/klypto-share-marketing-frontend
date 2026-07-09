import { useEffect, useRef } from "react";
import { LineSeries } from "lightweight-charts";

export default function SMAPlot({
  result,
  rows,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  removeSeries,
  chart,
  containerRef,
  indicatorConfigs,
}) {
  const canvasRef = useRef(null);

  /* ================= CREATE SMA ================= */

  useEffect(() => {
    if (!result) return;

    if (indicatorSeriesRef.current?.SMA) {
      Object.values(indicatorSeriesRef.current.SMA).forEach((s) => {
        if (s?.setData) {
          try {
            s.setData([]);
            chart?.removeSeries(s);
          } catch (e) {
            console.warn("SMAPlot removeSeries failed:", e);
          }
        }
      });

      indicatorSeriesRef.current.SMA = null;
    }

    const groupedSeries = {};

    let upperData = [];
    let lowerData = [];

    /* ================= MAIN LINES ================= */

    Object.entries(result?.data || {}).forEach(([lineName, lineData]) => {
      const rowConfig = rows?.find((r) => r.key === lineName);
      const styleConfig = indicatorStyle?.SMA?.[lineName];

      const series = addSeries("SMA", LineSeries, {
        color: styleConfig?.color || rowConfig?.color || "#26a69a",
        lineWidth: styleConfig?.width || 2,
        lineStyle: styleConfig?.lineStyle,
        visible: styleConfig?.visible ?? true,
        priceLineVisible: false,
        lastValueVisible: lineName === "sma" || lineName === "smoothingMA",
      });

      if (!series) return;

      series.setData(lineData);

      groupedSeries[lineName] = series;

      if (lineName === "bbUpper") upperData = lineData;
      if (lineName === "bbLower") lowerData = lineData;
    });

    groupedSeries.bbUpperData = upperData;
    groupedSeries.bbLowerData = lowerData;

    indicatorSeriesRef.current.SMA = groupedSeries;
  }, [result]);

  /* ================= CANVAS INIT ================= */

  useEffect(() => {
    if (!containerRef || canvasRef.current) return;

    const canvas = document.createElement("canvas");

    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 1;

    containerRef.appendChild(canvas);

    canvasRef.current = canvas;
  }, [containerRef]);

  /* ================= DRAW BB CLOUD ================= */

  const drawBBCloud = () => {
    const smaGroup = indicatorSeriesRef.current?.SMA;
    if (!smaGroup || !canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rect = containerRef.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const upper = smaGroup.bbUpperData || [];
    const lower = smaGroup.bbLowerData || [];

    // console.log("SMAPlot drawBBCloud data lengths:", upper.length, lower.length);

    if (!upper.length || !lower.length) return;

    const fill = indicatorStyle?.SMA?.bbFill;
    // console.log("SMAPlot drawBBCloud fill style:", fill);

    if (!(fill?.visible ?? true)) return;

    ctx.save();
    // Clip to timeScale width (prevent bleeding into y-axis) and canvas height (prevent bleeding into oscillators)
    ctx.rect(0, 0, chart.timeScale().width(), canvas.height);
    ctx.clip();

    ctx.beginPath();
    let drawnPoints = 0;

    for (let i = 0; i < upper.length; i++) {
      const p = upper[i];

      const x = chart.timeScale().timeToCoordinate(p.time);
      const y = smaGroup.bbUpper.priceToCoordinate(p.value);

      if (x == null || y == null) continue;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      drawnPoints++;
    }

    for (let i = lower.length - 1; i >= 0; i--) {
      const p = lower[i];

      const x = chart.timeScale().timeToCoordinate(p.time);
      const y = smaGroup.bbLower.priceToCoordinate(p.value);

      if (x == null || y == null) continue;

      ctx.lineTo(x, y);
      drawnPoints++;
    }

    ctx.closePath();
    // console.log("SMAPlot drawBBCloud drawn points:", drawnPoints);

    ctx.fillStyle = fill?.topFillColor1 || "rgba(76,175,80,0.2)";
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    if (!chart) return;

    const redraw = () => drawBBCloud();

    chart.timeScale().subscribeVisibleTimeRangeChange(redraw);
    chart.subscribeCrosshairMove(redraw);

    drawBBCloud();

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(redraw);
      chart.unsubscribeCrosshairMove(redraw);
    };
  }, [chart, indicatorStyle, result]);

  /* ================= STYLE UPDATE ================= */

  useEffect(() => {
    const smaGroup = indicatorSeriesRef.current?.SMA;
    if (!smaGroup) return;

    Object.entries(smaGroup).forEach(([key, series]) => {
      if (!series?.applyOptions) return;

      const style = indicatorStyle?.SMA?.[key];
      if (!style) return;

      series.applyOptions({
        color: style.color,
        lineWidth: style.width,
        lineStyle: style.lineStyle,
        visible: style.visible,
      });
    });

    drawBBCloud();
  }, [indicatorStyle, result]);
  
  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
      }

      canvasRef.current = null;

      if (indicatorSeriesRef.current?.SMA) {
        indicatorSeriesRef.current.SMA = null;
      }
    };
  }, []);

  return null;
}
