import { useEffect, useRef } from "react";
import { LineSeries } from "lightweight-charts";

export default function IchimokuCloudPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
  containerRef,
}) {
  const canvasRef = useRef(null);

  /* ================= CREATE SERIES ================= */

  useEffect(() => {
    if (!result) return;

    if (indicatorSeriesRef.current?.ICHIMOKU) {
      Object.values(indicatorSeriesRef.current.ICHIMOKU).forEach((s) => {
        if (s?.setData) {
          try {
            s.setData([]);
          } catch {}
        }
      });

      indicatorSeriesRef.current.ICHIMOKU = null;
    }

    const style = indicatorStyle?.ICHIMOKU ?? {};
    const grouped = {};

    const conversionLine = result?.data?.conversionLine || [];
    const baseLine = result?.data?.baseLine || [];
    const spanA = result?.data?.leadLine1 || [];
    const spanB = result?.data?.leadLine2 || [];
    const laggingSpan = result?.data?.laggingSpan || [];

    const conversionSeries = addSeries("main", LineSeries, {
      color: style?.conversionLine?.color,
      lineWidth: style?.conversionLine?.width ?? 2,
      visible: style?.conversionLine?.visible ?? true,
    });

    const baseSeries = addSeries("main", LineSeries, {
      color: style?.baseLine?.color,
      lineWidth: style?.baseLine?.width ?? 2,
      visible: style?.baseLine?.visible ?? true,
    });

    const spanASeries = addSeries("main", LineSeries, {
      color: style?.leadLine1?.color,
      lineWidth: style?.leadLine1?.width ?? 2,
      visible: style?.leadLine1?.visible ?? true,
    });

    const spanBSeries = addSeries("main", LineSeries, {
      color: style?.leadLine2?.color,
      lineWidth: style?.leadLine2?.width ?? 2,
      visible: style?.leadLine2?.visible ?? true,
    });

    const laggingSeries = addSeries("main", LineSeries, {
      color: style?.laggingSpan?.color,
      lineWidth: style?.laggingSpan?.width ?? 2,
      visible: style?.laggingSpan?.visible ?? true,
    });

    conversionSeries.setData(conversionLine);
    baseSeries.setData(baseLine);
    spanASeries.setData(spanA);
    spanBSeries.setData(spanB);
    laggingSeries.setData(laggingSpan);

    grouped.conversionLine = conversionSeries;
    grouped.baseLine = baseSeries;
    grouped.leadLine1 = spanASeries;
    grouped.leadLine2 = spanBSeries;
    grouped.laggingSpan = laggingSeries;

    grouped.spanA = spanA;
    grouped.spanB = spanB;

    indicatorSeriesRef.current.ICHIMOKU = grouped;
  }, [result]);

  /* ================= CANVAS INIT ================= */

  useEffect(() => {
    if (!containerRef || canvasRef.current) return;

    const canvas = document.createElement("canvas");

    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5";

    containerRef.appendChild(canvas);

    canvasRef.current = canvas;
  }, [containerRef]);

  /* ================= DRAW KUMO CLOUD ================= */

  const drawCloud = () => {
    const group = indicatorSeriesRef.current?.ICHIMOKU;
    if (!group || !canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rect = containerRef.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const { spanA, spanB, leadLine1, leadLine2 } = group;
    if (!spanA?.length || !spanB?.length) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isVisible = indicatorStyle?.ICHIMOKU?.cloudFillBullish?.visible ?? true;
    if (!isVisible) return;

    const bullishColor =
      indicatorStyle?.ICHIMOKU?.cloudFillBullish?.palette?.color0 ||
      indicatorStyle?.ICHIMOKU?.cloudFillBullish?.color ||
      "rgba(67, 160, 71, 0.35)";

    const bearishColor =
      indicatorStyle?.ICHIMOKU?.cloudFillBearish?.palette?.color0 ||
      indicatorStyle?.ICHIMOKU?.cloudFillBearish?.color ||
      "rgba(244, 67, 54, 0.35)";

    ctx.save();
    ctx.rect(0, 0, chart.timeScale().width(), canvas.height);
    ctx.clip();

    const dataMap = new Map();
    const times = [];

    for (let i = 0; i < spanA.length; i++) {
      const pt = spanA[i];
      if (!dataMap.has(pt.time)) {
        dataMap.set(pt.time, { time: pt.time });
        times.push(pt.time);
      }
      dataMap.get(pt.time).a = pt.value;
    }

    for (let i = 0; i < spanB.length; i++) {
      const pt = spanB[i];
      if (!dataMap.has(pt.time)) {
        dataMap.set(pt.time, { time: pt.time });
        times.push(pt.time);
      }
      dataMap.get(pt.time).b = pt.value;
    }

    const validPoints = [];
    for (const t of times) {
      const d = dataMap.get(t);
      if (
        d.a !== undefined && d.a !== null && !Number.isNaN(d.a) &&
        d.b !== undefined && d.b !== null && !Number.isNaN(d.b)
      ) {
        validPoints.push(d);
      }
    }

    const visiblePts = [];
    let prevPt = null;

    for (let i = 0; i < validPoints.length; i++) {
      const pt = validPoints[i];
      const x = chart.timeScale().timeToCoordinate(pt.time);

      if (x === null || x === undefined || Number.isNaN(x)) continue;

      const yA = leadLine1.priceToCoordinate(pt.a);
      const yB = leadLine2.priceToCoordinate(pt.b);

      if (
        yA !== null && yA !== undefined && !Number.isNaN(yA) &&
        yB !== null && yB !== undefined && !Number.isNaN(yB)
      ) {
        const currentPt = { x, yA, yB, a: pt.a, b: pt.b };

        if (x < -20) {
          prevPt = currentPt;
        } else if (x > canvas.width + 20) {
          visiblePts.push(currentPt);
          break;
        } else {
          if (prevPt) {
            visiblePts.push(prevPt);
            prevPt = null;
          }
          visiblePts.push(currentPt);
        }
      }
    }

    const chartPts = visiblePts;

    if (chartPts.length < 2) {
      ctx.restore();
      return;
    }

    const segments = [];
    let currentSegment = [];
    let currentBullish = chartPts[0].a >= chartPts[0].b;

    currentSegment.push(chartPts[0]);

    for (let i = 1; i < chartPts.length; i++) {
      const p1 = chartPts[i - 1];
      const p2 = chartPts[i];

      const bullish1 = p1.a >= p1.b;
      const bullish2 = p2.a >= p2.b;

      if (bullish1 !== bullish2) {
        const dA1 = p1.a - p1.b;
        const dA2 = p2.a - p2.b;
        const diff = (dA1 - dA2) === 0 ? 1 : (dA1 - dA2);
        const t = dA1 / diff;

        const intersectX = p1.x + (p2.x - p1.x) * t;
        const intersectY = p1.yA + (p2.yA - p1.yA) * t;

        const intersectPt = { x: intersectX, yA: intersectY, yB: intersectY };

        currentSegment.push(intersectPt);
        segments.push({ isBullish: currentBullish, points: currentSegment });

        currentSegment = [intersectPt];
        currentBullish = bullish2;
      }

      currentSegment.push(p2);
    }

    segments.push({ isBullish: currentBullish, points: currentSegment });

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      if (seg.points.length < 2) continue;

      ctx.beginPath();

      ctx.moveTo(seg.points[0].x, seg.points[0].yA);
      for (let i = 1; i < seg.points.length; i++) {
        ctx.lineTo(seg.points[i].x, seg.points[i].yA);
      }

      for (let i = seg.points.length - 1; i >= 0; i--) {
        ctx.lineTo(seg.points[i].x, seg.points[i].yB);
      }

      ctx.closePath();
      ctx.fillStyle = seg.isBullish ? bullishColor : bearishColor;
      ctx.fill();
    }

    ctx.restore();
  };

  /* ================= REDRAW EVENTS ================= */

  useEffect(() => {
    if (!chart) return;

    const redraw = () => drawCloud();

    chart.timeScale().subscribeVisibleTimeRangeChange(redraw);
    chart.subscribeCrosshairMove(redraw);

    drawCloud();

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(redraw);
      chart.unsubscribeCrosshairMove(redraw);
    };
  }, [chart, indicatorStyle, result]);

  /* ================= STYLE UPDATE ================= */

  useEffect(() => {
    const group = indicatorSeriesRef.current?.ICHIMOKU;
    if (!group) return;

    const style = indicatorStyle?.ICHIMOKU ?? {};

    [
      "conversionLine",
      "baseLine",
      "leadLine1",
      "leadLine2",
      "laggingSpan",
    ].forEach((key) => {
      const s = group[key];
      const st = style?.[key];
      if (!s || !st) return;
      s.applyOptions({
        color: st.color,
        lineWidth: st.width,
        lineStyle: st.lineStyle ?? 0,
        visible: st.visible,
      });
    });

    drawCloud();
  }, [indicatorStyle, result]);

  /* ================= CLEANUP ================= */

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
      }

      canvasRef.current = null;

      if (indicatorSeriesRef.current?.ICHIMOKU) {
        indicatorSeriesRef.current.ICHIMOKU = null;
      }
    };
  }, []);

  return null;
}
