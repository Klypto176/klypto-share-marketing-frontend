import React, { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { IoCloseSharp } from "react-icons/io5";
import { FaBookOpen, FaPlay, FaSave, FaTrash, FaSyncAlt } from "react-icons/fa";
import { Spinner } from "../tradingModals/Spinner";
import chartlabGuideMarkdown from "../../assets/chartlab-build-guide.md?raw";

export const STRATEGY_EDITOR_TEMPLATES = [
  {
    id: "chartlab-close-line",
    label: "ChartLab Close Line",
    code: `from chartlab import indicator, plot

@indicator(name="Close Line", pane="overlay")
def run(ctx):
    plot(ctx.close, title="Close", color="#3b82f6", width=2)`,
  },
  {
    id: "chartlab-ema-cloud",
    label: "ChartLab EMA Cloud",
    code: `from chartlab import indicator, plot, fill

@indicator(name="EMA Cloud", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=9)
    slow = ctx.ta.ema(ctx.close, length=21)

    fast_plot = plot(fast, title="EMA 9", color="#22c55e", width=2)
    slow_plot = plot(slow, title="EMA 21", color="#f59e0b", width=2)

    fill(fast_plot, slow_plot, colorTop="rgba(34,197,94,0.18)", colorBottom="rgba(245,158,11,0.10)")`,
  },
  {
    id: "chartlab-rsi-pane",
    label: "ChartLab RSI Pane",
    code: `from chartlab import indicator, input_int, plot, hline

@indicator(name="RSI Pane", pane="oscillator")
def run(ctx):
    length = input_int("Length", 14, min=2, max=100)
    rsi_value = ctx.ta.rsi(ctx.close, length)

    plot(rsi_value, title="RSI", color="#8b5cf6", width=2)
    hline(70, "Overbought", color="#ef4444")
    hline(30, "Oversold", color="#22c55e")`,
  },
  {
    id: "chartlab-macd-histogram",
    label: "ChartLab MACD Histogram",
    code: `from chartlab import indicator, plot

@indicator(name="MACD Histogram", pane="oscillator")
def run(ctx):
    macd_data = ctx.ta.macd(ctx.close, fast=12, slow=26, signal=9)

    plot(macd_data["macd"], title="MACD", color="#3b82f6", width=2)
    plot(macd_data["signal"], title="Signal", color="#f59e0b", width=2)
    plot(
        macd_data["histogram"],
        title="Histogram",
        type="histogram",
        renderers=["line", "histogram", "bar"],
        color="#22c55e",
        base=0,
    )`,
  },
  {
    id: "chartlab-volume-bars",
    label: "ChartLab Volume Bars",
    code: `from chartlab import indicator, plot

@indicator(name="Volume Bars", pane="volume")
def run(ctx):
    volume_avg = ctx.ta.sma(ctx.volume, length=20)

    plot(
        ctx.volume,
        title="Volume",
        type="bar",
        renderers=["bar", "histogram"],
        color="#64748b",
        base=0,
    )
    plot(volume_avg, title="Volume Avg", color="#f59e0b", width=2)`,
  },
  {
    id: "chartlab-area-trend",
    label: "ChartLab Area Trend",
    code: `from chartlab import indicator, plot_area

@indicator(name="Area Trend", pane="overlay")
def run(ctx):
    trend = ctx.ta.ema(ctx.close, length=34)
    plot_area(
        trend,
        title="EMA 34 Area",
        color="#06b6d4",
        lineColor="#0891b2",
        topColor="rgba(6,182,212,0.28)",
        bottomColor="rgba(6,182,212,0.05)",
        width=2,
    )`,
  },
  {
    id: "chartlab-step-levels",
    label: "ChartLab Step Levels Fill",
    code: `from chartlab import indicator, plot_step, fill, hline

@indicator(name="Step Levels", pane="oscillator")
def run(ctx):
    highest_high = ctx.ta.highest(ctx.high, length=10)
    lowest_low = ctx.ta.lowest(ctx.low, length=10)

    high_plot = plot_step(highest_high, title="10 High", color="#ef4444", width=2)
    low_plot = plot_step(lowest_low, title="10 Low", color="#22c55e", width=2)

    fill(
        high_plot,
        low_plot,
        colorTop="rgba(239,68,68,0.12)",
        colorBottom="rgba(34,197,94,0.12)",
    )

    hline((ctx.close[-1] if len(ctx.close) else 0), "Last Close", color="#94a3b8")`,
  },
  {
    id: "chartlab-scatter-signals",
    label: "ChartLab Scatter Signals",
    code: `from chartlab import indicator, plot_scatter

@indicator(name="Scatter Signals", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=5)
    slow = ctx.ta.ema(ctx.close, length=13)

    fast_cross = ctx.ta.crossover(fast, slow)
    slow_cross = ctx.ta.crossunder(fast, slow)

    fast_points = [close if active else None for close, active in zip(ctx.close, fast_cross)]
    slow_points = [close if active else None for close, active in zip(ctx.close, slow_cross)]

    plot_scatter(fast_points, title="Fast Cross", color="#22c55e")
    plot_scatter(slow_points, title="Slow Cross", color="#ef4444")`,
  },
  {
    id: "chartlab-atr-bands",
    label: "ChartLab ATR Bands",
    code: `from chartlab import indicator, input_int, input_float, plot, fill

@indicator(name="ATR Bands", pane="overlay")
def run(ctx):
    atr_length = input_int("ATR Length", 14, min=1, max=100)
    multiplier = input_float("ATR Multiplier", 2.0, min=0.1, max=10.0, step=0.1)

    basis = ctx.ta.ema(ctx.close, length=20)
    atr_value = ctx.ta.atr(ctx.high, ctx.low, ctx.close, length=atr_length)

    upper = basis + (atr_value * multiplier)
    lower = basis - (atr_value * multiplier)

    basis_plot = plot(basis, title="Basis", color="#f8fafc", width=2)
    upper_plot = plot(upper, title="Upper", color="#f59e0b", width=1)
    lower_plot = plot(lower, title="Lower", color="#22c55e", width=1)

    fill(upper_plot, lower_plot, colorTop="rgba(245,158,11,0.12)", colorBottom="rgba(34,197,94,0.12)")`,
  },
  {
    id: "chartlab-dual-renderer",
    label: "ChartLab Renderer Switch",
    code: `from chartlab import indicator, input_select, plot

@indicator(name="Renderer Switch", pane="oscillator")
def run(ctx):
    renderer = input_select("Renderer", "histogram", ["line", "histogram", "bar", "area"])
    values = ctx.ta.rsi(ctx.close, 6)

    plot(
        values,
        title="Directional Score",
        type=renderer,
        renderers=["line", "histogram", "bar", "area"],
        color="#22c55e",
        width=2,
    )`,
  },
  {
    id: "chartlab-obv-sma",
    label: "ChartLab OBV + SMA",
    code: `from chartlab import indicator, input_int, plot

@indicator(name="OBV with SMA", pane="volume")
def run(ctx):
    ma_length = input_int("OBV SMA Length", 21, min=1, max=200)

    obv_value = ctx.ta.obv(ctx.close, ctx.volume)
    obv_ma = ctx.ta.sma(obv_value, length=ma_length)

    plot(obv_value, title="OBV", color="#60a5fa", width=2)
    plot(obv_ma, title="OBV SMA", color="#f59e0b", width=2)`,
  },
  {
    id: "chartlab-pvo-histogram",
    label: "ChartLab PVO Histogram",
    code: `from chartlab import indicator, plot, hline

@indicator(name="PVO Histogram", pane="volume")
def run(ctx):
    volume_fast = ctx.ta.ema(ctx.volume, length=12)
    volume_slow = ctx.ta.ema(ctx.volume, length=26)
    pvo = ((volume_fast - volume_slow) / volume_slow) * 100
    signal_line = ctx.ta.ema(pvo, length=9)
    histogram = pvo - signal_line

    plot(
        histogram,
        title="Histogram",
        type="histogram",
        renderers=["histogram", "bar", "line"],
        color="#22c55e",
        base=0,
    )
    plot(pvo, title="PVO", color="#3b82f6", width=2)
    plot(signal_line, title="Signal", color="#f59e0b", width=2)
    hline(0, "Zero", color="#94a3b8")`,
  },
  {
    id: "chartlab-cmf-zero-line",
    label: "ChartLab CMF Zero Line",
    code: `from chartlab import indicator, plot, hline

@indicator(name="CMF Zero Line", pane="oscillator")
def run(ctx):
    cmf = ctx.ta.cmf(ctx.high, ctx.low, ctx.close, ctx.volume, length=20)

    plot(cmf, title="CMF", color="#facc15", width=2)
    hline(0, "Zero", color="#94a3b8")`,
  },
  {
    id: "chartlab-mfi-bands",
    label: "ChartLab MFI Bands",
    code: `from chartlab import indicator, plot, hline

@indicator(name="MFI Bands", pane="oscillator")
def run(ctx):
    mfi = ctx.ta.mfi(ctx.high, ctx.low, ctx.close, ctx.volume, length=14)

    plot(mfi, title="MFI", color="#14b8a6", width=2)
    hline(80, "Overbought", color="#ef4444")
    hline(50, "Middle", color="#94a3b8")
    hline(20, "Oversold", color="#22c55e")`,
  },
  {
    id: "chartlab-williams-r",
    label: "ChartLab Williams %R",
    code: `from chartlab import indicator, plot, hline

@indicator(name="Williams %R", pane="oscillator")
def run(ctx):
    wpr = ctx.ta.williams_r(ctx.high, ctx.low, ctx.close, length=14)

    plot(wpr, title="WPR", color="#a78bfa", width=2)
    hline(-20, "Upper Band", color="#ef4444")
    hline(-50, "Middle", color="#94a3b8")
    hline(-80, "Lower Band", color="#22c55e")`,
  },
  {
    id: "chartlab-stochrsi",
    label: "ChartLab Stoch RSI",
    code: `from chartlab import indicator, plot, hline, fill

@indicator(name="Stoch RSI", pane="oscillator")
def run(ctx):
    stoch = ctx.ta.stochrsi(ctx.close, length=14, signal_length=3)
    k_line = stoch["k"]
    d_line = stoch["d"]

    k_plot = plot(k_line, title="%K", color="#22c55e", width=2)
    d_plot = plot(d_line, title="%D", color="#f59e0b", width=2)

    fill(
        k_plot,
        d_plot,
        colorTop="rgba(34,197,94,0.08)",
        colorBottom="rgba(245,158,11,0.08)",
    )

    hline(80, "Upper", color="#ef4444")
    hline(20, "Lower", color="#22c55e")`,
  },
  {
    id: "chartlab-supertrend-overlay",
    label: "ChartLab SuperTrend Overlay",
    code: `from chartlab import indicator, plot

@indicator(name="SuperTrend Overlay", pane="overlay")
def run(ctx):
    supertrend_data = ctx.ta.supertrend(ctx.high, ctx.low, ctx.close, length=10, multiplier=3.0)
    trend_line = supertrend_data["supertrend"]

    plot(trend_line, title="SuperTrend", color="#22c55e", width=2)`,
  },
  {
    id: "chartlab-sma-ribbon",
    label: "ChartLab SMA Ribbon",
    code: `from chartlab import indicator, plot, fill

@indicator(name="SMA Ribbon", pane="overlay")
def run(ctx):
    sma_20 = ctx.ta.sma(ctx.close, length=20)
    sma_50 = ctx.ta.sma(ctx.close, length=50)
    sma_100 = ctx.ta.sma(ctx.close, length=100)

    fast_plot = plot(sma_20, title="SMA 20", color="#22c55e", width=2)
    slow_plot = plot(sma_50, title="SMA 50", color="#f59e0b", width=2)
    plot(sma_100, title="SMA 100", color="#60a5fa", width=2)

    fill(fast_plot, slow_plot, colorTop="rgba(34,197,94,0.10)", colorBottom="rgba(245,158,11,0.08)")`,
  },
  {
    id: "chartlab-bollinger-cloud",
    label: "ChartLab Bollinger Cloud",
    code: `from chartlab import indicator, plot, fill

@indicator(name="Bollinger Cloud", pane="overlay")
def run(ctx):
    bb = ctx.ta.bollinger(ctx.close, length=20, mult=2.0)

    upper_plot = plot(bb["upper"], title="Upper Band", color="#ef4444", width=1)
    basis_plot = plot(bb["basis"], title="Basis", color="#f8fafc", width=2)
    lower_plot = plot(bb["lower"], title="Lower Band", color="#22c55e", width=1)

    fill(upper_plot, lower_plot, colorTop="rgba(239,68,68,0.08)", colorBottom="rgba(34,197,94,0.08)")
    fill(basis_plot, lower_plot, colorTop="rgba(255,255,255,0.02)", colorBottom="rgba(34,197,94,0.05)")`,
  },
  {
    id: "chartlab-advanced-wedge-overlay",
    label: "Advanced Wedge Overlay",
    code: `from chartlab import indicator, plot, fill, plot_scatter, input_int, input_float


@indicator(name="Advanced Historical Wedge Overlay", pane="overlay")
def run(ctx):
    bb_length = input_int("BB Length", 20, min=5, max=200)
    bb_mult = input_float("BB StdDev", 2.5, min=0.5, max=10.0, step=0.5)
    pivot_len = input_int("Pivot Length", 5, min=2, max=30)
    min_span = input_int("Min Pattern Bars", 12, min=4, max=200)
    max_span = input_int("Max Pattern Bars", 80, min=10, max=400)
    edge_window = input_int("Edge Sync Bars", 8, min=1, max=40)
    min_inner_touches = input_int("Min Inner Touches", 1, min=0, max=10)
    candle_tolerance_pct = input_float("Containment Tolerance %", 0.08, min=0.01, max=0.5, step=0.01)
    slope_tolerance = input_float("Slope Tolerance", 0.15, min=0.01, max=5.0, step=0.01)
    min_compression_ratio = input_float("Min Compression Ratio", 0.12, min=0.02, max=0.9, step=0.01)
    max_break_fraction = input_float("Max Break Fraction", 0.18, min=0.0, max=0.5, step=0.01)
    max_body_offset = input_float("Max Body Offset", 0.55, min=0.10, max=1.0, step=0.01)

    n = len(ctx.close)
    if n == 0:
        return

    basis = ctx.ta.sma(ctx.close, length=bb_length)
    dev = ctx.ta.rolling_std(ctx.close, length=bb_length)

    upper_band = [
        None if basis[i] is None or dev[i] is None else basis[i] + (dev[i] * bb_mult)
        for i in range(n)
    ]
    lower_band = [
        None if basis[i] is None or dev[i] is None else basis[i] - (dev[i] * bb_mult)
        for i in range(n)
    ]

    pivot_highs = [None] * n
    pivot_lows = [None] * n

    for center in range(pivot_len, n - pivot_len):
        high_window = ctx.high[center - pivot_len : center + pivot_len + 1]
        low_window = ctx.low[center - pivot_len : center + pivot_len + 1]

        center_high = ctx.high[center]
        center_low = ctx.low[center]

        if center_high == max(high_window) and high_window.count(center_high) == 1:
            confirm_bar = center + pivot_len
            if confirm_bar < n:
                pivot_highs[confirm_bar] = {"bar": center, "price": center_high}

        if center_low == min(low_window) and low_window.count(center_low) == 1:
            confirm_bar = center + pivot_len
            if confirm_bar < n:
                pivot_lows[confirm_bar] = {"bar": center, "price": center_low}

    highs = []
    lows = []
    pivot_high_marks = [None] * n
    pivot_low_marks = [None] * n

    for i in range(n):
        if pivot_highs[i] is not None:
            highs.append(pivot_highs[i])
            pivot_high_marks[pivot_highs[i]["bar"]] = pivot_highs[i]["price"]
        if pivot_lows[i] is not None:
            lows.append(pivot_lows[i])
            pivot_low_marks[pivot_lows[i]["bar"]] = pivot_lows[i]["price"]

    wedge_upper = [None] * n
    wedge_lower = [None] * n
    chosen_high_marks = [None] * n
    chosen_low_marks = [None] * n

    def line_params(x1, y1, x2, y2):
        m = (y2 - y1) / max(x2 - x1, 1)
        c = y1 - (m * x1)
        return m, c

    def line_value(m, c, x):
        return (m * x) + c

    def count_near_touches(points, left_bar, right_bar, m, c, tol):
        count = 0
        for point in points:
            if left_bar < point["bar"] < right_bar:
                projected = line_value(m, c, point["bar"])
                if abs(point["price"] - projected) <= tol:
                    count += 1
        return count

    def band_touched_high(point):
        band_value = upper_band[point["bar"]]
        return band_value is not None and point["price"] >= band_value

    def pivot_set_respects_lines(points, left_bar, right_bar, m, c, tol, is_highs):
        for point in points:
            if left_bar <= point["bar"] <= right_bar:
                projected = line_value(m, c, point["bar"])
                if is_highs and point["price"] > projected + tol:
                    return False
                if (not is_highs) and point["price"] < projected - tol:
                    return False
        return True

    def candles_stay_inside(start_bar, end_bar, high_m, high_c, low_m, low_c, tol):
        outside_count = 0
        total_count = 0
        for bar in range(start_bar, end_bar + 1):
            upper_value = line_value(high_m, high_c, bar)
            lower_value = line_value(low_m, low_c, bar)
            if upper_value <= lower_value:
                return False
            total_count += 1
            if ctx.high[bar] > upper_value + tol or ctx.low[bar] < lower_value - tol:
                outside_count += 1
        if total_count == 0:
            return False
        return (outside_count / total_count) <= max_break_fraction

    def edge_violation_fraction(start_bar, end_bar, high_m, high_c, low_m, low_c, tol):
        outside_count = 0
        total_count = 0
        for bar in range(start_bar, end_bar + 1):
            upper_value = line_value(high_m, high_c, bar)
            lower_value = line_value(low_m, low_c, bar)
            if upper_value <= lower_value:
                return 1.0
            total_count += 1
            if ctx.high[bar] > upper_value + tol or ctx.low[bar] < lower_value - tol:
                outside_count += 1
        if total_count == 0:
            return 1.0
        return outside_count / total_count

    def line_respected_by_anchors(points, start_bar, end_bar, m, c, tol, is_highs):
        touches = []
        for point in points:
            if start_bar <= point["bar"] <= end_bar:
                projected = line_value(m, c, point["bar"])
                delta = point["price"] - projected
                if is_highs:
                    if delta > tol:
                        return None
                    if abs(delta) <= tol:
                        touches.append(point["bar"])
                else:
                    if delta < -tol:
                        return None
                    if abs(delta) <= tol:
                        touches.append(point["bar"])
        return touches

    def alternating_touch_score(high_touch_bars, low_touch_bars):
        sequence = []
        for bar in high_touch_bars:
            sequence.append((bar, "H"))
        for bar in low_touch_bars:
            sequence.append((bar, "L"))
        sequence.sort()
        if len(sequence) < 4:
            return 0
        alternations = 0
        for idx in range(1, len(sequence)):
            if sequence[idx][1] != sequence[idx - 1][1]:
                alternations += 1
        return alternations

    def body_position_score(start_bar, end_bar, high_m, high_c, low_m, low_c):
        score = 0.0
        counted = 0
        for bar in range(start_bar, end_bar + 1):
            upper_value = line_value(high_m, high_c, bar)
            lower_value = line_value(low_m, low_c, bar)
            gap = upper_value - lower_value
            if gap <= 0:
                return None
            midpoint = lower_value + (gap / 2.0)
            close_value = ctx.close[bar]
            score += abs(close_value - midpoint) / gap
            counted += 1
        if counted == 0:
            return None
        return score / counted

    candidates = []

    for hi1_idx in range(len(highs)):
        h1 = highs[hi1_idx]
        if not band_touched_high(h1):
            continue

        for hi2_idx in range(hi1_idx + 1, len(highs)):
            h2 = highs[hi2_idx]
            span = h2["bar"] - h1["bar"]
            if span < min_span:
                continue
            if span > max_span:
                break
            if not band_touched_high(h2):
                continue

            high_m, high_c = line_params(h1["bar"], h1["price"], h2["bar"], h2["price"])
            if h2["price"] > h1["price"] + (slope_tolerance * span):
                continue

            inner_lows = [point for point in lows if h1["bar"] < point["bar"] < h2["bar"]]
            if len(inner_lows) < 2:
                continue

            for lo1_idx in range(len(inner_lows)):
                l1 = inner_lows[lo1_idx]
                for lo2_idx in range(lo1_idx + 1, len(inner_lows)):
                    l2 = inner_lows[lo2_idx]
                    if l2["bar"] <= l1["bar"]:
                        continue
                    if l2["price"] <= l1["price"]:
                        continue
                    if abs(l1["bar"] - h1["bar"]) > edge_window:
                        continue
                    if abs(l2["bar"] - h2["bar"]) > edge_window:
                        continue

                    low_m, low_c = line_params(l1["bar"], l1["price"], l2["bar"], l2["price"])
                    if low_m <= 0:
                        continue
                    if low_m <= high_m:
                        continue

                    start_bar = min(h1["bar"], l1["bar"])
                    end_bar = max(h2["bar"], l2["bar"])
                    start_gap = line_value(high_m, high_c, start_bar) - line_value(low_m, low_c, start_bar)
                    end_gap = line_value(high_m, high_c, end_bar) - line_value(low_m, low_c, end_bar)

                    if start_gap <= 0 or end_gap <= 0:
                        continue
                    if end_gap >= start_gap:
                        continue
                    compression_ratio = (start_gap - end_gap) / start_gap
                    tolerance = max(0.0001, start_gap * candle_tolerance_pct)

                    if not pivot_set_respects_lines(highs, start_bar, end_bar, high_m, high_c, tolerance, True):
                        continue
                    if not pivot_set_respects_lines(lows, start_bar, end_bar, low_m, low_c, tolerance, False):
                        continue
                    high_touch_bars = line_respected_by_anchors(highs, start_bar, end_bar, high_m, high_c, tolerance, True)
                    low_touch_bars = line_respected_by_anchors(lows, start_bar, end_bar, low_m, low_c, tolerance, False)
                    if high_touch_bars is None or low_touch_bars is None:
                        continue

                    high_touches = count_near_touches(highs, h1["bar"], h2["bar"], high_m, high_c, tolerance)
                    low_touches = count_near_touches(lows, l1["bar"], l2["bar"], low_m, low_c, tolerance)
                    if high_touches + 1 < min_inner_touches or low_touches + 1 < min_inner_touches:
                        continue
                    if len(high_touch_bars) < 2 or len(low_touch_bars) < 2:
                        continue

                    alternation_score = alternating_touch_score(high_touch_bars, low_touch_bars)

                    average_body_offset = body_position_score(start_bar, end_bar, high_m, high_c, low_m, low_c)
                    if average_body_offset is None:
                        continue
                    break_fraction = edge_violation_fraction(start_bar, end_bar, high_m, high_c, low_m, low_c, tolerance)
                    containment_ok = candles_stay_inside(start_bar, end_bar, high_m, high_c, low_m, low_c, tolerance)

                    quality_penalty = 0.0
                    if compression_ratio < min_compression_ratio:
                        quality_penalty += (min_compression_ratio - compression_ratio) * 120.0
                    if alternation_score < 2:
                        quality_penalty += (2 - alternation_score) * 18.0
                    if average_body_offset > max_body_offset:
                        quality_penalty += (average_body_offset - max_body_offset) * 90.0
                    if break_fraction > max_break_fraction:
                        quality_penalty += (break_fraction - max_break_fraction) * 160.0

                    if compression_ratio <= 0.04:
                        continue
                    if average_body_offset >= 0.80:
                        continue
                    if break_fraction >= 0.35:
                        continue
                    if (not containment_ok) and quality_penalty > 28.0:
                        continue

                    compression = start_gap - end_gap
                    edge_alignment_penalty = abs(l1["bar"] - h1["bar"]) + abs(l2["bar"] - h2["bar"])
                    score = (
                        span * 2.0 +
                        compression * 12.0 +
                        high_touches * 10.0 +
                        low_touches * 10.0 -
                        abs(high_m) * 25.0 -
                        edge_alignment_penalty * 4.0 +
                        alternation_score * 8.0 -
                        average_body_offset * 35.0 -
                        quality_penalty
                    )

                    candidates.append(
                        {
                            "score": score,
                            "h1": h1,
                            "h2": h2,
                            "l1": l1,
                            "l2": l2,
                            "high_m": high_m,
                            "high_c": high_c,
                            "low_m": low_m,
                            "low_c": low_c,
                            "start_bar": start_bar,
                            "end_bar": end_bar,
                        }
                    )

    selected_patterns = []
    occupied_until = -1

    if candidates:
        candidates.sort(key=lambda item: (item["end_bar"], item["start_bar"], -item["score"]))
        current_bucket = []
        current_end = None

        for candidate in candidates:
            candidate_end = candidate["end_bar"]
            if current_end is None or candidate_end == current_end:
                current_bucket.append(candidate)
                current_end = candidate_end
                continue

            current_bucket.sort(key=lambda item: item["score"], reverse=True)
            chosen = current_bucket[0]
            if chosen["start_bar"] > occupied_until:
                selected_patterns.append(chosen)
                occupied_until = chosen["end_bar"]

            current_bucket = [candidate]
            current_end = candidate_end

        if current_bucket:
            current_bucket.sort(key=lambda item: item["score"], reverse=True)
            chosen = current_bucket[0]
            if chosen["start_bar"] > occupied_until:
                selected_patterns.append(chosen)

    for pattern in selected_patterns:
        for bar in range(pattern["start_bar"], pattern["end_bar"] + 1):
            wedge_upper[bar] = line_value(pattern["high_m"], pattern["high_c"], bar)
            wedge_lower[bar] = line_value(pattern["low_m"], pattern["low_c"], bar)

        chosen_high_marks[pattern["h1"]["bar"]] = pattern["h1"]["price"]
        chosen_high_marks[pattern["h2"]["bar"]] = pattern["h2"]["price"]
        chosen_low_marks[pattern["l1"]["bar"]] = pattern["l1"]["price"]
        chosen_low_marks[pattern["l2"]["bar"]] = pattern["l2"]["price"]

    upper_band_plot = plot(upper_band, title="BB Upper", color="#f59e0b", width=1)
    basis_plot = plot(basis, title="BB Mid", color="#94a3b8", width=1)
    lower_band_plot = plot(lower_band, title="BB Lower", color="#60a5fa", width=1)

    wedge_upper_plot = plot(wedge_upper, title="Wedge Upper", color="#ef4444", width=2)
    wedge_lower_plot = plot(wedge_lower, title="Wedge Lower", color="#22c55e", width=2)

    fill(
        wedge_upper_plot,
        wedge_lower_plot,
        colorTop="rgba(239,68,68,0.08)",
        colorBottom="rgba(34,197,94,0.08)",
    )

    plot_scatter(pivot_high_marks, title="Pivot Highs", color="rgba(245,158,11,0.30)")
    plot_scatter(pivot_low_marks, title="Pivot Lows", color="rgba(96,165,250,0.30)")
    plot_scatter(chosen_high_marks, title="Chosen Highs", color="#ef4444")
    plot_scatter(chosen_low_marks, title="Chosen Lows", color="#22c55e")`,
  },
  {
    id: "chartlab-vwap-trend",
    label: "ChartLab VWAP Trend",
    code: `from chartlab import indicator, plot

@indicator(name="VWAP Trend", pane="overlay")
def run(ctx):
    vwap_line = ctx.ta.vwap(ctx.high, ctx.low, ctx.close, ctx.volume)
    ema_21 = ctx.ta.ema(ctx.close, length=21)

    plot(vwap_line, title="VWAP", color="#f59e0b", width=2)
    plot(ema_21, title="EMA 21", color="#3b82f6", width=2)`,
  },
  {
    id: "chartlab-ssl-channel",
    label: "ChartLab SSL Hybrid",
    code: `from chartlab import indicator, input_int, input_float, input_bool, input_color, input_select
from chartlab import plot, plot_scatter, fill, barcolor

@indicator(name="SSL Hybrid", pane="overlay")
def run(ctx):
    baseline_length = input_int("Baseline Length", 60, min=1, max=300)
    ssl2_length = input_int("SSL2 Length", 5, min=1, max=100)
    exit_length = input_int("Exit Length", 15, min=1, max=100)
    atr_length = input_int("ATR Length", 14, min=1, max=100)
    channel_mult = input_float("Channel Multiplier", 0.2, min=0.01, max=5.0, step=0.01)
    continuation_atr = input_float("Continuation ATR", 0.9, min=0.1, max=5.0, step=0.1)
    baseline_mode = input_select("Baseline MA", "HMA", ["HMA", "EMA", "SMA"])
    ssl2_mode = input_select("SSL2 MA", "EMA", ["EMA", "HMA", "SMA"])
    exit_mode = input_select("Exit MA", "HMA", ["HMA", "EMA", "SMA"])
    show_continuation = input_bool("Show Continuation", True)

    bull_color = input_color("Bull Candle Color", "#00c3ff")
    bear_color = input_color("Bear Candle Color", "#ff0062")
    neutral_color = input_color("Neutral Candle Color", "#666666")
    baseline_color = input_color("Baseline Color", "#f8fafc")
    ssl1_color = input_color("SSL1 Color", "#60a5fa")
    ssl2_color = input_color("SSL2 Color", "#f59e0b")
    exit_color = input_color("Exit Color", "#c084fc")

    def ma(mode, values, length):
        if mode == "SMA":
            return ctx.ta.sma(values, length=length)
        if mode == "EMA":
            return ctx.ta.ema(values, length=length)
        return ctx.ta.hma(values, length=length)

    baseline = ma(baseline_mode, ctx.close, baseline_length)
    atr = ctx.ta.atr(ctx.high, ctx.low, ctx.close, length=atr_length)
    avg_range = ctx.ta.ema(atr, length=baseline_length)
    upper_channel = baseline + (avg_range * channel_mult)
    lower_channel = baseline - (avg_range * channel_mult)

    ssl1_high = ma(baseline_mode, ctx.high, baseline_length)
    ssl1_low = ma(baseline_mode, ctx.low, baseline_length)
    ssl2_high = ma(ssl2_mode, ctx.high, ssl2_length)
    ssl2_low = ma(ssl2_mode, ctx.low, ssl2_length)
    exit_high = ma(exit_mode, ctx.high, exit_length)
    exit_low = ma(exit_mode, ctx.low, exit_length)

    def build_ssl_state(close_values, high_values, low_values):
        states = []
        last_state = 0
        for close_value, high_value, low_value in zip(close_values, high_values, low_values):
            if high_value is None or low_value is None:
                states.append(last_state)
                continue
            if close_value > high_value:
                last_state = 1
            elif close_value < low_value:
                last_state = -1
            states.append(last_state)
        return states

    def build_ssl_line(states, high_values, low_values):
        return [
            high_value if state < 0 else low_value
            for state, high_value, low_value in zip(states, high_values, low_values)
        ]

    ssl1_state = build_ssl_state(ctx.close, ssl1_high, ssl1_low)
    ssl2_state = build_ssl_state(ctx.close, ssl2_high, ssl2_low)
    exit_state = build_ssl_state(ctx.close, exit_high, exit_low)

    ssl1 = build_ssl_line(ssl1_state, ssl1_high, ssl1_low)
    ssl2 = build_ssl_line(ssl2_state, ssl2_high, ssl2_low)
    ssl_exit = build_ssl_line(exit_state, exit_high, exit_low)

    baseline_bull = [
        (upper_value is not None) and (close_value > upper_value)
        for close_value, upper_value in zip(ctx.close, upper_channel)
    ]
    baseline_bear = [
        (lower_value is not None) and (close_value < lower_value)
        for close_value, lower_value in zip(ctx.close, lower_channel)
    ]
    neutral_state = [
        (not bull) and (not bear)
        for bull, bear in zip(baseline_bull, baseline_bear)
    ]

    baseline_line_color = [
        bull_color if bull else bear_color if bear else baseline_color
        for bull, bear in zip(baseline_bull, baseline_bear)
    ]
    ssl1_line_color = [
        bull_color if state > 0 else bear_color if state < 0 else ssl1_color
        for state in ssl1_state
    ]
    ssl2_line_color = [
        bull_color if state > 0 else bear_color if state < 0 else ssl2_color
        for state in ssl2_state
    ]
    exit_line_color = [
        bull_color if state > 0 else bear_color if state < 0 else exit_color
        for state in exit_state
    ]

    baseline_plot = plot(
        baseline,
        title="Baseline",
        color=baseline_color,
        lineColor=baseline_line_color,
        width=2,
    )
    upper_plot = plot(upper_channel, title="Upper Channel", color="#22c55e", width=1)
    lower_plot = plot(lower_channel, title="Lower Channel", color="#ef4444", width=1)
    ssl1_plot = plot(
        ssl1,
        title="SSL1",
        color=ssl1_color,
        lineColor=ssl1_line_color,
        width=2,
    )
    ssl2_plot = plot(
        ssl2,
        title="SSL2",
        color=ssl2_color,
        lineColor=ssl2_line_color,
        width=2,
    )
    exit_plot = plot(
        ssl_exit,
        title="SSL Exit",
        color=exit_color,
        lineColor=exit_line_color,
        width=2,
    )

    fill(
        upper_plot,
        lower_plot,
        colorTop="rgba(180,180,180,0.10)",
        colorBottom="rgba(110,110,110,0.08)",
    )
    fill(
        ssl1_plot,
        ssl2_plot,
        colorTop="rgba(96,165,250,0.08)",
        colorBottom="rgba(245,158,11,0.08)",
    )
    fill(
        baseline_plot,
        exit_plot,
        colorTop="rgba(255,255,255,0.03)",
        colorBottom="rgba(192,132,252,0.04)",
    )

    barcolor(baseline_bull, bull_color)
    barcolor(baseline_bear, bear_color)
    barcolor(neutral_state, neutral_color)

    upper_half = [
        None if atr_value is None else close_value + (atr_value * continuation_atr)
        for close_value, atr_value in zip(ctx.close, atr)
    ]
    lower_half = [
        None if atr_value is None else close_value - (atr_value * continuation_atr)
        for close_value, atr_value in zip(ctx.close, atr)
    ]

    continuation_buy = [
        (
            show_continuation
            and base_value is not None
            and ssl2_value is not None
            and lower_value is not None
            and close_value > base_value
            and close_value > ssl2_value
            and lower_value < ssl2_value
        )
        for close_value, base_value, ssl2_value, lower_value in zip(ctx.close, baseline, ssl2, lower_half)
    ]
    continuation_sell = [
        (
            show_continuation
            and base_value is not None
            and ssl2_value is not None
            and upper_value is not None
            and close_value < base_value
            and close_value < ssl2_value
            and upper_value > ssl2_value
        )
        for close_value, base_value, ssl2_value, upper_value in zip(ctx.close, baseline, ssl2, upper_half)
    ]

    continuation_buy_points = [
        ssl2_value if active else None
        for active, ssl2_value in zip(continuation_buy, ssl2)
    ]
    continuation_sell_points = [
        ssl2_value if active else None
        for active, ssl2_value in zip(continuation_sell, ssl2)
    ]

    plot(
        upper_half,
        title="Continuation Upper",
        color="rgba(0,195,255,0.45)",
        width=1,
        lineStyle="dotted",
    )
    plot(
        lower_half,
        title="Continuation Lower",
        color="rgba(255,0,98,0.45)",
        width=1,
        lineStyle="dotted",
    )
    plot_scatter(continuation_buy_points, title="Continuation Buy", color=bull_color)
    plot_scatter(continuation_sell_points, title="Continuation Sell", color=bear_color)`,
  },
  {
    id: "chartlab-ad-line",
    label: "ChartLab A/D Line",
    code: `from chartlab import indicator, plot, input_int

@indicator(name="Accumulation Distribution", pane="volume")
def run(ctx):
    smooth_length = input_int("Smooth", 10, min=1, max=100)
    ad_line = ctx.ta.accdist(ctx.high, ctx.low, ctx.close, ctx.volume)
    ad_sma = ctx.ta.sma(ad_line, length=smooth_length)

    plot(ad_line, title="A/D", color="#60a5fa", width=2)
    plot(ad_sma, title="A/D SMA", color="#f59e0b", width=2)`,
  },
  {
    id: "chartlab-force-histogram",
    label: "ChartLab Force Histogram",
    code: `from chartlab import indicator, plot, hline

@indicator(name="Force Histogram", pane="histogram")
def run(ctx):
    force_value = ctx.ta.force_index(ctx.close, ctx.volume, length=13)
    smooth_force = ctx.ta.ema(force_value, length=5)

    plot(
        force_value,
        title="Force",
        type="histogram",
        renderers=["histogram", "bar", "line"],
        color="#22c55e",
        base=0,
    )
    plot(smooth_force, title="Smooth Force", color="#f59e0b", width=2)
    hline(0, "Zero", color="#94a3b8")`,
  },
  {
    id: "chartlab-cci-reversal",
    label: "ChartLab CCI Reversal",
    code: `from chartlab import indicator, plot, hline

@indicator(name="CCI Reversal", pane="oscillator")
def run(ctx):
    cci = ctx.ta.cci(ctx.high, ctx.low, ctx.close, length=20)

    plot(cci, title="CCI", color="#38bdf8", width=2)
    hline(100, "Upper", color="#ef4444")
    hline(0, "Zero", color="#94a3b8")
    hline(-100, "Lower", color="#22c55e")`,
  },
  {
    id: "chartlab-adx-trend",
    label: "ChartLab ADX Trend",
    code: `from chartlab import indicator, plot, hline

@indicator(name="ADX Trend", pane="oscillator")
def run(ctx):
    adx_data = ctx.ta.adx(ctx.high, ctx.low, ctx.close, length=14)

    plot(adx_data["adx"], title="ADX", color="#f59e0b", width=2)
    plot(adx_data["plus_di"], title="+DI", color="#22c55e", width=2)
    plot(adx_data["minus_di"], title="-DI", color="#ef4444", width=2)
    hline(20, "Trend Threshold", color="#94a3b8")`,
  },
  {
    id: "chartlab-aroon-oscillator",
    label: "ChartLab Aroon Oscillator",
    code: `from chartlab import indicator, plot, fill, hline

@indicator(name="Aroon Oscillator", pane="oscillator")
def run(ctx):
    aroon = ctx.ta.aroon(ctx.high, ctx.low, length=25)
    up_plot = plot(aroon["up"], title="Aroon Up", color="#22c55e", width=2)
    down_plot = plot(aroon["down"], title="Aroon Down", color="#ef4444", width=2)

    fill(up_plot, down_plot, colorTop="rgba(34,197,94,0.08)", colorBottom="rgba(239,68,68,0.08)")
    hline(50, "Middle", color="#94a3b8")`,
  },
  {
    id: "chartlab-psar-overlay",
    label: "ChartLab PSAR Overlay",
    code: `from chartlab import indicator, plot_scatter

@indicator(name="PSAR Overlay", pane="overlay")
def run(ctx):
    psar = ctx.ta.psar(ctx.high, ctx.low, step=0.02, max_step=0.2)

    plot_scatter(psar, title="PSAR", color="#f472b6")`,
  },
  {
    id: "chartlab-heikin-overlay",
    label: "ChartLab Heikin Overlay",
    code: `from chartlab import indicator, plot_candles

@indicator(name="Heikin Overlay", pane="overlay")
def run(ctx):
    smoothed_open = ctx.ta.ema(ctx.open, length=3)
    smoothed_high = ctx.ta.ema(ctx.high, length=3)
    smoothed_low = ctx.ta.ema(ctx.low, length=3)
    smoothed_close = ctx.ta.ema(ctx.close, length=3)

    plot_candles(
        smoothed_open,
        smoothed_high,
        smoothed_low,
        smoothed_close,
        title="Smoothed Candles",
        upColor="#22c55e",
        downColor="#ef4444",
    )`,
  },
  {
    id: "chartlab-regime-pressure",
    label: "ChartLab Regime Pressure",
    code: `from chartlab import indicator, input_int, input_float, plot, fill, hline

@indicator(name="Regime Pressure", pane="oscillator")
def run(ctx):
    trend_length = input_int("Trend EMA", 34, min=5, max=200)
    momentum_length = input_int("Momentum RSI", 14, min=2, max=100)
    volatility_length = input_int("ATR Length", 14, min=2, max=100)
    pressure_threshold = input_float("Pressure Trigger", 12.0, min=1.0, max=50.0, step=0.5)

    trend = ctx.ta.ema(ctx.close, length=trend_length)
    rsi = ctx.ta.rsi(ctx.close, length=momentum_length)
    atr = ctx.ta.atr(ctx.high, ctx.low, ctx.close, length=volatility_length)
    atr_basis = ctx.ta.ema(atr, length=volatility_length)

    trend_bias = ((ctx.close - trend) / trend) * 100
    momentum_bias = rsi - 50
    volatility_bias = ((atr / atr_basis) - 1) * 100

    pressure = trend_bias + (momentum_bias * 0.8) + (volatility_bias * 1.2)
    smooth_pressure = ctx.ta.ema(pressure, length=5)

    pressure_plot = plot(pressure, title="Pressure", color="#22c55e", width=2)
    smooth_plot = plot(smooth_pressure, title="Pressure EMA", color="#f59e0b", width=2)
    fill(pressure_plot, smooth_plot, colorTop="rgba(34,197,94,0.10)", colorBottom="rgba(245,158,11,0.08)")

    hline(pressure_threshold, "Bull Trigger", color="#22c55e")
    hline(0, "Balance", color="#94a3b8")
    hline(-pressure_threshold, "Bear Trigger", color="#ef4444")`,
  },
  {
    id: "chartlab-liquidity-pulse",
    label: "ChartLab Liquidity Pulse",
    code: `from chartlab import indicator, input_int, input_float, plot, fill

@indicator(name="Liquidity Pulse", pane="overlay")
def run(ctx):
    pulse_length = input_int("Pulse Lookback", 20, min=5, max=100)
    volume_length = input_int("Volume EMA", 21, min=2, max=100)
    expansion_mult = input_float("Expansion Mult", 1.4, min=0.5, max=4.0, step=0.1)

    range_mid = (ctx.high + ctx.low) / 2
    range_bias = ctx.close - range_mid
    volume_trend = ctx.ta.ema(ctx.volume, length=volume_length)
    atr = ctx.ta.atr(ctx.high, ctx.low, ctx.close, length=14)
    base = ctx.ta.ema(ctx.close, length=pulse_length)

    liquidity_pulse = ctx.ta.ema(range_bias * ctx.volume, length=5)
    expansion = (ctx.high - ctx.low) > (atr * expansion_mult)
    heavy_volume = ctx.volume > volume_trend

    upper_band = base + (atr * 1.5)
    lower_band = base - (atr * 1.5)

    base_plot = plot(base, title="Pulse Base", color="#38bdf8", width=2)
    upper_plot = plot(upper_band, title="Upper Liquidity Band", color="#f59e0b", width=1)
    lower_plot = plot(lower_band, title="Lower Liquidity Band", color="#22c55e", width=1)
    fill(upper_plot, lower_plot, colorTop="rgba(245,158,11,0.08)", colorBottom="rgba(34,197,94,0.08)")`,
  },
  {
    id: "chartlab-fractal-drift",
    label: "ChartLab Fractal Drift",
    code: `from chartlab import indicator, input_int, plot, plot_step, fill

@indicator(name="Fractal Drift", pane="overlay")
def run(ctx):
    drift_length = input_int("Drift Window", 13, min=5, max=80)
    trend_length = input_int("Trend Window", 55, min=10, max=200)

    local_high = ctx.ta.highest(ctx.high, length=drift_length)
    local_low = ctx.ta.lowest(ctx.low, length=drift_length)
    drift_mid = (local_high + local_low) / 2
    anchor = ctx.ta.ema(drift_mid, length=trend_length)

    high_plot = plot_step(local_high, title="Drift High", color="#ef4444", width=2)
    low_plot = plot_step(local_low, title="Drift Low", color="#22c55e", width=2)
    anchor_plot = plot(anchor, title="Anchor", color="#60a5fa", width=2)

    fill(high_plot, low_plot, colorTop="rgba(239,68,68,0.08)", colorBottom="rgba(34,197,94,0.08)")
    fill(anchor_plot, low_plot, colorTop="rgba(96,165,250,0.03)", colorBottom="rgba(34,197,94,0.05)")`,
  },
  {
    id: "chartlab-delta-stretch",
    label: "ChartLab Delta Stretch",
    code: `from chartlab import indicator, input_int, input_float, plot, hline

@indicator(name="Delta Stretch", pane="histogram")
def run(ctx):
    stretch_length = input_int("Stretch Length", 18, min=5, max=80)
    smooth_length = input_int("Smooth Length", 5, min=1, max=30)
    stretch_mult = input_float("Stretch Level", 1.6, min=0.5, max=5.0, step=0.1)

    delta = ctx.close - ctx.open
    delta_basis = ctx.ta.ema(delta, length=smooth_length)
    delta_std = ctx.ta.rolling_std(delta, length=stretch_length)

    stretch_score = (delta - delta_basis) / delta_std
    trend_filter = ctx.ta.ema(ctx.close, length=34)

    plot(
        stretch_score,
        title="Stretch Histogram",
        type="histogram",
        renderers=["histogram", "bar", "line"],
        color="#22c55e",
        base=0,
    )
    plot(delta_basis, title="Delta Basis", color="#f59e0b", width=2)
    hline(stretch_mult, "Upper Stretch", color="#ef4444")
    hline(0, "Zero", color="#94a3b8")
    hline(-stretch_mult, "Lower Stretch", color="#22c55e")`,
  },
  {
    id: "chartlab-volume-imbalance-map",
    label: "ChartLab Volume Imbalance Map",
    code: `from chartlab import indicator, input_int, plot, plot_area

@indicator(name="Volume Imbalance Map", pane="volume")
def run(ctx):
    fast_length = input_int("Fast Volume", 5, min=1, max=50)
    slow_length = input_int("Slow Volume", 21, min=2, max=100)

    signed_volume = [v if c >= o else -v for o, c, v in zip(ctx.open, ctx.close, ctx.volume)]
    imbalance = ctx.ta.ema(signed_volume, length=fast_length)
    slow_imbalance = ctx.ta.ema(signed_volume, length=slow_length)
    spread = imbalance - slow_imbalance

    plot_area(
        spread,
        title="Imbalance Spread",
        color="#06b6d4",
        lineColor="#38bdf8",
        topColor="rgba(6,182,212,0.22)",
        bottomColor="rgba(6,182,212,0.04)",
        width=2,
    )
    plot(slow_imbalance, title="Slow Imbalance", color="#f59e0b", width=2)`,
  },
  {
    id: "ema-crossover",
    label: "EMA Crossover",
    code: `# EMA crossover starter
fast_ema = df["close"].ewm(span=9, adjust=False).mean()
slow_ema = df["close"].ewm(span=21, adjust=False).mean()

buy_cross = (fast_ema > slow_ema) & (fast_ema.shift(1) <= slow_ema.shift(1))
sell_cross = (fast_ema < slow_ema) & (fast_ema.shift(1) >= slow_ema.shift(1))

# Use buy_cross and sell_cross in your own workflow.`,
  },
  {
    id: "rsi-reversal",
    label: "RSI Reversal",
    code: `# RSI reversal starter
delta = df["close"].diff()
gain = delta.clip(lower=0).rolling(14).mean()
loss = (-delta.clip(upper=0)).rolling(14).mean()
rs = gain / loss.replace(0, float("nan"))
rsi = 100 - (100 / (1 + rs))

buy_signal = (rsi < 30) & (rsi.shift(1) >= 30)
sell_signal = (rsi > 70) & (rsi.shift(1) <= 70)

# Use buy_signal and sell_signal in your own workflow.`,
  },
  {
    id: "breakout",
    label: "Breakout",
    code: `# 20-bar breakout starter
rolling_high = df["high"].rolling(20).max()
rolling_low = df["low"].rolling(20).min()

buy_breakout = df["close"] > rolling_high.shift(1)
sell_breakout = df["close"] < rolling_low.shift(1)

# Use buy_breakout and sell_breakout in your own workflow.`,
  },
];

const DEFAULT_TEMPLATE_ID = "ema-crossover";
const CUSTOM_TEMPLATE_ID = "__custom__";
const TEMPLATE_STORAGE_KEY = "strategyEditorSelectedTemplateId";

const findTemplateIdByCode = (code) => {
  const match = STRATEGY_EDITOR_TEMPLATES.find(
    (template) => template.code === code,
  );
  return match?.id || null;
};

export const DEFAULT_EDITOR_CODE =
  STRATEGY_EDITOR_TEMPLATES.find((template) => template.id === DEFAULT_TEMPLATE_ID)
    ?.code || STRATEGY_EDITOR_TEMPLATES[0].code;

export { CUSTOM_TEMPLATE_ID };

const renderInlineMarkdown = (text, keyPrefix) =>
  text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${keyPrefix}-code-${index}`} className="chartlab-md__inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
  });

const renderMarkdown = (markdown) => {
  const lines = String(markdown || "").split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", content: codeLines.join("\n") });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", content: trimmed.slice(2) });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", content: trimmed.slice(3) });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !lines[index].trim().startsWith("# ") &&
      !lines[index].trim().startsWith("## ") &&
      !lines[index].trim().startsWith("- ")
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "p", content: paragraphLines.join(" ") });
  }

  return blocks.map((block, index) => {
    if (block.type === "h1") {
      return (
        <h1 key={`md-${index}`} className="chartlab-md__h1">
          {block.content}
        </h1>
      );
    }

    if (block.type === "h2") {
      return (
        <h2 key={`md-${index}`} className="chartlab-md__h2">
          {block.content}
        </h2>
      );
    }

    if (block.type === "code") {
      return (
        <pre key={`md-${index}`} className="chartlab-md__pre">
          <code>{block.content}</code>
        </pre>
      );
    }

    if (block.type === "list") {
      return (
        <ul key={`md-${index}`} className="chartlab-md__list">
          {block.items.map((item, itemIndex) => (
            <li key={`md-${index}-${itemIndex}`} className="chartlab-md__list-item">
              {renderInlineMarkdown(item, `md-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`md-${index}`} className="chartlab-md__p">
        {renderInlineMarkdown(block.content, `md-${index}`)}
      </p>
    );
  });
};

const CodeEditorPanel = ({
  onClose,
  onDeploy,
  onSave,
  onUpdate,
  onClear,
  onEdit,
  editorCode,
  setEditorCode,
  isDeployed,
  isDeploying,
  isSaving,
  isUpdating,
  canUpdate,
  canShowUpdate,
  loadedStrategyName,
}) => {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark",
  );
  const [hasErrors, setHasErrors] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const matchedTemplateId = findTemplateIdByCode(editorCode);
    const storedTemplateId = localStorage.getItem(TEMPLATE_STORAGE_KEY);

    if (
      storedTemplateId &&
      STRATEGY_EDITOR_TEMPLATES.some((template) => template.id === storedTemplateId)
    ) {
      return storedTemplateId;
    }

    return matchedTemplateId || DEFAULT_TEMPLATE_ID;
  });

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const matchedTemplateId = findTemplateIdByCode(editorCode);

    if (matchedTemplateId) {
      setSelectedTemplateId((current) =>
        current === matchedTemplateId ? current : matchedTemplateId,
      );
      localStorage.setItem(TEMPLATE_STORAGE_KEY, matchedTemplateId);
      return;
    }

    setSelectedTemplateId((current) =>
      current === CUSTOM_TEMPLATE_ID ? current : CUSTOM_TEMPLATE_ID,
    );
  }, [editorCode]);

  const handleChange = (value) => {
    setEditorCode(value || "");

    if (onEdit) onEdit();
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleValidate = useCallback((markers) => {
    // MarkerSeverity.Error is 8
    const errors = markers.filter((marker) => marker.severity === 8);
    setHasErrors(errors.length > 0);
  }, []);

  const applyTemplate = useCallback(
    (templateId) => {
      const template = STRATEGY_EDITOR_TEMPLATES.find(
        (item) => item.id === templateId,
      );
      if (!template) return;

      setSelectedTemplateId(templateId);
      localStorage.setItem(TEMPLATE_STORAGE_KEY, templateId);
      setEditorCode(template.code);
      if (editorRef.current) {
        editorRef.current.setValue(template.code);
      }
      if (onEdit) onEdit();
    },
    [onEdit, setEditorCode],
  );

  const isCustomStrategy = selectedTemplateId === CUSTOM_TEMPLATE_ID;

  return (
    <>
      <style>{`
        .code-editor-panel {
          width: 400px;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          z-index: 100;
        }
        @media (max-width: 768px) {
          .code-editor-panel {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
            border: none;
          }
        }
        .chartlab-guide-btn {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(59, 130, 246, 0.28);
          background: rgba(59, 130, 246, 0.12);
          color: #93c5fd;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .chartlab-guide-btn:hover {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.42);
        }
        .chartlab-guide-modal {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(2, 6, 23, 0.68);
          backdrop-filter: blur(6px);
        }
        .chartlab-guide-modal__dialog {
          width: min(840px, 100%);
          max-height: min(82vh, 900px);
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          overflow: hidden;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94)),
            var(--bg-primary);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
        }
        .chartlab-guide-modal__header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .chartlab-guide-modal__title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.03em;
        }
        .chartlab-guide-modal__close {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          font-size: 20px;
        }
        .chartlab-guide-modal__body {
          overflow: auto;
          padding: 18px 20px 24px;
        }
        .chartlab-md__h1 {
          margin: 0 0 14px;
          font-size: 20px;
          line-height: 1.25;
          color: #f8fafc;
        }
        .chartlab-md__h2 {
          margin: 22px 0 10px;
          font-size: 14px;
          line-height: 1.35;
          color: #93c5fd;
        }
        .chartlab-md__p {
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .chartlab-md__list {
          margin: 0 0 12px;
          padding-left: 18px;
          color: var(--text-secondary);
        }
        .chartlab-md__list-item {
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.65;
        }
        .chartlab-md__pre {
          margin: 0 0 14px;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(2, 6, 23, 0.5);
          color: #cbd5e1;
          overflow: auto;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre;
        }
        .chartlab-md__inline-code {
          padding: 1px 5px;
          border-radius: 4px;
          background: rgba(51, 65, 85, 0.55);
          color: #e2e8f0;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 11px;
        }
      `}</style>
      <div className="code-editor-panel">
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "var(--text-primary)",
          }}
        >
          Code Editor
        </span>
        <IoCloseSharp
          style={{
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: "1.2rem",
          }}
          onClick={onClose}
        />
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          background: "var(--bg-secondary)",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Templates
        </span>
        <select
          value={selectedTemplateId}
          onChange={(e) => applyTemplate(e.target.value)}
          style={{
            flex: 1,
            minWidth: "160px",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          <option value={CUSTOM_TEMPLATE_ID}>Current Custom Code</option>
          {STRATEGY_EDITOR_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="chartlab-guide-btn"
          onClick={() => setIsGuideOpen(true)}
        >
          <FaBookOpen size={11} />
          Guide
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="python"
          theme={theme === "light" ? "light" : "vs-dark"}
          value={editorCode}
          onChange={handleChange}
          onValidate={handleValidate}
          onMount={handleEditorDidMount}
          loading={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Spinner />
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 24,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            renderLineHighlight: "all",
          }}
        />
      </div>
      <div
        style={{
          padding: "12px 12px 14px",
          borderTop: "1px solid var(--border-color)",
          background:
            "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() =>
            onSave(editorCode, { requireStrategyName: isCustomStrategy })
          }
          disabled={isSaving || isDeploying || isUpdating || hasErrors}
          style={{
            flex: 1,
            padding: "11px 16px",
            background:
              isSaving || isDeploying || isUpdating || hasErrors
                ? "var(--bg-secondary)"
                : "rgba(34,197,94,0.14)",
            color:
              isSaving || isDeploying || isUpdating || hasErrors
                ? "var(--text-secondary)"
                : "#86efac",
            border:
              isSaving || isDeploying || isUpdating || hasErrors
                ? "1px solid var(--border-color)"
                : "1px solid rgba(34,197,94,0.35)",
            borderRadius: "6px",
            cursor:
              isSaving || isDeploying || isUpdating || hasErrors ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "13px",
            letterSpacing: "0.04em",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "7px",
            transition: "all 0.15s ease",
            opacity: isSaving || isDeploying || isUpdating || hasErrors ? 0.7 : 1,
          }}
          title={hasErrors ? "Please fix syntax errors before saving" : ""}
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <FaSave size={11} />
              Save
            </>
          )}
        </button>
        {canShowUpdate && (
          <button
            onClick={() => onUpdate(editorCode)}
            disabled={!canUpdate || isSaving || isDeploying || isUpdating || hasErrors}
            style={{
              flex: 1,
              padding: "11px 16px",
              background:
                !canUpdate || isSaving || isDeploying || isUpdating || hasErrors
                  ? "var(--bg-secondary)"
                  : "rgba(245,158,11,0.14)",
              color:
                !canUpdate || isSaving || isDeploying || isUpdating || hasErrors
                  ? "var(--text-secondary)"
                  : "#fbbf24",
              border:
                !canUpdate || isSaving || isDeploying || isUpdating || hasErrors
                  ? "1px solid var(--border-color)"
                  : "1px solid rgba(245,158,11,0.35)",
              borderRadius: "6px",
              cursor:
                !canUpdate || isSaving || isDeploying || isUpdating || hasErrors ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.04em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s ease",
              opacity: !canUpdate || isSaving || isDeploying || isUpdating || hasErrors ? 0.7 : 1,
            }}
            title={
              hasErrors
                ? "Please fix syntax errors before updating"
                : loadedStrategyName
                  ? `Update ${loadedStrategyName}`
                  : "Update saved strategy"
            }
          >
            {isUpdating ? (
              <>Updating...</>
            ) : (
              <>
                <FaSyncAlt size={11} />
                Update
              </>
            )}
          </button>
        )}
        {isDeployed ? (
          <button
            onClick={onClear}
            style={{
              flex: 1,
              padding: "11px 16px",
              background: "transparent",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.04em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s ease",
              boxShadow: "0 0 0 0 rgba(239,68,68,0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.7)";
              e.currentTarget.style.boxShadow = "0 0 14px rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
              e.currentTarget.style.boxShadow = "0 0 0 0 rgba(239,68,68,0)";
            }}
          >
            <FaTrash size={11} />
            Clear
          </button>
        ) : (
          <button
            onClick={() =>
              onDeploy(editorCode, { requireStrategyName: isCustomStrategy })
            }
            disabled={isDeploying || hasErrors}
            style={{
              flex: 1,
              padding: "11px 16px",
              background:
                isDeploying || hasErrors
                  ? "var(--bg-secondary)"
                  : "linear-gradient(135deg, var(--accent-color) 0%, #1a4fd6 100%)",
              color:
                isDeploying || hasErrors ? "var(--text-secondary)" : "#fff",
              border:
                isDeploying || hasErrors
                  ? "1px solid var(--border-color)"
                  : "1px solid rgba(41,98,255,0.6)",
              borderRadius: "6px",
              cursor: isDeploying || hasErrors ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.04em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s ease",
              boxShadow:
                isDeploying || hasErrors
                  ? "none"
                  : "0 2px 12px rgba(41,98,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              opacity: isDeploying || hasErrors ? 0.7 : 1,
            }}
            title={hasErrors ? "Please fix syntax errors before deploying" : ""}
            onMouseEnter={(e) => {
              if (isDeploying || hasErrors) return;
              e.currentTarget.style.background =
                "linear-gradient(135deg, #3d74ff 0%, var(--accent-color) 100%)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(41,98,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (isDeploying || hasErrors) return;
              e.currentTarget.style.background =
                "linear-gradient(135deg, var(--accent-color) 0%, #1a4fd6 100%)";
              e.currentTarget.style.boxShadow =
                "0 2px 12px rgba(41,98,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isDeploying ? (
              <>Deploying...</>
            ) : (
              <>
                <FaPlay size={11} />
                Deploy
              </>
            )}
          </button>
        )}
      </div>
    </div>
    {isGuideOpen && (
      <div
        className="chartlab-guide-modal"
        onClick={() => setIsGuideOpen(false)}
      >
        <div
          className="chartlab-guide-modal__dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="chartlab-guide-modal__header">
            <div className="chartlab-guide-modal__title">ChartLab Markdown Guide</div>
            <button
              type="button"
              className="chartlab-guide-modal__close"
              onClick={() => setIsGuideOpen(false)}
            >
              <IoCloseSharp />
            </button>
          </div>
          <div className="chartlab-guide-modal__body">
            {renderMarkdown(chartlabGuideMarkdown)}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CodeEditorPanel;
