import { useEffect } from "react";
import { LineSeries } from "lightweight-charts";

const LINE_KEYS = [
  "smaRibbonDistance",
  "maximumRibbonDistance",
  "priceDistanceFromRibbonCenter",
  "compressionThreshold",
  "midLine",
  "zeroLine",
];

const DEFAULT_LEVELS = {
  compressionThreshold: 80,
  midLine: 50,
  zeroLine: 0,
};

export default function SmaRibbonDistancePlot({
  id,
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
}) {
  useEffect(() => {
    if (!result) return;

    if (indicatorSeriesRef.current?.[id]) {
      Object.values(indicatorSeriesRef.current[id]).forEach((series) => {
        try {
          chart?.removeSeries(series);
        } catch {}
      });
    }

    const style =
      indicatorStyle?.[id] ??
      indicatorStyle?.SMA_RIBBON_DISTANCE;

    const groupedSeries = {};
    const timeSource =
      result.data?.smaRibbonDistance ??
      result.data?.maximumRibbonDistance ??
      result.data?.priceDistanceFromRibbonCenter ??
      [];

    const createLine = (key) => {
      const styleConfig = style?.[key] || {};
      const series = addSeries(id, LineSeries, {
        color: styleConfig.color,
        lineWidth: styleConfig.width,
        lineStyle: styleConfig.lineStyle,
        visible: styleConfig.visible,
        priceLineVisible: false,
        lastValueVisible: !["compressionThreshold", "midLine", "zeroLine"].includes(key),
      });

      if (!series) return;

      const isLevelLine = Object.prototype.hasOwnProperty.call(
        DEFAULT_LEVELS,
        key,
      );
      const data =
        result.data?.[key]?.length
          ? result.data[key]
          : isLevelLine
            ? timeSource.map((d) => ({
                time: d.time,
                value: styleConfig.value ?? DEFAULT_LEVELS[key],
              }))
            : [];

      series.setData(data);
      groupedSeries[key] = series;
    };

    LINE_KEYS.forEach(createLine);

    indicatorSeriesRef.current[id] = groupedSeries;
  }, [result]);

  useEffect(() => {
    const group = indicatorSeriesRef.current?.[id];
    if (!group || !result) return;

    const style =
      indicatorStyle?.[id] ??
      indicatorStyle?.SMA_RIBBON_DISTANCE;

    const timeSource =
      result.data?.smaRibbonDistance ??
      result.data?.maximumRibbonDistance ??
      result.data?.priceDistanceFromRibbonCenter ??
      [];

    Object.entries(group).forEach(([key, series]) => {
      if (!series?.applyOptions) return;

      const styleConfig = style?.[key] || {};

      series.applyOptions({
        color: styleConfig.color,
        lineWidth: styleConfig.width,
        lineStyle: styleConfig.lineStyle,
        visible: styleConfig.visible,
      });

      if (["compressionThreshold", "midLine", "zeroLine"].includes(key)) {
        const value = styleConfig.value ?? DEFAULT_LEVELS[key] ?? 0;
        series.setData(
          timeSource.map((d) => ({
            time: d.time,
            value: Number(value),
          })),
        );
      }
    });
  }, [indicatorStyle, result]);

  return null;
}
