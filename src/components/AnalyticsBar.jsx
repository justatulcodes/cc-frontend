import { useDataCache } from "../contexts/DataCacheContext";

/* ========= STAT CARD ========= */

function Stat({ label, value, iconSrc, loading, isBlue }) {
  if (loading) {
    return (
      <div
        className="h-[102px] rounded-[14px] pt-[10px] pr-[21px] pb-[1px] pl-[21px] flex flex-col gap-[5px] opacity-100 animate-pulse"
        style={{
          backgroundColor: "var(--primary-bg)",
          border: `1px solid var(--primary-border)`
        }}
      >
        {/* Label + Icon Skeleton */}
        <div className="flex items-center justify-between w-full">
          <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--secondary-border)' }}></div>
          <div className="w-8 h-8 rounded-[10px]" style={{ backgroundColor: 'var(--secondary-border)' }}></div>
        </div>

        {/* Value Skeleton */}
        <div className="h-9 w-20 rounded" style={{ backgroundColor: 'var(--secondary-border)' }}></div>
      </div>
    );
  }
  const iconStylesByLabel = {
    "Conversations": {
      bgColor: "var(--color-primary-100)",
    },
    "User messages": {
      bgColor: "var(--color-primary-100)",
    },
    "Avg time / convo": {
      bgColor: "var(--color-primary-100)",
    },
  };
  const iconBadge = iconStylesByLabel[label] ?? {
    bgColor: isBlue ? "var(--color-primary-100)" : "var(--color-primary-100)",
  };

  const bgColor = iconBadge.bgColor;
  const iconFilter = isBlue ? { filter: 'brightness(0) saturate(100%) invert(39%) sepia(99%) saturate(2476%) hue-rotate(211deg) brightness(95%) contrast(105%)' } : {};
  
  return (
    <div
      className="h-[102px] rounded-[14px] pt-[21px] pr-[21px] pb-[1px] pl-[21px] flex items-start justify-between opacity-100"
      style={{
        backgroundColor: "var(--primary-bg)",
        border: `1px solid var(--primary-border)`
      }}
    >
      {/* Label + Value column */}
      <div className="flex min-w-0 flex-col gap-[8px]">
        <span
          className="text-sm font-semibold"
          style={{
            color: "var(--secondary-text)",
            fontFamily: "'Open Sans', sans-serif",
            letterSpacing: "-0.02px",
            lineHeight: "20px",
          }}
        >
          {label}
        </span>
        <div
          className="text-3xl font-semibold"
          style={{
            color: "var(--primary-text)",
            lineHeight: "36px",
          }}
        >
          {value}
        </div>
      </div>

      {/* Icon wrapper kept outside the label/value column so it does not push the value */}
      {iconSrc && (
        <div className="flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-100)" }}
          >
            <img src={iconSrc} alt="" className="w-[16px] h-[16px]" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= ANALYTICS BAR ========= */

export default function AnalyticsBar() {
  const { report, conversations, loadingAnalytics } = useDataCache();

  const kpis = report?.D_data_table?.kpis ?? {};
  
  const totalConvos = kpis.total_sessions ?? 0;
  const totalUser = kpis.total_user_messages ?? 0;
  
  // Calculate assistant messages from conversations
  const totalAssistant = (conversations ?? []).reduce((sum, c) => {
    const n = (c.messages ?? []).filter(
      (m) => m.role === "assistant" && (m.content ?? "").trim()
    ).length;
    return sum + n;
  }, 0);
  
  // Calculate average time per conversation
  const avgTimePerConvo = (() => {
    if (!totalConvos || !conversations?.length) return "0s";
    
    const totalMs = (conversations ?? []).reduce((sum, c) => {
      if (!c.created_at || !c.last_message_at) return sum;
      const start = new Date(c.created_at).getTime();
      const end = new Date(c.last_message_at).getTime();
      return sum + (end - start);
    }, 0);
    
    const avgSeconds = Math.round(totalMs / conversations.length / 1000);
    
    if (avgSeconds < 60) return `${avgSeconds}s`;
    if (avgSeconds < 3600) return `${Math.round(avgSeconds / 60)} min`;
    return `${(avgSeconds / 3600).toFixed(1)}h`;
  })();

  return (
    <div
      className="-mt-1 grid grid-cols-3 gap-4 pr-8"
    >
      <Stat label="Conversations" value={totalConvos} iconSrc="/conversations.svg" loading={loadingAnalytics} />
      <Stat label="User messages" value={totalUser} iconSrc="/Group.svg" loading={loadingAnalytics} isBlue={true} />
      {/* <Stat label="Assistant messages" value={totalAssistant} iconSrc="/u.svg" loading={loadingAnalytics} /> */}
      <Stat label="Avg time / convo" value={avgTimePerConvo} iconSrc="/g.svg" loading={loadingAnalytics} isBlue={true} />
    </div>
  );
}
