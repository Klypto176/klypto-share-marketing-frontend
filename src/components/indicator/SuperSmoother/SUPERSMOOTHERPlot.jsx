import { useEffect } from "react";
import {
  LineSeries,
  HistogramSeries,
  BaselineSeries,
  createSeriesMarkers,
} from "lightweight-charts";

export default function SuperSmootherPlot({
  id,
  result,
  rows,
  indicatorStyle,
  indicatorSeriesRef,
  addSeries,
  chart,
  pane,
}) {

  useEffect(() => {

    if (!result) return;

    // remove old series
    if (indicatorSeriesRef.current?.[id]) {
      const oldGroup = indicatorSeriesRef.current[id];
      if (oldGroup.markersPrimitive && pane) {
        try {
          pane.detachPrimitive(oldGroup.markersPrimitive);
        } catch {}
      }
      Object.values(oldGroup).forEach((s) => {
        if (s === oldGroup.markersPrimitive) return;
        try {
          chart?.removeSeries(s);
        } catch {}
      });

      indicatorSeriesRef.current[id] = null;
    }

    const groupedSeries = {};
    const style = indicatorStyle?.[id] || indicatorStyle?.SUPERSMOOTHER;

    Object.entries(result.data).forEach(([lineName, lineData]) => {

      const styleConfig = style?.[lineName];

      //------------------------------------
      // HISTOGRAM
      //------------------------------------
      if (lineName === "histogram") {

        const series = addSeries(id, HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false,
          visible: styleConfig?.visible ?? true,
        });
        
        const styledData = lineData.map((d) => {
          const isRising = d.value >= 0;
          const color = d.histogramColor || d.color || (isRising 
            ? (styleConfig?.pr || styleConfig?.palette?.pr || "rgba(0,255,127,0.6)")
            : (styleConfig?.pf || styleConfig?.palette?.pf || "rgba(255,0,0,0.6)"));
          return { ...d, color };
        });

        series.setData(styledData);

        groupedSeries[lineName] = series;

        return;
      }

      //------------------------------------
      // BUY/SELL MARKERS (Handled in second useEffect)
      //------------------------------------
      if (
        lineName === "buySignals" ||
        lineName === "sellSignals" ||
        lineName === "strongBuySignals" ||
        lineName === "strongSellSignals"
      ) {
        groupedSeries[lineName] = lineData;
        return;
      }

      //------------------------------------
      // NORMAL LINES
      //------------------------------------
      if (lineName === "oscillator") {
        // 1. Fill Series (Baseline) without line
        const fillStyle = styleConfig?.oscillatorFill || style?.oscillatorFill;
        const fillSeries = addSeries(id, BaselineSeries, {
          baseValue: { type: "price", price: 0 },
          topLineColor: "rgba(0, 0, 0, 0)", // Transparent line
          bottomLineColor: "rgba(0, 0, 0, 0)", // Transparent line
          topFillColor1: fillStyle?.topFillColor1 || "rgba(0, 255, 0, 0.5)",
          topFillColor2: fillStyle?.topFillColor2 || "rgba(0, 255, 0, 0.05)",
          bottomFillColor1: fillStyle?.bottomFillColor1 || "rgba(255, 20, 147, 0.05)",
          bottomFillColor2: fillStyle?.bottomFillColor2 || "rgba(255, 20, 147, 0.5)",
          lineWidth: 0,
          visible: styleConfig?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        // The BaselineSeries only takes time and value, color per point isn't natively supported for the line, 
        // so we map data without the per-point color for the fill.
        fillSeries.setData(lineData.map(d => ({ time: d.time, value: d.value })));
        groupedSeries.oscillatorFill = fillSeries;

        // 2. Line Series for dynamic per-point coloring
        const lineSeries = addSeries(id, LineSeries, {
          color: styleConfig?.color || "rgba(0, 255, 0, 1)",
          lineWidth: styleConfig?.width ?? 2,
          visible: styleConfig?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        const styledLineData = lineData.map((d) => {
          const isRising = d.value >= 0;
          return {
            ...d,
            color: d.color || (isRising ? "rgba(0, 255, 0, 1)" : "rgba(255, 20, 147, 1)")
          };
        });

        lineSeries.setData(styledLineData);
        groupedSeries[lineName] = lineSeries;

        // 3. Zero line reference
        const zeroData = lineData.map((d) => ({ time: d.time, value: 0 }));
        const zeroSeries = addSeries(id, LineSeries, {
          color: style?.zeroLine?.color || "rgba(128,128,128,1)",
          lineWidth: style?.zeroLine?.width ?? 1,
          lineStyle: style?.zeroLine?.lineStyle ?? 2, // dashed
          visible: style?.zeroLine?.visible ?? true,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        zeroSeries.setData(zeroData);
        groupedSeries.zeroLine = zeroSeries;

        return;
      }

      const series = addSeries(id, LineSeries, {
        color: styleConfig?.color,
        lineWidth: styleConfig?.width ?? 2,
        visible: styleConfig?.visible ?? true,
        priceLineVisible: false,
        lastValueVisible:
          lineName === "oscillator" ||
          lineName === "signalLine",
      });

      series.setData(lineData);

      groupedSeries[lineName] = series;

    });

    indicatorSeriesRef.current[id] = groupedSeries;

  }, [result]);


  //--------------------------------
  // STYLE UPDATE AND DYNAMIC MARKERS
  //--------------------------------

  useEffect(() => {

    const group = indicatorSeriesRef.current?.[id];
    if (!group || !result) return;

    const styleStr = JSON.stringify(indicatorStyle?.[id] || indicatorStyle?.SUPERSMOOTHER || {});
    if (group._lastStyleStr === styleStr) return;
    group._lastStyleStr = styleStr;

    const style = JSON.parse(styleStr);

    group.oscillator?.applyOptions({
      color: style?.oscillator?.color,
      lineWidth: style?.oscillator?.width,
      visible: style?.oscillator?.visible,
    });

    const fillStyle = style?.oscillator?.oscillatorFill || style?.oscillatorFill;
    if (group.oscillatorFill) {
      group.oscillatorFill.applyOptions({
        topFillColor1: fillStyle?.topFillColor1 || "rgba(0, 255, 0, 0.5)",
        topFillColor2: fillStyle?.topFillColor2 || "rgba(0, 255, 0, 0.05)",
        bottomFillColor1: fillStyle?.bottomFillColor1 || "rgba(255, 20, 147, 0.05)",
        bottomFillColor2: fillStyle?.bottomFillColor2 || "rgba(255, 20, 147, 0.5)",
        visible: style?.oscillator?.visible,
      });
    }

    group.signalLine?.applyOptions({
      color: style?.signalLine?.color,
      lineWidth: style?.signalLine?.width,
      visible: style?.signalLine?.visible,
    });

    group.zeroLine?.applyOptions({
      color: style?.zeroLine?.color,
      lineWidth: style?.zeroLine?.width,
      lineStyle: style?.zeroLine?.lineStyle,
      visible: style?.zeroLine?.visible,
    });

    if (group.histogram) {
      group._recolor = () => {
        const histDataToColor = group.rawData?.histogram || result?.data?.histogram || [];
        if (!histDataToColor.length) return;

        group.histogram.applyOptions({
          visible: style?.histogram?.visible,
        });

        const styledData = histDataToColor.map((d) => {
          const isRising = d.value >= 0;
          const color = d.histogramColor || d.color || (isRising 
            ? (style?.histogram?.pr || style?.histogram?.palette?.pr || "rgba(0,255,127,0.6)")
            : (style?.histogram?.pf || style?.histogram?.palette?.pf || "rgba(255,0,0,0.6)"));
          return { ...d, color };
        });
        group.histogram.setData(styledData);
      };

      group._recolor();
    }

    if (group.oscillator) {
      group._recolorOscillator = () => {
        const lineDataToColor = group.rawData?.oscillator || result?.data?.oscillator || [];
        if (!lineDataToColor.length) return;

        const styledLineData = lineDataToColor.map((d) => {
          const isRising = d.value >= 0;
          return {
            ...d,
            color: d.color || (isRising ? "rgba(0, 255, 0, 1)" : "rgba(255, 20, 147, 1)")
          };
        });
        group.oscillator.setData(styledLineData);
      };
      group._recolorOscillator();
    }

    // if (pane) {
    //   const markers = [
    //     ...(result.data.buySignals || []).map((p) => ({
    //       time: p.time,
    //       position: "belowBar",
    //       color: style?.buySignals?.color || "#00ff00",
    //       shape: "arrowUp",
    //       text: "BUY",
    //     })),
    //     ...(result.data.sellSignals || []).map((p) => ({
    //       time: p.time,
    //       position: "aboveBar",
    //       color: style?.sellSignals?.color || "#ff0000",
    //       shape: "arrowDown",
    //       text: "SELL",
    //     })),
    //     ...(result.data.strongBuySignals || []).map((p) => ({
    //       time: p.time,
    //       position: "belowBar",
    //       color: style?.strongBuySignals?.color || "#00ff7f",
    //       shape: "arrowUp",
    //       text: "STRONG BUY",
    //     })),
    //     ...(result.data.strongSellSignals || []).map((p) => ({
    //       time: p.time,
    //       position: "aboveBar",
    //       color: style?.strongSellSignals?.color || "#800000",
    //       shape: "arrowDown",
    //       text: "STRONG SELL",
    //     })),
    //   ];
    //   
    //   const sortedMarkers = markers.sort((a, b) => a.time - b.time);
    //   
    //   if (!group.markersPrimitive) {
    //     group.markersPrimitive = createSeriesMarkers(pane, sortedMarkers);
    //     pane.attachPrimitive(group.markersPrimitive);
    //   } else {
    //     group.markersPrimitive.setMarkers(sortedMarkers);
    //   }
    // }

  }, [indicatorStyle, result, pane]);

  return null;
}