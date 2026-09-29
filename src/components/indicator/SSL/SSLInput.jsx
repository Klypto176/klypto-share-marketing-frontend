const IST_OFFSET = 19800;

const BULLISH = "#00c3ff"; // Blue
const BEARISH = "#ff0062"; // Pink
const NEUTRAL = "#666666";

const getBaselineColor = (close, upperChannel, lowerChannel) => {
  if (close == null || upperChannel == null || lowerChannel == null) return NEUTRAL;
  if (close > upperChannel) return BULLISH;
  if (close < lowerChannel) return BEARISH;
  return NEUTRAL;
};

const getSsl1Color = (close, ssl1) => {
  if (close == null || ssl1 == null) return NEUTRAL;
  if (close > ssl1) return BULLISH;
  if (close < ssl1) return BEARISH;
  return NEUTRAL;
};

const getSsl2Color = (close, ssl2, baseline, atr) => {
  if (close == null || ssl2 == null || baseline == null || atr == null) return NEUTRAL;
  const atr_crit = 0.9;
  const upper_half = atr * atr_crit + close;
  const lower_half = close - atr * atr_crit;
  const buy_inatr = lower_half < ssl2;
  const sell_inatr = upper_half > ssl2;
  const buy_cont = close > baseline && close > ssl2;
  const sell_cont = close < baseline && close < ssl2;
  const buy_atr = buy_inatr && buy_cont;
  const sell_atr = sell_inatr && sell_cont;
  if (buy_atr) return BULLISH;
  if (sell_atr) return BEARISH;
  return NEUTRAL;
};

export default function SSLInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const data = response?.data || response?.result || {};

  const getRawArray = (key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    return [];
  };

  const baselineArr = getRawArray("baseline");
  const upperArr = getRawArray("upperChannel");
  const lowerArr = getRawArray("lowerChannel");
  const ssl1Arr = getRawArray("ssl1");
  const ssl2Arr = getRawArray("ssl2");
  const atrUpperArr = getRawArray("atrUpper");
  const atrLowerArr = getRawArray("atrLower");

  const upperByTime = new Map(upperArr.map((p) => [Number(p.time), p.value ?? p.upperChannel]));
  const lowerByTime = new Map(lowerArr.map((p) => [Number(p.time), p.value ?? p.lowerChannel]));
  const baselineByTime = new Map(baselineArr.map((p) => [Number(p.time), p.value ?? p.baseline]));

  // Build time -> close map
  const closeMap = new Map();
  [...baselineArr, ...upperArr, ...lowerArr, ...ssl1Arr, ...ssl2Arr].forEach((point) => {
    if (point?.time != null && point?.close != null) {
      closeMap.set(Number(point.time), point.close);
    }
  });

  const mapSeries = (arr, key, colorFn) =>
    arr
      .filter((d) => (d[key] != null || d.value != null) && d.time != null)
      .map((d) => {
        const rawTime = Number(d.time);
        const time = rawTime > 2000000000 ? rawTime : rawTime + IST_OFFSET;
        const val = Number(d[key] ?? d.value);
        const close = closeMap.get(rawTime) ?? d.close ?? null;
        const color = colorFn ? colorFn(d, val, close) : undefined;
        return {
          time,
          value: val,
          ...(color ? { color } : {}),
        };
      })
      .sort((a, b) => a.time - b.time);

  const baseline = mapSeries(baselineArr, "baseline", (d, val, close) =>
    getBaselineColor(close, upperByTime.get(Number(d.time)), lowerByTime.get(Number(d.time)))
  );

  const upperChannel = mapSeries(upperArr, "upperChannel", (d, val, close) =>
    getBaselineColor(close, upperByTime.get(Number(d.time)), lowerByTime.get(Number(d.time)))
  );

  const lowerChannel = mapSeries(lowerArr, "lowerChannel", (d, val, close) =>
    getBaselineColor(close, upperByTime.get(Number(d.time)), lowerByTime.get(Number(d.time)))
  );

  const ssl1 = mapSeries(ssl1Arr, "ssl1", (d, val, close) =>
    getSsl1Color(close, val)
  );

  const ssl2 = mapSeries(ssl2Arr, "ssl2", (d, val, close) =>
    getSsl2Color(close, val, baselineByTime.get(Number(d.time)), d.atr)
  );

  const atrUpper = mapSeries(atrUpperArr, "atrUpper");
  const atrLower = mapSeries(atrLowerArr, "atrLower");

  const indicatorId = instanceId || "SSL_HYBRID";
  const series = indicatorSeriesRef.current?.[indicatorId];

  if (!series) return;

  if (baseline.length) series.baseline?.setData(baseline);
  if (upperChannel.length) series.upperChannel?.setData(upperChannel);
  if (lowerChannel.length) series.lowerChannel?.setData(lowerChannel);
  if (ssl1.length) series.ssl1?.setData(ssl1);
  if (ssl2.length) series.ssl2?.setData(ssl2);
  if (atrUpper.length) series.atrUpper?.setData(atrUpper);
  if (atrLower.length) series.atrLower?.setData(atrLower);

  latestIndicatorValuesRef.current[indicatorId] = {
    baseline: baseline.at(-1)?.value ?? null,
    upperChannel: upperChannel.at(-1)?.value ?? null,
    lowerChannel: lowerChannel.at(-1)?.value ?? null,
    ssl1: ssl1.at(-1)?.value ?? null,
    ssl2: ssl2.at(-1)?.value ?? null,
    atrUpper: atrUpper.at(-1)?.value ?? null,
    atrLower: atrLower.at(-1)?.value ?? null,
  };
}

