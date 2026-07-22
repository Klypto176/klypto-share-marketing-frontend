const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const regression = (points) => {
  const meanX = average(points.map((point) => point.index));
  const meanY = average(points.map((point) => point.price));
  let numerator = 0;
  let denominator = 0;

  points.forEach((point) => {
    const deltaX = point.index - meanX;
    numerator += deltaX * (point.price - meanY);
    denominator += deltaX * deltaX;
  });

  const slope = denominator ? numerator / denominator : 0;
  return { slope, intercept: meanY - slope * meanX };
};

const lineValue = (line, index) => line.intercept + line.slope * index;

const directional = (points, direction) => {
  if (points.length < 2) return false;
  return points.every((point, index) => {
    if (index === 0) return true;
    const delta = point.price - points[index - 1].price;
    return direction === "up" ? delta > 0 : delta < 0;
  });
};

export const findPivotPoints = (candles, depth = 4) => {
  const pivots = [];
  const safeDepth = Math.max(1, Math.floor(Number(depth) || 1));

  for (let index = safeDepth; index < candles.length - safeDepth; index += 1) {
    const candle = candles[index];
    const left = candles.slice(index - safeDepth, index);
    const right = candles.slice(index + 1, index + safeDepth + 1);
    const isHigh =
      left.every((item) => candle.high > item.high) &&
      right.every((item) => candle.high > item.high);
    const isLow =
      left.every((item) => candle.low < item.low) &&
      right.every((item) => candle.low < item.low);

    if (isHigh) {
      pivots.push({ type: "high", index, time: candle.time, price: candle.high });
    }
    if (isLow) {
      pivots.push({ type: "low", index, time: candle.time, price: candle.low });
    }
  }

  return pivots.sort((a, b) => a.index - b.index);
};

const classifyWindow = ({ candles, highs, lows, compressionThreshold }) => {
  const firstIndex = Math.min(highs[0].index, lows[0].index);
  const lastIndex = Math.max(highs.at(-1).index, lows.at(-1).index);
  const upper = regression(highs);
  const lower = regression(lows);
  const startSpread = lineValue(upper, firstIndex) - lineValue(lower, firstIndex);
  const endSpread = lineValue(upper, lastIndex) - lineValue(lower, lastIndex);

  if (startSpread <= 0 || endSpread <= 0) return null;

  const typicalRange = median(
    candles.slice(firstIndex, lastIndex + 1).map((candle) => candle.high - candle.low),
  );
  if (endSpread < typicalRange * 0.2) return null;

  const compression = endSpread / startSpread;
  const rising = upper.slope > 0 && lower.slope > 0;
  const falling = upper.slope < 0 && lower.slope < 0;
  if (!rising && !falling) return null;

  const type = rising
    ? lower.slope > upper.slope && compression <= compressionThreshold
      ? "rising_wedge"
      : "uptrend"
    : Math.abs(upper.slope) > Math.abs(lower.slope) &&
        compression <= compressionThreshold
      ? "falling_wedge"
      : "downtrend";

  const selectedPivots = [...highs, ...lows].sort((a, b) => a.index - b.index);
  const errors = selectedPivots.map((point) => {
    const guide = point.type === "high" ? upper : lower;
    return Math.abs(point.price - lineValue(guide, point.index)) / startSpread;
  });
  const maxError = Math.max(...errors);
  if (maxError > 0.45) return null;

  if (type === "uptrend" || type === "rising_wedge") {
    if (!directional(highs, "up") || !directional(lows, "up")) return null;
  } else if (!directional(highs, "down") || !directional(lows, "down")) {
    return null;
  }

  return {
    id: `${type}-${firstIndex}-${lastIndex}`,
    type,
    startIndex: firstIndex,
    endIndex: lastIndex,
    startTime: candles[firstIndex].time,
    endTime: candles[lastIndex].time,
    upperLine: {
      start: lineValue(upper, firstIndex),
      end: lineValue(upper, lastIndex),
      slope: upper.slope,
    },
    lowerLine: {
      start: lineValue(lower, firstIndex),
      end: lineValue(lower, lastIndex),
      slope: lower.slope,
    },
    highs,
    lows,
    compression,
    score:
      selectedPivots.length * 10 + (1 - compression) * 30 - maxError * 20,
  };
};

export const detectTrendPatterns = (
  candles,
  {
    pivotDepth = 4,
    minTouches = 3,
    lookbackBars = 80,
    compressionThreshold = 0.82,
    maxPatterns = 8,
  } = {},
) => {
  if (!Array.isArray(candles) || candles.length < pivotDepth * 2 + 5) {
    return { pivots: [], patterns: [] };
  }

  const pivots = findPivotPoints(candles, pivotDepth);
  const patterns = [];
  const maxLookback = Math.max(lookbackBars, minTouches * 4);

  // Evaluate windows ending at each confirmed pivot, so historical patterns are
  // retained instead of only evaluating the most recent fixed-size window.
  pivots.forEach((endingPivot) => {
    const windowPivots = pivots.filter(
      (pivot) =>
        pivot.index <= endingPivot.index &&
        endingPivot.index - pivot.index <= maxLookback,
    );
    const highs = windowPivots.filter((pivot) => pivot.type === "high").slice(-minTouches);
    const lows = windowPivots.filter((pivot) => pivot.type === "low").slice(-minTouches);
    if (highs.length < minTouches || lows.length < minTouches) return;

    const candidate = classifyWindow({
      candles,
      highs,
      lows,
      compressionThreshold,
    });
    if (!candidate) return;

    const duplicate = patterns.some(
      (pattern) =>
        pattern.type === candidate.type &&
        Math.abs(pattern.endIndex - candidate.endIndex) <= Math.floor(maxLookback * 0.25),
    );
    if (!duplicate) patterns.push(candidate);
  });

  return {
    pivots,
    patterns: patterns
      .sort((a, b) => b.score - a.score || b.endIndex - a.endIndex)
      .slice(0, maxPatterns)
      .sort((a, b) => a.startIndex - b.startIndex),
  };
};

export const patternLabelMap = {
  uptrend: "Uptrend",
  downtrend: "Downtrend",
  rising_wedge: "Rising Wedge",
  falling_wedge: "Falling Wedge",
};
