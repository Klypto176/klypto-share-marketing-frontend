import { useEffect, useRef } from "react";
import { LineSeries, BaselineSeries } from "lightweight-charts";

export default function OBVPlot({
  result,
  rows,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
  containerRef,
  indicatorConfigs,
  panesRef,
  id,
}) {
  const canvasRef = useRef(null);

  /* ================= CREATE OBV ================= */
  useEffect(() => {
    if (!result) return;

    // Clear previous series
    if (indicatorSeriesRef.current?.OBV) {
      Object.values(indicatorSeriesRef.current.OBV).forEach((s) => {
        if (s?.setData) {
          try { s.setData([]); } catch {}
        }
      });
      indicatorSeriesRef.current.OBV = null;
    }

    const groupedSeries = {};
    let obvData = [];
    let bbUpperData = [];
    let bbLowerData = [];

    const maType = indicatorConfigs?.[id]?.maType || indicatorConfigs?.OBV?.maType || "none";
    const hasBB = result?.data?.bbUpper && result?.data?.bbLower;

    Object.entries(result?.data || {}).forEach(([lineName, lineData]) => {
      const rowConfig = rows?.find((r) => r.key === lineName);
      const styleConfig = indicatorStyle?.[id]?.[lineName] || indicatorStyle?.OBV?.[lineName];

      // Only add BB lines if MA is SMA and Bollinger Bands exist
      if ((lineName === "bbUpper" || lineName === "bbLower") && !(maType === "SMA + Bollinger Bands" && hasBB)) return;

      const series = addSeries("OBV", LineSeries, {
        color: styleConfig?.color || rowConfig?.color || "#26a69a",
        lineWidth: styleConfig?.width || 2,
        lineStyle: styleConfig?.lineStyle,
        visible: styleConfig?.visible ?? true,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      if (!series) return;

      series.setData(lineData);
      groupedSeries[lineName] = series;

      if (lineName === "obv") obvData = lineData;
      if (lineName === "bbUpper") bbUpperData = lineData;
      if (lineName === "bbLower") bbLowerData = lineData;
    });

    groupedSeries.obvData = obvData;
    groupedSeries.bbUpperData = bbUpperData;
    groupedSeries.bbLowerData = bbLowerData;

    indicatorSeriesRef.current.OBV = groupedSeries;

    drawBBCloud();
  }, [result, indicatorConfigs]);

  /* ================= CANVAS INIT ================= */
  useEffect(() => {
    if (!panesRef?.current || !containerRef) return;

    let retryCount = 0;
    const MAX_RETRIES = 10;

    const initCanvas = () => {
      const pane = panesRef.current[id];
      const paneDiv = pane?.div;

      if (!paneDiv) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(initCanvas, 100);
        }
        return;
      }

      // If canvas already exists and is in the correct div, don't recreate
      if (canvasRef.current && canvasRef.current.parentNode === containerRef) {
        if (canvasRef.current) drawBBCloud();
        return;
      }

      if (canvasRef.current) canvasRef.current.remove();

      const canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "10"; // Higher z-index
      containerRef.appendChild(canvas);

      canvasRef.current = canvas;
      drawBBCloud();
    };

    initCanvas();
  }, [panesRef, id, result, containerRef]);

  /* ================= DRAW BB CLOUD ================= */
  const drawBBCloud = () => {
    const obvGroup = indicatorSeriesRef.current?.OBV;
    const pane = panesRef.current?.[id];
    const paneDiv = pane?.div;
    const paneChart = pane?.chart;

    if (!obvGroup || !canvasRef.current || !paneDiv || !paneChart || !containerRef) return;

    const upperData = obvGroup.bbUpperData || [];
    const lowerData = obvGroup.bbLowerData || [];

    const maType = indicatorConfigs?.[id]?.maType || indicatorConfigs?.OBV?.maType || "none";
    const fill = indicatorStyle?.[id]?.bbFill || indicatorStyle?.OBV?.bbFill;
    const hasBB = upperData.length && lowerData.length;

    if (!hasBB || !fill?.visible || maType !== "SMA + Bollinger Bands") {
      // Clear canvas if BB not applicable
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const paneRect = paneDiv.getBoundingClientRect();
    const chartRect = containerRef.getBoundingClientRect();

    const topOffset = paneRect.top - chartRect.top;
    const leftOffset = paneRect.left - chartRect.left;

    canvas.width = chartRect.width;
    canvas.height = chartRect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(leftOffset, topOffset);

    // Clip to timeScale width (prevent Y-axis bleed) and pane height (prevent bleeding into other panes)
    ctx.rect(0, 0, paneChart.timeScale().width(), paneRect.height);
    ctx.clip();

    ctx.beginPath();

    for (let i = 0; i < upperData.length; i++) {
      const p = upperData[i];
      const x = paneChart.timeScale().timeToCoordinate(p.time);
      const y = obvGroup.bbUpper.priceToCoordinate(p.value);
      if (x === null || y === null) continue;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    for (let i = lowerData.length - 1; i >= 0; i--) {
      const p = lowerData[i];
      const x = paneChart.timeScale().timeToCoordinate(p.time);
      const y = obvGroup.bbLower.priceToCoordinate(p.value);
      if (x === null || y === null) continue;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = fill.color;
    ctx.fill();
    ctx.restore();
  };

  /* ================= VISIBLE RANGE SUBSCRIPTION ================= */
  useEffect(() => {
    if (!chart) return;

    const redraw = () => drawBBCloud();

    if (indicatorSeriesRef.current?.OBV) {
      indicatorSeriesRef.current.OBV._drawCloud = redraw;
    }

    const unsubscribeTime = chart.timeScale().subscribeVisibleLogicalRangeChange
      ? chart.timeScale().subscribeVisibleLogicalRangeChange(redraw)
      : null;

    const unsubscribeCrosshair = chart.subscribeCrosshairMove
      ? chart.subscribeCrosshairMove(redraw)
      : null;

    return () => {
      if (unsubscribeTime) unsubscribeTime();
      if (unsubscribeCrosshair) unsubscribeCrosshair();
    };
  }, [chart, indicatorStyle, indicatorConfigs]);

  /* ================= STYLE UPDATE ================= */
  useEffect(() => {
    const obvGroup = indicatorSeriesRef.current?.OBV;
    if (!obvGroup) return;

    const maType = indicatorConfigs?.[id]?.maType || indicatorConfigs?.OBV?.maType || "none";
    const hasBB = obvGroup.bbUpperData?.length && obvGroup.bbLowerData?.length;

    Object.entries(obvGroup).forEach(([key, series]) => {
      if (!series?.applyOptions) return;
      const style = indicatorStyle?.[id]?.[key] || indicatorStyle?.OBV?.[key];
      if (!style) return;

      if ((key === "bbUpper" || key === "bbLower") && !(maType === "SMA + Bollinger Bands" && hasBB)) return;

      series.applyOptions({
        color: style.color,
        lineWidth: style.width,
        lineStyle: style.lineStyle,
        visible: style.visible,
      });
    });

    drawBBCloud();
  }, [indicatorStyle, result, indicatorConfigs, id]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      if (indicatorSeriesRef.current?.OBV) {
        indicatorSeriesRef.current.OBV = null;
      }
    };
  }, []);

  return null;
}