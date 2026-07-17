import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Pagination,
  Card,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import {
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaUndo,
  FaChartLine,
  FaLayerGroup,
} from "react-icons/fa";
import apiService from "../services/apiServices";
import Select from "react-select";
import { getStrategySocket } from "../services/websocket/socket";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";

/* ─── Design tokens ─────────────────────────────────────────────────────────────
───────────────────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root {
    --oc-bg:           var(--bg-primary);
    --oc-surface:      var(--bg-secondary);
    --oc-border:       var(--border-color);
    --oc-muted:        var(--text-secondary);
    --oc-green:        var(--success-color);
    --oc-red:          var(--danger-color);
    --oc-text:         var(--text-primary);
    --oc-radius:       14px;
    --oc-radius-sm:    9px;
    --oc-shadow:       0 2px 14px rgba(0,0,0,.28), 0 1px 2px rgba(0,0,0,.18);
    --oc-shadow-md:    0 8px 28px rgba(0,0,0,.32);
    --oc-shadow-hover: 0 6px 22px rgba(127,119,221,.18);
  }

  /* Page shell */
  .oc-page {
    background:
      radial-gradient(circle at 0% 0%, rgba(127,119,221,.06), transparent 45%),
      radial-gradient(circle at 100% 0%, rgba(59,130,246,.05), transparent 40%),
      var(--oc-bg);
    min-height: 100vh;
    padding: 28px 24px 40px;
    font-family: 'Inter', sans-serif;
    color: var(--oc-text);
  }

  /* ── Header ── */
  .oc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
    gap: 16px;
  }
  .oc-header-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: linear-gradient(135deg, var(--oc-accent), #3B82F6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 17px;
    box-shadow: 0 4px 14px rgba(127,119,221,.35);
    flex-shrink: 0;
  }
  .oc-title-group {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .oc-title {
    font-size: 23px;
    font-weight: 800;
    color: var(--oc-navy);
    letter-spacing: -0.4px;
    margin: 0;
    line-height: 1.2;
  }
  .oc-subtitle {
    font-size: 13px;
    color: var(--oc-muted);
    margin: 3px 0 0;
    font-weight: 400;
  }
  .oc-live-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(8,153,129,.10);
    color: var(--oc-green);
    border: 1px solid rgba(8,153,129,.25);
    border-radius: 20px;
    padding: 6px 13px;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    white-space: nowrap;
    height: fit-content;
  }
  .oc-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--oc-green);
    box-shadow: 0 0 0 0 rgba(8,153,129,.7);
    animation: oc-pulse 1.8s infinite;
  }
  @keyframes oc-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(8,153,129,.55); }
    70%  { box-shadow: 0 0 0 6px rgba(8,153,129,0); }
    100% { box-shadow: 0 0 0 0 rgba(8,153,129,0); }
  }

  /* ── Filter card ── */
  .oc-filter-card {
    background: var(--oc-surface);
    border-radius: var(--oc-radius);
    border: 1px solid var(--oc-border);
    box-shadow: var(--oc-shadow);
    padding: 22px 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .oc-filter-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--oc-accent), #3B82F6, var(--oc-accent));
    opacity: .85;
  }
  .oc-filter-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--oc-muted);
    margin-bottom: 7px;
    display: block;
  }
  .oc-select, .oc-date-input {
    height: 42px !important;
    font-size: 13.5px !important;
    font-family: 'Inter', sans-serif !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: var(--oc-radius-sm) !important;
    background-color: var(--oc-surface) !important;
    color: var(--oc-text) !important;
    transition: border-color .18s, box-shadow .18s, background .18s !important;
    box-shadow: none !important;
  }
  .oc-select:hover, .oc-date-input:hover {
    border-color: rgba(127,119,221,.5) !important;
  }
  .oc-select:focus, .oc-date-input:focus {
    border-color: var(--oc-accent) !important;
    box-shadow: 0 0 0 3px rgba(127,119,221,.15) !important;
  }
  .oc-input-icon {
    background: linear-gradient(135deg, var(--oc-accent), #3B82F6) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-right: none !important;
    border-radius: var(--oc-radius-sm) 0 0 var(--oc-radius-sm) !important;
    color: #fff !important;
    height: 42px !important;
    display: flex;
    align-items: center;
    padding: 0 12px;
    cursor: pointer;
    transition: filter .18s;
  }
  .oc-input-icon:hover { filter: brightness(1.12); }
  .oc-date-input {
    border-left: none !important;
    border-radius: 0 var(--oc-radius-sm) var(--oc-radius-sm) 0 !important;
    position: relative;
  }
  .oc-date-input::-webkit-calendar-picker-indicator {
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }

  /* Buttons */
  .oc-btn-apply {
    height: 42px;
    background: linear-gradient(135deg, var(--oc-accent), #3B82F6) !important;
    border: none !important;
    border-radius: var(--oc-radius-sm) !important;
    font-size: 13.5px !important;
    font-weight: 700 !important;
    font-family: 'Inter', sans-serif !important;
    letter-spacing: 0.2px;
    color: #fff !important;
    transition: filter .18s ease, transform .12s ease, box-shadow .18s ease !important;
    box-shadow: 0 3px 10px rgba(59, 130, 246, .3) !important;
  }
  .oc-btn-apply:hover {
    filter: brightness(1.08);
    box-shadow: 0 5px 16px rgba(59, 130, 246, .45) !important;
    transform: translateY(-1.5px);
  }
  .oc-btn-apply:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 6px rgba(59, 130, 246, .3) !important;
    filter: brightness(0.97);
  }

  .oc-btn-reset {
    height: 42px;
    border: 1.5px solid var(--oc-border) !important;
    border-radius: var(--oc-radius-sm) !important;
    background: var(--oc-surface) !important;
    color: var(--oc-muted) !important;
    font-size: 13.5px !important;
    font-weight: 600 !important;
    font-family: 'Inter', sans-serif !important;
    letter-spacing: 0.2px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px !important;
    transition: border-color .18s ease, color .18s ease, background .18s ease, transform .12s ease !important;
  }
  .oc-btn-reset:hover {
    border-color: #3B82F6 !important;
    color: #3B82F6 !important;
    background: rgba(59, 130, 246, .08) !important;
    transform: translateY(-1.5px);
  }
  .oc-btn-reset:active {
    transform: translateY(0) !important;
  }

  /* ── Table card ── */
  .oc-table-card {
    background: var(--oc-surface);
    border-radius: var(--oc-radius);
    border: 1px solid var(--oc-border);
    box-shadow: var(--oc-shadow);
    overflow: hidden;
  }

  /* Table */
  .oc-table {
    margin: 0 !important;
    min-width: 1200px;
    font-family: 'Inter', sans-serif;
    background: transparent !important;
    color: var(--oc-text) !important;
    border-collapse: separate;
  }
  .oc-table td, .oc-table th {
    background-color: transparent !important;
    color: var(--oc-text) !important;
  }
  .oc-table thead tr {
    background: var(--oc-surface);
    border-bottom: 1.5px solid var(--oc-border);
  }
  .oc-table thead th {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--oc-muted) !important;
    padding: 14px 16px !important;
    border: none !important;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: color .15s, background .15s;
    position: sticky;
    top: 0;
  }
  .oc-table thead th:hover {
    color: var(--oc-accent) !important;
    background: var(--oc-accent-light) !important;
  }
  .oc-table thead th .sort-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .oc-table tbody tr {
    border-bottom: 1px solid var(--oc-border) !important;
    transition: background .15s, transform .1s;
    background-color: transparent !important;
  }
  .oc-table tbody tr:hover {
    background: var(--oc-accent-light) !important;
  }
  .oc-table tbody tr:last-child { border-bottom: none !important; }

  .oc-table td {
    padding: 12px 16px !important;
    border: none !important;
    vertical-align: middle !important;
    font-size: 13px;
  }

  /* Mono cells for numbers/prices */
  .oc-mono {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 500;
  }
  .oc-cell-date    { color: var(--oc-muted); font-size: 12.5px; }
  .oc-cell-symbol  { font-weight: 700; color: var(--oc-navy); font-size: 13.5px; letter-spacing: -0.2px; }
  .oc-cell-expiry  { color: var(--oc-muted); font-size: 12.5px; }
  .oc-cell-strike  { font-weight: 700; color: var(--oc-navy); }
  .oc-cell-high    { color: var(--oc-green); font-weight: 600; }
  .oc-cell-low     { color: var(--oc-red); font-weight: 600; }
  .oc-cell-close   { font-weight: 700; color: var(--oc-navy); }
  .oc-cell-muted   { color: var(--oc-muted); }

  /* Type badge */
  .oc-badge-ce, .oc-badge-pe {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.4px;
    border: 1px solid transparent;
  }
  .oc-badge-ce {
    background: rgba(8,153,129,.12);
    color: var(--oc-green);
    border-color: rgba(8,153,129,.25);
  }
  .oc-badge-pe {
    background: rgba(242,54,69,.12);
    color: var(--oc-red);
    border-color: rgba(242,54,69,.25);
  }

  /* Empty state */
  .oc-empty {
    padding: 64px 0;
    text-align: center;
    color: var(--oc-muted);
  }
  .oc-empty-icon {
    font-size: 38px;
    margin-bottom: 14px;
    opacity: .45;
    display: flex;
    justify-content: center;
  }
  .oc-empty h6 {
    font-weight: 700;
    color: var(--oc-text);
    margin-bottom: 4px;
    font-size: 14.5px;
  }
  .oc-empty p {
    font-size: 13px;
    margin: 0;
    color: var(--oc-muted);
  }

  /* ── Footer / Pagination ── */
  .oc-footer {
    padding: 15px 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border-top: 1.5px solid var(--oc-border);
    background: var(--oc-bg);
  }
  .oc-footer-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .oc-rows-label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--oc-muted);
    white-space: nowrap;
  }
  .oc-select-rows {
    height: 34px !important;
    width: 76px !important;
    font-size: 13px !important;
    border: 1.5px solid var(--oc-border) !important;
    border-radius: 7px !important;
    background: var(--oc-surface) !important;
    color: var(--oc-text) !important;
    box-shadow: none !important;
    padding: 0 8px !important;
    transition: border-color .18s !important;
  }
  .oc-select-rows:hover {
    border-color: rgba(127,119,221,.5) !important;
  }
  .oc-total-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, var(--oc-accent-light), rgba(59,130,246,.15));
    color: var(--oc-accent);
    border: 1px solid rgba(127,119,221,.25);
    border-radius: 20px;
    padding: 5px 13px;
    font-size: 12px;
    font-weight: 700;
  }

  /* Pagination */
  .oc-pagination .page-item .page-link {
    border: 1.5px solid var(--oc-border) !important;
    border-radius: 7px !important;
    margin: 0 2px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--oc-muted) !important;
    padding: 5px 11px;
    transition: all .15s;
    background: var(--oc-surface) !important;
    box-shadow: none !important;
    font-family: 'Inter', sans-serif;
  }
  .oc-pagination .page-item.active .page-link {
    background: linear-gradient(135deg, var(--oc-accent), #3B82F6) !important;
    border-color: var(--oc-accent) !important;
    color: #fff !important;
    box-shadow: 0 3px 10px rgba(127,119,221,.32) !important;
  }
  .oc-pagination .page-item:not(.active):not(.disabled) .page-link:hover {
    background: var(--oc-accent-light) !important;
    border-color: var(--oc-accent) !important;
    color: var(--oc-accent) !important;
    transform: translateY(-1px);
  }
  .oc-pagination .page-item.disabled .page-link {
    opacity: .35;
    pointer-events: none;
  }

  /* Sort icon colours */
  .sort-icon-muted  { color: var(--oc-border); }
  .sort-icon-active { color: var(--oc-accent); }

  .oc-loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    background: rgba(10, 11, 13, 0.8) !important;
    backdrop-filter: blur(4px);
    z-index: 1000;
    font-size: 14.5px;
    font-weight: 600;
    color: var(--oc-text);
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--oc-surface);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--oc-border);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--oc-accent);
  }
`;

const OptionChain = () => {
  const formatValue = (val, isNumber = false) => {
    if (val === null || val === undefined || val === "") return "-";
    return isNumber ? Number(val).toLocaleString() : val;
  };

  const parseDDMMYYYY = (str) => {
    if (!str) return 0;
    const [d, m, y] = str.split("-");
    return new Date(`${y}-${m}-${d}`).getTime();
  };

  const parseYYYYMMDD = (str) => {
    if (!str) return 0;
    return new Date(str).getTime();
  };

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [stockFilter, setStockFilter] = useState("TCS");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [filterDate, setFilterDate] = useState("2025-01-01");
  const [appliedFilterDate, setAppliedFilterDate] = useState("2025-01-01");

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const filterDateRef = useRef(null);

  const [uniqueStocks, setUniqueStocks] = useState([]);
  const [uniqueExpiries, setUniqueExpiries] = useState([]);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await apiService.get("/options/symbols");
        if (Array.isArray(res)) setUniqueStocks(res);
        else if (res?.data && Array.isArray(res.data))
          setUniqueStocks(res.data);
      } catch (err) {
        console.error("Error fetching symbols:", err);
      }
    };
    fetchSymbols();

    // Setup websocket for live strategy ticks
    const socket = getStrategySocket();
    const handleLiveTick = (payload) => {
      if (!payload || !payload.symbol || !payload.tick) return;

      setData((prevData) =>
        prevData.map((item) => {
          const itemSymbol = item._symbol || item.symbol;
          if (itemSymbol === payload.symbol) {
            return {
              ...item,
              open: payload.tick.open,
              high: payload.tick.high,
              low: payload.tick.low,
              close: payload.tick.close,
              volume: payload.tick.volume,
              oi:
                payload.tick.open_interest !== undefined
                  ? payload.tick.open_interest
                  : item.oi,
            };
          }
          return item;
        }),
      );
    };

    // Listening to a few likely event names since it wasn't specified
    socket.on("live_tick", handleLiveTick);
    socket.on("tick", handleLiveTick);
    socket.on("strategy_live_tick", handleLiveTick);
    socket.on("strategy_tick", handleLiveTick);

    return () => {
      socket.off("live_tick", handleLiveTick);
      socket.off("tick", handleLiveTick);
      socket.off("strategy_live_tick", handleLiveTick);
      socket.off("strategy_tick", handleLiveTick);
    };
  }, []);

  useEffect(() => {
    const fetchExpiries = async () => {
      if (stockFilter) {
        try {
          const res = await apiService.get("/options/expiries", {
            stockName: stockFilter,
          });
          let expiries = [];
          if (Array.isArray(res)) expiries = res;
          else if (res?.data && Array.isArray(res.data)) expiries = res.data;
          
          setUniqueExpiries(expiries);
          
          if (expiries.length > 0) {
            const latest = expiries[0];
            setExpiryFilter(latest?.expiryDate || latest?.date || latest);
          }
        } catch (err) {
          console.error("Error fetching expiries:", err);
        }
      } else {
        setUniqueExpiries([]);
      }
    };
    fetchExpiries();
  }, [stockFilter]);

  const sortKey = sortConfig.key;
  const sortDirection = sortConfig.direction;

  const fetchTableData = useCallback(async () => {
    if (!stockFilter || !expiryFilter) return;

    let formattedDate = "";
    if (appliedFilterDate) {
      const [year, month, day] = appliedFilterDate.split('-');
      formattedDate = `${day}-${month}-${year}`;
    }

    const params = {
      limit: "all",
      ...(stockFilter && { stockName: stockFilter }),
      ...(expiryFilter && { expiryDate: expiryFilter }),
      ...(formattedDate && { date: formattedDate }),
      ...(sortKey && { sortBy: sortKey }),
      ...(sortKey && { sortOrder: sortDirection === "asc" ? "DESC" : "ASC" }),
    };
    setIsLoading(true);
    try {
      const res = await apiService.get("/options/data-table", params);
      let records = [];
      let total = 0;
      if (res?.data && Array.isArray(res.data)) {
        records = res.data;
        total =
          res?.pagination?.totalRecords ??
          res.totalRecords ??
          res.pagination?.total ??
          res.total ??
          records.length;
      } else if (res?.records && Array.isArray(res.records)) {
        records = res.records;
        total =
          res?.pagination?.totalRecords ??
          res.totalRecords ??
          res.total ??
          records.length;
      } else if (Array.isArray(res)) {
        records = res;
        total = res.length;
      }
      setData(records);
      setTotalRecords(total);
    } catch (err) {
      console.error("Error fetching table data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    stockFilter,
    expiryFilter,
    appliedFilterDate,
    sortKey,
    sortDirection,
  ]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const handleApplyDateRange = () => {
    const expiryTime = parseDDMMYYYY(expiryFilter);
    const selectedDateTime = parseYYYYMMDD(filterDate);
    if (expiryTime > 0 && selectedDateTime > 0 && expiryTime < selectedDateTime) {
      toast.error('Expiry cannot be less than the selected date', { theme: 'dark' });
      return;
    }
    setAppliedFilterDate(filterDate);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setStockFilter("TCS");
    if (uniqueExpiries.length > 0) {
      const latest = uniqueExpiries[0];
      setExpiryFilter(latest?.expiryDate || latest?.date || latest);
    } else {
      setExpiryFilter("");
    }
    setFilterDate("2025-01-01");
    setAppliedFilterDate("2025-01-01");
    setSortConfig({ key: null, direction: "asc" });
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <FaSort className="sort-icon-muted" size={10} />;
    if (sortConfig.direction === "asc")
      return <FaSortUp className="sort-icon-active" size={10} />;
    return <FaSortDown className="sort-icon-active" size={10} />;
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const groupedOptionChain = React.useMemo(() => {
    if (!data || !data.length) return [];
    const strikesMap = {};
    data.forEach((item) => {
      const strike = parseFloat(item.strike);
      const timeKey = item.timestamp_epoch || item.timestamp_ist || item.date_ist || "unknown";
      const key = `${timeKey}_${strike}`;
      
      if (!strikesMap[key]) {
        strikesMap[key] = { key, strike, time: timeKey, date_ist: item.date_ist, CE: null, PE: null };
      }
      if (item.optionType === "CE" || item.request_option_type === "CE") {
        strikesMap[key].CE = item;
      } else if (item.optionType === "PE" || item.request_option_type === "PE") {
        strikesMap[key].PE = item;
      }
    });
    return Object.values(strikesMap).sort((a, b) => {
      if (a.time !== b.time) {
         if (a.time > b.time) return -1;
         if (a.time < b.time) return 1;
      }
      return a.strike - b.strike;
    });
  }, [data]);

  const columns = [
    { key: "date_ist", label: "Date" },
    { key: "_stock_name", label: "Symbol" },
    { key: "expiry_date", label: "Expiry" },
    { key: "strike", label: "Strike" },
    { key: "request_option_type", label: "Type" },
    { key: "open", label: "Open" },
    { key: "high", label: "High" },
    { key: "low", label: "Low" },
    { key: "close", label: "Close" },
    { key: "volume", label: "Volume" },
    { key: "oi", label: "OI" },
    { key: "iv", label: "IV" },
  ];

  const todayDateStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <style>{styles}</style>

      <div className="oc-page">
        {/* Header */}
        <div className="oc-header">
          <div className="oc-title-group">
            <div className="oc-header-icon-wrap">
              <FaLayerGroup />
            </div>
            <div>
              <h2 className="oc-title">Option Chain Scanner</h2>
              <p className="oc-subtitle">
                Filter, sort, and analyse historical options data
              </p>
            </div>
          </div>
          {/* <span className="oc-live-pill">
            <span className="oc-live-dot" />
            Live
          </span> */}
        </div>

        {/* Filters */}
        <div className="oc-filter-card">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <label className="oc-filter-label">Stock Name</label>
              <Select
                options={[
                  { value: "", label: "All Stocks" },
                  ...uniqueStocks.map((stock) => {
                    const v = stock?.symbol || stock?.stockName || stock;
                    return { value: v, label: v };
                  }),
                ]}
                value={{
                  value: stockFilter,
                  label: stockFilter || "All Stocks",
                }}
                onChange={(selected) => {
                  setStockFilter(selected ? selected.value : "");
                  setExpiryFilter("");
                  setCurrentPage(1);
                }}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "var(--oc-surface)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "9px",
                    color: "var(--oc-text)",
                    minHeight: "42px",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "rgba(127,119,221,0.5)",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "var(--text-primary)",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    zIndex: 9999,
                  }),
                  menuList: (base) => ({
                    ...base,
                    "::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "::-webkit-scrollbar-thumb": {
                      background: "rgba(128, 128, 128, 0.5)",
                      borderRadius: "10px",
                    },
                    "::-webkit-scrollbar-thumb:hover": {
                      background: "rgba(128, 128, 128, 0.8)",
                    },
                  }),
                  option: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: isFocused
                      ? "var(--border-color)"
                      : "transparent",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "var(--text-primary)",
                  }),
                }}
              />
            </Col>

            <Col md={3}>
              <Form.Group className="mb-0">
                <label className="oc-filter-label">Expiry Date</label>
                <Form.Select
                  value={expiryFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpiryFilter(val);
                    
                    if (val) {
                      const [d, m, y] = val.split("-");
                      const dateObj = new Date(`${y}-${m}-${d}`);
                      if (!isNaN(dateObj.getTime())) {
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        setFilterDate(formattedDate);
                        setAppliedFilterDate(formattedDate);
                      }
                    }
                    
                    setCurrentPage(1);
                  }}
                  className="oc-select"
                  disabled={!stockFilter && uniqueExpiries.length === 0}
                >
                  {uniqueExpiries.map((expiry, idx) => {
                    const v = expiry?.expiryDate || expiry?.date || expiry;
                    return (
                      <option key={idx} value={v}>
                        {v}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <label className="oc-filter-label">Date</label>
              <InputGroup>
                <InputGroup.Text 
                  className="oc-input-icon" 
                  onClick={() => filterDateRef.current?.showPicker && filterDateRef.current.showPicker()}
                >
                  <FaCalendarAlt size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  ref={filterDateRef}
                  value={filterDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selectedDateTime = parseYYYYMMDD(val);
                    const expiryTime = parseDDMMYYYY(expiryFilter);
                    if (expiryTime > 0 && selectedDateTime > 0 && expiryTime < selectedDateTime) {
                       toast.error('Expiry cannot be less than the selected date', { theme: 'dark' });
                       return;
                    }
                    setFilterDate(val);
                    setAppliedFilterDate(val);
                    setCurrentPage(1);
                  }}
                  className="oc-select oc-date-input"
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <label className="oc-filter-label">&nbsp;</label>
              <div className="d-flex gap-2">
                <Button
                  className="oc-btn-apply w-50 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleApplyDateRange}
                >
                  <FaFilter size={12} /> Apply Filters
                </Button>
                <Button
                  className="oc-btn-reset w-50 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleResetFilters}
                  title="Reset all filters"
                >
                  <FaUndo size={12} /> Reset
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="oc-table-card" style={{ position: "relative" }}>
          {isLoading && (
            <div className="oc-loading-overlay">
              <Spinner
                animation="border"
                style={{ color: "#3B82F6", width: "3rem", height: "3rem" }}
              />
              <span style={{ letterSpacing: "0.5px" }}>Loading options chain...</span>
            </div>
          )}
          <div
            className="table-responsive"
            style={{
              filter: isLoading ? "blur(3px)" : "none",
              transition: "filter 0.2s ease",
            }}
          >
            <Table className="oc-table">
              <thead>
                <tr>
                  <th colSpan="7" style={{ textAlign: "center", borderRight: "2px solid var(--oc-border)" }}>CALLS</th>
                  <th style={{ textAlign: "center", borderRight: "2px solid var(--oc-border)" }}>STRIKE</th>
                  <th colSpan="7" style={{ textAlign: "center" }}>PUTS</th>
                </tr>
                <tr>
                  {/* CE Columns */}
                  <th style={{ textAlign: "center" }}>OI</th>
                  <th style={{ textAlign: "center" }}>Vol</th>
                  <th style={{ textAlign: "center" }}>IV</th>
                  <th style={{ textAlign: "center" }}>Close</th>
                  <th style={{ textAlign: "center" }}>High</th>
                  <th style={{ textAlign: "center" }}>Low</th>
                  <th style={{ textAlign: "center", borderRight: "2px solid var(--oc-border)" }}>Open</th>
                  
                  {/* Strike */}
                  <th style={{ textAlign: "center", borderRight: "2px solid var(--oc-border)" }}>Price</th>
                  
                  {/* PE Columns */}
                  <th style={{ textAlign: "center" }}>Open</th>
                  <th style={{ textAlign: "center" }}>Low</th>
                  <th style={{ textAlign: "center" }}>High</th>
                  <th style={{ textAlign: "center" }}>Close</th>
                  <th style={{ textAlign: "center" }}>IV</th>
                  <th style={{ textAlign: "center" }}>Vol</th>
                  <th style={{ textAlign: "center" }}>OI</th>
                </tr>
              </thead>
              <tbody>
                {groupedOptionChain.map((row, idx) => (
                  <tr key={row.key || row.strike || idx}>
                    {/* CE Cells */}
                    <td className="oc-cell-muted oc-mono">{row.CE ? formatValue(row.CE.oi, true) : "-"}</td>
                    <td className="oc-cell-muted oc-mono">{row.CE ? formatValue(row.CE.volume, true) : "-"}</td>
                    <td className="oc-cell-muted oc-mono">{row.CE ? formatValue(row.CE.iv) : "-"}</td>
                    <td className="oc-cell-close oc-mono">{row.CE ? formatValue(row.CE.close) : "-"}</td>
                    <td className="oc-cell-high oc-mono">{row.CE ? formatValue(row.CE.high) : "-"}</td>
                    <td className="oc-cell-low oc-mono">{row.CE ? formatValue(row.CE.low) : "-"}</td>
                    <td className="oc-cell-muted oc-mono" style={{ borderRight: "2px solid var(--oc-border)" }}>{row.CE ? formatValue(row.CE.open) : "-"}</td>
                    
                    {/* Strike Cell */}
                    <td className="oc-cell-strike oc-mono" style={{ borderRight: "2px solid var(--oc-border)", fontWeight: "900", backgroundColor: "var(--oc-border)", color: "var(--oc-text)", fontSize: "15px" }}>
                      {formatValue(row.strike)}
                    </td>
                    
                    {/* PE Cells */}
                    <td className="oc-cell-muted oc-mono">{row.PE ? formatValue(row.PE.open) : "-"}</td>
                    <td className="oc-cell-low oc-mono">{row.PE ? formatValue(row.PE.low) : "-"}</td>
                    <td className="oc-cell-high oc-mono">{row.PE ? formatValue(row.PE.high) : "-"}</td>
                    <td className="oc-cell-close oc-mono">{row.PE ? formatValue(row.PE.close) : "-"}</td>
                    <td className="oc-cell-muted oc-mono">{row.PE ? formatValue(row.PE.iv) : "-"}</td>
                    <td className="oc-cell-muted oc-mono">{row.PE ? formatValue(row.PE.volume, true) : "-"}</td>
                    <td className="oc-cell-muted oc-mono">{row.PE ? formatValue(row.PE.oi, true) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          <div style={{ padding: "15px", textAlign: "center", fontWeight: "bold", color: "var(--oc-text)" }}>
            Total Records Displayed: {totalRecords}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default OptionChain;
