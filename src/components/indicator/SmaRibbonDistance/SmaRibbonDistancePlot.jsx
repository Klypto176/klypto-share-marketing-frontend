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

const HELPER_LINE_KEYS = new Set([
  "maximumRibbonDistance",
  "priceDistanceFromRibbonCenter",
]);

const DEFAULT_LEVELS = {
  compressionThreshold: 80,
  midLine: 50,
  zeroLine: 0,
};

const OSCILLATOR_SCALE = {
  autoScale: true,
  mode: 0,
  scaleMargins: {
    top: 0.1,
    bottom: 0.1,
  },
};

const oscillatorAutoscale = () => ({
  priceRange: {
    minValue: 0,
    maxValue: 100,
  },
});

export default function SmaRibbonDistancePlot({
  id,
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
}) {
  useEffect(() => {
    if (!result || !chart) return;

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
      const visible = HELPER_LINE_KEYS.has(key)
        ? false
        : styleConfig.visible ?? true;
      const series = addSeries(id, LineSeries, {
        color: styleConfig.color || "#00bcd4",
        lineWidth: styleConfig.width ?? 2,
        lineStyle: styleConfig.lineStyle ?? 0,
        visible,
        priceLineVisible: false,
        lastValueVisible:
          visible && !["compressionThreshold", "midLine", "zeroLine"].includes(key),
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
        autoscaleInfoProvider: oscillatorAutoscale,
      });

      if (!series) return;
      series.priceScale?.().applyOptions?.(OSCILLATOR_SCALE);

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
  }, [result, chart]);

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
        color: styleConfig.color || "#00bcd4",
        lineWidth: styleConfig.width ?? 2,
        lineStyle: styleConfig.lineStyle ?? 0,
        visible: HELPER_LINE_KEYS.has(key)
          ? false
          : styleConfig.visible ?? true,
        autoscaleInfoProvider: oscillatorAutoscale,
      });

      series.priceScale?.().applyOptions?.(OSCILLATOR_SCALE);

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
