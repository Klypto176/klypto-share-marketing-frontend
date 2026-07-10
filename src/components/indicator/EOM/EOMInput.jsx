export default function EOMInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  let rows = [];
  if (Array.isArray(response?.data)) {
    rows = response.data;
  } else if (response?.data?.eom) {
    rows = response.data.eom;
  }

  if (!rows.length) {
    console.log("❌ EOM rows empty");
    return;
  }

  const group = indicatorSeriesRef.current?.[instanceId || "EOM"];

  if (!group || !group.eom) {
    console.log("❌ EOM series not ready");
    return;
  }

  const eomData = rows
    .filter((d) => (d.eom != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time),
      value: Number(d.eom ?? d.value),
    }));

  if (!eomData.length) {
    console.log("❌ EOM mapped empty");
    return;
  }

  group.eom.setData([...eomData]); // clone = force refresh

  latestIndicatorValuesRef.current[instanceId || "EOM"] = {
    eom: eomData[eomData.length - 1]?.value ?? null,
  };

  console.log("✅ EOM updated", eomData.length);
}
