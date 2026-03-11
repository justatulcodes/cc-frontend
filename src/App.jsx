import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DataCacheProvider } from "./contexts/DataCacheContext";
import Sidebar from "./components/Sidebar";
import LeadsPasswordModal from "./components/LeadsPasswordModal";
import LoginPage from "./pages/LoginPage";
import LiveDashboard from "./pages/LiveDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import LeadsPage from "./pages/LeadsPage";
import DemoPage from "./pages/DemoPage";
import ChatViewPage from "./pages/ChatViewPage"; 
import LeadsDetailsPage from "./pages/LeadsDetailsPage";

const CalendarIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const VALID_TABS = new Set(["live", "analytics", "leads", "demo"]);
const TAB_PATHS = {
  live: "/live",
  analytics: "/analytics",
  leads: "/leads",
  demo: "/demo",
};

function getRouteState(pathname) {
  if (!pathname || pathname === "/") return { tab: "live", conversationId: null, isKnown: true };
  if (pathname.startsWith("/chat/")) {
    const rawId = pathname.slice("/chat/".length);
    return {
      tab: "chat_view",
      conversationId: rawId ? decodeURIComponent(rawId) : null,
      isKnown: Boolean(rawId),
    };
  }
  if (pathname.startsWith("/leads/")) {
    const rawId = pathname.slice("/leads/".length);
    return {
      tab: "leads_detail",
      conversationId: null,
      isKnown: Boolean(rawId),
    };
  }

  const tab = Object.entries(TAB_PATHS).find(([, path]) => path === pathname)?.[0] ?? null;
  return { tab: tab ?? "live", conversationId: null, isKnown: Boolean(tab) };
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = useMemo(() => getRouteState(location.pathname), [location.pathname]);
  const tab = routeState.tab;
  const conversationId = routeState.conversationId;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadsUnlocked, setLeadsUnlocked] = useState(() => sessionStorage.getItem("leadsUnlocked") === "1"); 
  const [showLeadsPassword, setShowLeadsPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Persistence States - Required for "View Details" to work
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); 
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const thirtyDaysAgoISO = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  }, []);
  const [dateFilter, setDateFilter] = useState({ from: thirtyDaysAgoISO, to: todayISO, preset: "" });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");
      if (!token || !storedUser) {
        setUser(null);
        setLeadsUnlocked(false);
      }
    };
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (sessionStorage.getItem("clearHistoryToLive") === "1") {
      sessionStorage.removeItem("clearHistoryToLive");
      navigate("/live", { replace: true });
    }
  }, [location]);

  useEffect(() => {
    if (location.pathname === "/") {
      const stored = localStorage.getItem("currentTab");
      const nextTab = stored && VALID_TABS.has(stored) ? stored : "live";
      navigate(TAB_PATHS[nextTab], { replace: true });
      return;
    }

    if (!routeState.isKnown) {
      navigate(TAB_PATHS.live, { replace: true });
    }
  }, [location.pathname, navigate, routeState.isKnown]);

  const handleIconClick = (ref) => {
    if (ref.current?.showPicker) ref.current.showPicker();
    else ref.current?.focus();
  };

  // Keep date range valid: clamp "to" to today; ensure from <= to
  const clampDateRange = (from, to) => {
    const safeTo = to ? (to > todayISO ? todayISO : to) : todayISO;
    let safeFrom = from || "";
    if (safeFrom && safeFrom > safeTo) safeFrom = safeTo;
    return { from: safeFrom, to: safeTo };
  };

  // Handlers that enforce constraints on change
  const handleFromDateChange = (value) => {
    setDateFilter((prev) => {
      const next = clampDateRange(value, prev.to || todayISO);
      return { ...prev, ...next, preset: "" };
    });
  };

  const handleToDateChange = (value) => {
    setDateFilter((prev) => {
      const next = clampDateRange(prev.from, value);
      return { ...prev, ...next, preset: "" };
    });
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let fromDate = new Date();
    if (preset === "today") fromDate = today;
    else if (preset === "week") fromDate.setDate(today.getDate() - 7);
    else if (preset === "month") fromDate.setMonth(today.getMonth() - 1);

    const next = clampDateRange(
      fromDate.toISOString().slice(0, 10),
      today.toISOString().slice(0, 10)
    );

    setDateFilter({
      preset,
      ...next,
    });
  };

  const clearFilter = () => setDateFilter({ from: "", to: todayISO, preset: "" });

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.setItem("currentTab", "live");
    sessionStorage.removeItem("leadsUnlocked");
    navigate(TAB_PATHS.live, { replace: true });
    setUser(null);
    setLeadsUnlocked(false);
    setSelectedLead(null);
    setIsDetailsOpen(false);
    setShowLogoutModal(false);
  };

  // Persist tab selection so a refresh keeps the current page
  useEffect(() => {
    if (VALID_TABS.has(tab)) {
      localStorage.setItem("currentTab", tab);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "leads" && tab !== "leads_detail" && tab !== "chat_view") {
      setIsDetailsOpen(false);
      setSelectedLead(null);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "leads" && !leadsUnlocked && user) {
      setShowLeadsPassword(true);
    }
  }, [tab, leadsUnlocked, user]);

  const handleTabChange = (nextTab) => {
    if (nextTab === "leads" && !leadsUnlocked) {
      setShowLeadsPassword(true);
      return;
    }
    // Only close details if explicitly switching away from leads/chat context
    if (nextTab !== "leads" && nextTab !== "chat_view") {
        setIsDetailsOpen(false);
        setSelectedLead(null);
    }
    navigate(TAB_PATHS[nextTab] ?? TAB_PATHS.live);
  };

  const handleViewChat = (cid) => {
    setIsDetailsOpen(true);
    navigate(`/chat/${encodeURIComponent(cid)}`);
  };

  if (loading) return <div className="min-h-screen w-full bg-[var(--color-primary-500)] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginPage onLogin={(userData) => setUser(userData)} />;

  return (
    <DataCacheProvider dateFilter={dateFilter}>
      <div className={`flex h-screen ${tab === "chat_view" ? "bg-white" : (tab === "live" || tab === "analytics" || tab === "leads" || tab === "demo") ? "bg-[var(--color-surface-100)]" : "bg-gray-50"}`}>
        <Sidebar currentTab={tab} onTabChange={handleTabChange} user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header section with corrected spacing */}
          {tab !== "chat_view" && tab !== "leads_detail" && (
            <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-extrabold text-gray-800 tracking-tight">
                    {tab === "live" ? "Live Conversations" : tab === "analytics" ? "Analytics" : tab === "leads" ? "Leads" : "Demo"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {tab === "live" ? "Overview of active conversations" : tab === "analytics" ? "Overview of performance metrics and conversation trends" : tab === "leads" ? "View leads" : "Try the chatbot"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[14px] font-semibold transition-all flex items-center justify-center focus:outline-none focus:ring-0"
                  style={{
                    width: "94px",
                    height: "31.5px",
                    backgroundColor: "var(--color-surface-0)",
                    borderRadius: "4px",
                    border: "none",
                    color: "var(--color-black)",
                    gap: "0px",
                    textDecoration: "none",
                    outline: "none",
                    boxShadow: "none",
                    appearance: "none",
                    WebkitAppearance: "none"
                  }}
                >
                  <img src="/logout.svg" alt="Logout" className="w-4 h-4 mr-1" style={{ filter: 'brightness(0)' }} />
                  Logout
                </button>
              </div>

              {tab === "live" && (
                <div className="mt-6 flex items-center gap-6 flex-nowrap overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  <div className="flex items-center gap-6 shrink-0">
                    {["today", "week", "month"].map((p) => (
                      <button
                        key={p}
                        onClick={() => applyPreset(p)}
                        className={`px-6 py-2 rounded-lg border font-medium text-[15px] transition-all hover:text-[var(--color-primary-500)] ${
                          dateFilter.preset === p
                            ? 'bg-[var(--color-primary-100)] border-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                            : 'bg-[var(--color-surface-100)] border-gray-300 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-100)] hover:border-[var(--color-primary-100)]'
                        }`}
                      >
                        {p === "week" ? "Last Week" : p === "month" ? "Last Month" : "Today"}
                      </button>
                    ))}
                  </div>
                  <div className="h-8 w-px bg-gray-200 hidden xl:block shrink-0" />
                  <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">From</span>
                    <div className="relative flex items-center">
                      <input
                        ref={fromDateRef}
                        type="date"
                        value={dateFilter.from}
                        onChange={(e) => handleFromDateChange(e.target.value)}
                        className="pl-4 pr-10 py-2 text-[15px] border border-gray-300 rounded-lg text-gray-800 bg-white w-44 focus:ring-2 focus:ring-green-500 outline-none"
                        max={dateFilter.to || todayISO}
                      />
                      <button type="button" onClick={() => handleIconClick(fromDateRef)} className="absolute right-3 text-gray-400 hover:text-[var(--color-primary-500)]"><CalendarIconSVG /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">To</span>
                    <div className="relative flex items-center">
                      <input
                        ref={toDateRef}
                        type="date"
                        value={dateFilter.to}
                        onChange={(e) => handleToDateChange(e.target.value)}
                        className="pl-4 pr-10 py-2 text-[15px] border border-gray-300 rounded-lg text-gray-800 bg-white w-44 focus:ring-2 focus:ring-green-500 outline-none"
                        min={dateFilter.from || undefined}
                        max={todayISO}
                      />
                      <button type="button" onClick={() => handleIconClick(toDateRef)} className="absolute right-3 text-gray-400 hover:text-[var(--color-primary-500)]"><CalendarIconSVG /></button>
                    </div>
                  </div>
                  <div className="ml-auto shrink-0">
                    <button onClick={clearFilter} className="px-8 py-2 text-[15px] rounded-lg border border-gray-300 font-bold text-[var(--color-primary-500)] transition-all bg-[var(--color-surface-100)] hover:bg-[var(--color-primary-100)] hover:border-[var(--color-primary-100)] hover:text-[var(--color-primary-500)]">Clear Filter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Area with logic fix */}
          <div className={`flex-1 overflow-auto ${ (tab === "chat_view" || tab === "analytics" || tab === "leads_detail") ? "pt-0" : "pt-4"}`}>
            <div className="min-h-full flex flex-col">
              <div className="flex-1">
                {tab === "live" && <LiveDashboard dateFilter={dateFilter} />}
                {tab === "analytics" && <AnalyticsDashboard />}
                {tab === "leads" && leadsUnlocked && (
                  <LeadsPage 
                    dateFilter={dateFilter}
                    selectedLead={selectedLead}
                    setSelectedLead={setSelectedLead}
                    onToggleDetails={(val) => setIsDetailsOpen(val)} 
                    onViewChat={handleViewChat} 
                  />
                )}
                {tab === "demo" && <DemoPage />}
                {tab === "chat_view" && (
                  <ChatViewPage 
                    onBack={() => navigate(-1)} 
                    conversationId={conversationId} 
                  />
                )}
                {tab === "leads_detail" && leadsUnlocked && (
                  <LeadsDetailsPage
                    lead={location.state?.lead ?? selectedLead}
                    onBack={() => navigate(TAB_PATHS.leads)}
                    onViewChat={handleViewChat}
                  />
                )}
              </div>

              <div className="shrink-0 pr-2 pb-2 pt-2 text-right pointer-events-none">
                <span className="text-sm font-medium italic text-gray-500">v1.1</span>
              </div>
            </div>
          </div>
        </div>

        {showLeadsPassword && (
          <LeadsPasswordModal
            onClose={() => setShowLeadsPassword(false)}
            onSuccess={() => {
              sessionStorage.setItem("leadsUnlocked", "1");
              setLeadsUnlocked(true);
              setShowLeadsPassword(false);
              navigate(TAB_PATHS.leads);
            }}
          />
        )}

        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogoutModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 text-sm mb-6">Are you sure you want to log out? You'll need to sign in again to access the dashboard.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-all border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-all"
                    style={{ 
                      backgroundColor: "var(--color-primary-100)", 
                      color: "var(--color-primary-500)"
                    }}
                  >
                    Confirm Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCacheProvider>
  );
}
