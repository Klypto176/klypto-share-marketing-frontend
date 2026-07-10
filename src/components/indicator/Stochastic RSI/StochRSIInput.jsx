export default function STOCHRSIInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  // Handle: flat array OR { candles: [...] } OR { stochRsiK: [...] }
  let rows = [];
  if (Array.isArray(response?.data)) {
    rows = response.data;
  } else if (Array.isArray(response?.data?.candles)) {
    rows = response.data.candles;
  } else if (Array.isArray(response?.data?.stochRsiK)) {
    // separate arrays per series
    const kArr = response.data.stochRsiK;
    const dArr = response.data.stochRsiD || [];
    rows = kArr.map((k, i) => ({
      time: k.time,
      stochRsiK: k.value ?? k.stochRsiK,
      stochRsiD: dArr[i]?.value ?? dArr[i]?.stochRsiD ?? null,
    }));
  }

  if (!rows.length) {
    console.warn("STOCHRSI: no data");

    const emptyResult = {
      data: {
        kData: [],
        dData: [],
      },
      _v: Date.now(),
    };

    if (indicatorSeriesRef?.current) {
      indicatorSeriesRef.current[instanceId || "STOCHRSIData"] = emptyResult;
    }

    return emptyResult;
  }

  const kData = [];
  const dData = [];

  for (let i = 0; i < rows.length; i++) {
    const d = rows[i];
    if (!d?.time) continue;

    const time = Number(d.time) + 19800;

    // ✅ K line
    if (
      d.stochRsiK !== null &&
      d.stochRsiK !== undefined &&
      !isNaN(d.stochRsiK)
    ) {
      kData.push({
        time,
        value: Number(d.stochRsiK),
      });
    }

    // ✅ D line
    if (
      d.stochRsiD !== null &&
      d.stochRsiD !== undefined &&
      !isNaN(d.stochRsiD)
    ) {
      dData.push({
        time,
        value: Number(d.stochRsiD),
      });
    }
  }

  // ✅ FORCE NEW REFERENCES (IMPORTANT)
  const result = {
    data: {
      kData: kData.map((x) => ({ ...x })),
      dData: dData.map((x) => ({ ...x })),
    },
    _v: Date.now(), // 🔥 forces update tracking
  };

  /* ---------------- INIT REF ---------------- */

  if (!indicatorSeriesRef.current) {
    indicatorSeriesRef.current = {};
  }

  if (!indicatorSeriesRef.current[instanceId || "STOCHRSI"]) {
    indicatorSeriesRef.current[instanceId || "STOCHRSI"] = {};
  }

  const group = indicatorSeriesRef.current[instanceId || "STOCHRSI"];

  /* ---------------- SERIES UPDATE ---------------- */

  try {
    if (group.kLine?.setData) {
      group.kLine.setData(result.data.kData);
    } else {
      console.warn("STOCHRSI: kLine series missing");
    }

    if (group.dLine?.setData) {
      group.dLine.setData(result.data.dData);
    } else {
      console.warn("STOCHRSI: dLine series missing");
    }

    // Update level lines so they span the new data range
    if (kData.length > 0) {
      const upper = group.upperBand?._internal_options?.value ?? 80;
      const middle = group.middleBand?._internal_options?.value ?? 50;
      const lower = group.lowerBand?._internal_options?.value ?? 20;

      const makeLevel = (val) => kData.map((p) => ({ time: p.time, value: val }));

      if (group.upperBand?.setData) group.upperBand.setData(makeLevel(upper));
      if (group.middleBand?.setData) group.middleBand.setData(makeLevel(middle));
      if (group.lowerBand?.setData) group.lowerBand.setData(makeLevel(lower));

      const bandData = kData.map((p) => ({ time: p.time, value: upper }));
      if (group.bandBackground?.setData) group.bandBackground.setData(bandData);

      // Update stored kData reference
      group.kData = kData;
    }
  } catch (err) {
    console.error("STOCHRSI: chart update failed", err);
  }

  /* ---------------- STORE RAW ---------------- */

  indicatorSeriesRef.current[instanceId || "STOCHRSIData"] = result.data;

  /* ---------------- LATEST VALUES ---------------- */

  if (!latestIndicatorValuesRef.current) {
    latestIndicatorValuesRef.current = {};
  }

  latestIndicatorValuesRef.current[instanceId || "STOCHRSI"] = {
    kLine: result.data.kData.at(-1)?.value ?? null,
    dLine: result.data.dData.at(-1)?.value ?? null,
  };

  /* ---------------- DEBUG ---------------- */

  console.log("STOCHRSI updated:", {
    rows: rows.length,
    kPoints: result.data.kData.length,
    dPoints: result.data.dData.length,
    last: latestIndicatorValuesRef.current[instanceId || "STOCHRSI"],
    version: result._v,
  });

  return result;
}