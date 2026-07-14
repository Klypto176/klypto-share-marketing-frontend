import { useEffect } from "react";
import { LineSeries } from "lightweight-charts";

export default function TRIXPlot({
  result,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
}) {
  /* ================= CREATE ================= */

  useEffect(() => {
    const trixRaw = result?.data?.trix;

    if (!Array.isArray(trixRaw) || !trixRaw.length) {
      console.log(":x: TRIX data missing", result);
      return;
    } // :fire: REMOVE OLD

    if (indicatorSeriesRef.current?.TRIX) {
      Object.values(indicatorSeriesRef.current.TRIX).forEach((s) => {
        try {
          s.setData([]);
        } catch {}
      });
      indicatorSeriesRef.current.TRIX = null;
    }

    const trixData = trixRaw.map((p) => ({
      time: Number(p.time),
      value: Number(p.value),
    }));

    const style = indicatorStyle?.TRIX; /* :fire: TRIX LINE */

    const trixSeries = addSeries("TRIX", LineSeries, {
      color: style?.trixLine?.color ?? "rgba(33,150,243,1)",
      lineWidth: style?.trixLine?.width ?? 2,
      lineStyle: style?.trixLine?.lineStyle ?? 0,
      visible: style?.trixLine?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: true,
    }); /* :fire: ZERO LINE */

    const zeroSeries = addSeries("TRIX", LineSeries, {
      color: style?.zeroLine?.color ?? "rgba(158,158,158,1)",
      lineWidth: style?.zeroLine?.width ?? 1,
      lineStyle: style?.zeroLine?.lineStyle ?? 2,
      visible: style?.zeroLine?.visible ?? true,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const zeroValue = style?.zeroLine?.value ?? 0;

    const zeroData = trixData.map((p) => ({
      time: p.time,
      value: zeroValue,
    }));

    trixSeries.setData(trixData);
    zeroSeries.setData(zeroData);

    indicatorSeriesRef.current.TRIX = {
      trixLine: trixSeries,
      zeroLine: zeroSeries,
      trixData,
      _levels: {
        zero: zeroValue
      }
    };

    console.log(":white_check_mark: TRIX plotted");
  }, [result]); /* ================= STYLE UPDATE ================= */

  useEffect(() => {
    const g = indicatorSeriesRef.current?.TRIX;
    if (!g) return;

    const style = indicatorStyle?.TRIX;
    if (!style) return; /* :fire: UPDATE ZERO LINE DATA */

    const zeroValue = style?.zeroLine?.value ?? 0;

    const zeroData = g.trixData.map((p) => ({
      time: p.time,
      value: zeroValue,
    }));

    g.zeroLine?.setData(zeroData); /* :fire: APPLY STYLE */

    g.trixLine?.applyOptions({
      color: style?.trixLine?.color,
      lineWidth: style?.trixLine?.width,
      lineStyle: style?.trixLine?.lineStyle,
      visible: style?.trixLine?.visible,
    });

    g.zeroLine?.applyOptions({
      color: style?.zeroLine?.color,
      lineWidth: style?.zeroLine?.width,
      lineStyle: style?.zeroLine?.lineStyle,
      visible: style?.zeroLine?.visible,
    });
  }, [indicatorStyle?.TRIX]);

  return null;
}
