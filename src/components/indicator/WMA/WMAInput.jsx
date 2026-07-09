export default function WMAInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  let rows = [];
  if (Array.isArray(response?.data)) {
    rows = response.data;
  } else if (response?.data?.wma) {
    rows = response.data.wma;
  }

  const series = indicatorSeriesRef.current?.[instanceId || "WMA"];
  if (!series) return;

  const wmaData = rows
    .filter((d) => (d.wma != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.wma ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  /* ================= UPDATE WMA ================= */

  series.wma?.setData(wmaData);

  /* ================= UPDATE HOVER VALUES ================= */

  latestIndicatorValuesRef.current[instanceId || "WMA"] = {
    wma: wmaData[wmaData.length - 1]?.value,
  };

  /* ================= STORE RESULT ================= */

  indicatorSeriesRef.current[instanceId || "WMA"].result = {
    data: {
      wma: wmaData,
    },
  };
}