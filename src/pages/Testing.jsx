import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  LineSeries,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import Papa from "papaparse";
import {
  detectTrendPatterns,
  findPivotPoints,
  patternLabelMap,
} from "../util/patternDetection";

const overlayPalette = {
  uptrend: { upper: "#16a34a", lower: "#22c55e", marker: "#16a34a" },
  downtrend: { upper: "#dc2626", lower: "#f97316", marker: "#dc2626" },
  rising_wedge: { upper: "#7c3aed", lower: "#a855f7", marker: "#7c3aed" },
  falling_wedge: { upper: "#2563eb", lower: "#06b6d4", marker: "#2563eb" },
};

const defaultSettings = {
  pivotDepth: 4,
  minTouches: 3,
  lookbackBars: 80,
  compressionThreshold: 0.82,
  maxPatterns: 6,
  projectionBars: 8,
};

const parseCandles = (rows) =>
  Array.from(
    new Map(
      rows
    .filter(
      (row) =>
        (row.datetime || row.date || row.time) &&
        row.open != null &&
        row.high != null &&
        row.low != null &&
        row.close != null,
    )
    .map((row) => ({
      time: Math.floor(
        new Date(row.datetime || row.date || row.time).getTime() / 1000,
      ),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
    }))
    .filter((row) =>
      [row.time, row.open, row.high, row.low, row.close].every(Number.isFinite),
    )
    .sort((a, b) => a.time - b.time)
    .map((candle) => [candle.time, candle]),
    ),
  ).map(([, candle]) => candle);

const PatternSummaryCard = ({ title, value, hint }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background:
        "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.75))",
      boxShadow: "0 18px 45px rgba(2, 6, 23, 0.28)",
    }}
  >
    <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>
      {title}
    </div>
    <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "#f8fafc" }}>
      {value}
    </div>
    <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>{hint}</div>
  </div>
);

export default function PatternScannerPage() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const overlaySeriesRef = useRef([]);
  const markerApiRef = useRef(null);

  const [candles, setCandles] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 760,
      layout: {
        background: { color: "#020617" },
        textColor: "#cbd5e1",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: {
        vertLine: { color: "rgba(148, 163, 184, 0.35)" },
        horzLine: { color: "rgba(148, 163, 184, 0.35)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    Papa.parse("/BOSLIM.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        const parsedCandles = parseCandles(data);
        if (!parsedCandles.length) {
          setLoadState("error");
          setLoadError(errors?.[0]?.message || "No valid historical OHLC candles were found.");
          return;
        }
        setCandles(parsedCandles);
        candleSeries.setData(parsedCandles);
        chart.timeScale().fitContent();
        setLoadState("ready");
      },
      error: (error) => {
        setLoadState("error");
        setLoadError(error?.message || "Unable to load historical candles.");
      },
    });

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  const detection = useMemo(
    () => detectTrendPatterns(candles, settings),
    [candles, settings],
  );

  const visiblePivots = useMemo(
    () => findPivotPoints(candles, settings.pivotDepth).slice(-30),
    [candles, settings.pivotDepth],
  );

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    overlaySeriesRef.current.forEach((series) => {
      try {
        chart.removeSeries(series);
      } catch {}
    });
    overlaySeriesRef.current = [];

    detection.patterns.forEach((pattern) => {
      const colors = overlayPalette[pattern.type];

      const upperSeries = chart.addSeries(LineSeries, {
        color: colors.upper,
        lineWidth: 2,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      const projectionIndex = Math.min(
        candles.length - 1,
        pattern.endIndex + settings.projectionBars,
      );
      const projectionTime = candles[projectionIndex]?.time || pattern.endTime;
      const upperEnd =
        pattern.upperLine.end +
        pattern.upperLine.slope * (projectionIndex - pattern.endIndex);
      upperSeries.setData([
        { time: pattern.startTime, value: pattern.upperLine.start },
        { time: projectionTime, value: upperEnd },
      ]);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: colors.lower,
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      const lowerEnd =
        pattern.lowerLine.end +
        pattern.lowerLine.slope * (projectionIndex - pattern.endIndex);
      lowerSeries.setData([
        { time: pattern.startTime, value: pattern.lowerLine.start },
        { time: projectionTime, value: lowerEnd },
      ]);

      overlaySeriesRef.current.push(upperSeries, lowerSeries);
    });

    const markers = [
      ...visiblePivots.map((pivot) => ({
        time: pivot.time,
        position: pivot.type === "high" ? "aboveBar" : "belowBar",
        shape: "circle",
        color: pivot.type === "high" ? "#f59e0b" : "#38bdf8",
        text: pivot.type === "high" ? "PH" : "PL",
      })),
      ...detection.patterns.map((pattern) => ({
        time: pattern.endTime,
        position:
          pattern.type === "downtrend" || pattern.type === "rising_wedge"
            ? "aboveBar"
            : "belowBar",
        shape:
          pattern.type === "uptrend" || pattern.type === "falling_wedge"
            ? "arrowUp"
            : "arrowDown",
        color: overlayPalette[pattern.type].marker,
        text: patternLabelMap[pattern.type],
      })),
    ];

    if (!markerApiRef.current) {
      markerApiRef.current = createSeriesMarkers(candleSeries, markers);
      candleSeries.attachPrimitive(markerApiRef.current);
    } else {
      markerApiRef.current.setMarkers(markers);
    }
  }, [candles, detection.patterns, settings.projectionBars, visiblePivots]);

  const patternCounts = useMemo(
    () =>
      detection.patterns.reduce((accumulator, pattern) => {
        accumulator[pattern.type] = (accumulator[pattern.type] || 0) + 1;
        return accumulator;
      }, {}),
    [detection.patterns],
  );

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(14,165,233,0.14), transparent 28%), #020617",
        color: "#e2e8f0",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 20,
        }}
      >
        <aside
          style={{
            padding: 20,
            borderRadius: 24,
            border: "1px solid rgba(148, 163, 184, 0.16)",
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
            boxShadow: "0 24px 80px rgba(2, 6, 23, 0.3)",
            alignSelf: "start",
            position: "sticky",
            top: 20,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: "0.18em", color: "#38bdf8" }}>
            PATTERN LAB
          </div>
          <h1
            style={{
              margin: "8px 0 10px",
              fontSize: 28,
              lineHeight: 1.1,
              color: "#f8fafc",
            }}
          >
            Wedge and trend overlay scanner
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
            Detects pivot-based uptrends, downtrends, rising wedges, and falling
            wedges, then draws them directly over the candles.
          </p>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 20,
            }}
          >
            <PatternSummaryCard
              title="Detected"
              value={detection.patterns.length}
              hint="Current overlays on the chart"
            />
            <PatternSummaryCard
              title="Pivot Highs/Lows"
              value={detection.pivots.length}
              hint="Fractal pivots used by the detector"
            />
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
            {[
              {
                key: "pivotDepth",
                label: "Pivot depth",
                min: 2,
                max: 12,
                step: 1,
              },
              {
                key: "minTouches",
                label: "Touches per side",
                min: 2,
                max: 5,
                step: 1,
              },
              {
                key: "lookbackBars",
                label: "Lookback bars",
                min: 30,
                max: 160,
                step: 5,
              },
              {
                key: "compressionThreshold",
                label: "Wedge compression",
                min: 0.55,
                max: 1,
                step: 0.01,
              },
              {
                key: "maxPatterns",
                label: "Max overlays",
                min: 1,
                max: 12,
                step: 1,
              },
              {
                key: "projectionBars",
                label: "Projection bars",
                min: 0,
                max: 20,
                step: 1,
              },
            ].map((control) => (
              <label key={control.key} style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#cbd5e1",
                  }}
                >
                  <span>{control.label}</span>
                  <span>{settings[control.key]}</span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={settings[control.key]}
                  onChange={(event) =>
                    updateSetting(
                      control.key,
                      Number.parseFloat(event.target.value),
                    )
                  }
                />
              </label>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 10 }}>
              Pattern count
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(patternLabelMap).map(([key, label]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: overlayPalette[key].marker }}>
                    {patternCounts[key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <section
            style={{
              padding: 18,
              borderRadius: 24,
              border: "1px solid rgba(148, 163, 184, 0.16)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.74))",
              boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
            }}
            >
              {loadState !== "ready" && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "10px 12px",
                    borderRadius: 10,
                    color: loadState === "error" ? "#fecaca" : "#bae6fd",
                    background:
                      loadState === "error"
                        ? "rgba(127,29,29,0.35)"
                        : "rgba(14,116,144,0.25)",
                    fontSize: 13,
                  }}
                >
                  {loadState === "loading"
                    ? "Loading historical candles..."
                    : loadError}
                </div>
              )}
              <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
                  BOSLIM candle scan
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                  Dashed lines show resistance. Solid lines show support.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: 12,
                }}
              >
                {Object.entries(patternLabelMap).map(([key, label]) => (
                  <span
                    key={key}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(15, 23, 42, 0.72)",
                      border: `1px solid ${overlayPalette[key].marker}55`,
                      color: overlayPalette[key].marker,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div
              ref={chartContainerRef}
              style={{
                width: "100%",
                height: 760,
                borderRadius: 20,
                overflow: "hidden",
              }}
            />
          </section>

          <section
            style={{
              padding: 18,
              borderRadius: 24,
              border: "1px solid rgba(148, 163, 184, 0.16)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.74))",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
              Active patterns
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {detection.patterns.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: 14 }}>
                  No patterns matched the current sensitivity settings.
                </div>
              ) : (
                detection.patterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(15, 23, 42, 0.72)",
                      border: `1px solid ${overlayPalette[pattern.type].marker}33`,
                    }}
                  >
                    <span
                      style={{
                        color: overlayPalette[pattern.type].marker,
                        fontWeight: 700,
                      }}
                    >
                      {patternLabelMap[pattern.type]}
                    </span>
                    <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                      Bar range {pattern.startIndex} to {pattern.endIndex}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>
                      Score {pattern.score.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
