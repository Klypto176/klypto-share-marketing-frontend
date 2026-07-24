import React, { useState } from "react";
import { FiX, FiTrash2, FiMaximize2, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LeftAlertListing = ({
  onClose,
  alertResult,
  setAlertResult,
  setSelectedCurrency,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleClear = () => {
    setAlertResult([]);
  };

  const results = Array.isArray(alertResult) ? alertResult : [];
  const filteredResults = results.filter((item) =>
    item.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item) => {
    if (setSelectedCurrency) {
      setSelectedCurrency({
        symbol: item.symbol,
        name: item.name || item.symbol,
        token: item.token,
        segment: item.segment || "NSE",
      });
    }
    if (setActiveTab) {
      setActiveTab("Chart");
    }
  };

  return (
    <div
      className="flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] border-r border-[var(--border-color)] font-sans"
      style={{ height: "calc(100vh - 60px)" }}
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-primary); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #363a45; }
        .alert-item:hover { background-color: var(--border-color); }
        .clear-btn:hover { background-color: var(--border-color); color: var(--text-primary); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] font-semibold text-[0.95rem]">
        <span>Script Signals</span>
        <div className="flex items-center gap-3">
          <button
            className="clear-btn flex items-center gap-1 bg-transparent border-none text-[var(--text-secondary)] cursor-pointer text-[0.8rem] px-2 py-1 rounded transition-colors"
            onClick={() => {
              onClose();
              navigate("/signals");
            }}
            title="Maximize to Dashboard"
          >
            <FiMaximize2 size={14} />
          </button>
          {results.length > 0 && (
            <button
              className="clear-btn flex items-center gap-1 bg-transparent border-none text-[var(--text-secondary)] cursor-pointer text-[0.8rem] px-2 py-1 rounded transition-colors"
              onClick={handleClear}
            >
              <FiTrash2 size={14} />
              <span>Clear</span>
            </button>
          )}
          <FiX
            className="cursor-pointer text-[var(--text-secondary)]"
            onClick={onClose}
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <FiSearch color="var(--text-secondary)" size={14} />
        <input
          type="text"
          placeholder="Search alerts..."
          className="w-full ml-2 bg-transparent border-none text-[var(--text-primary)] outline-none text-[0.85rem] placeholder:text-[var(--text-secondary)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] px-5 py-5 text-center">
            <div className="text-[2rem] mb-3 opacity-50">🔔</div>
            <p className="font-semibold text-[0.9rem] text-[var(--text-primary)]">
              No active alerts
            </p>
            <p className="text-[0.75rem] mt-2 leading-snug">
              Start a scan from the Alert modal to see matching stocks here.
            </p>
          </div>
        ) : (
          filteredResults.map((item, idx) => (
            <div key={idx} className="relative">
              <div className="no-underline text-inherit">
                <div
                  className="alert-item flex flex-col px-4 py-3 border-b border-[var(--bg-secondary)] cursor-pointer transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[0.85rem] text-[var(--text-primary)]">
                      {item.symbol}
                    </span>

                    {item.signalType && (
                      <span
                        className={`font-semibold text-[0.85rem] ${
                          item.signalType === "BUY"
                            ? "text-[#22ab94]"
                            : "text-[var(--danger-color)]"
                        }`}
                      >
                        {item.signalType}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-[0.75rem] text-[var(--text-secondary)]">
                    <span>
                      {item.timestamp || new Date().toLocaleTimeString()}
                    </span>

                    {/* <span>{item.segment || "NSE"}</span> */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftAlertListing;