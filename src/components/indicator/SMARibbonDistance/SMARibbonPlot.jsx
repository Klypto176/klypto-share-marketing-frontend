import { useEffect } from "react";
import { LineSeries, HistogramSeries } from "lightweight-charts";

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
        key: "compressionScore",
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
      {
        key: "effectiveDistanceThreshold",
        color: "rgba(121,85,72,1)",
      },
      {
        key: "consecutiveTightBars",
        color: "rgba(63,81,181,1)",
      },
      {
        key: "priceDistanceFromRibbonCenter",
        color: "rgba(233,30,99,1)",
      },
    ];

    // Background Color Series
    if (result.data.compressionScore) {
      const bgSeries = addSeries(id, HistogramSeries, {
        lastValueVisible: false,
        priceLineVisible: false,
        baseLineVisible: false,
        autoscaleInfoProvider: () => null,
      });

      if (bgSeries) {
        const bgData = result.data.compressionScore.map((d) => {
          let bgColor = "transparent";
          if (d.tightBarCount >= (d.minimumTightBars || 20)) {
            bgColor = "rgba(255,0,255,0.13)"; // fuchsia 87% transparency
          } else if (d.value >= (d.compressionThreshold || 80)) {
            bgColor = "rgba(0,255,255,0.08)"; // aqua 92% transparency
          }
          return {
            time: d.time,
            value: bgColor !== "transparent" ? 100000 : 0,
            color: bgColor,
          };
        });

        bgSeries.setData(bgData);
        try {
          bgSeries.applyOptions({ base: -100000 });
        } catch (e) {}

        groupedSeries["_bg"] = bgSeries;
      }
    }

    seriesConfig.forEach(({ key, color }) => {
      const s = addSeries(id, LineSeries, {
        color: style?.[key]?.color || color,
        lineWidth: style?.[key]?.width || (key === "compressionScore" ? 3 : 2),
        lineStyle: style?.[key]?.lineStyle || 0,
        visible: style?.[key]?.visible ?? (key === "compressionScore"),
        priceLineVisible: false,
        lastValueVisible: true,
      });

      if (!s) return;

      if (result.data[key]) {
        let finalData = result.data[key];

        if (key === "compressionScore") {
          const c0 = style?.compressionScore?.color0 || "rgba(255,0,255,1)";
          const c1 = style?.compressionScore?.color1 || "rgba(0,255,255,1)";
          const c2 = style?.compressionScore?.color2 || "rgba(255,165,0,1)";
          const c3 = style?.compressionScore?.color3 || "rgba(128,128,128,1)";

          finalData = finalData.map((d) => {
            let pointColor = c3;
            if (d.tightBarCount >= (d.minimumTightBars || 20)) {
              pointColor = c0;
            } else if (d.value >= (d.compressionThreshold || 80)) {
              pointColor = c1;
            } else if (d.value >= 50) {
              pointColor = c2;
            }
            return { time: d.time, value: d.value, color: pointColor };
          });
        }

        s.setData(finalData);
      }

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
        const val = style?.[level.key]?.value !== undefined ? Number(style[level.key].value) : level.value;

        const s = addSeries(`${id}_${level.key}`, LineSeries, {
          color: style?.[level.key]?.color || level.defaultColor,
          lineWidth: style?.[level.key]?.width || 1,
          lineStyle: val === 50 ? 0 : 2,
          visible: style?.[level.key]?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        if (!s) return;

        s.setData(
          refData.map((x) => ({
            time: x.time,
            value: val,
          }))
        );

        groupedSeries[level.key] = s;
      });
    }

    indicatorSeriesRef.current[id] = groupedSeries;
  }, [result, indicatorStyle]); // Add indicatorStyle here so it completely re-renders when styles change

  return null;
}