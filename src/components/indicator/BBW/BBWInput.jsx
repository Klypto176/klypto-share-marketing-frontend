export default function BBWInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef
, instanceId) {

  const group = indicatorSeriesRef.current?.[instanceId || "BBW"];
  if (!group) return;

  const bbwData =
    response?.data
      ?.filter((d) => d.bbw != null && d.time != null)
      .map((d) => ({
        time: Number(d.time) + 19800,
        value: Number(d.bbw),
      })) ?? [];

  const highestData =
    response?.data
      ?.filter((d) => d.highestExpansion != null && d.time != null)
      .map((d) => ({
        time: Number(d.time) + 19800,
        value: Number(d.highestExpansion),
      })) ?? [];

  const lowestData =
    response?.data
      ?.filter((d) => d.lowestContraction != null && d.time != null)
      .map((d) => ({
        time: Number(d.time) + 19800,
        value: Number(d.lowestContraction),
      })) ?? [];

  group.bbwLine?.setData(bbwData);
  if (highestData.length) group.highest?.setData(highestData);
  if (lowestData.length) group.lowest?.setData(lowestData);

  latestIndicatorValuesRef.current[instanceId || "BBW"] = {
    bbw: bbwData[bbwData?.length - 1]?.value ?? null,
    highest: highestData[highestData?.length - 1]?.value ?? null,
    lowest: lowestData[lowestData?.length - 1]?.value ?? null,
  };
}