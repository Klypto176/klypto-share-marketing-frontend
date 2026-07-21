export default function DEMAInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  let rows = [];
  if (Array.isArray(response?.data)) {
    rows = response.data;
  } else if (response?.data?.dema) {
    rows = response.data.dema;
  }

  const series = indicatorSeriesRef.current?.[instanceId || "DEMA"];
  if (!series?.dema) return;

  const demaData = rows
    .filter((d) => (d?.dema != null || d?.value != null) && d?.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.dema ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  /* ================= UPDATE SERIES ================= */

  series.dema.setData(demaData);

  /* ================= STORE HOVER VALUE ================= */

  latestIndicatorValuesRef.current[instanceId || "DEMA"] = {
    dema: demaData[demaData.length - 1]?.value,
  };
}