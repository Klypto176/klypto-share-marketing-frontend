import React, { useEffect } from "react";
import { socketManager } from "../services/websocket/socketManager";
import EVENTS from "../services/websocket/socketEvent";

// Global cache to persist data across route transitions
export const globalCache = {
  watchList: null,
  stocksList: null,
  optionChain: null,
  backtestDashboard: null,
  syncStatus: null,
};

const useSocket = (props = {}) => {
  const propsRef = React.useRef(props);

  React.useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const handlers = {
      [EVENTS.STOCK_LIST.STOCKS_LIST]: (data) => {
        const stocksArray = Array.isArray(data) ? data : data?.stocks || [];
        globalCache.stocksList = stocksArray;
        
        if (propsRef.current.setStocks) propsRef.current.setStocks(stocksArray);
        if (propsRef.current.handleAlertTick) propsRef.current.handleAlertTick({ type: EVENTS.STOCK_LIST.STOCKS_LIST, data: stocksArray });
      },
      
      [EVENTS.STOCK_LIST.STOCK_UPDATE]: (stock) => {
        if (propsRef.current.handleStockUpdate) propsRef.current.handleStockUpdate(stock);
        if (propsRef.current.handleAlertTick) propsRef.current.handleAlertTick({ type: EVENTS.STOCK_LIST.STOCK_UPDATE, data: stock });
      },
      
      [EVENTS.WATCHLIST.RESPONSE]: (res) => {
        // console.log("masterWatchlistResponse:", res);
        globalCache.watchList = res?.data || res;
        if (propsRef.current.handleWatchlistResponse) propsRef.current.handleWatchlistResponse(res);
      },
      
      [EVENTS.OPTION_CHAIN.LIST]: (res) => {
        if (propsRef.current.handleOptionChainList) propsRef.current.handleOptionChainList(res);
      },
      
      [EVENTS.OPTION_CHAIN.RESPONSE]: (res) => {
        globalCache.optionChain = res;
        if (propsRef.current.handleOptionChainResponse) propsRef.current.handleOptionChainResponse(res);
      },
      
      [EVENTS.CHART.RESPONSE]: (data) => {
        if (propsRef.current.handleHistoricalData) propsRef.current.handleHistoricalData(data);
      },
      
      [EVENTS.CHART.ERROR]: (err) => {
        if (propsRef.current.handleHistoricalError) propsRef.current.handleHistoricalError(err);
      },
      
      [EVENTS.CHART.LIVETICKS]: (tick) => {
        console.log(`[SOCKET] ${EVENTS.CHART.LIVETICKS} received:`, tick);
        if (propsRef.current.handleLiveTick) propsRef.current.handleLiveTick(tick);
        if (propsRef.current.handleAlertTick) propsRef.current.handleAlertTick({ type: EVENTS.CHART.LIVETICKS, data: tick });
      },
      
      [EVENTS.OVERVIEW.RESPONSE]: (tick) => {
        console.log(`[SOCKET] ${EVENTS.OVERVIEW.RESPONSE} (strategyLiveTick) received:`, tick);
        if (propsRef.current.handleOverviewTick) {
          propsRef.current.handleOverviewTick(tick);
          return;
        }
        // Always route overview ticks to handleLiveTick (ignore disableOverviewLiveTickFallback)
        if (propsRef.current.handleLiveTick) {
          propsRef.current.handleLiveTick(tick);
        }
      },
      
      [EVENTS.INDICATOR.RESPONSE]: (res) => {
        if (propsRef.current.handleIndicatorDetails) propsRef.current.handleIndicatorDetails(res);
      },
      
      [EVENTS.INDICATOR.LIVE_RESPONSE]: (tick) => {
        console.log(`[SOCKET] ${EVENTS.INDICATOR.LIVE_RESPONSE} received:`, tick);
        if (propsRef.current.handleLiveIndicator) propsRef.current.handleLiveIndicator(tick);
        if (propsRef.current.handleAlertTick) propsRef.current.handleAlertTick({ type: EVENTS.INDICATOR.LIVE_RESPONSE, data: tick });
      },
      
      [EVENTS.INDICATOR.UPDATE_RESPONSE]: (res) => {
        if (propsRef.current.handleUpdateIndicator) propsRef.current.handleUpdateIndicator(res);
      },
      
      [EVENTS.BACKTEST.DASHBOARD_RESPONSE]: (res) => {
        globalCache.backtestDashboard = res;
        if (propsRef.current.setBacktestDashboard) propsRef.current.setBacktestDashboard(res);
      },
      
      [EVENTS.STRATEGY.PROGRESS]: (data) => {
        // console.log(`[SOCKET] ${EVENTS.STRATEGY.PROGRESS} Payload:`, data);
        if (propsRef.current.handleScannerProgress) propsRef.current.handleScannerProgress(data);
      },
      
      [EVENTS.STRATEGY.NEW_SIGNAL]: (signalData) => {
        // console.log(`[SOCKET] ${EVENTS.STRATEGY.NEW_SIGNAL} Payload:`, signalData);
        if (propsRef.current.handleNewScannerSignal) propsRef.current.handleNewScannerSignal(signalData);
      },
      
      [EVENTS.STRATEGY.COMPLETE]: (response) => {
        // console.log(`[SOCKET] ${EVENTS.STRATEGY.COMPLETE} Payload:`, response);
        if (propsRef.current.handleScannerComplete) propsRef.current.handleScannerComplete(response);
      },

      [EVENTS.STRATEGY.AI_PREDICTION_STATUS]: (response) => {
        console.log(`[SOCKET] signal ${EVENTS.STRATEGY.AI_PREDICTION_STATUS} Payload:`, response);
        if (propsRef.current.handleAiPredictionStatus) propsRef.current.handleAiPredictionStatus(response);
      },

      [EVENTS.STRATEGY.AI_TRADE_SIGNAL]: (response) => {
        console.log(`[SOCKET] ${EVENTS.STRATEGY.AI_TRADE_SIGNAL} Payload:`, response);
        if (propsRef.current.handleAiTradeSignal) propsRef.current.handleAiTradeSignal(response);
      },


      "connect": () => {
         if (propsRef.current.handleConnect) propsRef.current.handleConnect();
      },
      "disconnect": () => {
         if (propsRef.current.handleDisconnect) propsRef.current.handleDisconnect();
      }
    };

    const unsubscribers = [];

    const eventRequirements = {
      [EVENTS.STOCK_LIST.STOCKS_LIST]: ["setStocks", "handleAlertTick"],
      [EVENTS.STOCK_LIST.STOCK_UPDATE]: ["handleStockUpdate", "handleAlertTick"],
      [EVENTS.WATCHLIST.RESPONSE]: ["handleWatchlistResponse"],
      [EVENTS.OPTION_CHAIN.LIST]: ["handleOptionChainList"],
      [EVENTS.OPTION_CHAIN.RESPONSE]: ["handleOptionChainResponse"],
      [EVENTS.CHART.RESPONSE]: ["handleHistoricalData"],
      [EVENTS.CHART.ERROR]: ["handleHistoricalError"],
      [EVENTS.CHART.LIVETICKS]: ["handleLiveTick", "handleAlertTick"],
      [EVENTS.OVERVIEW.RESPONSE]: ["handleOverviewTick", "handleLiveTick"],
      [EVENTS.INDICATOR.RESPONSE]: ["handleIndicatorDetails"],
      [EVENTS.INDICATOR.LIVE_RESPONSE]: ["handleLiveIndicator", "handleAlertTick"],
      [EVENTS.INDICATOR.UPDATE_RESPONSE]: ["handleUpdateIndicator"],
      [EVENTS.BACKTEST.DASHBOARD_RESPONSE]: ["setBacktestDashboard"],
      [EVENTS.STRATEGY.PROGRESS]: ["handleScannerProgress"],
      [EVENTS.STRATEGY.NEW_SIGNAL]: ["handleNewScannerSignal"],
      [EVENTS.STRATEGY.COMPLETE]: ["handleScannerComplete"],
      [EVENTS.STRATEGY.AI_PREDICTION_STATUS]: ["handleAiPredictionStatus"],
      [EVENTS.STRATEGY.AI_TRADE_SIGNAL]: ["handleAiTradeSignal"],
      connect: ["handleConnect"],
      disconnect: ["handleDisconnect"],
    };

    Object.entries(handlers).forEach(([eventName, handler]) => {
      const requiredProps = eventRequirements[eventName] || [];
      const shouldSubscribe = requiredProps.length === 0 || requiredProps.some(
        (propName) => typeof propsRef.current[propName] === "function",
      );

      if (!shouldSubscribe) return;

      const wrappedHandler = (...args) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[SOCKET ERROR] Event '${eventName}' threw an exception:`, error);
        }
      };

      unsubscribers.push(socketManager.subscribe(eventName, wrappedHandler));
    });

    const bootstrap = () => {
      // Re-hydrate components from global cache upon mount
      if (globalCache.watchList && propsRef.current.handleWatchlistResponse) {
        propsRef.current.handleWatchlistResponse({ success: true, data: globalCache.watchList });
      }
      if (globalCache.stocksList && propsRef.current.setStocks) {
        propsRef.current.setStocks(globalCache.stocksList);
      }
    };

    socketManager.socket.on("connect", bootstrap);
    if (socketManager.socket.connected) {
      bootstrap();
    }

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      socketManager.socket.off("connect", bootstrap);
    };
  }, []); // Empty dependency array -> register once per component mount

  const methods = React.useMemo(() => ({
    emit: socketManager.emit.bind(socketManager),
    once: socketManager.once.bind(socketManager),
    off: socketManager.socket.off.bind(socketManager.socket),
    connect: socketManager.socket.connect.bind(socketManager.socket),
    disconnect: socketManager.socket.disconnect.bind(socketManager.socket),
    socket: socketManager.socket,
  }), []);

  return { 
    ...methods,
    get connected() { return socketManager.socket.connected; },
    get id() { return socketManager.socket.id; }
  };
};

export default useSocket;
