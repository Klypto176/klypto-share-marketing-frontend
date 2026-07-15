import { useEffect } from "react";
import { LineSeries, HistogramSeries } from "lightweight-charts";

export default function MACDPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
}) {

  /* ================= CREATE SERIES ================= */

  useEffect(() => {
    if (!result?.data) return;

    /* ---------- REMOVE OLD SERIES ---------- */

    if (indicatorSeriesRef.current?.MACD) {
      Object.values(indicatorSeriesRef.current.MACD).forEach((s) => {
        try {
          s?.setData?.([]);
        } catch {}
      });

      indicatorSeriesRef.current.MACD = null;
    }

    const groupedSeries = {};

    let macdData = [];
    let histogramRaw = [];

    Object.entries(result.data).forEach(([lineName, lineData]) => {
      if (!Array.isArray(lineData)) return;

      const style = indicatorStyle?.MACD?.[lineName];

      /* ================= HISTOGRAM ================= */

      if (lineName === "histogram") {
        const series = addSeries("MACD", HistogramSeries, {
          visible: indicatorStyle?.MACD?.histogram?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        histogramRaw = lineData
          .filter((d) => d?.time != null && d?.value != null)
          .map((d) => ({
            time: d.time,
            value: Number(d.value),
          }));

        const palette = indicatorStyle?.MACD?.histogram?.palette || {};

        const colored = histogramRaw.map((d, i, arr) => {
          const v = d.value;
          const prev = arr[i - 1]?.value;

          let color;

          if (v >= 0) {
            color = i === 0 || v >= prev ? palette?.["pf"] : palette?.["pr"];
          } else {
            color = i === 0 || v >= prev ? palette?.["nf"] : palette?.["nr"];
          }

          return {
            ...d,
            color,
          };
        });

        series.setData(colored);

        groupedSeries.histogram = series;
        groupedSeries.histogramRaw = histogramRaw;
      }

      /* ================= MACD + SIGNAL ================= */

      else {
        const series = addSeries("MACD", LineSeries, {
          color: style?.color,
          lineWidth: style?.width ?? 2,
          lineStyle: style?.lineStyle ?? 0,
          visible: style?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        const cleanData = lineData
          .filter((d) => d?.time != null && d?.value != null)
          .map((d) => ({
            time: d.time,
            value: Number(d.value),
          }));

        series.setData(cleanData);

        if (lineName === "macd") macdData = cleanData;

        groupedSeries[lineName] = series;
      }
    });

    /* ================= ZERO LINE ================= */

    const zeroStyle = indicatorStyle?.MACD?.zeroLine;

    const zeroLine = addSeries("MACD", LineSeries, {
      color: zeroStyle?.color,
      lineWidth: zeroStyle?.width ?? 1,
      lineStyle: zeroStyle?.lineStyle ?? 2,
      visible: zeroStyle?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const zeroValue = zeroStyle?.value ?? 0;

    const zeroData = macdData.map((p) => ({
      time: p.time,
      value: zeroValue,
    }));

    zeroLine.setData(zeroData);

    groupedSeries.zeroLine = zeroLine;
    groupedSeries.macdData = macdData;

    indicatorSeriesRef.current.MACD = groupedSeries;

  }, [result]);



  /* ================= STYLE / PALETTE UPDATE ================= */

  useEffect(() => {

    const macdGroup = indicatorSeriesRef.current?.MACD;
    if (!macdGroup) return;

    const style = indicatorStyle?.MACD;
    const macdData = macdGroup.macdData ?? [];
    const histogramRaw = macdGroup.histogramRaw ?? [];

    /* ---------- UPDATE MACD + SIGNAL ---------- */

    ["macd", "signal"].forEach((key) => {

      const series = macdGroup[key];
      const s = style?.[key];

      if (!series || !s) return;

      series.applyOptions({
        color: s.color,
        lineWidth: s.width,
        lineStyle: s.lineStyle,
        visible: s.visible,
      });

    });


    /* ---------- UPDATE ZERO LINE ---------- */

    const zeroStyle = style?.zeroLine;
    const zeroValue = zeroStyle?.value ?? 0;

    macdGroup.zeroLine?.applyOptions({
      color: zeroStyle?.color,
      lineWidth: zeroStyle?.width,
      lineStyle: zeroStyle?.lineStyle,
      visible: zeroStyle?.visible,
    });

    macdGroup.zeroLine?.setData(
      macdData.map((p) => ({
        time: p.time,
        value: zeroValue,
      }))
    );


    /* ---------- UPDATE HISTOGRAM ---------- */

    const histogramSeries = macdGroup.histogram;
    const palette = style?.histogram?.palette;
    const histogramVisible = style?.histogram?.visible ?? true;

    if (histogramSeries) {
      histogramSeries.applyOptions({
        visible: histogramVisible,
      });
    }

    if (histogramSeries) {
      macdGroup._recolor = () => {
        const palette = indicatorStyle?.MACD?.histogram?.palette;
        if (!palette) return;

        const histDataToColor = macdGroup.rawData?.histogram ?? macdGroup.histogramRaw ?? [];
        if (!histDataToColor.length) return;

        const recolored = histDataToColor.map((d, i, arr) => {
          const v = d.value;
          const prev = arr[i - 1]?.value;
          let color;

          if (v >= 0) {
            color = i === 0 || v >= prev ? palette?.["pf"] : palette?.["pr"];
          } else {
            color = i === 0 || v >= prev ? palette?.["nf"] : palette?.["nr"];
          }

          return {
            ...d,
            color,
          };
        });

        histogramSeries.setData(recolored);
      };

      macdGroup._recolor();
    }

  }, [indicatorStyle]);


  return null;
}