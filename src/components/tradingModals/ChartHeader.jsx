import { FiPlus } from "react-icons/fi";
import { VscGraphLine } from "react-icons/vsc";
import { LuLibrary } from "react-icons/lu";
import { FiEye, FiEyeOff, FiSettings } from "react-icons/fi";
import { useState, useEffect } from "react";
import { ListingModal } from "./ListingModal";
import apiService from "../../services/apiServices";
import { Form } from "react-bootstrap";
import { MdAlarmAdd } from "react-icons/md";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FiChevronDown } from "react-icons/fi";
import { chartOptions } from "../../util/common";
import { EditableNumber } from "../indicator/EditTableLabel";
import { isAuthenticated, logout } from "../../pages/auth/protected";
import { Navigate, useNavigate } from "react-router-dom";
import ProfileDropDown from "../auth/profile/ProfileDropDown";
import { CgMaximizeAlt } from "react-icons/cg";
import { MdOutlineFullscreenExit } from "react-icons/md";
import { TbCalendarShare } from "react-icons/tb";
import GoToDateDialog from "../layout/GoToDateDialog";
import { BsFillAlarmFill } from "react-icons/bs";
const d = {
  bar: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "4px 16px",
    background: "var(--bg-primary)",
    borderBottom: "1px solid var(--bg-secondary)",
    flexWrap: "nowrap",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  btn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    color: "var(--text-primary)",
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    height: 36,
    whiteSpace: "nowrap",
  },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--accent-color)",
    border: "1px solid var(--accent-color)",
    borderRadius: 6,
    color: "var(--text-primary)",
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    height: 36,
  },
  select: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    color: "var(--text-primary)",
    padding: "6px 10px",
    fontSize: "0.8rem",
    height: 36,
    width: 120,
    cursor: "pointer",
  },
  dateInput: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    color: "var(--text-primary)",
    height: 36,
    fontSize: "0.78rem",
    padding: "0 8px",
  },
  divider: {
    width: 1, height: 24, background: "var(--bg-secondary)", flexShrink: 0, 
  },
  dropdownContent: {
    background: "var(--bg-primary)",
    border: "1px solid var(--bg-secondary)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    padding: 6,
    zIndex: 999,
    minWidth: 160,
  },
  dropdownItem: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 12px",
    borderRadius: 6,
    color: "var(--text-primary)",
    fontSize: "0.8rem",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    width: "100%",
  },
};

export default function ChartHeader({
  timeframeValue,
  setTimeframeValue,
  selectedCurrency,
  selectedIndicator,
  setSelectedIndicator,
  setSelectedCurrency,
  toggleIndicator,
  setChartType,
  chartType,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  setAlertResult,
  alertResult,
  addAlert,
  onOpenScanner,
  onSelectStrategy,
  onToggleStrategyVisuals,
  onOpenStrategyEditor,
  areStrategyVisualsVisible,
  hasActiveStrategy,
  isFullscreen,
  onToggleFullscreen,
  onGoToDate,
}) {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState(60);
  const [showGoToDate, setShowGoToDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const active = chartOptions.find((c) => c.value === chartType);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = tomorrow.toISOString().split("T")[0];

  const [modalConfig, setModalConfig] = useState({ open: false, title: "", items: [], initialSearch: "" });

  const openModal  = (title, items, initialSearch = "") => setModalConfig({ open: true, title, items, initialSearch });
  const closeModal = () => setModalConfig((prev) => ({ ...prev, open: false, initialSearch: "" }));

  async function fetchTimeframe() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post("/equity/getTimeFrames");
      setTimeframe(response.data);
      setTimeframeValue(timeframeValue);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to fetch timeframes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTimeframe(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isTypingInFormField =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable;
      const isInsideCodeEditor =
        activeElement?.closest?.(".code-editor-panel") ||
        activeElement?.closest?.(".monaco-editor") ||
        activeElement?.classList?.contains("inputarea");

      // Check if key is alphabetic and no modifier keys are active
      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Prevent opening if the user is typing in a field or inside Monaco/code editor.
        if (isTypingInFormField || isInsideCodeEditor) {
          return;
        }

        // Open symbol search modal and pass the pressed key
        e.preventDefault();
        openModal("Symbol Search", undefined, e.key);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0, fontSize: "0.85rem" }}>
      <style>{`
        .chart-header-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 16px;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--bg-secondary);
          flex-wrap: wrap;
        }

        @media (max-width: 992px) {
          .hide-text-md, .hide-below-lg {
            display: none !important;
          }
        }

        .sleek-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sleek-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sleek-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color, #888);
          border-radius: 4px;
        }
        .sleek-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary, #555);
        }

        @media (max-width: 768px) {
          .chart-header-bar {
            flex-wrap: wrap;
            overflow-x: visible;
            padding: 8px 16px;
            gap: 8px;
          }
          .chart-header-bar > * {
            flex-grow: 1;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
      <div className="chart-header-bar">

        {/* Symbol button */}
        <button title="Symbol Search" onClick={() => openModal("Symbol Search")} style={{ ...d.btn, fontWeight: 700, borderRadius: 20, padding: "6px 18px" }}>
          {selectedCurrency?.name || "TCS"}
        </button>

        {/* <div style={d.divider} /> */}

        {/* Timeframe dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button style={{ ...d.btn, justifyContent: "space-between" }} title={timeframeValue || "5m"}>
              <span>{timeframeValue || "5m"}</span>
              {/* <FiChevronDown size={13} /> */}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" className="sleek-scroll" sideOffset={6} style={{ ...d.dropdownContent, minWidth: 130, maxHeight: 400, overflowY: "auto" }}>
              {(!timeframe || Object.keys(timeframe)?.length === 0) && (
                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => setTimeframeValue("5m")}
                    style={{
                      ...d.dropdownItem,
                      background: timeframeValue === "5m" ? "var(--bg-secondary)" : "transparent",
                      color: timeframeValue === "5m" ? "var(--accent-color)" : "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => { if (timeframeValue !== "5m") e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={(e) => { if (timeframeValue !== "5m") e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ flex: 1, textAlign: "left" }}>5 Minute</span>
                    {timeframeValue === "5m" && <span style={{ color: "var(--accent-color)", fontSize: "0.7rem" }}>✓</span>}
                  </button>
                </DropdownMenu.Item>
              )}
              {timeframe && Object.entries(timeframe)?.map(([group, items]) => (
                <div key={group}>
                  <div style={{ padding: "6px 12px 2px", fontSize: "0.7rem", color: "var(--text-secondary)", opacity: 0.7, fontWeight: "bold", textTransform: "uppercase", textAlign: "left" }}>
                    {group}
                  </div>
                  {items?.map((item) => (
                    <DropdownMenu.Item key={item?.seconds} asChild>
                      <button
                        onClick={() => setTimeframeValue(item?.value)}
                        style={{
                          ...d.dropdownItem,
                          background: timeframeValue === item?.value ? "var(--bg-secondary)" : "transparent",
                          color: timeframeValue === item?.value ? "var(--accent-color)" : "var(--text-primary)",
                        }}
                        onMouseEnter={(e) => { if (timeframeValue !== item?.value) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                        onMouseLeave={(e) => { if (timeframeValue !== item?.value) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ flex: 1, textAlign: "left" }}>{item?.label}</span>
                        {timeframeValue === item?.value && <span style={{ color: "var(--accent-color)", fontSize: "0.7rem" }}>✓</span>}
                      </button>
                    </DropdownMenu.Item>
                  ))}
                </div>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Chart type dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button style={d.btn} title={active?.label}>
              {active?.icon && <active.icon size={15} />}
              {/* <span>{active?.label}</span> */}
              {/* <FiChevronDown size={13} /> */}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={6} style={d.dropdownContent}>
              {chartOptions?.map((item) => (
                <DropdownMenu.Item key={item.value} asChild>
                  <button
                    onClick={() => setChartType(item.value)}
                    style={{
                      ...d.dropdownItem,
                      background: chartType === item.value ? "var(--bg-secondary)" : "transparent",
                      color: chartType === item.value ? "var(--accent-color)" : "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => { if (chartType !== item.value) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={(e) => { if (chartType !== item.value) e.currentTarget.style.background = "transparent"; }}
                  >
                    <item.icon size={15} />
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {chartType === item.value && <span style={{ color: "var(--accent-color)", fontSize: "0.7rem" }}>✓</span>}
                  </button>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="hide-below-lg" style={d.divider} />

        {/* Indicators */}
        <button title="Indicators" onClick={() => openModal("Indicators")} style={d.btn}>
          <VscGraphLine size={15} />
          <span className="hide-text-md">Indicators</span>
        </button>

        <button title="Strategies" onClick={() => openModal("Strategies")} style={d.btn}>
          <LuLibrary size={15} />
          <span className="hide-text-md">Strategies</span>
        </button>

        {hasActiveStrategy && (
          <>
            <button
              title={areStrategyVisualsVisible ? "Hide strategy visuals" : "Show strategy visuals"}
              onClick={onToggleStrategyVisuals}
              style={d.btn}
            >
              {areStrategyVisualsVisible ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              <span>{areStrategyVisualsVisible ? "Hide" : "Show"}</span>
            </button>

            <button
              title="Open strategy editor"
              onClick={onOpenStrategyEditor}
              style={d.btn}
            >
              <FiSettings size={15} />
            </button>
          </>
        )}

        {/* Date pickers */}
        {/* <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
          <input
            type="date"
            value={fromDate}
            max={maxDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={d.dateInput}
          />
          <input
            type="date"
            value={toDate}
            max={maxDate}
            onChange={(e) => setToDate(e.target.value)}
            style={d.dateInput}
          />
        </div> */}

        {/* Spacer */}
        {/* <div style={{ flex: 1 }} /> */}
        <button title="Create Alert" onClick={onOpenScanner} style={d.btn}>
          <BsFillAlarmFill style={{ marginRight: 4 }} size={14} />
          <span className="hide-text-md">Create Alert</span>
        </button>

        {/* Auth button
        {isAuthenticated ? (
          <button title="Logout" onClick={() => { logout(); navigate("/login"); }} style={d.btnPrimary}>
            <span>Logout</span>
          </button>
        ) : (
          <button title="Signup" onClick={() => navigate("/signup")} style={d.btnPrimary}>
            <span>Signup</span>
          </button>
        )} */}

        {/* <ProfileDropDown /> */}
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {!isFullscreen && (
            <button
              style={d.btn}
              title="Maximize Chart"
              onClick={onToggleFullscreen}
            >
              <CgMaximizeAlt size={15} />
            </button>
          )}

          {isFullscreen && (
            <button
              style={{ ...d.btn, backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444", color: "#ef4444" }}
              title="Exit Fullscreen (Esc)"
              onClick={onToggleFullscreen}
            >
              <MdOutlineFullscreenExit size={15} />
              EXIT
            </button>
          )}

          <button style={d.btn} title="Go to" onClick={() => setShowGoToDate(true)}>
            <TbCalendarShare size={14} />
          </button>
        </div>
      </div>

      <ListingModal
        isOpen={modalConfig.open}
        onClose={closeModal}
        title={modalConfig.title}
        initialSearch={modalConfig.initialSearch}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        selectedIndicator={selectedIndicator}
        setSelectedIndicator={setSelectedIndicator}
        toggleIndicator={toggleIndicator}
        setAlertResult={setAlertResult}
        alertResult={alertResult}
        timeframeValue={timeframeValue}
        onSelectStrategy={onSelectStrategy}
        onSubmit={(data) => {
          if (addAlert) addAlert(data);
          closeModal();
        }}
      />

      {showGoToDate && (
        <GoToDateDialog
          onClose={() => setShowGoToDate(false)}
          onGoTo={(date) => {
            if (onGoToDate) onGoToDate(date);
          }}
        />
      )}
    </div>
  );
}
