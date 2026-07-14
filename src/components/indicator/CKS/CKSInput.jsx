export default function CKSInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const longSeries = indicatorSeriesRef.current?.[instanceId || "CKS"]?.long;
  const shortSeries = indicatorSeriesRef.current?.[instanceId || "CKS"]?.short;

  if (!longSeries || !shortSeries) return;

  let rawData = [];
  if (Array.isArray(response?.data)) {
    rawData = response.data;
  } else if (response?.data) {
    if (Array.isArray(response.data.long) || Array.isArray(response.data.short)) {
      // Historical format fallback if needed
      rawData = response.data.long || response.data.short || [];
    } else {
      // Flat object containing stopLong / stopShort
      rawData = [response.data];
    }
  }

  const longRaw = rawData;
  const shortRaw = rawData;

  const longData = longRaw
    .filter((d) => (d.stopLong != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.stopLong ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  const shortData = shortRaw
    .filter((d) => (d.stopShort != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.stopShort ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  if (Array.isArray(response?.data) || Array.isArray(response?.data?.long)) {
    longSeries.setData(longData);
    shortSeries.setData(shortData);
  } else {
    if (longData.length) longSeries.update(longData[0]);
    if (shortData.length) shortSeries.update(shortData[0]);
  }

  latestIndicatorValuesRef.current[instanceId || "CKS"] = {
    long: longData[longData?.length - 1]?.value ?? null,
    short: shortData[shortData?.length - 1]?.value ?? null,
  };
}