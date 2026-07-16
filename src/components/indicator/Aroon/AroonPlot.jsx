import { useEffect } from "react";
import { LineSeries } from "lightweight-charts";

export default function AroonPlot({
  result,
  rows,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
}) {
  /* ================= CREATE AROON ================= */

  useEffect(() => {
    if (!result) return;

    /* REMOVE OLD AROON COMPLETELY */

    if (indicatorSeriesRef.current?.AROON) {
      Object.values(indicatorSeriesRef.current.AROON).forEach((s) => {
        if (s?.setData) {
          try {
            s.setData([]);
          } catch {}
        }
      });
      indicatorSeriesRef.current.AROON = null;
    }

    const groupedSeries = {};

    /* ================= MAIN LINES ================= */

    let formattedUp = [];
    let formattedDown = [];

    if (Array.isArray(result.data)) {
      formattedUp = result.data
        .filter((d) => (d.aroonUp != null || d.up != null) && d.time != null)
        .map((d) => ({
          time: Number(d.time),
          value: Number(d.aroonUp ?? d.up),
        }))
        .sort((a, b) => a.time - b.time);

      formattedDown = result.data
        .filter((d) => (d.aroonDown != null || d.down != null) && d.time != null)
        .map((d) => ({
          time: Number(d.time),
          value: Number(d.aroonDown ?? d.down),
        }))
        .sort((a, b) => a.time - b.time);
    } else if (result.data && typeof result.data === "object") {
      formattedUp = (result.data.aroonUp || result.data.up || []).map(d => ({
        time: Number(d.time),
        value: Number(d.value)
      }));
      formattedDown = (result.data.aroonDown || result.data.down || []).map(d => ({
        time: Number(d.time),
        value: Number(d.value)
      }));
    }

    /* AROON UP */
    const upStyle = indicatorStyle?.AROON?.aroonUp;
    const upSeries = addSeries("AROON", LineSeries, {
      color: upStyle?.color || "rgb(38,166,154)",
      lineWidth: upStyle?.width || 1,
      lineStyle: upStyle?.lineStyle ?? 0,
      visible: upStyle?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    if (upSeries) {
      upSeries.setData(formattedUp);
      groupedSeries.aroonUp = upSeries;
    }

    /* AROON DOWN */
    const downStyle = indicatorStyle?.AROON?.aroonDown;
    const downSeries = addSeries("AROON", LineSeries, {
      color: downStyle?.color || "rgb(239,83,80)",
      lineWidth: downStyle?.width || 1,
      lineStyle: downStyle?.lineStyle ?? 0,
      visible: downStyle?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    if (downSeries) {
      downSeries.setData(formattedDown);
      groupedSeries.aroonDown = downSeries;
    }

    indicatorSeriesRef.current.AROON = groupedSeries;
  }, [result]);

  /* ================= STYLE UPDATE ================= */

  useEffect(() => {
    const aroonGroup = indicatorSeriesRef.current?.AROON;
    if (!aroonGroup) return;

    const upStyle = indicatorStyle?.AROON?.aroonUp;
    const downStyle = indicatorStyle?.AROON?.aroonDown;

    /* UPDATE AROON UP */

    if (aroonGroup.aroonUp) {
      aroonGroup.aroonUp.applyOptions({
        color: upStyle?.color,
        lineWidth: upStyle?.width,
        lineStyle: upStyle?.lineStyle ?? 0,
        visible: upStyle?.visible,
        lastValueVisible: upStyle?.visible,
        opacity: upStyle?.opacity, // ⭐ add this
      });
    }

    /* UPDATE AROON DOWN */

    if (aroonGroup.aroonDown) {
      aroonGroup.aroonDown.applyOptions({
        color: downStyle?.color,
        lineWidth: downStyle?.width,
        lineStyle: downStyle?.lineStyle ?? 0,
        visible: downStyle?.visible,
        lastValueVisible: downStyle?.visible,
        opacity: downStyle?.opacity, // ⭐ add this
      });
    }
  }, [indicatorStyle]);
  return null;
}
