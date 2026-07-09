import { useEffect } from "react";
import { LineSeries } from "lightweight-charts";

export default function WMAPlot({
  result,
  rows,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries
}) {

  /* ================= CREATE WMA ================= */

  useEffect(() => {

    if (!result) return;

    /* REMOVE OLD WMA */

    if (indicatorSeriesRef.current?.WMA) {

      Object.values(indicatorSeriesRef.current.WMA).forEach((s) => {
        if (s?.setData) {
          try { s.setData([]); } catch {}
        }
      });

      indicatorSeriesRef.current.WMA = null;
    }

    const groupedSeries = {};

    Object.entries(result.data).forEach(([lineName, lineData]) => {

      const rowConfig = rows?.find((r) => r.key === lineName);
      const styleConfig = indicatorStyle?.WMA?.[lineName];

      const series = addSeries("WMA", LineSeries, {
        color: styleConfig?.color || rowConfig?.color || "#9c27b0",
        lineWidth: styleConfig?.width || 2,
        visible: styleConfig?.visible ?? true,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      if (!series) return;

      const formattedData = lineData
        .filter((d) => d != null && d.time != null)
        .map((d) => ({
          time: Number(d.time),
          value: Number(d.value ?? d[lineName]),
        }));

      series.setData(formattedData);

      groupedSeries[lineName] = series;
    });

    indicatorSeriesRef.current.WMA = groupedSeries;

  }, [result]);


  /* ================= STYLE UPDATE ================= */

  useEffect(() => {

    const wmaGroup = indicatorSeriesRef.current?.WMA;
    if (!wmaGroup) return;

    const style = indicatorStyle?.WMA?.wma;

    if (wmaGroup.wma) {
      wmaGroup.wma.applyOptions({
        color: style?.color,
        lineWidth: style?.width,
        lineStyle: style?.lineStyle ?? 0,
        visible: style?.visible,
        lastValueVisible: style?.visible,
        opacity: style?.opacity,
      });
    }

  }, [indicatorStyle]);

  return null;
}