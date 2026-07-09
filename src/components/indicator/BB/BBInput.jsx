export default function BBInput(
  response,
  indicatorSeriesRef,
  latestIndicatorValuesRef,
  instanceId
) {
  const group = indicatorSeriesRef.current?.[instanceId || "BB"];
  if (!group) return;

  const upperRaw = Array.isArray(response?.data) ? response.data : (response?.data?.upper || []);
  const lowerRaw = Array.isArray(response?.data) ? response.data : (response?.data?.lower || []);
  const basisRaw = Array.isArray(response?.data) ? response.data : (response?.data?.basis || []);

  const upper = upperRaw
    .filter((d) => (d.upper != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.upper ?? d.value),
    }));

  const lower = lowerRaw
    .filter((d) => (d.lower != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.lower ?? d.value),
    }));

  const basis = basisRaw
    .filter((d) => (d.basis != null || d.value != null) && d.time != null)
    .map((d) => ({
      time: Number(d.time) + 19800,
      value: Number(d.basis ?? d.value),
    }));

  group?.upper?.setData(upper);
  group?.lower?.setData(lower);
  group?.basis?.setData(basis);

  if (group) {
    group.upperData = upper;
    group.lowerData = lower;
    group.redrawCloud?.();
  }

  latestIndicatorValuesRef.current[instanceId || "BB"] = {
    upper: upper[upper?.length - 1]?.value ?? null,
    lower: lower[lower?.length - 1]?.value ?? null,
    basis: basis[basis?.length - 1]?.value ?? null,
  };
}
