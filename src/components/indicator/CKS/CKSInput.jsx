export default function CKSInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const longSeries = indicatorSeriesRef.current?.[instanceId || "CKS"]?.long;
  const shortSeries = indicatorSeriesRef.current?.[instanceId || "CKS"]?.short;

  if (!longSeries || !shortSeries) return;

  const longRaw = Array.isArray(response?.data)
    ? response.data
    : (response?.data?.long || []);

  const shortRaw = Array.isArray(response?.data)
    ? response.data
    : (response?.data?.short || []);

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

  longSeries.setData(longData);
  shortSeries.setData(shortData);

  latestIndicatorValuesRef.current[instanceId || "CKS"] = {
    long: longData[longData?.length - 1]?.value ?? null,
    short: shortData[shortData?.length - 1]?.value ?? null,
  };
}