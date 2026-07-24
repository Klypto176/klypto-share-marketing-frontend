import React from "react";
import { FiX } from "react-icons/fi";
import { Spinner } from "../tradingModals/Spinner";

const LeftDepth = ({
  onClose,
  predictResults,
  setSelectedCurrency,
  isPredicting,
  predictionStatus,
}) => {
  // console.log(
  //   "[DEBUG LeftDepth] Rendered with predictionStatus:",
  //   predictionStatus,
  //   "isPredicting:",
  //   isPredicting,
  // );

  const progressPercent =
    Number(predictionStatus?.processed) > 0 && Number(predictionStatus?.total)
      ? Math.round(
          (Number(predictionStatus.processed) / Number(predictionStatus.total)) * 100,
        )
      : 0;

  const statusStr =
    typeof predictionStatus === "string"
      ? predictionStatus
      : predictionStatus?.phase || predictionStatus?.status || "";

  const isSuccess =
    statusStr?.toLowerCase() === "complete" ||
    statusStr?.toLowerCase() === "skipped" ||
    statusStr?.toLowerCase() === "done";

  return (
    <div
      className="flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] border-r border-[var(--border-color)] font-sans"
      style={{ height: "calc(100vh - 60px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] font-semibold text-[0.95rem]">
        <div className="flex items-center gap-2">
          <span>Strategy Results</span>
          {predictResults && predictResults.length > 0 && (
            <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
              {predictResults.length}
            </span>
          )}
        </div>
        <FiX
          className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={onClose}
        />
      </div>

      {/* Progress bar */}
      {predictionStatus?.status === "running" && (
        <div className="px-4 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex justify-between text-[0.85rem] mb-2 font-semibold">
            <span>
              {predictionStatus?.phase === "predicting"
                ? "Predicting AI..."
                : "Fetching Ticks..."}
            </span>
            <span>
              {predictionStatus?.total
                ? `${predictionStatus?.processed || 0} / ${predictionStatus?.total} (${progressPercent}%)`
                : "0 / 0 (0%)"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--border-color)]">
            <div
              className="h-full bg-green-500 transition-[width] duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {isPredicting &&
        (!predictionStatus || predictionStatus.status !== "running") ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : predictResults && predictResults.length > 0 ? (
          predictResults.map((item, idx) => {
            const type = item.response?.type || "UNKNOWN";
            const isCall = type.toUpperCase() === "CALL";

            const timeStr = item.tick?.datetime || item.response?.entry_time;
            let displayTime = "N/A";
            if (timeStr) {
              try {
                const d = new Date(timeStr);
                displayTime = isNaN(d.getTime())
                  ? timeStr
                  : d.toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
              } catch (e) {
                displayTime = timeStr;
              }
            }

            return (
              <div
                key={item.uuid || idx}
                className="flex flex-col gap-1.5 px-4 py-3 border-b border-[var(--border-color)] cursor-pointer transition-colors hover:bg-[var(--bg-secondary)]"
                onClick={() => {
                  if (setSelectedCurrency && item.symbol) {
                    setSelectedCurrency({
                      name: item.symbol,
                      symbol: item.symbol,
                      segment: "NSE",
                      type: "currency",
                    });
                  }
                }}
              >
                {/* Row 1: Symbol + Trade Type Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[0.9rem] text-[var(--text-primary)]">
                    {item?.symbol}
                  </span>
                  <span
                    className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded ${
                      isCall
                        ? "bg-green-500/15 text-green-500 "
                        : "bg-red-500/15 text-red-500 "
                    }`}
                  >
                    {type}
                  </span>
                </div>

                {/* Row 2: Entry Price + Trend + RSI */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[0.8rem] font-semibold ${
                      isCall ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ₹{item.response?.entry_price ?? "—"}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    {item.response?.trend && (
                      <span
                        className={`text-[0.68rem] ${
                          item.response.trend === "UP"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {item.response.trend === "UP" ? "↑" : "↓"}{" "}
                        {item.response.trend}
                      </span>
                    )}
                    {item.response?.rsi && (
                      <span className="text-[0.68rem] text-[var(--text-secondary)]">
                        RSI: {Number(item.response.rsi).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Time */}
                <div className="text-[0.75rem] text-[var(--text-secondary)]">
                  {displayTime}
                </div>
              </div>
            );
          })
        ) : predictionStatus?.status === "running" ||
          predictionStatus?.phase === "predicting" ||
          predictionStatus?.phase === "starting" ||
          predictionStatus?.status === "starting" ? null : (
          <div className="mt-5 text-center text-[0.85rem] text-[var(--text-secondary)]">
            No results available.
          </div>
        )}
      </div>

      {/* Footer */}
      {!isSuccess && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          {statusStr && (
            <>
              <span className="whitespace-nowrap text-[0.75rem] font-semibold px-2.5 py-1 rounded-md bg-yellow-500/15 text-yellow-500 border border-yellow-50 capitalize">
                Status: {statusStr}
              </span>
              <span className="whitespace-nowrap text-[0.75rem] font-semibold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
                Trades: {predictResults?.length || 0}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LeftDepth;