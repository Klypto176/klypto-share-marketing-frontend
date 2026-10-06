import React, { useState } from "react";
import { FiMinus, FiMoreHorizontal, FiPlus, FiX } from "react-icons/fi";
import { BsGrid } from "react-icons/bs";
import { AiOutlineEdit } from "react-icons/ai";
import { ListingModal } from "../tradingModals/ListingModal";

const getSymbolKey = (symbol) =>
  String(symbol || "").replace(/\s+/g, " ").trim().toUpperCase();

const LeftWatchlist = ({
  onClose,
  selectedCurrency,
  detailsList,
  onAddStock,
  onRemoveStock,
  setSelectedCurrency,
  liveLtpBySymbol,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const styles = {
    container: { display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", background: "var(--panel-background)", color: "var(--text-primary)", borderRight: "1px solid var(--border-color)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-color)" },
    headerTitle: { display: "flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "0.95rem" },
    headerIcons: { display: "flex", gap: "12px", color: "var(--text-secondary)", cursor: "pointer", alignItems: "center" },
    subHeader: { display: "flex", justifyContent: "space-between", padding: "8px 16px", fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" },
    listContainer: { flex: 1, overflowY: "auto" },
    listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--bg-secondary)", cursor: "pointer" },
    stockName: { fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)" },
    stockChange: { fontSize: "0.75rem", minWidth: "34px", textAlign: "right" },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" },
    footerLeft: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" },
    footerIcons: { display: "flex", gap: "16px", color: "var(--text-secondary)", cursor: "pointer" },
    btnContainer: { display: "flex", gap: "8px" },
    addBtn: { background: "var(--accent-color)", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" },
    deleteBtn: { background: "var(--danger-color)", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-primary); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .left-watchlist-item:hover, .left-watchlist-item.active { background: var(--border-color); }
      `}</style>

      <div style={styles.header}>
        <div style={styles.headerTitle}>Watchlist</div>
        <div style={styles.headerIcons}>
          <FiPlus onClick={() => setIsModalOpen(true)} title="Add Symbol" />
          <FiX onClick={onClose} />
        </div>
      </div>

      <div style={styles.subHeader}>
        <span>Symbol</span>
        <div style={{ display: "flex", gap: "12px" }}>
          <span>LTP</span>
          {/* <span>Chg</span> */}
          <span>Chg%</span>
        </div>
      </div>

      <div className="custom-scrollbar" style={styles.listContainer}>
        {detailsList.length === 0 ? (
          <div style={{ padding: "24px 16px", color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, textAlign: "center" }}>
            Add symbols to your watchlist using the "+" symbol.
          </div>
        ) : detailsList.map((stock, idx) => {
          const high = parseFloat(stock.high || 0);
          const low = parseFloat(stock.low || 0);
          const calculatedChange = high - low;
          const calculatedPercentChange = low !== 0 ? (calculatedChange / low) * 100 : 0;
          const isPositive = calculatedChange >= 0;
          const color = isPositive ? "#22ab94" : "var(--danger-color)";
          const isActive = (stock.token && selectedCurrency?.token && String(stock.token) === String(selectedCurrency.token)) || (stock.symbol || stock.name || "").toUpperCase() === (selectedCurrency?.symbol || selectedCurrency?.name || "").toUpperCase();
          const liveLtp = liveLtpBySymbol?.[getSymbolKey(stock.name)] ?? liveLtpBySymbol?.[getSymbolKey(stock.symbol)] ?? stock.ltp;
          const formattedLtp = Number.isFinite(Number(liveLtp)) ? Number(liveLtp).toFixed(2) : "—";

          return (
            <div key={idx} className={`left-watchlist-item ${isActive ? "active" : ""}`} style={styles.listItem} onClick={() => setSelectedCurrency(stock)}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: idx % 2 === 0 ? "var(--accent-color)" : "var(--bg-secondary)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.6rem", fontWeight: "bold" }}>
                  {stock.name ? stock.name.substring(0, 1) : "S"}
                </div>
                <div style={styles.stockName}>{stock.name}</div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ ...styles.stockChange, color: "var(--text-primary)" }}>{formattedLtp}</div>
                {/* <div style={{ ...styles.stockChange, color }}>{calculatedChange.toFixed(2)}</div> */}
                <div style={{ ...styles.stockChange, color }}>{`${calculatedPercentChange.toFixed(2)}%`}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-color)", display: "flex", justifyContent: "center", alignItems: "center" }}><span style={{ fontSize: "0.8rem" }}>D</span></div>
          {selectedCurrency?.name || "STOCK"}
        </div>
        <div style={styles.footerIcons}>
            <BsGrid /><AiOutlineEdit /><FiMoreHorizontal />
            </div>
      </div> */}

      {isModalOpen && (
        <ListingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Symbol Search"
          setSelectedCurrency={setSelectedCurrency}
          renderActions={(stock) => {
            const isAdded = detailsList.some((item) => item.symbol === stock.symbol);
            return <div style={styles.btnContainer}>{!isAdded ? (
              <button style={styles.addBtn} onClick={(event) => { event.stopPropagation(); onAddStock(stock); }} title="Add to watchlist" aria-label="Add to watchlist"><FiPlus size={14} /></button>
            ) : (
              <button style={styles.deleteBtn} onClick={(event) => { event.stopPropagation(); onRemoveStock(stock.symbol); }} title="Remove from watchlist" aria-label="Remove from watchlist"><FiMinus size={14} /></button>
            )}</div>;
          }}
        />
      )}
    </div>
  );
};

export default LeftWatchlist;
