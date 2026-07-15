import { useEffect } from "react";
import { LineSeries, HistogramSeries } from "lightweight-charts";

export default function PVOPlot({ result, indicatorStyle, indicatorSeriesRef, addSeries }) {

  /* ================= CREATE SERIES ================= */
  useEffect(() => {
    if (!result?.data) return;

    // Remove old series
    if (indicatorSeriesRef.current?.PVO) {
      Object.values(indicatorSeriesRef.current.PVO).forEach((s) => {
        try { s?.setData?.([]); } catch {}
      });
      indicatorSeriesRef.current.PVO = null;
    }

    const groupedSeries = {};
    let pvoData = [];
    let histRaw = [];

    Object.entries(result.data).forEach(([lineName, lineData]) => {
      if (!Array.isArray(lineData)) return;
      const style = indicatorStyle?.PVO?.[lineName];

      /* ================= HISTOGRAM ================= */
      if (lineName === "hist") {
        const series = addSeries("PVO", HistogramSeries, {
          visible: style?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        histRaw = lineData
          .filter((d) => d?.time != null && d?.value != null)
          .map((d) => ({ time: d.time, value: Number(d.value) }));

        // ALWAYS use palette from state (user-selected)
        const palette = indicatorStyle?.PVO?.histogram?.palette;
        if (!palette) return; // do nothing if palette is missing

        const colored = histRaw.map((d, i, arr) => {
          const v = d.value;
          const prev = arr[i - 1]?.value;
          let color;

          if (v > 0) color = i === 0 || v >= prev ? palette.color0 : palette.color1;
          else color = i === 0 || v <= prev ? palette.color3 : palette.color2;

          return { ...d, color };
        });

        series.setData(colored);
        groupedSeries.hist = series;
        groupedSeries.histRaw = histRaw;
      }

      /* ================= PVO + SIGNAL LINES ================= */
      else {
        const series = addSeries("PVO", LineSeries, {
          color: style?.color,
          lineWidth: style?.width ?? 2,
          lineStyle: style?.lineStyle ?? 0,
          visible: style?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        const cleanData = lineData
          .filter((d) => d?.time != null && d?.value != null)
          .map((d) => ({ time: d.time, value: Number(d.value) }));

        series.setData(cleanData);
        if (lineName === "pvo") pvoData = cleanData;
        groupedSeries[lineName] = series;
      }
    });

    /* ================= ZERO LINE ================= */
    const zeroStyle = indicatorStyle?.PVO?.zero;
    const zeroValue = zeroStyle?.value ?? 0;

    const zeroLine = addSeries("PVO", LineSeries, {
      color: zeroStyle?.color,
      lineWidth: zeroStyle?.width ?? 1,
      lineStyle: zeroStyle?.lineStyle ?? 2,
      visible: zeroStyle?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    zeroLine.setData(pvoData.map((p) => ({ time: p.time, value: zeroValue })));
    groupedSeries.zero = zeroLine;
    groupedSeries.pvoData = pvoData;

    indicatorSeriesRef.current.PVO = groupedSeries;

  }, [result]);

  /* ================= STYLE / PALETTE UPDATE ================= */
  useEffect(() => {
    const group = indicatorSeriesRef.current?.PVO;
    if (!group) return;

    const style = indicatorStyle?.PVO;
    const histRaw = group.histRaw ?? [];
    const pvoData = group.pvoData ?? [];

    /* ---------- PVO + SIGNAL LINES ---------- */
    ["pvo", "signal"].forEach((key) => {
      const s = group[key];
      if (!s || !style?.[key]) return;

      s.applyOptions({
        color: style[key].color,
        lineWidth: style[key].width,
        lineStyle: style[key].lineStyle,
        visible: style[key].visible,
      });
    });

    /* ---------- ZERO LINE ---------- */
    group.zero?.applyOptions({
      color: style?.zero?.color,
      lineWidth: style?.zero?.width,
      lineStyle: style?.zero?.lineStyle,
      visible: style?.zero?.visible,
    });

    group.zero?.setData(
      pvoData.map((p) => ({ time: p.time, value: style?.zero?.value ?? 0 }))
    );

    /* ---------- HISTOGRAM ---------- */
    const histSeries = group.hist;
    if (!histSeries) return;

    histSeries.applyOptions({ visible: style?.histogram?.visible ?? true });

    group._recolor = () => {
      const palette = indicatorStyle?.PVO?.histogram?.palette;
      if (!palette) return;

      const histDataToColor = group.rawData?.hist ?? group.histRaw ?? [];
      if (!histDataToColor.length) return;

      const recolored = histDataToColor.map((d, i, arr) => {
        const v = d.value;
        const prev = arr[i - 1]?.value;
        let color;

        if (v > 0) color = i === 0 || v >= prev ? palette.color0 : palette.color1;
        else color = i === 0 || v <= prev ? palette.color3 : palette.color2;

        return { ...d, color };
      });

      histSeries.setData(recolored);
    };

    group._recolor();

  }, [indicatorStyle]);

  return null;
}