import React, { useState } from "react";
import { FiMoreHorizontal, FiX, FiZap } from "react-icons/fi";
import { BsGrid } from "react-icons/bs";
import { AiOutlineEdit } from "react-icons/ai";
import ScannerPanel from "./ScannerPanel";

const LeftDetail = ({
  onClose,
  selectedCurrency,
  addAlert,
  clearAllCoins,
  scanner,
  matchedCoins,
  removeCoin,
  setSelectedCurrency,
  activeIndicators,
  openScannerTrigger,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  React.useEffect(() => {
    if (openScannerTrigger && openScannerTrigger > 0) setIsScannerOpen(true);
  }, [openScannerTrigger]);

  const styles = {
    container: { display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: "var(--panel-background)", color: "var(--text-primary)", borderRight: "1px solid var(--border-color)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-color)" },
    headerTitle: { display: "flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "0.95rem" },
    headerIcons: { display: "flex", gap: "12px", color: "var(--text-secondary)", cursor: "pointer", alignItems: "center" },
    subHeader: { display: "flex", justifyContent: "space-between", padding: "8px 16px", fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" },
    listContainer: { flex: 1, overflowY: "auto" },
    stockName: { fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)" },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" },
    footerLeft: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" },
    footerIcons: { display: "flex", gap: "16px", color: "var(--text-secondary)", cursor: "pointer" },
    scannerItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--bg-secondary)", cursor: "pointer" },
    badge: { width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-color), #22ab94)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.6rem", fontWeight: "bold", color: "#fff" },
    rsiTag: { fontSize: "0.7rem", color: "#22ab94", marginTop: 2 },
    timeTag: { fontSize: "0.68rem", color: "var(--text-secondary)" },
    emptyState: { textAlign: "center", padding: "32px 16px", color: "#4a4f5e", fontSize: "0.8rem" },
    scannerActiveBar: { display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(34, 171, 148, 0.1)", borderBottom: "1px solid #22ab9430", fontSize: "0.72rem", color: "#22ab94" },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-primary); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .left-detail-list-item:hover { background: var(--border-color); }
      `}</style>
      <div style={styles.header}>
        <div style={styles.headerTitle}>Scanner</div>
        <div style={styles.headerIcons}>
          <FiZap size={14} color={scanner ? "#f7c948" : "var(--text-secondary)"} onClick={() => setIsScannerOpen(true)} title="Configure Scanner" />
          <FiX onClick={onClose} />
        </div>
      </div>

      {scanner ? (
        <div style={styles.scannerActiveBar}>
          <FiZap size={11} color="#f7c948" />
          <span>{scanner.indicator} {scanner.condition} {scanner.value}</span>
          <span style={{ marginLeft: "auto", color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => setIsScannerOpen(true)}>Edit</span>
        </div>
      ) : (
        <div style={{ ...styles.scannerActiveBar, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
          <FiZap size={11} />
          <span>No scanner active —</span>
          <span style={{ color: "var(--accent-color)", cursor: "pointer", marginLeft: 4 }} onClick={() => setIsScannerOpen(true)}>Configure</span>
        </div>
      )}

      <div style={styles.subHeader}><span>Symbol</span><div style={{ display: "flex", gap: "20px" }}><span>Value</span><span>Time</span></div></div>
      <div className="custom-scrollbar" style={styles.listContainer}>
        {!matchedCoins || matchedCoins.length === 0 ? (
          <div style={styles.emptyState}><FiZap size={24} style={{ marginBottom: 8, opacity: 0.3 }} /><div>No matches yet</div><div style={{ marginTop: 4, fontSize: "0.72rem" }}>{scanner ? "Waiting for conditions to trigger…" : "Set up a scanner to start"}</div></div>
        ) : matchedCoins.map((coin, idx) => (
          <div key={idx} className="left-detail-list-item" style={styles.scannerItem} onClick={() => setSelectedCurrency({ name: coin.symbol })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={styles.badge}>{coin.symbol.substring(0, 1)}</div><div><div style={styles.stockName}>{coin.symbol}</div><div style={styles.rsiTag}>{coin.indicator || "RSI"}: {coin.rsi} · {coin.condition}</div></div></div>
            <div style={{ textAlign: "right" }}><div style={styles.timeTag}>{coin.timestamp}</div></div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerLeft}><div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-color)", display: "flex", justifyContent: "center", alignItems: "center" }}><span style={{ fontSize: "0.8rem" }}>D</span></div>{selectedCurrency?.name || "STOCK"}</div>
        <div style={styles.footerIcons}><BsGrid /><AiOutlineEdit /><FiMoreHorizontal /></div>
      </div>

      {isScannerOpen && <ScannerPanel onClose={() => setIsScannerOpen(false)} addAlert={addAlert} clearAllCoins={clearAllCoins} scanner={scanner} matchedCoins={matchedCoins} removeCoin={removeCoin} setSelectedCurrency={setSelectedCurrency} activeIndicators={activeIndicators} />}
    </div>
  );
};

export default LeftDetail;
