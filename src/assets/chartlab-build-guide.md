# ChartLab Build Guide

ChartLab lets you build indicator and strategy-style scripts against candle data already loaded in the sandbox.

This guide focuses on the ChartLab execution model used by the editor:

- Write executable Python.
- Use `@indicator(...)` to register one runnable script.
- Read market data from `ctx`.
- Use `ctx.ta` helpers for aligned calculations.
- Emit visuals with `plot`, `fill`, `hline`, `barcolor`, and related helpers.

## Minimal Script

```python
from chartlab import indicator, plot

@indicator(name="Close Line", pane="overlay")
def run(ctx):
    plot(ctx.close, title="Close", color="#3b82f6", width=2)
```

## Execution Model

- The sandbox calls your registered function with `ctx`.
- `ctx` already contains candle-aligned series.
- Every plotted series should match the candle length.
- Prefer returning output through ChartLab helpers instead of printing values.
- Multiple `plot(...)` calls are allowed in one script.

## Available Candle Data

- `ctx.open`
- `ctx.high`
- `ctx.low`
- `ctx.close`
- `ctx.volume`
- `ctx.time`
- `ctx.bar_index`
- `ctx.symbol`
- `ctx.timeframe`

## Derived Price Sources

- `ctx.hl2`
- `ctx.hlc3`
- `ctx.ohlc4`

Example:

```python
from chartlab import indicator, plot

@indicator(name="HLC3 Trend", pane="overlay")
def run(ctx):
    basis = ctx.ta.ema(ctx.hlc3, length=21)
    plot(basis, title="HLC3 EMA", color="#14b8a6", width=2)
```

## Technical Analysis Helpers

Use `ctx.ta` when possible so the series stays aligned with candle count and warmup gaps are handled consistently.

Common helpers already used across templates include:

- `ctx.ta.sma(series, length=...)`
- `ctx.ta.ema(series, length=...)`
- `ctx.ta.hma(series, length=...)`
- `ctx.ta.rsi(series, length=...)`
- `ctx.ta.atr(high, low, close, length=...)`
- `ctx.ta.macd(series, fast=..., slow=..., signal=...)`
- `ctx.ta.highest(series, length=...)`
- `ctx.ta.lowest(series, length=...)`
- `ctx.ta.obv(close, volume)`
- `ctx.ta.mfi(high, low, close, volume, length=...)`
- `ctx.ta.crossover(left, right)`
- `ctx.ta.crossunder(left, right)`

Example:

```python
from chartlab import indicator, plot

@indicator(name="EMA Pair", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=9)
    slow = ctx.ta.ema(ctx.close, length=21)

    plot(fast, title="EMA 9", color="#22c55e", width=2)
    plot(slow, title="EMA 21", color="#f59e0b", width=2)
```

## Pane Selection

The decorator decides where the script should render.

- `pane="overlay"` draws on the main price chart.
- `pane="oscillator"` creates a separate indicator pane.
- `pane="volume"` creates a separate pane that fits volume-style indicators.
- `pane="histogram"` can also be used for separate lower-pane displays.

Example:

```python
from chartlab import indicator, plot, hline

@indicator(name="RSI Pane", pane="oscillator")
def run(ctx):
    rsi_value = ctx.ta.rsi(ctx.close, length=14)
    plot(rsi_value, title="RSI", color="#8b5cf6", width=2)
    hline(70, "Overbought", color="#ef4444")
    hline(30, "Oversold", color="#22c55e")
```

## Plot Types

Base plotting helper:

```python
plot(values, title="Name", color="#3b82f6", width=2)
```

Supported visual types currently include:

- `line`
- `step`
- `scatter`
- `histogram`
- `bar`
- `area`
- `candle`

Example:

```python
from chartlab import indicator, plot

@indicator(name="Mixed Plot Types", pane="oscillator")
def run(ctx):
    momentum = ctx.close - ctx.ta.sma(ctx.close, length=10)

    plot(momentum, title="Line", type="line", color="#38bdf8", width=2)
    plot(momentum, title="Histogram", type="histogram", color="#22c55e", base=0)
```

## Renderer Variants

You can offer renderer choices for the same series.

```python
from chartlab import indicator, plot

@indicator(name="Renderer Switch", pane="oscillator")
def run(ctx):
    values = ctx.ta.rsi(ctx.close, length=6)
    plot(
        values,
        title="Directional Score",
        type="histogram",
        renderers=["line", "histogram", "bar", "area"],
        color="#22c55e",
        width=2,
    )
```

## Area Plots

Area plots support line and fill styling.

```python
from chartlab import indicator, plot_area

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
    )
```

## Dynamic Line Colors

You can color each point in a plotted line using an array of colors aligned to candle length.

```python
from chartlab import indicator, plot

@indicator(name="Dynamic EMA", pane="overlay")
def run(ctx):
    ema_21 = ctx.ta.ema(ctx.close, length=21)
    line_colors = [
        "#22c55e" if ema is not None and close >= ema else "#ef4444"
        for close, ema in zip(ctx.close, ema_21)
    ]

    plot(
        ema_21,
        title="EMA 21",
        color="#94a3b8",
        lineColor=line_colors,
        width=2,
    )
```

## Histogram and Bar Plots

Use `base=0` when the visualization should anchor to zero.

```python
from chartlab import indicator, plot

@indicator(name="MACD Histogram", pane="oscillator")
def run(ctx):
    macd = ctx.ta.macd(ctx.close, fast=12, slow=26, signal=9)

    plot(macd["macd"], title="MACD", color="#3b82f6", width=2)
    plot(macd["signal"], title="Signal", color="#f59e0b", width=2)
    plot(
        macd["histogram"],
        title="Histogram",
        type="histogram",
        renderers=["line", "histogram", "bar"],
        color="#22c55e",
        base=0,
    )
```

## Scatter and Event Dots

Scatter plots are useful when only selected candles should display markers.

```python
from chartlab import indicator, plot_scatter

@indicator(name="Scatter Events", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=5)
    slow = ctx.ta.ema(ctx.close, length=13)
    buy = ctx.ta.crossover(fast, slow)

    buy_points = [close if active else None for close, active in zip(ctx.close, buy)]
    plot_scatter(buy_points, title="Buy Dots", color="#22c55e")
```

## Horizontal Levels

Use `hline(...)` for fixed reference levels.

```python
hline(0, "Zero", color="#94a3b8")
hline(70, "Upper", color="#ef4444")
hline(30, "Lower", color="#22c55e")
```

## Fill Between Series

`fill(...)` expects references returned by `plot(...)`.

```python
from chartlab import indicator, plot, fill

@indicator(name="EMA Cloud", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=9)
    slow = ctx.ta.ema(ctx.close, length=21)

    fast_plot = plot(fast, title="EMA 9", color="#22c55e", width=2)
    slow_plot = plot(slow, title="EMA 21", color="#f59e0b", width=2)

    fill(
        fast_plot,
        slow_plot,
        colorTop="rgba(34,197,94,0.18)",
        colorBottom="rgba(245,158,11,0.10)",
    )
```

## Candle Colors

Use `barcolor(...)` to recolor chart candles based on boolean conditions.

```python
from chartlab import indicator, plot, barcolor

@indicator(name="Trend Candles", pane="overlay")
def run(ctx):
    ema_21 = ctx.ta.ema(ctx.close, length=21)
    bull = ctx.close > ema_21
    bear = ctx.close < ema_21

    plot(ema_21, title="EMA 21", color="#60a5fa", width=2)
    barcolor(bull, "#00c3ff")
    barcolor(bear, "#ff0062")
```

## Input Controls

Inputs let the frontend expose configurable strategy settings.

```python
from chartlab import indicator
from chartlab import input_int, input_float, input_bool, input_color, input_select
from chartlab import plot

@indicator(name="Configurable Trend", pane="overlay")
def run(ctx):
    length = input_int("Length", 21, min=1, max=200)
    mult = input_float("Multiplier", 2.0, min=0.1, max=10.0, step=0.1)
    show_line = input_bool("Show Line", True)
    line_color = input_color("Line Color", "#3b82f6")
    mode = input_select("Mode", "EMA", ["EMA", "SMA", "HMA"])

    if mode == "SMA":
        basis = ctx.ta.sma(ctx.close, length=length)
    elif mode == "HMA":
        basis = ctx.ta.hma(ctx.close, length=length)
    else:
        basis = ctx.ta.ema(ctx.close, length=length)

    plot(basis, title="Basis", color=line_color, width=2, visible=show_line)
```

## Working with Series

ChartLab series can be combined arithmetically.

```python
spread = fast - slow
upper = basis + (atr * 2.0)
lower = basis - (atr * 2.0)
```

You can also build list-based derived values when you need precise custom behavior.

```python
signed_volume = [
    volume if close >= open_price else -volume
    for open_price, close, volume in zip(ctx.open, ctx.close, ctx.volume)
]
```

When using list comprehensions:

- Keep the output length identical to candle length.
- Use `None` for candles where a point should be hidden.
- Be careful with warmup values from moving averages because early bars may be `None`.

## Warmup and Safety

Many moving calculations return `None` on early candles before enough lookback exists.

Use defensive checks:

```python
line_colors = [
    "#22c55e" if ema is not None and close >= ema else "#ef4444"
    for close, ema in zip(ctx.close, ema_21)
]
```

Avoid direct comparisons without checking for `None` first:

- `close > ema` can fail on warmup bars if `ema` is `None`.
- Division denominators should be checked if they can become zero.

## Strategy Construction Pattern

A practical build pattern is:

- Read source series from `ctx`.
- Compute a trend filter.
- Compute trigger logic.
- Plot the important visual series.
- Add fills or levels for readability.
- Keep event conditions aligned to the final setup.

Example:

```python
from chartlab import indicator, plot, fill

@indicator(name="Trend + Trigger", pane="overlay")
def run(ctx):
    trend = ctx.ta.ema(ctx.close, length=50)
    trigger = ctx.ta.ema(ctx.close, length=9)
    pullback = ctx.ta.ema(ctx.low, length=5)

    trend_plot = plot(trend, title="Trend", color="#f8fafc", width=2)
    trigger_plot = plot(trigger, title="Trigger", color="#22c55e", width=2)
    pullback_plot = plot(pullback, title="Pullback", color="#f59e0b", width=1)

    fill(trigger_plot, pullback_plot, colorTop="rgba(34,197,94,0.12)", colorBottom="rgba(245,158,11,0.08)")

    long_entry = (ctx.close > trend) & ctx.ta.crossover(trigger, pullback)
    short_entry = (ctx.close < trend) & ctx.ta.crossunder(trigger, pullback)
```

## Safe Imports

Safe standard-library style imports are preferred when needed, for example:

- `math`
- `statistics`
- `datetime`
- `json`

Example:

```python
import math
from chartlab import indicator, plot

@indicator(name="Log Distance", pane="oscillator")
def run(ctx):
    values = [
        None if close <= 0 else math.log(close)
        for close in ctx.close
    ]
    plot(values, title="Log Close", color="#38bdf8", width=2)
```

## Good Habits

- Keep scripts candle-length aligned.
- Use `ctx.ta` before writing manual rolling logic.
- Use clear plot titles because they appear in the legend.
- Use separate panes for oscillators and volume-style studies.
- Test one visual layer at a time when a complex script does not render as expected.

## Common Mistakes

- Using pandas dataframe code directly in the ChartLab editor.
- Returning arrays with the wrong length.
- Comparing against moving-average values before checking for `None`.
- Calling a TA helper with unsupported argument names.
- Plotting volume or oscillator values on `overlay` when a separate pane is better.

## Debug Workflow

When a script does not behave correctly:

- Start with one `plot(...)` using `ctx.close`.
- Add one calculation at a time.
- Plot intermediate values before final conditions.
- Convert continuous conditions into event conditions using `crossover` or `crossunder` if your logic is too dense.

## Copyable Starter

```python
from chartlab import indicator, plot, fill, hline

@indicator(name="New Strategy", pane="overlay")
def run(ctx):
    fast = ctx.ta.ema(ctx.close, length=9)
    slow = ctx.ta.ema(ctx.close, length=21)
    strength = ctx.ta.rsi(ctx.close, length=14)

    fast_plot = plot(fast, title="Fast EMA", color="#22c55e", width=2)
    slow_plot = plot(slow, title="Slow EMA", color="#f59e0b", width=2)

    fill(
        fast_plot,
        slow_plot,
        colorTop="rgba(34,197,94,0.14)",
        colorBottom="rgba(245,158,11,0.10)",
    )

    hline(50, "Strength Mid", color="#94a3b8")

    buy = ctx.ta.crossover(fast, slow) & (strength > 50)
    sell = ctx.ta.crossunder(fast, slow) & (strength < 50)
```
