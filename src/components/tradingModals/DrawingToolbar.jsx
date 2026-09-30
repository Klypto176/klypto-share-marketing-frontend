import React, { useEffect, useRef, useState } from "react";
import {
  LuMousePointer2,
  LuTrash2,
  LuMinus,
  LuGitBranch,
  LuMoveHorizontal,
  LuMoveVertical,
  LuCrosshair,
  LuChartNoAxesCombined,
  LuSpline,
  LuChevronRight,
} from "react-icons/lu";
import { MdTimeline } from "react-icons/md";

const lineTools = [
  { id: "trendLine", label: "Trendline", shortcut: "Alt + T", icon: MdTimeline, activeTool: "trendLine" },
  { id: "ray", label: "Ray", icon: LuGitBranch },
  { id: "infoLine", label: "Info line", icon: LuGitBranch },
  { id: "extendedLine", label: "Extended line", icon: LuGitBranch },
  { id: "trendAngle", label: "Trend angle", icon: LuGitBranch },
  { id: "horizontalLine", label: "Horizontal line", shortcut: "Alt + H", icon: LuMinus, activeTool: "horizontalLine" },
  { id: "horizontalRay", label: "Horizontal ray", shortcut: "Alt + J", icon: LuMoveHorizontal },
  { id: "verticalLine", label: "Vertical line", shortcut: "Alt + V", icon: LuMoveVertical },
  { id: "crossline", label: "Crossline", shortcut: "Alt + C", icon: LuCrosshair },
];

const channelTools = [
  { id: "parallelChannel", label: "Parallel channel", icon: LuGitBranch },
  { id: "regressionTrend", label: "Regression trend", icon: LuChartNoAxesCombined },
  { id: "flatTopBottom", label: "Flat top/bottom", icon: LuSpline },
  { id: "disjointChannel", label: "Disjoint channel", icon: LuGitBranch },
];

const DrawingToolbar = ({ activeTool, setActiveTool, clearAllDrawings }) => {
  const [isLineMenuOpen, setIsLineMenuOpen] = useState(false);
  const [selectedLineTool, setSelectedLineTool] = useState(lineTools[0]);
  const lineToolMenuRef = useRef(null);
  const SelectedLineToolIcon = selectedLineTool.icon;

  useEffect(() => {
    if (!isLineMenuOpen) return undefined;

    const closeWhenOutside = (event) => {
      if (!lineToolMenuRef.current?.contains(event.target)) {
        setIsLineMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("wheel", closeWhenOutside, true);

    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("wheel", closeWhenOutside, true);
    };
  }, [isLineMenuOpen]);

  const iconButtonStyle = (isActive, width = "28px") => ({
    background: isActive ? "var(--bg-tertiary)" : "transparent",
    border: "none",
    color: isActive ? "#2962FF" : "#94a3b8",
    cursor: "pointer",
    padding: 0,
    width,
    height: "28px",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.2s",
  });

  const selectTool = (tool) => {
    setSelectedLineTool(tool);
    setActiveTool(tool.id);
    setIsLineMenuOpen(false);
  };

  const renderMenuItem = (tool) => {
    const Icon = tool.icon;
    const title = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;

    return (
      <button
        key={tool.id}
        type="button"
        title={title}
        onClick={() => selectTool(tool)}
        style={{
          width: "100%",
          minHeight: "32px",
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "0 10px",
          border: "none",
          borderRadius: "4px",
          background: "transparent",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: "12px",
          textAlign: "left",
        }}
        onMouseEnter={(event) => { event.currentTarget.style.background = "var(--bg-tertiary)"; }}
        onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
      >
        <Icon size={17} color="var(--text-secondary)" />
        <span style={{ flex: 1 }}>{tool.label}</span>
        {tool.shortcut && <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>{tool.shortcut}</span>}
      </button>
    );
  };

  const selectedToolIsActive = activeTool === selectedLineTool.activeTool;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "40px",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "var(--panel-background)",
        borderRight: "1px solid var(--border-color)",
        padding: "16px 0",
        alignItems: "center",
        gap: "20px",
        position: "relative",
        zIndex: 60,
      }}
    >
      <button
        type="button"
        title="Cursor"
        onClick={() => setActiveTool("cursor")}
        style={iconButtonStyle(activeTool === "cursor")}
        onMouseEnter={(event) => { if (activeTool !== "cursor") event.currentTarget.style.background = "var(--bg-tertiary)"; }}
        onMouseLeave={(event) => { if (activeTool !== "cursor") event.currentTarget.style.background = "transparent"; }}
      >
        <LuMousePointer2 size={16} />
      </button>

      <div ref={lineToolMenuRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <button
          type="button"
          title={selectedLineTool.label}
          aria-label={selectedLineTool.label}
          onClick={() => {
            if (selectedLineTool.activeTool) setActiveTool(selectedLineTool.activeTool);
          }}
          style={iconButtonStyle(selectedToolIsActive, "24px")}
          onMouseEnter={(event) => { if (!selectedToolIsActive) event.currentTarget.style.background = "var(--bg-tertiary)"; }}
          onMouseLeave={(event) => { if (!selectedToolIsActive) event.currentTarget.style.background = "transparent"; }}
        >
          <SelectedLineToolIcon size={16} />
        </button>
        <button
          type="button"
          title="Line tools"
          aria-label="Line tools"
          aria-expanded={isLineMenuOpen}
          onClick={() => setIsLineMenuOpen((open) => !open)}
          style={iconButtonStyle(isLineMenuOpen, "12px")}
          onMouseEnter={(event) => { if (!isLineMenuOpen) event.currentTarget.style.background = "var(--bg-tertiary)"; }}
          onMouseLeave={(event) => { if (!isLineMenuOpen) event.currentTarget.style.background = "transparent"; }}
        >
          <LuChevronRight size={10} style={{ transform: isLineMenuOpen ? "rotate(90deg)" : "none" }} />
        </button>

        {isLineMenuOpen && (
          <div
            role="menu"
            aria-label="Line and channel drawing tools"
            style={{
              position: "absolute",
              left: "34px",
              top: "-6px",
              width: "218px",
              padding: "8px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
              zIndex: 100,
            }}
          >
            <div style={{ padding: "2px 6px 6px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 700 }}>LINES</div>
            {lineTools.map(renderMenuItem)}
            <div style={{ height: "1px", background: "var(--border-color)", margin: "7px 0" }} />
            <div style={{ padding: "0 6px 6px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 700 }}>CHANNELS</div>
            {channelTools.map(renderMenuItem)}
          </div>
        )}
      </div>

      <div style={{ height: "1px", width: "16px", backgroundColor: "var(--border-color)" }} />

      <button
        type="button"
        title="Clear All Drawings"
        onClick={clearAllDrawings}
        style={iconButtonStyle(false)}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = "var(--bg-tertiary)";
          event.currentTarget.style.color = "#ef4444";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = "transparent";
          event.currentTarget.style.color = "#94a3b8";
        }}
      >
        <LuTrash2 size={16} />
      </button>
    </div>
  );
};

export default DrawingToolbar;