import { useEffect, useRef } from "react";
import { LineSeries } from "lightweight-charts";

export default function VWAPPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  removeSeries,
  chart,
  containerRef,
  indicatorConfigs,
  id,
}) {
  const canvasRef = useRef(null);

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

  /* ================= DRAW FILL ================= */

  const drawBands = () => {
    const group = indicatorSeriesRef.current?.VWAP;
    if (!group || !canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rect = containerRef.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawSingleBand = (bandIdx) => {
      const fillStyle = indicatorStyle?.VWAP?.[`bandFill${bandIdx}`];

      const bandCfg = indicatorConfigs?.[id]?.[`band${bandIdx}`];
      const isEnabled = bandCfg?.enabled ?? (bandIdx === 1 ? true : false);
      if (!isEnabled) return;

      if (fillStyle?.visible === false) return;

      const upperData = group[`upperBand${bandIdx}Data`] || [];
      const lowerData = group[`lowerBand${bandIdx}Data`] || [];

      const upperSeries = group[`upperBand${bandIdx}`];
      const lowerSeries = group[`lowerBand${bandIdx}`];

      if (!upperSeries || !lowerSeries) return;
      if (!upperData.length || !lowerData.length) return;

      ctx.beginPath();

      for (let i = 0; i < upperData.length; i++) {
        const p = upperData[i];
        const x = chart.timeScale().timeToCoordinate(p.time);
        const y = upperSeries.priceToCoordinate(p.value);

        if (x == null || y == null) continue;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      for (let i = lowerData.length - 1; i >= 0; i--) {
        const p = lowerData[i];
        const x = chart.timeScale().timeToCoordinate(p.time);
        const y = lowerSeries.priceToCoordinate(p.value);

        if (x == null || y == null) continue;
        ctx.lineTo(x, y);
      }

      ctx.closePath();

      ctx.fillStyle = fillStyle?.color || "rgba(0,0,0,0.1)";
      ctx.fill();
    };

    drawSingleBand(1);
    drawSingleBand(2);
    drawSingleBand(3);
  };

  /* ================= CREATE SERIES ================= */

  useEffect(() => {
    if (!result?.data) return;

    if (indicatorSeriesRef.current?.VWAP) {
      Object.values(indicatorSeriesRef.current.VWAP).forEach((s) => {
        if (s?.setData) {
          removeSeries(s);
        }
      });

      indicatorSeriesRef.current.VWAP = null;
    }

    const groupedSeries = {};

    const {
      vwap = [],
      upper1 = [],
      lower1 = [],
      upper2 = [],
      lower2 = [],
      upper3 = [],
      lower3 = [],
    } = result.data;

    const config = indicatorConfigs?.[id] || {};

    if (vwap.length) {
      const s = addSeries("VWAP-vwap", LineSeries, {
        color: indicatorStyle?.VWAP?.vwap?.color,
        lineWidth: indicatorStyle?.VWAP?.vwap?.width,
        lineStyle: indicatorStyle?.VWAP?.vwap?.lineStyle,
        visible: indicatorStyle?.VWAP?.vwap?.visible,
        priceLineVisible: false,
      });

      s.setData(vwap);
      groupedSeries.vwap = s;
    }

    /* ================= BAND CREATOR ================= */

    const createBand = (bandIdx, upperData, lowerData) => {
      const bandCfg = config?.[`band${bandIdx}`];

      const isEnabled = bandCfg?.enabled ?? (bandIdx === 1 ? true : false);

      if (!isEnabled) {
        return;
      }

      const upperKey = `upperBand${bandIdx}`;
      const lowerKey = `lowerBand${bandIdx}`;

      const upperStyle = indicatorStyle?.VWAP?.[upperKey] || {};
      const lowerStyle = indicatorStyle?.VWAP?.[lowerKey] || {};

      const upperSeries = addSeries(`VWAP-${upperKey}`, LineSeries, {
        color: upperStyle.color,
        lineWidth: upperStyle.width,
        lineStyle: upperStyle.lineStyle,
        visible: upperStyle.visible ?? true,
        priceLineVisible: false,
      });

      const lowerSeries = addSeries(`VWAP-${lowerKey}`, LineSeries, {
        color: lowerStyle.color,
        lineWidth: lowerStyle.width,
        lineStyle: lowerStyle.lineStyle,
        visible: lowerStyle.visible ?? true,
        priceLineVisible: false,
      });

      upperSeries.setData(upperData || []);
      lowerSeries.setData(lowerData || []);

      groupedSeries[upperKey] = upperSeries;
      groupedSeries[lowerKey] = lowerSeries;

      groupedSeries[`${upperKey}Data`] = upperData || [];
      groupedSeries[`${lowerKey}Data`] = lowerData || [];
    };

    createBand(1, upper1, lower1);
    createBand(2, upper2, lower2);
    createBand(3, upper3, lower3);

    groupedSeries._drawCloud = drawBands;
    indicatorSeriesRef.current.VWAP = groupedSeries;

    drawBands();
  }, [
    result,
    indicatorConfigs?.[id]?.band1?.enabled,
    indicatorConfigs?.[id]?.band2?.enabled,
    indicatorConfigs?.[id]?.band3?.enabled,
  ]);

  /* ================= REDRAW EVENTS ================= */

  useEffect(() => {
    if (!chart) return;

    const redraw = () => drawBands();

    chart.timeScale().subscribeVisibleTimeRangeChange(redraw);
    chart.subscribeCrosshairMove(redraw);

    drawBands();

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(redraw);
      chart.unsubscribeCrosshairMove(redraw);
    };
  }, [chart, indicatorConfigs]);

  /* ================= STYLE UPDATE ================= */

  useEffect(() => {
    const group = indicatorSeriesRef.current?.VWAP;
    if (!group) return;

    Object.entries(group).forEach(([key, series]) => {
      if (!series?.applyOptions) return;

      const style = indicatorStyle?.VWAP?.[key];
      if (!style) return;

      const opts = {};
      if (style.color !== undefined) opts.color = style.color;
      if (style.width !== undefined) opts.lineWidth = style.width;
      if (style.lineStyle !== undefined) opts.lineStyle = style.lineStyle;
      if (style.visible !== undefined) opts.visible = style.visible;

      if (Object.keys(opts).length > 0) {
        series.applyOptions(opts);
      }
    });

    drawBands();
  }, [indicatorStyle, result, indicatorConfigs]);

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

      if (indicatorSeriesRef.current?.VWAP) {
        Object.values(indicatorSeriesRef.current.VWAP).forEach((s) => {
          if (s?.setData) {
            removeSeries(s);
          }
        });
        indicatorSeriesRef.current.VWAP = null;
      }
    };
  }, []);

  return null;
}
