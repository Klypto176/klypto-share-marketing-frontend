const IST_OFFSET = 19800;

const VALUE_KEYS = [
  "compressionScore",
  "smaRibbonDistance",
  "sma_ribbon_distance",
  "SmaRibbonPriceDistanceOscillator",
  "smaRibbonPriceDistanceOscillator",
  "sma_ribbon_price_distance_oscillator",
  "value",
];

function firstNumber(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value === null || value === undefined || value === "") continue;

    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }

  return null;
}

function mapLine(rows, keys) {
  return rows
    .map((d) => ({
      time: Number(d.time) + IST_OFFSET,
      value: firstNumber(d, keys),
    }))
    .filter((d) => Number.isFinite(d.time) && d.value !== null);
}

export default function SmaRibbonDistanceInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId,
) {
  const rows = Array.isArray(response?.data) ? response.data : [];

  const smaRibbonDistance = mapLine(rows, VALUE_KEYS);
  const maximumRibbonDistance = mapLine(rows, ["maximumRibbonDistance"]);
  const priceDistanceFromRibbonCenter = mapLine(rows, [
    "priceDistanceFromRibbonCenter",
  ]);
  const compressionThreshold = mapLine(rows, ["compressionThreshold"]);

  const timeSource =
    smaRibbonDistance.length > 0
      ? smaRibbonDistance
      : maximumRibbonDistance.length > 0
        ? maximumRibbonDistance
        : priceDistanceFromRibbonCenter;

  const thresholdLine =
    compressionThreshold.length > 0
      ? compressionThreshold
      : timeSource.map((d) => ({ time: d.time, value: 80 }));
  const midLine = timeSource.map((d) => ({ time: d.time, value: 50 }));
  const zeroLine = timeSource.map((d) => ({ time: d.time, value: 0 }));

  const indicatorId = instanceId || "SMA_RIBBON_DISTANCE";
  const series = indicatorSeriesRef.current?.[indicatorId];

  if (!series) return;

  series.smaRibbonDistance?.setData(smaRibbonDistance);
  series.maximumRibbonDistance?.setData(maximumRibbonDistance);
  series.priceDistanceFromRibbonCenter?.setData(priceDistanceFromRibbonCenter);
  series.compressionThreshold?.setData(thresholdLine);
  series.midLine?.setData(midLine);
  series.zeroLine?.setData(zeroLine);

  latestIndicatorValuesRef.current[indicatorId] = {
    smaRibbonDistance: smaRibbonDistance.at(-1)?.value ?? null,
    maximumRibbonDistance: maximumRibbonDistance.at(-1)?.value ?? null,
    priceDistanceFromRibbonCenter:
      priceDistanceFromRibbonCenter.at(-1)?.value ?? null,
  };
}
