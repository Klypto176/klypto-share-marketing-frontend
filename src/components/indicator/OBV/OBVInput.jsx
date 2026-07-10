export default function OBVInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  maType,
  instanceId
) {
  if (!response?.data?.length) return;

  const obvGroup = indicatorSeriesRef.current?.[instanceId || "OBV"];
  if (!obvGroup) return;

  const obv = response.data
    .filter((d) => d.obv != null && d.time != null)
    .map((d) => ({ time: Number(d.time) + 19800, value: Number(d.obv) }));

  const smoothingMA = response.data
    .filter((d) => d.smoothingMA != null && d.time != null)
    .map((d) => ({ time: Number(d.time) + 19800, value: Number(d.smoothingMA) }));

  const bbUpper = response.data
    .filter((d) => d.bbUpper != null && d.time != null)
    .map((d) => ({ time: Number(d.time) + 19800, value: Number(d.bbUpper) }));

  const bbLower = response.data
    .filter((d) => d.bbLower != null && d.time != null)
    .map((d) => ({ time: Number(d.time) + 19800, value: Number(d.bbLower) }));

  // update series
  obvGroup.obv?.setData(obv);

  if (maType !== "none") {
    obvGroup.smoothingMA?.setData(smoothingMA);
  } else {
    obvGroup.smoothingMA?.setData([]);
  }

  if (maType === "SMA + Bollinger Bands") {
    obvGroup.bbUpper?.setData(bbUpper);
    obvGroup.bbLower?.setData(bbLower);
    obvGroup.bbUpperData = bbUpper;
    obvGroup.bbLowerData = bbLower;
  } else {
    obvGroup.bbUpper?.setData([]);
    obvGroup.bbLower?.setData([]);
    obvGroup.bbUpperData = [];
    obvGroup.bbLowerData = [];
  }
  
  obvGroup.redrawCloud?.();

  latestIndicatorValuesRef.current[instanceId || "OBV"] = {
    obv: obv.at(-1)?.value ?? null,
    smoothingMA: smoothingMA.at(-1)?.value ?? null,
    bbUpper: bbUpper.at(-1)?.value ?? null,
    bbLower: bbLower.at(-1)?.value ?? null,
  };
}