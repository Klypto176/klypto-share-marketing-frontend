export default function AroonInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const upRaw = Array.isArray(response?.data) ? response.data : (response?.data?.aroonUp || response?.data?.aroonUpSeries || []);
  const downRaw = Array.isArray(response?.data) ? response.data : (response?.data?.aroonDown || response?.data?.aroonDownSeries || []);

  const upSeries = upRaw
    .filter((d) => (d.aroonUp != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.aroonUp ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  const downSeries = downRaw
    .filter((d) => (d.aroonDown != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.aroonDown ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  if (!indicatorSeriesRef.current[instanceId || "AROON"]) {
    indicatorSeriesRef.current[instanceId || "AROON"] = {};
  }

  const series = indicatorSeriesRef.current[instanceId || "AROON"];

  series.aroonUp?.setData(upSeries);
  series.aroonDown?.setData(downSeries);

  latestIndicatorValuesRef.current[instanceId || "AROON"] = {
    aroonUp: upSeries[upSeries?.length - 1]?.value,
    aroonDown: downSeries[downSeries?.length - 1]?.value,
  };

  series.result = {
    data: {
      aroonUp: upSeries,
      aroonDown: downSeries,
    },
  };
}
