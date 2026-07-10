export default function NVIInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const nviRaw = Array.isArray(response?.data) ? response.data : (response?.data?.nvi || []);
  const emaRaw = Array.isArray(response?.data) ? response.data : (response?.data?.nviEma || response?.data?.pviEma || []);

  const nviSeries = indicatorSeriesRef.current?.[instanceId || "NVI"]?.nvi;
  const emaSeries = indicatorSeriesRef.current?.[instanceId || "NVI"]?.nviEma;

  if (!nviSeries && !emaSeries) return;

  const nviData = nviRaw
    .filter((d) => (d.nvi != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.nvi ?? d.value),
    }));

  const emaData = emaRaw
    .filter((d) => (d.nviEma != null || d.value != null || d.pviEma != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.nviEma ?? d.pviEma ?? d.value),
    }));

  if (nviSeries) nviSeries.setData(nviData);
  if (emaSeries) emaSeries.setData(emaData);

  latestIndicatorValuesRef.current[instanceId || "NVI"] = {
    nvi: nviData[nviData.length - 1]?.value ?? null,
    nviEma: emaData[emaData.length - 1]?.value ?? null,
  };
}
