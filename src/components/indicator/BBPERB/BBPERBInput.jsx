export default function BBPERBInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId,
) {
  const group = indicatorSeriesRef?.current?.[instanceId || "BBPERB"];
  if (!group) return;

  const rawData = Array.isArray(response?.data)
    ? response.data
    : (response?.data?.percentB || response?.data?.bbperb || []);

  const percentBData = rawData
    .filter((d) => (d.percentB != null || d.bbperb != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.percentB ?? d.bbperb ?? d.value),
    }))
    .sort((a, b) => a.time - b.time);

  if (!percentBData.length) return;

  group?.percentB?.setData(percentBData);

  // Also update the level lines so they span the new data range
  const levels = group?._levels || { overbought: 1, middle: 0.5, oversold: 0 };
  const makeLevel = (val) => percentBData.map((d) => ({ time: d.time, value: val }));
  
  group?.overbought?.setData(makeLevel(levels.overbought));
  group?.middleBand?.setData(makeLevel(levels.middle));
  group?.oversold?.setData(makeLevel(levels.oversold));
  
  group?.overboughtBg?.setData(percentBData.map((d) => ({ time: d.time, value: 2 })));
  group?.middleBg?.setData(makeLevel(levels.overbought));
  group?.oversoldBg?.setData(makeLevel(-1));

  if (latestIndicatorValuesRef?.current) {
    latestIndicatorValuesRef.current[instanceId || "BBPERB"] = {
      percentB: percentBData[percentBData?.length - 1]?.value ?? null,
    };
  }
}
