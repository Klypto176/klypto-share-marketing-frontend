import { useEffect, useRef } from "react";
import { LineSeries } from "lightweight-charts";

export default function IchimokuCloudPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
  containerRef,
  container,
}) {
  const cloudCanvasRef = useRef(null);
  const cloudCtxRef = useRef(null);

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

    /* ================= DATA ================= */

    const conversionLine = result?.data?.conversionLine || [];
    const baseLine = result?.data?.baseLine || [];
    const spanA = result?.data?.leadLine1 || [];
    const spanB = result?.data?.leadLine2 || [];
    const laggingSpan = result?.data?.laggingSpan || [];

    /* ================= LINES ================= */

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

    /* ================= STORE ================= */

    grouped.conversionLine = conversionSeries;
    grouped.baseLine = baseSeries;
    grouped.leadLine1 = spanASeries;
    grouped.leadLine2 = spanBSeries;
    grouped.laggingSpan = laggingSeries;

    grouped.spanA = spanA;
    grouped.spanB = spanB;

    indicatorSeriesRef.current.ICHIMOKU = grouped;
  }, [result]);

  /* ================= CREATE CANVAS ================= */

  useEffect(() => {
    // Some parent components pass the raw DOM node as `containerRef`, others pass a React ref.
    // We also accept `container` prop which is the ref itself.
    const node = container?.current || containerRef?.current || containerRef;
    if (!node || !chart) return;
    if (cloudCanvasRef.current) return;

    const rect = node.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5";

    node.appendChild(canvas);

    cloudCanvasRef.current = canvas;
    cloudCtxRef.current = canvas.getContext("2d");
    cloudCtxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Size overlay canvas using the actual chart container (node)
        const currentRect = node.getBoundingClientRect();
        const currentDpr = window.devicePixelRatio || 1;
        const newWidth = currentRect.width * currentDpr;
        const newHeight = currentRect.height * currentDpr;

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
          canvas.style.width = currentRect.width + "px";
          canvas.style.height = currentRect.height + "px";

          const ctx = canvas.getContext("2d");
          ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

          console.log({
            chartWidth: currentRect.width,
            chartHeight: currentRect.height,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
          });

          // Trigger a custom event so the drawCloud effect can listen to it
          canvas.dispatchEvent(new Event("canvas-resize"));
        }
      }
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
      if (node?.contains(canvas)) {
        node.removeChild(canvas);
      }
    };
  }, [chart]);

  /* ================= DRAW KUMO CLOUD ================= */

  useEffect(() => {
    const drawCloud = () => {
      const group = indicatorSeriesRef.current?.ICHIMOKU;
      if (!group || !cloudCtxRef.current || !cloudCanvasRef.current) return;

      const { spanA, spanB, leadLine1, leadLine2 } = group;
      if (!spanA?.length || !spanB?.length) return;

      const ctx = cloudCtxRef.current;
      const canvas = cloudCanvasRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isVisible = indicatorStyle?.ICHIMOKU?.cloudFillBullish?.visible ?? true;
      if (!isVisible) return;

      const bullishColor =
        indicatorStyle?.ICHIMOKU?.cloudFillBullish?.palette?.color0 ||
        indicatorStyle?.ICHIMOKU?.cloudFillBullish?.color ||
        "rgba(67, 160, 71, 0.35)";
      
      const bearishColor =
        indicatorStyle?.ICHIMOKU?.cloudFillBullish?.palette?.color1 ||
        indicatorStyle?.ICHIMOKU?.cloudFillBearish?.color ||
        "rgba(244, 67, 54, 0.35)";

      // Clip drawing to visible chart area (avoid drawing over price scale)
      ctx.save();
      try {
        const timeScaleWidth = chart.timeScale().width();
        ctx.beginPath();
        ctx.rect(0, 0, timeScaleWidth, canvas.height);
        ctx.clip();
      } catch (e) {
        // Fallback if width() is not supported in this lightweight-charts version
      }

      // 5. Match points by timestamp, not by array index.
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

      // We assume `times` is mostly ordered, but sorting ensures correctness
      // Lightweight charts times are strictly ordered.
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
          
          // Buffer of 20px off-screen to ensure polygons reach the edge seamlessly
          if (x < -20) {
            prevPt = currentPt;
          } else if (x > canvas.width + 20) {
            visiblePts.push(currentPt);
            break; // Stop parsing since points are sequential
          } else {
            if (prevPt) {
              visiblePts.push(prevPt);
              prevPt = null;
            }
            visiblePts.push(currentPt);
          }
        }
      }

      console.log({
          totalPoints: validPoints.length,
          visiblePoints: visiblePts.length,
          canvasWidth: canvas.width,
          firstVisible: visiblePts[0],
          lastVisible: visiblePts[visiblePts.length - 1],
      });

      const chartPts = visiblePts;

      if (chartPts.length < 2) {
        ctx.restore();
        return;
      }

      // Split into bullish and bearish segments at crossovers
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
          // Detect the exact crossover.
          const dA1 = p1.a - p1.b;
          const dA2 = p2.a - p2.b;
          // Avoid division by zero
          const diff = (dA1 - dA2) === 0 ? 1 : (dA1 - dA2);
          const t = dA1 / diff;
          
          const intersectX = p1.x + (p2.x - p1.x) * t;
          const intersectY = p1.yA + (p2.yA - p1.yA) * t;

          const intersectPt = { x: intersectX, yA: intersectY, yB: intersectY };
          
          // Close the current segment at the intersection
          currentSegment.push(intersectPt);
          segments.push({ isBullish: currentBullish, points: currentSegment });

          // Start a new segment from the intersection
          currentSegment = [intersectPt];
          currentBullish = bullish2;
        }

        currentSegment.push(p2);
      }

      segments.push({ isBullish: currentBullish, points: currentSegment });

      // Draw each segment as a single continuous polygon
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (seg.points.length < 2) continue;

        ctx.beginPath();

        // Traverse Span A from left to right
        ctx.moveTo(seg.points[0].x, seg.points[0].yA);
        for (let i = 1; i < seg.points.length; i++) {
          ctx.lineTo(seg.points[i].x, seg.points[i].yA);
        }

        // Traverse Span B from right to left
        for (let i = seg.points.length - 1; i >= 0; i--) {
          ctx.lineTo(seg.points[i].x, seg.points[i].yB);
        }

        ctx.closePath();
        ctx.fillStyle = seg.isBullish ? bullishColor : bearishColor;
        ctx.fill();
      }

      ctx.restore();
    };

    drawCloud();
    
    // 8. Redraw whenever visible logical range changes, new data arrives
    chart.timeScale().subscribeVisibleLogicalRangeChange(drawCloud);
    // Removed crosshair move redraw per requirements
    
    if (cloudCanvasRef.current) {
      cloudCanvasRef.current.addEventListener("canvas-resize", drawCloud);
    }

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(drawCloud);
      if (cloudCanvasRef.current) {
        cloudCanvasRef.current.removeEventListener("canvas-resize", drawCloud);
      }
    };
  }, [result, indicatorStyle]);

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
  }, [indicatorStyle]);

  return null;
}
