export const createAgentMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  ...extras,
});

export const buildStrategyAgentPrompt = (editorCode, symbol, timeframe) =>
  `
Convert the current strategy editor content into runnable ChartLab-compatible Python for sandbox execution.

Requirements:
- Preserve the strategy intent from the editor code below.
- Return only executable Python code, with no markdown fences or explanation.
- Use ChartLab-compatible Python when needed.
- Emit trade markers with signal(...) for every backtestable BUY/SELL/EXIT event.
- For pattern scanners, emit signal(...) only on the confirmed breakout/entry/exit candle, not on earlier anchor candles.
- Avoid lookahead bias: loops may inspect completed historical bars, but a signal must only use information available at that candle's confirmation point.
- Prefer rich ChartLab visuals where helpful: plot, plot_area, plot_step, plot_scatter, fill, hline, barcolor, labels, zones, boxes, and separate panes.
- Guard every advanced calculation against short history, None warmup values, and division by zero.
- Keep outputs candle-length aligned so rendering is stable like a notebook cell output.
- If the existing code is already runnable ChartLab-compatible Python, keep the logic and return the final code.
- The chart symbol is ${symbol || "the selected symbol"} on timeframe ${timeframe || "the selected timeframe"}.

Current editor code:
${editorCode}
`.trim();
