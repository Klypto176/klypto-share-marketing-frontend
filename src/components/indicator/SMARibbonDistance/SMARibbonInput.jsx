const IST_OFFSET = 19800;

export default function SMARibbonInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const rows = Array.isArray(response?.data)
    ? response.data
    : [];

  const mapData = (key) =>
    rows
      .filter((d) => d[key] != null)
      .map((d) => ({
        time: Number(d.time) + IST_OFFSET,
        value: Number(d[key]),
      }));

  const oscillator = mapData("compressionScore");
  const maxDistance = mapData("maximumRibbonDistance");
  const avgDistance = mapData("averagePairDistance");

  const distance12 = mapData("distance12");
  const distance23 = mapData("distance23");
  const distance34 = mapData("distance34");

  const indicatorId = instanceId || "SMARIBBON";
  const series = indicatorSeriesRef.current?.[indicatorId];

  if (!series) return;

  series.oscillator?.setData(oscillator);
  series.maxDistance?.setData(maxDistance);
  series.avgDistance?.setData(avgDistance);

  series.distance12?.setData(distance12);
  series.distance23?.setData(distance23);
  series.distance34?.setData(distance34);

  latestIndicatorValuesRef.current[indicatorId] = {
    oscillator: oscillator.at(-1)?.value ?? null,
    maxDistance: maxDistance.at(-1)?.value ?? null,
    avgDistance: avgDistance.at(-1)?.value ?? null,
    distance12: distance12.at(-1)?.value ?? null,
    distance23: distance23.at(-1)?.value ?? null,
    distance34: distance34.at(-1)?.value ?? null,
  };
}