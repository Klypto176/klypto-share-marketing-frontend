import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { FiSend, FiTrash2, FiCpu, FiCode } from "react-icons/fi";

const panelStyles = {
  container: {
    width: "360px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, #121726 0%, #0d1321 100%)",
    borderLeft: "1px solid rgba(148, 163, 184, 0.2)",
    flexShrink: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
  },
  titleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg, rgba(124,58,237,0.26), rgba(59,130,246,0.18))",
    color: "#c4b5fd",
  },
  title: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  subtitle: {
    margin: "3px 0 0",
    color: "rgba(226, 232, 240, 0.64)",
    fontSize: "0.75rem",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  iconButton: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.65)",
    color: "#cbd5e1",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    margin: "auto 0",
    padding: "18px",
    borderRadius: "16px",
    border: "1px dashed rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.45)",
    color: "#94a3b8",
    fontSize: "0.84rem",
    lineHeight: 1.6,
  },
  message: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  messageMeta: {
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(148, 163, 184, 0.78)",
  },
  bubble: {
    padding: "12px 13px",
    borderRadius: "14px",
    fontSize: "0.84rem",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "#f8fafc",
    borderBottomRightRadius: "4px",
  },
  assistantBubble: {
    background: "rgba(15, 23, 42, 0.92)",
    color: "#e2e8f0",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderBottomLeftRadius: "4px",
  },
  codeCard: {
    background: "rgba(2, 6, 23, 0.92)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  codeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
  },
  codeLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#93c5fd",
    fontSize: "0.74rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  applyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "8px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    background: "rgba(34, 197, 94, 0.12)",
    color: "#86efac",
    padding: "6px 9px",
    fontSize: "0.76rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  codePreview: {
    margin: 0,
    maxHeight: "180px",
    overflow: "auto",
    fontSize: "0.76rem",
    lineHeight: 1.5,
    color: "#cbd5e1",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
  },
  footer: {
    padding: "14px 16px 16px",
    borderTop: "1px solid rgba(148, 163, 184, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  textarea: {
    width: "100%",
    minHeight: "92px",
    resize: "none",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(15, 23, 42, 0.85)",
    color: "#f8fafc",
    padding: "12px 13px",
    outline: "none",
    fontSize: "0.84rem",
    lineHeight: 1.5,
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  helper: {
    color: "rgba(148, 163, 184, 0.82)",
    fontSize: "0.74rem",
    lineHeight: 1.4,
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    borderRadius: "10px",
    border: "1px solid #7c3aed",
    background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(79,70,229,0.22))",
    color: "#ddd6fe",
    padding: "9px 12px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

const MessageBubble = ({ message, onApplyCode }) => {
  const isUser = message.role === "user";

  return (
    <div style={panelStyles.message}>
      <div style={panelStyles.messageMeta}>
        {isUser ? "You" : "Strategy Agent"}
      </div>
      <div
        style={{
          ...panelStyles.bubble,
          ...(isUser ? panelStyles.userBubble : panelStyles.assistantBubble),
        }}
      >
        {message.content}
      </div>

      {message.code ? (
        <div style={panelStyles.codeCard}>
          <div style={panelStyles.codeHeader}>
            <div style={panelStyles.codeLabel}>
              <FiCode size={14} />
              Generated code
            </div>
            {typeof onApplyCode === "function" ? (
              <button
                type="button"
                style={panelStyles.applyBtn}
                onClick={() => onApplyCode(message)}
              >
                <FiCode size={14} />
                Apply to editor
              </button>
            ) : null}
          </div>
          <pre style={panelStyles.codePreview}>{message.code}</pre>
        </div>
      ) : null}
    </div>
  );
};

const StrategyAgentPanel = ({
  onClose,
  messages,
  draft,
  onDraftChange,
  onSend,
  isLoading,
  onClear,
  onApplyCode,
}) => {
  const bodyRef = useRef(null);
  const [localDraft, setLocalDraft] = useState(draft || "");

  useEffect(() => {
    setLocalDraft(draft || "");
  }, [draft]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const trimmed = useMemo(() => localDraft.trim(), [localDraft]);

  const handleSubmit = () => {
    if (!trimmed || isLoading) return;
    onSend?.(trimmed);
  };

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <div style={panelStyles.titleWrap}>
          <div style={panelStyles.titleIcon}>
            <FiCpu size={18} />
          </div>
          <div>
            <p style={panelStyles.title}>Strategy Agent</p>
            <p style={panelStyles.subtitle}>
              Ask for signals, code changes, or strategy help.
            </p>
          </div>
        </div>

        <div style={panelStyles.headerActions}>
          <button
            type="button"
            style={panelStyles.iconButton}
            title="Clear chat"
            onClick={onClear}
          >
            <FiTrash2 size={16} />
          </button>
          <button
            type="button"
            style={panelStyles.iconButton}
            title="Close agent"
            onClick={onClose}
          >
            <IoCloseSharp size={18} />
          </button>
        </div>
      </div>

      <div ref={bodyRef} style={panelStyles.body}>
        {messages.length === 0 ? (
          <div style={panelStyles.emptyState}>
            Try prompts like "Turn this into a breakout strategy", "Explain the
            last signal", or "Generate ChartLab code for EMA crossovers on the
            current symbol and timeframe."
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onApplyCode={message.code ? onApplyCode : null}
            />
          ))
        )}

        {isLoading ? (
          <div style={panelStyles.message}>
            <div style={panelStyles.messageMeta}>Strategy Agent</div>
            <div
              style={{
                ...panelStyles.bubble,
                ...panelStyles.assistantBubble,
                color: "#93c5fd",
              }}
            >
              Thinking...
            </div>
          </div>
        ) : null}
      </div>

      <div style={panelStyles.footer}>
        <textarea
          value={localDraft}
          onChange={(event) => {
            const nextValue = event.target.value;
            setLocalDraft(nextValue);
            onDraftChange?.(nextValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask the strategy agent..."
          style={panelStyles.textarea}
        />

        <div style={panelStyles.footerRow}>
          <div style={panelStyles.helper}>
            Enter sends. Shift+Enter adds a new line.
          </div>
          <button
            type="button"
            style={{
              ...panelStyles.sendBtn,
              opacity: !trimmed || isLoading ? 0.6 : 1,
            }}
            onClick={handleSubmit}
            disabled={!trimmed || isLoading}
          >
            <FiSend size={15} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyAgentPanel;
