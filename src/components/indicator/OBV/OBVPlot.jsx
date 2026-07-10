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

    const maType = indicatorConfigs?.OBV?.maType ?? "none";
    const hasBB = result?.data?.bbUpper && result?.data?.bbLower;

    Object.entries(result?.data || {}).forEach(([lineName, lineData]) => {
      const rowConfig = rows?.find((r) => r.key === lineName);
      const styleConfig = indicatorStyle?.OBV?.[lineName];

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
    const obvGroup = indicatorSeriesRef.current?.OBV;
    if (!obvGroup) return;

    const upperData = obvGroup.bbUpperData || [];
    const lowerData = obvGroup.bbLowerData || [];

    const maType = indicatorConfigs?.OBV?.maType ?? "none";
    const fill = indicatorStyle?.OBV?.bbFill;
    const hasBB = upperData.length && lowerData.length;

    if (!hasBB || !fill?.visible || maType !== "SMA + Bollinger Bands") {
      // Clear canvas if BB not applicable
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    if (!canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = containerRef.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();

    // Draw upper
    for (let i = 0; i < upperData.length; i++) {
      const p = upperData[i];
      const x = chart.timeScale().timeToCoordinate(p.time);
      const y = obvGroup.bbUpper.priceToCoordinate(p.value);
      if (x == null || y == null) continue;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Draw lower in reverse
    for (let i = lowerData.length - 1; i >= 0; i--) {
      const p = lowerData[i];
      const x = chart.timeScale().timeToCoordinate(p.time);
      const y = obvGroup.bbLower.priceToCoordinate(p.value);
      if (x == null || y == null) continue;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = fill?.topFillColor1 || "rgba(76,175,80,0.2)";
    ctx.fill();
  };

  /* ================= REDRAW ON CHANGES ================= */
  useEffect(() => {
    if (!chart) return;

    const redraw = () => drawBBCloud();

    if (indicatorSeriesRef.current?.OBV) {
      indicatorSeriesRef.current.OBV.redrawCloud = redraw;
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

    const maType = indicatorConfigs?.OBV?.maType ?? "none";
    const hasBB = obvGroup.bbUpperData?.length && obvGroup.bbLowerData?.length;

    Object.entries(obvGroup).forEach(([key, series]) => {
      if (!series?.applyOptions) return;
      const style = indicatorStyle?.OBV?.[key];
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
  }, [indicatorStyle, result, indicatorConfigs]);

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