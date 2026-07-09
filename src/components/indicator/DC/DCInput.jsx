export default function DCInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef
, instanceId) {

  const rows = Array.isArray(response?.data) ? response.data : [];

  /* ================= FORMAT DATA ================= */

  const upperData = rows
    .filter((d) => d.upper != null && d.time != null)
    .map((d) => ({
      time: Number(d.time),
      value: Number(d.upper),
    }))
    .sort((a, b) => a.time - b.time);

  const basisData = rows
    .filter((d) => d.basis != null && d.time != null)
    .map((d) => ({
      time: Number(d.time),
      value: Number(d.basis),
    }))
    .sort((a, b) => a.time - b.time);

  const lowerData = rows
    .filter((d) => d.lower != null && d.time != null)
    .map((d) => ({
      time: Number(d.time),
      value: Number(d.lower),
    }))
    .sort((a, b) => a.time - b.time);

  /* ================= HOVER VALUES ================= */

  latestIndicatorValuesRef.current[instanceId || "DC"] = {
    upper: upperData[upperData?.length - 1]?.value,
    basis: basisData[basisData?.length - 1]?.value,
    lower: lowerData[lowerData?.length - 1]?.value,
  };

  /* ================= STORE RESULT ================= */

  const group = indicatorSeriesRef.current[instanceId || "DC"];
  if (group) {
    group.upper?.setData(upperData);
    group.basis?.setData(basisData);
    group.lower?.setData(lowerData);

    group.upperData = upperData;
    group.lowerData = lowerData;
    group.redrawCloud?.();
    
    group.result = {
      data: {
        upper: upperData,
        basis: basisData,
        lower: lowerData,
      },
    };
  } else {
    indicatorSeriesRef.current[instanceId || "DC"] = {
      result: {
        data: {
          upper: upperData,
          basis: basisData,
          lower: lowerData,
        },
      }
    };
  }
}