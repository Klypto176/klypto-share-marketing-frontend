import React, { useState, useMemo, useRef, useEffect, startTransition } from "react";
import { FiSearch, FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { BsGrid, BsBell } from "react-icons/bs";
import apiService from "../../services/apiServices";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, logout, getUser } from "../../pages/auth/protected";
import useSocket from "../../util/useSocket";
import logo from "../../assets/Logo.png";
import Swal from "sweetalert2";

const mergeRealtimeIntoStock = (stock, payload) => {
  const livePrice =
    payload?.ltp ??
    payload?.last_traded_price ??
    payload?.data?.last_traded_price ??
    payload?.data?.close ??
    stock?.ltp ??
    "0.00";

  const closeRefRaw =
    payload?.close_price ??
    payload?.close ??
    payload?.raw?.close_price ??
    payload?.raw?.close ??
    0;

  const lastPrice = parseFloat(livePrice);
  const closeRef = parseFloat(closeRefRaw);
  const canRecalc = Number.isFinite(lastPrice) && Number.isFinite(closeRef) && closeRef > 0;
  const computedChange = canRecalc ? lastPrice - closeRef : null;
  const computedPercent = canRecalc ? ((computedChange / closeRef) * 100).toFixed(2) : null;

  return {
    ...stock,
    ...payload,
    ltp: Number.isFinite(lastPrice) ? lastPrice.toFixed(2) : stock?.ltp,
    change:
      payload?.change ??
      payload?.net_change ??
      payload?.raw?.net_change ??
      (computedChange !== null
        ? `${computedChange >= 0 ? "+" : ""}${computedChange.toFixed(2)}`
        : stock?.change),
    percent_change:
      payload?.percent_change ??
      payload?.pChange ??
      payload?.percentChange ??
      payload?.raw?.percent_change ??
      payload?.raw?.percentChange ??
      computedPercent ??
      stock?.percent_change,
  };
};

const Navbar = ({
  setSelectedCurrency,
  predictCount = 0,
  onBellClick,
  activeTab,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [topIndex, setTopIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const authenticated = isAuthenticated();
  const pendingRealtimeUpdatesRef = useRef(new Map());
  const realtimeFlushTimerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    const result = await Swal.fire({
      title: "Log out?",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef5350",
      background: "var(--bg-secondary)",
      color: "var(--text-primary)",
    });

    if (result.isConfirmed) {
      logout();
      navigate("/login");
    }
  };

  const searchContainerRef = useRef(null);

  const flushRealtimeUpdates = () => {
    realtimeFlushTimerRef.current = null;
    const pendingUpdates = pendingRealtimeUpdatesRef.current;
    if (!pendingUpdates.size) return;

    pendingRealtimeUpdatesRef.current = new Map();

    startTransition(() => {
      setStocks((prev) => {
        let hasChanges = false;
        const next = prev.map((stock) => {
          const payload = pendingUpdates.get(String(stock.token));
          if (!payload) return stock;
          hasChanges = true;
          return mergeRealtimeIntoStock(stock, payload);
        });

        return hasChanges ? next : prev;
      });

      setTopIndex((prev) => {
        if (!prev) return prev;

        const matchingByToken = prev.token
          ? pendingUpdates.get(String(prev.token))
          : null;

        const matchingByName = matchingByToken
          || Array.from(pendingUpdates.values()).find((payload) => {
            const payloadName = String(
              payload?.name || payload?.symbol || payload?.symbolWithEq || "",
            )
              .replace("-EQ", "")
              .toUpperCase();
            return prev.name?.toUpperCase() === payloadName;
          });

        return matchingByName
          ? mergeRealtimeIntoStock(prev, matchingByName)
          : prev;
      });
    });
  };

  const queueRealtimeUpdate = (payload) => {
    if (!payload?.token) return;

    pendingRealtimeUpdatesRef.current.set(String(payload.token), payload);
    if (!realtimeFlushTimerRef.current) {
      realtimeFlushTimerRef.current = setTimeout(flushRealtimeUpdates, 120);
    }
  };

  // ✅ Fetch stocks from API on mount
  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await apiService.get("equity/stocks");
        setStocks(response?.stocks || []);
      } catch (err) {
        console.error("Failed to fetch stocks:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTopIndex = async () => {
      try {
        const response = await apiService.get("equity/indices");
        const indices = response?.data || [];
        const nifty =
          indices.find((item) => item.name?.toUpperCase() === "NIFTY") ||
          indices[0] ||
          null;
        setTopIndex(nifty);
      } catch (err) {
        console.error("Failed to fetch top index:", err);
      }
    };

    fetchStocks();
    fetchTopIndex();
  }, []);

  useSocket({
    handleStockUpdate: (updatedStock) => {
      queueRealtimeUpdate(updatedStock);
    },
    handleLiveTick: (tick) => {
      queueRealtimeUpdate(tick);
    },
  });

  useEffect(() => {
    return () => {
      if (realtimeFlushTimerRef.current) {
        clearTimeout(realtimeFlushTimerRef.current);
        realtimeFlushTimerRef.current = null;
      }
      pendingRealtimeUpdatesRef.current.clear();
    };
  }, []);

  // ✅ Format numbers to Indian locale
  const formatLtp = (ltp) => {
    const num = parseFloat(ltp);
    if (isNaN(num)) return ltp;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const topIndexDisplay = useMemo(() => {
    const fallback = {
      name: "NIFTY",
      ltp: "0.00",
      change: "0.00",
      percent_change: "0.00",
    };
    const item = topIndex || fallback;
    const percent = parseFloat(item.percent_change ?? item.pChange ?? 0);
    const change = parseFloat(item.change ?? 0);
    const isUp = (!Number.isNaN(percent) ? percent : change) >= 0;
    return {
      ...item,
      isUp,
      color: isUp ? "#26a69a" : "#ef5350",
      arrow: isUp ? "▲" : "▼",
      formattedLtp: formatLtp(item.ltp ?? "0.00"),
      formattedChange: !Number.isNaN(change)
        ? `${isUp ? "+" : ""}${change.toFixed(2)}`
        : String(item.change ?? "0.00"),
      formattedPercent: !Number.isNaN(percent)
        ? `${isUp ? "+" : ""}${percent.toFixed(2)}%`
        : `${item.percent_change ?? item.pChange ?? "0.00"}%`,
    };
  }, [topIndex]);

  // ✅ Filter stocks based on search term
  const filteredStocks = useMemo(() => {
    if (!searchTerm.trim()) return stocks.slice(0, 8); // ✅ default 8 shown immediately
    return stocks
      .filter(
        (s) =>
          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.userCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 10);
  }, [searchTerm, stocks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Badge type from segment
  const getBadgeType = (stock) => {
    const seg = stock.segment?.toUpperCase() || "";
    if (seg.includes("FUT")) return "FUT";
    if (seg.includes("OPT") || stock.strike) return "OPT";
    return "EQ";
  };

  const styles = {
    navbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "16px",
      padding: "6px 24px",
      backgroundColor: "var(--bg-primary)",
      borderBottom: "1px solid var(--border-color)",
      color: "var(--text-primary)",
      height: "50px",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    leftSection: { display: "flex", alignItems: "center", gap: "24px" },
    chartTabs: {
      display: "flex",
      alignItems: "center",
      gap: "2px",
      flexShrink: 0,
    },
    chartTab: (active) => ({
      border: "none",
      borderBottom: active
        ? "2px solid var(--accent-color)"
        : "2px solid transparent",
      background: "transparent",
      color: active ? "var(--accent-color)" : "var(--text-secondary)",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: active ? 600 : 500,
      height: "38px",
      padding: "0 8px",
      whiteSpace: "nowrap",
    }),
    logoContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: "var(--text-primary)",
      fontWeight: "bold",
      fontSize: "1.2rem",
    },
    logoIcon: { color: "var(--accent-color)", fontSize: "1.5rem" },
    indexData: { display: "flex", flexDirection: "column", fontSize: "0.8rem" },
    indexName: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      fontWeight: "600",
    },
    expiryTag: {
      fontSize: "0.6rem",
      backgroundColor: "rgba(239,83,80,0.1)",
      color: "#ef5350",
      padding: "2px 4px",
      borderRadius: "4px",
    },
    indexValues: { display: "flex", gap: "8px", fontWeight: "500" },

    // Search
    searchContainer: { position: "relative", flex: "0 1 420px" },
    searchForm: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "var(--bg-secondary)",
      borderRadius: "6px",
      padding: "7px 12px",
      border: "1px solid var(--border-color)",
    },
    searchInput: {
      border: "none",
      backgroundColor: "transparent",
      color: "var(--text-primary)",
      outline: "none",
      width: "100%",
      marginLeft: "8px",
      fontSize: "0.75rem",
    },

    // Dropdown
    dropdown: {
      position: "absolute",
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      backgroundColor: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
      zIndex: 1000,
      overflow: "hidden",
      maxHeight: "420px",
      overflowY: "auto",
    },
    dropdownHeader: {
      padding: "8px 14px 6px",
      fontSize: "0.7rem",
      fontWeight: "600",
      color: "var(--text-secondary)",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      borderBottom: "1px solid var(--border-color)",
      position: "sticky",
      top: 0,
      backgroundColor: "var(--bg-secondary)",
    },
    resultItem: {
      display: "flex",
      alignItems: "center",
      padding: "9px 14px",
      cursor: "pointer",
      gap: "10px",
      borderBottom: "1px solid #23262f",
      transition: "background 0.12s",
    },

    // Badge
    badge: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.58rem",
      fontWeight: "700",
      flexShrink: 0,
      letterSpacing: "0.02em",
    },
    badgeEQ: {
      background: "rgba(41,98,255,0.12)",
      color: "var(--accent-color)",
      border: "1px solid rgba(41,98,255,0.25)",
    },
    badgeFUT: {
      background: "rgba(255,171,0,0.1)",
      color: "#ffab00",
      border: "1px solid rgba(255,171,0,0.22)",
    },
    badgeOPT: {
      background: "rgba(100,181,246,0.1)",
      color: "#64b5f6",
      border: "1px solid rgba(100,181,246,0.22)",
    },

    // Item info
    itemInfo: { flex: 1, minWidth: 0 },
    itemTop: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "0.85rem",
      fontWeight: "600",
      color: "var(--text-primary)",
    },
    itemSub: {
      fontSize: "0.72rem",
      color: "var(--text-secondary)",
      marginTop: "2px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    // Tags
    tag: {
      fontSize: "0.6rem",
      padding: "1px 5px",
      borderRadius: "3px",
      fontWeight: "600",
      flexShrink: 0,
    },
    tagNSE: { background: "rgba(78,205,196,0.1)", color: "#4ecdc4" },
    tagBSE: { background: "rgba(150,117,255,0.1)", color: "#9675ff" },
    tagFO: { background: "rgba(255,171,0,0.1)", color: "#ffab00" },
    tagPE: { background: "rgba(239,83,80,0.1)", color: "#ef5350" },
    tagCE: { background: "rgba(38,166,154,0.1)", color: "#26a69a" },

    // Price
    itemPrice: { textAlign: "right", flexShrink: 0 },
    ltp: { fontSize: "0.88rem", fontWeight: "600" },
    priceChange: { fontSize: "0.7rem", marginTop: "2px" },

    // Right section
    rightSection: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginLeft: "auto",
    },
    navLinks: { display: "flex", gap: "20px", alignItems: "center" },
    navLink: {
      color: "var(--text-primary)",
      textDecoration: "none",
      fontSize: "0.9rem",
      fontWeight: "500",
      cursor: "pointer",
    },
    navLinkActive: { color: "var(--accent-color)" },
    iconButton: {
      background: "transparent",
      border: "none",
      color: "var(--text-primary)",
      cursor: "pointer",
      fontSize: "1.2rem",
      display: "flex",
      alignItems: "center",
      padding: "4px",
    },
    avatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#e0e3eb",
      color: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "0.9rem",
      cursor: "pointer",
    },
    avatarButton: {
      background: "transparent",
      border: "none",
      padding: 0,
      borderRadius: "50%",
      display: "flex",
      cursor: "pointer",
    },
    profileMenuContainer: {
      position: "relative",
      display: "flex",
    },
    profileDropdown: {
      position: "absolute",
      top: "calc(100% + 8px)",
      right: 0,
      width: "200px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
      zIndex: 1100,
      overflow: "hidden",
    },
    profileInfo: {
      padding: "12px 14px",
    },
    profileName: {
      color: "var(--text-primary)",
      fontSize: "0.85rem",
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    profileEmail: {
      color: "var(--text-secondary)",
      fontSize: "0.75rem",
      marginTop: "3px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    profileDivider: {
      height: "1px",
      background: "var(--border-color)",
    },
    profileInfoDivider: {
      height: "1px",
      backgroundColor: "#4b5563",
      margin: "0 12px",
      opacity: 0.8,
    },
    logoutMenuButton: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "none",
      background: "transparent",
      color: "#ef5350",
      padding: "10px 14px",
      cursor: "pointer",
      fontSize: "0.8rem",
      fontWeight: 600,
      textAlign: "left",
    },
    profileThemeButton: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "none",
      background: "transparent",
      color: "var(--text-primary)",
      padding: "10px 14px",
      cursor: "pointer",
      fontSize: "0.8rem",
      fontWeight: 500,
      textAlign: "left",
    },
  };

  // ✅ Resolve tag style by segment string
  const getSegmentTagStyle = (segment = "") => {
    const s = segment.toUpperCase();
    if (s.includes("BSE")) return styles.tagBSE;
    if (s.includes("FO") || s.includes("NFO")) return styles.tagFO;
    return styles.tagNSE;
  };
  const chartTabs = [
    "Chart",
    "Overview",
    "Option Chain",
    "OI Analytics",
    "Backtest",
  ];

  return (
    <div style={styles.navbar}>
      {/* Left */}
      <div style={styles.leftSection}>
        <div style={styles.logoContainer}>
          <button 
            className="d-md-none" 
            onClick={() => setIsMobileMenuOpen(true)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', marginRight: '8px', padding: 0 }}
          >
            ☰
          </button>
          <img 
            src={logo} 
            alt="Klypto Logo" 
            style={{ width:"30px", height:"30px" }}
          />
        </div>
      </div>

      {activeTab && setActiveTab && (
        <div className="d-none d-lg-flex" style={styles.chartTabs}>
          {chartTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={styles.chartTab(activeTab === tab)}
            >
              {tab === "OI Analytics" ? "OI Analytics" : tab}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="d-none d-sm-block" style={styles.searchContainer} ref={searchContainerRef}>
        <form
          style={styles.searchForm}
          onSubmit={(e) => {
            e.preventDefault();
            setShowRecent(false);
          }}
        >
          <FiSearch color="var(--text-secondary)" size={15} />
          <input
            style={styles.searchInput}
            placeholder="Search stocks, indices…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowRecent(true)}
          />
          {searchTerm && (
            <span
              onClick={() => setSearchTerm("")}
              style={{
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ✕
            </span>
          )}
        </form>

        {showRecent && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              {searchTerm ? `Results for "${searchTerm}"` : "Recent"}
            </div>

            {loading ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                Loading…
              </div>
            ) : filteredStocks?.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                No results found
              </div>
            ) : (
              filteredStocks.map((stock, idx) => {
                const badgeType = getBadgeType(stock);
                const isUp =
                  parseFloat(stock.change) >= 0 ||
                  stock.sentiment === "bullish";
                const color = isUp ? "#26a69a" : "#ef5350";
                const arrow = isUp ? "▲" : "▼";
                const changeVal = stock.change
                  ? `${arrow} ${isUp ? "+" : ""}${stock.change} (${stock.percent_change}%)`
                  : null;

                return (
                  <div
                    key={stock.token || idx}
                    style={styles.resultItem}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--border-color)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                    onClick={() => {
                      const type = stock.strike
                        ? "OPTIONS"
                        : stock.segment?.includes("FUT")
                          ? "FUTURES"
                          : "EQUITY";

                      setSelectedCurrency((prev) => {
                        if (prev?.token === stock.token) return prev;
                        
                        return {
                          symbol: stock.actualSymbol || stock.name,
                          name: stock.name,
                          token: stock.token,
                          exchange: stock.segment,
                          type,
                          strike: stock.strike || null,
                          optionType: stock.optionType || null,
                          expiry: stock.expiry || null,
                        };
                      });

                      setSearchTerm("");
                      setShowRecent(false);
                    }}
                  >
                    {/* Badge */}
                    <div
                      style={{
                        ...styles.badge,
                        ...styles[`badge${badgeType}`],
                      }}
                    >
                      {badgeType}
                    </div>

                    {/* Info */}
                    <div style={styles.itemInfo}>
                      <div style={styles.itemTop}>
                        <span>{stock.name}</span>
                        <span
                          style={{
                            ...styles.tag,
                            ...getSegmentTagStyle(stock.segment),
                          }}
                        >
                          {stock.segment}
                        </span>
                        {stock.optionType === "PE" && (
                          <span style={{ ...styles.tag, ...styles.tagPE }}>
                            PE
                          </span>
                        )}
                        {stock.optionType === "CE" && (
                          <span style={{ ...styles.tag, ...styles.tagCE }}>
                            CE
                          </span>
                        )}
                      </div>
                      <div style={styles.itemSub}>
                        {stock.expiry
                          ? `${stock.expiry}${stock.strike ? ` · Strike ${stock.strike}` : ""}`
                          : stock.fullName}
                      </div>
                    </div>

                    {/* Price */}
                    <div style={styles.itemPrice}>
                      <div style={{ ...styles.ltp, color }}>
                        {formatLtp(stock.ltp)}
                      </div>
                      {changeVal && (
                        <div style={{ ...styles.priceChange, color }}>
                          {changeVal}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={styles.rightSection}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            borderLeft: "1px solid var(--border-color)",
            paddingLeft: "20px",
          }}
        >
          <button 
            style={{ ...styles.iconButton, position: "relative" }}
            onClick={onBellClick}
          >
            <BsBell />
            {predictCount > 0 && (
              <span style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                background: "#ef5350",
                color: "white",
                borderRadius: "50%",
                padding: "2px 5px",
                fontSize: "10px",
                fontWeight: "bold",
                lineHeight: "1"
              }}>
                {predictCount}
              </span>
            )}
          </button>
          
          {/* Theme Toggle */}
          {/* <button style={styles.iconButton} onClick={toggleTheme} title="Toggle Theme"> */}
            {/* {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button> */}
          {authenticated ? (
            <div ref={profileMenuRef} style={styles.profileMenuContainer}>
              <button
                type="button"
                style={styles.avatarButton}
                title="Open profile menu"
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((open) => !open)}
              >
                <div style={styles.avatar}>
                  {user?.firstName
                    ? user.firstName.split(" ").map((name) => name[0]).join("").substring(0, 2).toUpperCase()
                    : "U"}
                </div>
              </button>
              {isProfileMenuOpen && (
                <div style={styles.profileDropdown} role="menu">
                  <div style={styles.profileInfo}>
                    <div style={styles.profileName}>{user?.firstName + " " + user?.lastName}</div>
                    <div style={styles.profileEmail}>{user?.email || ""}</div>
                  </div>
                  <div style={styles.profileInfoDivider} />
                  <button
                    type="button"
                    style={styles.profileThemeButton}
                    role="menuitem"
                    onClick={toggleTheme}
                    title="Toggle theme"
                  >
                    {theme === "dark" ? <FiSun size={15} /> : <FiMoon size={15} />}
                    <span>Theme</span>
                  </button>
                  <div style={styles.profileDivider} />
                  <button
                    type="button"
                    style={styles.logoutMenuButton}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              title="Signup"
              onClick={() => navigate("/signup")}
              style={d.btnPrimary}
            >
              <span>Signup</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "var(--bg-primary)", zIndex: 9999,
          padding: "20px", display: "flex", flexDirection: "column", gap: "20px",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.logoContainer}>
              <BsGrid style={styles.logoIcon} />
              <span>Algo Mobile</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem' }}
            >
              ✕
            </button>
          </div>
          
          <div style={{...styles.indexData, fontSize: '1rem', padding: '10px 0', borderBottom: '1px solid var(--border-color)'}}>
            <div style={styles.indexName}>
              <span>{topIndexDisplay.name || "NIFTY"}</span>
              <span style={styles.expiryTag}>EXPIRY</span>
            </div>
            <div style={styles.indexValues}>
              <span style={{ color: topIndexDisplay.color }}>
                {topIndexDisplay.formattedLtp}
              </span>
              <span style={{ color: topIndexDisplay.color }}>
                {topIndexDisplay.arrow} {topIndexDisplay.formattedChange} ({topIndexDisplay.formattedPercent})
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Navbar;
