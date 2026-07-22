import { useEffect } from "react";
import { LineSeries } from "lightweight-charts";

export default function SMARibbonPlot({
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

    const style = indicatorStyle?.[id] ?? indicatorStyle?.SMARIBBON;

    const groupedSeries = {};

    const seriesConfig = [
      {
        key: "oscillator",
        color: "rgba(33,150,243,1)",
      },
      {
        key: "maxDistance",
        color: "rgba(255,235,59,1)",
      },
      {
        key: "avgDistance",
        color: "rgba(63,81,181,1)",
      },
      {
        key: "distance12",
        color: "rgba(255,193,7,1)",
      },
      {
        key: "distance23",
        color: "rgba(255,152,0,1)",
      },
      {
        key: "distance34",
        color: "rgba(244,67,54,1)",
      },
    ];

    seriesConfig.forEach(({ key, color }) => {
      const s = addSeries(id, LineSeries, {
        color: style?.[key]?.color || color,
        lineWidth: style?.[key]?.width || 2,
        lineStyle: style?.[key]?.lineStyle || 0,
        visible: style?.[key]?.visible ?? true,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      if (result.data[key]) s.setData(result.data[key]);

      groupedSeries[key] = s;
    });

    // Reference lines

    const refLevels = [
      {
        key: "perfectCompression",
        value: 100,
        defaultColor: "rgba(120,120,120,1)",
      },
      {
        key: "compressionThreshold",
        value: 80,
        defaultColor: "rgba(255,0,255,1)",
      },
      {
        key: "neutral",
        value: 50,
        defaultColor: "rgba(120,120,120,1)",
      },
      {
        key: "zero",
        value: 0,
        defaultColor: "rgba(120,120,120,1)",
      },
    ];

    const refData =
      Object.values(result.data).find(
        (x) => Array.isArray(x) && x.length > 0
      ) || [];

    if (refData.length) {
      refLevels.forEach((level) => {
        const s = addSeries(`${id}_${level.key}`, LineSeries, {
          color:
            style?.[level.key]?.color ||
            level.defaultColor,
          lineWidth:
            style?.[level.key]?.width || 1,
          lineStyle:
            level.value === 50
              ? 0
              : 2,
          visible:
            style?.[level.key]?.visible ??
            true,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        s.setData(
          refData.map((x) => ({
            time: x.time,
            value: level.value,
          }))
        );

        groupedSeries[level.key] = s;
      });
    }

    indicatorSeriesRef.current[id] = groupedSeries;
  }, [result]);

  useEffect(() => {
    const group = indicatorSeriesRef.current?.[id];
    if (!group) return;

    const style = indicatorStyle?.[id] ?? indicatorStyle?.SMARIBBON;

    Object.entries(group).forEach(([key, series]) => {
      if (!series?.applyOptions) return;

      series.applyOptions({
        color: style?.[key]?.color,
        lineWidth: style?.[key]?.width,
        lineStyle: style?.[key]?.lineStyle,
        visible: style?.[key]?.visible,
      });
    });
  }, [indicatorStyle]);

  return null;
}