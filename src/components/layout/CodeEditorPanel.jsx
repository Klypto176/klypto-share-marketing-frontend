import React, { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { IoCloseSharp } from "react-icons/io5";
import { FaPlay, FaSave, FaTrash, FaSyncAlt } from "react-icons/fa";
import { Spinner } from "../tradingModals/Spinner";

export const STRATEGY_EDITOR_TEMPLATES = [
  {
    id: "ema-crossover",
    label: "EMA Crossover",
    code: `# EMA crossover starter
fast_ema = df["close"].ewm(span=9, adjust=False).mean()
slow_ema = df["close"].ewm(span=21, adjust=False).mean()

buy_cross = (fast_ema > slow_ema) & (fast_ema.shift(1) <= slow_ema.shift(1))
sell_cross = (fast_ema < slow_ema) & (fast_ema.shift(1) >= slow_ema.shift(1))

markers = []

for idx in df.index[buy_cross.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "BUY", "position": "belowBar"})

for idx in df.index[sell_cross.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "SELL", "position": "aboveBar"})

plot_markers(markers)`,
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

markers = []

for idx in df.index[buy_signal.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "BUY", "position": "belowBar"})

for idx in df.index[sell_signal.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "SELL", "position": "aboveBar"})

plot_markers(markers)`,
  },
  {
    id: "breakout",
    label: "Breakout",
    code: `# 20-bar breakout starter
rolling_high = df["high"].rolling(20).max()
rolling_low = df["low"].rolling(20).min()

buy_breakout = df["close"] > rolling_high.shift(1)
sell_breakout = df["close"] < rolling_low.shift(1)

markers = []

for idx in df.index[buy_breakout.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "BUY", "position": "belowBar"})

for idx in df.index[sell_breakout.fillna(False)]:
    markers.append({"time": df.loc[idx, "time"], "text": "SELL", "position": "aboveBar"})

plot_markers(markers)`,
  },
];

export const DEFAULT_EDITOR_CODE = STRATEGY_EDITOR_TEMPLATES[0].code;

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
  loadedStrategyName,
}) => {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark",
  );
  const [hasErrors, setHasErrors] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    STRATEGY_EDITOR_TEMPLATES[0].id,
  );

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
      setEditorCode(template.code);
      if (editorRef.current) {
        editorRef.current.setValue(template.code);
      }
      if (onEdit) onEdit();
    },
    [onEdit, setEditorCode],
  );

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
          {STRATEGY_EDITOR_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
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
          onClick={() => onSave(editorCode)}
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
                : "Load a saved strategy to update it"
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
            onClick={() => onDeploy(editorCode)}
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
    </>
  );
};

export default CodeEditorPanel;
