const IST_OFFSET = 19800;

export default function SSLInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const rows = Array.isArray(response?.data) ? response.data : [];

  const mapSeries = (key) =>
    rows
      .filter((d) => d[key] != null && d.time != null)
      .map((d) => ({
        time: Number(d.time) + IST_OFFSET,
        value: Number(d[key]),
      }))
      .sort((a, b) => a.time - b.time);

  const baseline = mapSeries("baseline");
  const upperChannel = mapSeries("upperChannel");
  const lowerChannel = mapSeries("lowerChannel");
  const ssl1 = mapSeries("ssl1");
  const ssl2 = mapSeries("ssl2");
  const atrUpper = mapSeries("atrUpper");
  const atrLower = mapSeries("atrLower");

  const indicatorId = instanceId || "SSL_HYBRID";
  const series = indicatorSeriesRef.current?.[indicatorId];

  if (!series) return;

  series.baseline?.setData(baseline);
  series.upperChannel?.setData(upperChannel);
  series.lowerChannel?.setData(lowerChannel);
  series.ssl1?.setData(ssl1);
  series.ssl2?.setData(ssl2);
  series.atrUpper?.setData(atrUpper);
  series.atrLower?.setData(atrLower);

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
