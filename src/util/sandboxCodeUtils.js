export const isDirectChartLabScript = (code) => {
  const text = String(code || "");
  return (
    /from\s+chartlab\s+import/i.test(text) &&
    /@indicator\s*\(/i.test(text) &&
    /def\s+run\s*\(\s*ctx\s*\)\s*:/i.test(text)
  );
};

export const getSandboxDependencies = (code) => {
  const text = String(code || "");
  const dependencies = [];

  if (/\b(?:from|import)\s+ta_patterns\b/.test(text)) {
    dependencies.push("ta-patterns");
  }

  return dependencies;
};

export const prepareSandboxCompatibleCode = (code) => String(code || "");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const extractSandboxErrorText = (errorLike) => {
  if (!errorLike) return "";
  if (typeof errorLike === "string") return errorLike;
  return (
    errorLike?.message ||
    errorLike?.detail ||
    errorLike?.error ||
    errorLike?.traceback ||
    ""
  );
};

const getChartLabDiagnosticSuggestions = (code, diagnostic = {}) => {
  const text = String(code || "");
  const message = String(diagnostic?.message || diagnostic?.error_message || "");
  const suggestions = [];

  if (/NameError/i.test(message) && /df/i.test(message)) {
    suggestions.push("This sandbox uses ChartLab context data. Replace df columns with ctx.close, ctx.high, ctx.low, ctx.open, or ctx.volume.");
  }
  if (/NameError/i.test(message) && /plot/i.test(message)) {
    suggestions.push("Import the helper before using it, for example: from chartlab import indicator, plot, plot_scatter, signal.");
  }
  if (/No module named|ModuleNotFoundError/i.test(message)) {
    suggestions.push("Use ChartLab built-ins and safe Python libraries. Heavy packages must be supported by the backend sandbox before importing them.");
  }
  if (/indent|expected an indented block/i.test(message)) {
    suggestions.push("Check indentation under def run(ctx):, if/for blocks, and multiline conditions.");
  }
  if (/invalid syntax|SyntaxError/i.test(message)) {
    suggestions.push("Look near the highlighted line for a missing colon, unmatched bracket, unterminated string, or pasted markdown fence.");
  }
  if (/unsupported operand|can't multiply sequence|can only concatenate/i.test(message)) {
    suggestions.push("ChartLab series are list-like. For element-wise math, build a list comprehension or use ctx.ta helpers such as ctx.ta.ema, ctx.ta.sma, or ctx.ta.atr.");
  }
  if (/list index out of range|IndexError/i.test(message)) {
    suggestions.push("Guard lookbacks with if len(ctx.close) < required_bars: return, or start loops after enough candles exist.");
  }
  if (/NoneType|not supported between instances/i.test(message)) {
    suggestions.push("Warmup values can be None. Skip None before comparisons or arithmetic.");
  }
  if (/\bdf\b/.test(text) && isDirectChartLabScript(text)) {
    suggestions.push("This script is in ChartLab format, so df is not available unless you create it yourself from ctx data.");
  }
  if (/plot_scatter|plot\(/.test(text) && !/from\s+chartlab\s+import[\s\S]*(plot|plot_scatter)/i.test(text)) {
    suggestions.push("Add the missing plot import from chartlab.");
  }
  if (/from\s+chartlab\s+import/i.test(text) && !/@indicator\s*\(/i.test(text)) {
    suggestions.push("Add @indicator(name=\"Your Indicator\", pane=\"overlay\") above def run(ctx):.");
  }

  return Array.from(new Set(suggestions)).slice(0, 5);
};

export const buildDiagnosticHtml = ({ title, diagnostic, code, fallback }) => {
  const line = diagnostic?.line || diagnostic?.lineno;
  const column = diagnostic?.column || diagnostic?.offset;
  const message =
    diagnostic?.message ||
    diagnostic?.error_message ||
    fallback ||
    "The sandbox could not execute this code.";
  const sourceLine =
    line && String(code || "").split(/\r?\n/)[Number(line) - 1]
      ? String(code || "").split(/\r?\n/)[Number(line) - 1]
      : "";
  const suggestions = [
    ...(Array.isArray(diagnostic?.suggestions) ? diagnostic.suggestions : []),
    ...getChartLabDiagnosticSuggestions(code, diagnostic),
  ];

  return `
    <div style="text-align:left;line-height:1.5">
      <div style="font-weight:700;margin-bottom:8px">${escapeHtml(title)}</div>
      <div style="margin-bottom:8px;color:#fecaca">${escapeHtml(message)}</div>
      ${
        line
          ? `<div style="margin-bottom:8px;color:#cbd5e1">Line ${escapeHtml(line)}${column ? `, column ${escapeHtml(column)}` : ""}</div>`
          : ""
      }
      ${
        sourceLine
          ? `<pre style="white-space:pre-wrap;background:var(--bg-primary);padding:10px;border-radius:6px;color:var(--text-primary);max-height:180px;overflow:auto">${escapeHtml(sourceLine)}</pre>`
          : ""
      }
      ${
        suggestions.length
          ? `<div style="margin-top:10px;font-weight:700">Suggestions</div><ul style="padding-left:18px;margin:6px 0 0">${suggestions
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul>`
          : ""
      }
    </div>
  `;
};
