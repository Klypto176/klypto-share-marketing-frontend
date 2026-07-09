export default function MFIInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  let rows = [];
  if (Array.isArray(response?.data)) {
    rows = response.data;
  } else if (response?.data?.mfi) {
    rows = response.data.mfi;
  }

  const group = indicatorSeriesRef.current?.[instanceId || "MFI"];
  if (!group) return;

  const mfiData = rows
    .filter((d) => (d.value != null || d.mfi != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.value ?? d.mfi),
    }));

  group.mfiLine?.setData([...mfiData]);

  latestIndicatorValuesRef.current[instanceId || "MFI"] = {
    mfi: mfiData[mfiData.length - 1]?.value ?? null,
  };
}
