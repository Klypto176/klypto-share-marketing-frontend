export default function AroonInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  if (!indicatorSeriesRef.current[instanceId || "AROON"]) {
    indicatorSeriesRef.current[instanceId || "AROON"] = {};
  }
  const series = indicatorSeriesRef.current[instanceId || "AROON"];
  if (!series.aroonUp || !series.aroonDown) return;

  let rawData = [];
  if (Array.isArray(response?.data)) {
    rawData = response.data;
  } else if (response?.data) {
    if (Array.isArray(response.data.aroonUp) || Array.isArray(response.data.aroonUpSeries)) {
      rawData = response.data.aroonUp || response.data.aroonUpSeries || [];
    } else {
      rawData = [response.data];
    }
  }

  const upSeries = rawData
    .filter((d) => (d.aroonUp != null || d.up != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.aroonUp ?? d.up ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  const downSeries = rawData
    .filter((d) => (d.aroonDown != null || d.down != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.aroonDown ?? d.down ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  if (Array.isArray(response?.data) || Array.isArray(response?.data?.aroonUp)) {
    series.aroonUp.setData(upSeries);
    series.aroonDown.setData(downSeries);
  } else {
    if (upSeries.length) series.aroonUp.update(upSeries[0]);
    if (downSeries.length) series.aroonDown.update(downSeries[0]);
  }

  latestIndicatorValuesRef.current[instanceId || "AROON"] = {
    aroonUp: upSeries[upSeries?.length - 1]?.value,
    aroonDown: downSeries[downSeries?.length - 1]?.value,
  };
}
