import { useNavigate } from "react-router-dom";
import logo from "../assets/Carpet_Call_logo.png";
// Inline SVG Icons
const LiveConvoIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 12.5C17.5 12.942 17.3244 13.366 17.0118 13.6785C16.6993 13.9911 16.2754 14.1667 15.8333 14.1667H5.83333L2.5 17.5V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V12.5Z" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 2.5V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H17.5" stroke={color} strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 14.1667V7.5" stroke={color} strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8333 14.1666V4.16663" stroke={color} strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.66675 14.1666V11.6666" stroke={color} strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LeadsIcon = ({ color }) => (
  <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M2.29167 0C1.68388 0 1.10098 0.241443 0.671214 0.671214C0.241443 1.10098 0 1.68388 0 2.29167V13.9583C0 14.5661 0.241443 15.149 0.671214 15.5788C1.10098 16.0086 1.68388 16.25 2.29167 16.25H10.625C11.2328 16.25 11.8157 16.0086 12.2455 15.5788C12.6752 15.149 12.9167 14.5661 12.9167 13.9583V4.95667C12.9167 4.65172 12.8211 4.35445 12.6433 4.10667L10.1317 0.608333C9.99674 0.420225 9.81896 0.266941 9.61305 0.161158C9.40714 0.0553754 9.179 0.000133055 8.9475 0H2.29167ZM1.25 2.29167C1.25 1.71667 1.71667 1.25 2.29167 1.25H8.33333V4.91417C8.33333 5.25917 8.61333 5.53917 8.95833 5.53917H11.6667V13.9583C11.6667 14.5333 11.2 15 10.625 15H2.29167C1.71667 15 1.25 14.5333 1.25 13.9583V2.29167Z" fill={color}/>
  </svg>
);

const DemoIcon = ({ color }) => (
  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.16667 17L9.08333 14.0833L12 17M9.08333 0.75V2.41667M6.58333 9.08333V10.75M9.08333 7.41667V10.75M11.5833 5.75V10.75M17.4167 2.91667V13.5833C17.4167 13.649 17.4037 13.714 17.3786 13.7747C17.3535 13.8353 17.3166 13.8905 17.2702 13.9369C17.2238 13.9833 17.1687 14.0201 17.108 14.0453C17.0473 14.0704 16.9823 14.0833 16.9167 14.0833H1.25C1.11739 14.0833 0.990215 14.0307 0.896447 13.9369C0.802678 13.8431 0.75 13.7159 0.75 13.5833V2.91667C0.75 2.78406 0.802678 2.65688 0.896447 2.56311C0.990215 2.46935 1.11739 2.41667 1.25 2.41667H16.9167C17.0493 2.41667 17.1765 2.46935 17.2702 2.56311C17.364 2.65688 17.4167 2.78406 17.4167 2.91667Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Sidebar({ currentTab, onTabChange, user }) {
  const navigate = useNavigate();
  const isDev = process.env.NODE_ENV === "development";
  const tabs = [
    "live",
    "analytics",
    "leads",
    // ...(isDev ? ["demo"] : []),
    "demo",
  ];

  const tabLabels = {
    live: "Live Conversations",
    analytics: "Analytics",
    leads: "Leads",
    demo: "Demo",
  };

  const tabIcons = {
    live: LiveConvoIcon,
    analytics: AnalyticsIcon,
    leads: LeadsIcon,
    demo: DemoIcon,
  };

  const getIconColor = (tab, isActive) => {
    if (isActive) return "var(--color-primary-active)";
    if (tab === "demo") return "var(--color-black)";
    return "var(--color-neutral-700)";
  };

  return (
    <div
      className="w-56 h-screen flex flex-col"
      style={{
        backgroundColor: "var(--primary-bg)",
      }}
    >
      {/* Logo Section */}
      <div
        className="h-16 flex items-center px-5 py-5"
        style={{ borderBottom: "1px solid var(--primary-border)" }}
      >
        <img
          src={logo}
          alt="Carpet Call Logo"
          onClick={() => {
            const idx = window.history.state?.idx ?? 0;
            if (idx === 0) {
              navigate("/live", { replace: true });
            } else {
              sessionStorage.setItem("clearHistoryToLive", "1");
              navigate(-idx);
            }
          }}
          style={{ cursor: "pointer", outline: "none", height: "30px", width: "auto" }}
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6">
        <ul className="flex flex-col gap-0">
          {tabs.map((tab) => {
            const IconComponent = tabIcons[tab];
            const isActive = currentTab === tab;
            return (
              <li key={tab}>
                <button
                  onClick={() => onTabChange(tab)}
                  className={`sidebar-tab w-full flex items-center gap-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "active" : ""
                  }`}
                  style={{
                    width: "100%",
                    height: "36px",
                    gap: "9.6px",
                    padding: "8px 19.2px",
                    borderRadius: "0px",
                    borderLeft: isActive ? "3px solid var(--color-primary-active)" : "3px solid transparent",
                    backgroundColor: isActive
                      ? "var(--color-primary-100)"
                      : "var(--primary-bg)",
                    color: isActive
                      ? "var(--sidebar-tab-active-text)"
                      : (tab === "demo" ? "var(--color-black)" : "var(--color-gray-800)"),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--color-primary-100)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--primary-bg)";
                    }
                  }}
                >
                  <IconComponent color={getIconColor(tab, isActive)} />
                  <span className="text-sm whitespace-nowrap">{tabLabels[tab]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div
        className="px-3.5 py-4"
        style={{
          borderTop: "1px solid var(--color-border-200)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* User Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-primary-100)",
              color: "var(--color-primary-500)",
            }}
          >
            <span className="text-xs font-medium">
              {user?.email
                ? user.email
                    .split("@")[0]
                    .split(/[\s.]+/)
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase() || "")
                    .join("")
                : "U"}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--color-gray-800)" }}
            >
              {user?.name}
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--secondary-text)" }}
            >
              Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
