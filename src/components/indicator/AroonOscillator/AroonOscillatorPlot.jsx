import { useEffect } from "react";
import { LineSeries, BaselineSeries } from "lightweight-charts";

export default function AroonOscillatorPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart
}) {

  /* ================= CREATE ================= */

  useEffect(() => {
    if (!result) return;

    if (indicatorSeriesRef.current?.AO) {
      Object.values(indicatorSeriesRef.current.AO).forEach((s)=>{
        try { chart?.removeSeries(s) } catch {}
      });
      indicatorSeriesRef.current.AO = null;
    }

    const grouped = {};
    const style = indicatorStyle?.AO;
    const data = result?.data ?? [];

    /* ================= OSC ================= */

    const osc = addSeries("AO", BaselineSeries, {
      baseValue: { type: "price", price: style?.center?.value ?? 0 },

      topLineColor: style?.oscillator?.palette?.up,
      bottomLineColor: style?.oscillator?.palette?.down,

      topFillColor1: style?.oscillatorFill?.palette?.topFillColor1,
      topFillColor2: style?.oscillatorFill?.palette?.topFillColor1,

      bottomFillColor1: style?.oscillatorFill?.palette?.topFillColor2,
      bottomFillColor2: style?.oscillatorFill?.palette?.topFillColor2,

      lineWidth: style?.oscillator?.width || 2,
      lineStyle: style?.oscillator?.lineStyle ?? 0,
    });

    const formattedData = data
      .filter((d) => d && d.time != null && (d.aroonOsc != null || d.value != null))
      .map((d) => ({
        time: Number(d.time) + 19800,
        value: Number(d.aroonOsc ?? d.value),
      }));

    osc.setData(formattedData);
    grouped.oscillator = osc;

    /* ================= LEVELS ================= */

    const make = (v) => formattedData.map(p => ({ time: p.time, value: v }));

    const center = addSeries("AO", LineSeries, {});
    const upper = addSeries("AO", LineSeries, {});
    const lower = addSeries("AO", LineSeries, {});

    center.setData(make(style?.center?.value ?? 0));
    upper.setData(make(style?.upperLevel?.value ?? 90));
    lower.setData(make(style?.lowerLevel?.value ?? -90));

    grouped.center = center;
    grouped.upperLevel = upper;
    grouped.lowerLevel = lower;

    grouped.data = data;

    indicatorSeriesRef.current.AO = grouped;

  }, [result]);


  /* ================= UPDATE ================= */

  useEffect(() => {

    const g = indicatorSeriesRef.current?.AO;
    if (!g) return;

    const style = indicatorStyle?.AO;
    const data = g.data ?? [];

    const make = (v) => data.map(p => ({ time: p.time, value: v }));

    /* ================= OSC ================= */

    g.oscillator.applyOptions({

      // ✅ VISIBILITY FIX
      visible: style?.oscillator?.visible ?? true,

      // ✅ LINE STYLE FIX
      lineWidth: style?.oscillator?.width,
      lineStyle: style?.oscillator?.lineStyle,

      // ✅ COLOR FIX
      topLineColor: style?.oscillator?.palette?.up,
      bottomLineColor: style?.oscillator?.palette?.down,

      // ✅ FILL FIX
      topFillColor1: style?.oscillatorFill?.visible
        ? style?.oscillatorFill?.palette?.topFillColor1
        : "rgba(0,0,0,0)",

      topFillColor2: style?.oscillatorFill?.visible
        ? style?.oscillatorFill?.palette?.topFillColor1
        : "rgba(0,0,0,0)",

      bottomFillColor1: style?.oscillatorFill?.visible
        ? style?.oscillatorFill?.palette?.topFillColor2
        : "rgba(0,0,0,0)",

      bottomFillColor2: style?.oscillatorFill?.visible
        ? style?.oscillatorFill?.palette?.topFillColor2
        : "rgba(0,0,0,0)",
    });

    /* ================= LEVELS ================= */

    const updateLine = (series, cfg, value) => {
      if (!series) return;

      series.applyOptions({
        visible: cfg?.visible ?? true,
        color: cfg?.color,
        lineWidth: cfg?.width,
        lineStyle: cfg?.lineStyle,
      });

      series.setData(make(value));
    };

    updateLine(g.center, style?.center, style?.center?.value ?? 0);
    updateLine(g.upperLevel, style?.upperLevel, style?.upperLevel?.value ?? 90);
    updateLine(g.lowerLevel, style?.lowerLevel, style?.lowerLevel?.value ?? -90);

  }, [
    result,

    // ✅ CRITICAL: full AO dependency
    indicatorStyle?.AO
  ]);

  return null;
}