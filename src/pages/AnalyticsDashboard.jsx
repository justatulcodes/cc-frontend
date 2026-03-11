import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDataCache } from "../contexts/DataCacheContext";
import ProductAnalytics from "../components/ProductAnalytics";
import { getTopRecommendedProducts, getTopClickedProducts } from "../api";
import RepeatedQuestions from "../components/RepeatedQuestions";
import {
  formatInt,
  formatPct,
  formatScore,
  objectToSeries,
  paletteForKeys,
  pairsToRows,
  pivotHourlyByCategory,
  safeArray,
  shortId,
} from "../utils";



function Section({ title, subtitle, children, right }) {
  return (
    <section className="mb-8">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--primary-text)' }}>{title}</h3>
          {subtitle ? <p className="text-sm font-normal mt-2" style={{ color: 'var(--secondary-text)' }}>{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Card({ title, subtitle, children, background, border, style }) {
  return (
    <div className={`rounded-2xl border p-6 ${background ? background : ''} ${border ? border : ''}`}
      style={{
        borderColor: 'var(--primary-border)',
        backgroundColor: background ? undefined : 'var(--primary-bg)',
        ...style
      }}>
      {title ? (
        <div className="mb-6">
          <h4 className="text-lg font-semibold" style={{ color: 'var(--primary-text)' }}>{title}</h4>
          {subtitle ? <p className="text-sm mt-2" style={{ color: 'var(--secondary-text)' }}>{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function KpiCard({ label, value, hint, icon }) {
  return (
    <div className="rounded-2xl border p-5 relative" style={{ borderColor: 'var(--primary-border)', backgroundColor: 'var(--primary-bg)' }}>
      {icon && (
        <div 
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary-100)' }}
        >
          <img src={icon} alt="" className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
        </div>
      )}
      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--primary-text)' }}>{label}</div>
      <div className="text-3xl font-semibold" style={{ color: 'var(--primary-text)' }}>{value}</div>
      {hint ? <div className="text-sm font-semibold mt-2" style={{ color: 'var(--primary-text)' }}>{hint}</div> : null}
    </div>
  );
}

function EmptyState({ text = "No data available." }) {
  return <div className="text-sm" style={{ color: 'var(--tertiary-text)' }}>{text}</div>;
}

function SkeletonLoader({ lines = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: 'var(--secondary-border)' }}></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--primary-border)' }}></div>
            {i % 2 === 0 && <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--primary-border)' }}></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ count }).map((_, i) => (
        <div key={i} className="rounded-2xl border py-3 px-3 flex gap-3 items-start" style={{ borderColor: 'var(--primary-border)', backgroundColor: 'var(--secondary-bg)' }}>
          <div className="w-5 h-5 rounded" style={{ backgroundColor: 'var(--secondary-border)' }}></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--primary-border)' }}></div>
            <div className="h-4 rounded w-4/5" style={{ backgroundColor: 'var(--primary-border)' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows }) {
  const safeRows = safeArray(rows);
  if (safeRows.length === 0) return <EmptyState />;

  return (
    <div className="overflow-auto">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-xs text-gray-600 text-left">
            {columns.map((c) => (
              <th key={c.key} className="px-2 py-1">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((r, idx) => (
            <tr key={idx} className="bg-gray-50 border border-gray-200">
              {columns.map((c) => (
                <td key={c.key} className="px-2 py-2 align-top text-gray-800">
                  {c.render ? c.render(r) : r?.[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatHourTick(value) {
  const text = String(value ?? "");
  if (!text) return "";
  try {
    const date = new Date(text);
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      hour12: true,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
    const hour = get('hour');
    const dayPeriod = get('dayPeriod').toLowerCase();
    return `${get('month')} ${get('day')}, ${hour}${dayPeriod}`;
  } catch {
    return text;
  }
}

function condenseHourlySeries(rows, maxPoints = 90) {
  const points = safeArray(rows);
  if (points.length <= maxPoints) return points;

  const bucketSize = Math.ceil(points.length / maxPoints);
  const condensed = [];

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;

    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    const messages = bucket.reduce((sum, point) => sum + Number(point.messages ?? 0), 0);

    condensed.push({
      hour_bucket_utc: first.hour_bucket_utc,
      messages,
      bucket_start_utc: first.hour_bucket_utc,
      bucket_end_utc: last.hour_bucket_utc,
      bucket_size: bucket.length,
    });
  }

  return condensed;
}

function formatHourlyTooltipLabel(label, payload) {
  const point = payload?.[0]?.payload;
  if (!point) return formatHourTick(label);

  const start = point.bucket_start_utc ?? label;
  const end = point.bucket_end_utc ?? label;
  if (!point.bucket_size || point.bucket_size <= 1 || start === end) {
    return formatHourTick(start);
  }

  return `${formatHourTick(start)} - ${formatHourTick(end)}`;
}

function formatReportDateRange(dateFilter = {}) {
  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatFullDate = (date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatRange = (fromDate, toDate) => {
    if (!fromDate || !toDate) return null;
    if (isSameDay(fromDate, toDate)) return formatFullDate(toDate);

    const sameYear = fromDate.getFullYear() === toDate.getFullYear();
    const sameMonth = sameYear && fromDate.getMonth() === toDate.getMonth();

    if (sameMonth) {
      return `${fromDate.toLocaleDateString("en-US", { month: "short" })} ${fromDate.getDate()}-${toDate.getDate()}, ${toDate.getFullYear()}`;
    }

    if (sameYear) {
      return `${fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${toDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }

    return `${formatFullDate(fromDate)} - ${formatFullDate(toDate)}`;
  };

  const fromDate = parseDate(dateFilter?.from);
  const toDate = parseDate(dateFilter?.to);
  const preset = dateFilter?.preset;
  const todayISO = new Date().toISOString().slice(0, 10);

  if (fromDate && toDate) {
    if (isSameDay(fromDate, toDate)) {
      if (preset === "today") return `Today (${formatFullDate(toDate)})`;
      return formatFullDate(toDate);
    }

    const rangeLabel = formatRange(fromDate, toDate);
    if (preset === "week") return `Last 7 Days (${rangeLabel})`;
    if (preset === "month") return `Last 30 Days (${rangeLabel})`;
    return rangeLabel;
  }

  if (toDate) {
    if (!dateFilter?.from && !preset && dateFilter?.to === todayISO) {
      return "all available data";
    }
    return `Through ${formatFullDate(toDate)}`;
  }
  if (fromDate) return `From ${formatFullDate(fromDate)}`;
  return "all available data";
}

function TooltipValue({ active, payload, label, labelFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  const header = labelFormatter ? labelFormatter(label, payload) : String(label ?? "");
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs">
      <div className="font-semibold mb-2 text-gray-800">{header}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-gray-600">{p.name ?? p.dataKey}</span>
            </div>
            <div className="font-medium text-gray-800">{formatInt(p.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const {
    conversations,
    report,
    topRecommendedProducts,
    topClickedProducts,
    loadingAnalytics,
    loadingAIClusters,
    loadingAISummary,
    loadingAIRecommendations,
    aiClusters,
    aiSummary,
    aiRecommendations,
    dateFilter,
    error,
    refetchAnalytics
  } = useDataCache();

  const [chatActivityModal, setChatActivityModal] = useState(null);

  const reportDateRangeLabel = useMemo(
    () => formatReportDateRange(dateFilter),
    [dateFilter?.from, dateFilter?.to, dateFilter?.preset]
  );

  // Aggregate country data from conversations
  const countryData = useMemo(() => {
    const countryCounts = {};

    conversations.forEach(conv => {
      const country = conv.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    // Sort by count descending
    const sorted = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1]);

    // Top 6 countries + "Other" for the rest
    const topN = 6;
    if (sorted.length <= topN) {
      return sorted.map(([name, value]) => ({ name, value }));
    }

    const top = sorted.slice(0, topN);
    const others = sorted.slice(topN);
    const otherSum = others.reduce((sum, [, count]) => sum + count, 0);

    return [
      ...top.map(([name, value]) => ({ name, value })),
      ...(otherSum > 0 ? [{ name: "Other", value: otherSum }] : [])
    ];
  }, [conversations]);

  const hourlyOverall = useMemo(() => {
    const raw = safeArray(report?.D_data_table?.kpis?.hourly_message_volume_overall).map((d) => ({
      hour_bucket_utc: d.hour_bucket_utc,
      messages: Number(d.messages ?? 0),
    }));
    return condenseHourlySeries(raw, 90);
  }, [report]);

  const hourlyTickInterval = useMemo(() => {
    const maxTicks = 12;
    if (hourlyOverall.length <= maxTicks) return 0;
    return Math.ceil(hourlyOverall.length / maxTicks) - 1;
  }, [hourlyOverall.length]);

  if (loadingAnalytics && !report) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gray-200 border-r-[var(--color-primary-500)]"></div>
          <div className="mt-4 text-gray-600">Loading analytics...</div>
          <div className="mt-2 text-sm text-gray-500">This may take a few moments</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load analytics</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button
            onClick={() => refetchAnalytics(true)}
            className="mt-4 px-4 py-2 bg-[var(--color-primary-500)] hover:bg-blue-700 text-white rounded-lg text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">No report data available</div>
      </div>
    );
  }

  // Only use AI-enhanced data, no fallback to base report
  const executiveSummary = aiSummary || [];
  const recommendations = aiRecommendations || [];

  const kpis = report?.D_data_table?.kpis ?? {};
  const conversion = report?.D_data_table?.conversion_signals ?? {};
  const friction = report?.D_data_table?.friction ?? {};

  const messagesByCategory = objectToSeries(
    kpis.messages_by_category,
    kpis.messages_by_category_pct,
    { countKey: "messages", pctKey: "pct" }
  );

  const sessionsByCategory = objectToSeries(
    kpis.sessions_by_category,
    kpis.sessions_by_category_pct,
    { countKey: "sessions", pctKey: "pct" }
  );

  // Only use AI-clustered questions, no fallback to base questions
  let topOverall = [];
  if (aiClusters?.top10_normalized_overall_clustered?.length > 0) {
    // AI clusters loaded
    topOverall = safeArray(aiClusters.top10_normalized_overall_clustered).map(item => ({
      question: item.representative,
      count: item.total_count,
      is_clustered: item.is_clustered,
      variants: item.variants || [],
    }));
  }

  // Map questions to categories using top10_normalized_per_category
  const questionToCategoryMap = {};
  if (kpis.top10_normalized_per_category) {
    Object.entries(kpis.top10_normalized_per_category).forEach(([category, questions]) => {
      questions.forEach(([question]) => {
        questionToCategoryMap[question] = category;
      });
    });
  }

  // Enrich topOverall with categories
  const topOverallWithCategories = topOverall.map(item => ({
    ...item,
    category: questionToCategoryMap[item.question] || "other"
  }));

  const stuckSessions = safeArray(kpis.stuck_sessions_top10);

  const showHourlyDots = hourlyOverall.length <= 60;

  const hourlyPivot = pivotHourlyByCategory(kpis.hourly_message_volume_by_category, { maxSeries: 6 });
  const seriesColors = paletteForKeys(hourlyPivot.categories);

  const moveRate = Number(conversion.move_rate_pct ?? 0);

  return (
    <div className="h-full p-5 overflow-auto">
      <div
        className="rounded-2xl border border-[var(--color-gray-200)] p-5 mb-8"
        style={{ background: 'var(--color-surface-0)', boxShadow: "none" }}
      >
        <h2 className="text-xl font-bold text-[var(--color-gray-900)]">
          Dashboard
        </h2>
        <p className="text-[var(--color-gray-700)] mt-2 text-sm">
          Conversation analytics report for {reportDateRangeLabel}
        </p>

        <div className="mt-4 flex gap-4">

          <div
            className="px-4 py-2 rounded-[35px] text-[14px] font-medium"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-500)'
            }}
          >
            Sessions: {formatInt(kpis.total_sessions)}
          </div>


          <div
            className="px-4 py-2 rounded-[35px] text-[14px] font-medium"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-500)'
            }}
          >
            User Messages: {formatInt(kpis.total_user_messages)}
          </div>
        </div>
      </div>

      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Section title="Top Recommended Products" subtitle="Products most frequently recommended.">
            {loadingAnalytics ? (
              <div className="text-sm opacity-70">Loading products...</div>
            ) : (
              <ProductAnalytics products={topRecommendedProducts} variant="grid" />
            )}
          </Section>

          <Section title="Most Clicked Products" subtitle="Products frequently clicked by users.">
            {loadingAnalytics ? (
              <div className="text-sm opacity-70">Loading products...</div>
            ) : (
              <ProductAnalytics
                products={topClickedProducts}
                conversations={conversations}
                variant="grid"
                showViewDetails
                onViewDetails={setChatActivityModal}
              />
            )}
          </Section>
        </div>

        {/* <Section title="Topline KPIs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard label="Total sessions" value={formatInt(kpis.total_sessions)} icon="/totalsessions.svg" />
            <KpiCard label="Total user messages" value={formatInt(kpis.total_user_messages)} icon="/totalmessage.svg" />

            <KpiCard
              label="Stuck sessions"
              value={formatInt(stuckSessions.length)}
              hint="Sessions with repeated normalized questions"
              icon="/stucksessions.svg"
            />
          </div>
        </Section> */}

        <Section title="Hourly Volume" subtitle="Traffic patterns across the day (UTC buckets)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Hourly Volume (Overall)">
              {hourlyOverall.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={hourlyOverall} margin={{ top: 8, right: 20, bottom: 42, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="hour_bucket_utc"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatHourTick}
                      interval={hourlyTickInterval}
                      angle={-45}
                      textAnchor="end"
                      tickMargin={16}
                      dy={8}
                      height={96}
                      padding={{ left: 8, right: 8 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<TooltipValue labelFormatter={formatHourlyTooltipLabel} />} />
                    <Line type="monotone" dataKey="messages" name="Messages" stroke="var(--chart-green)" strokeWidth={2} dot={showHourlyDots ? { r: 4 } : false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card title="Sessions by Category">
              {sessionsByCategory.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={sessionsByCategory} margin={{ top: 8, right: 24, bottom: 40, left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-55}
                      textAnchor="start"
                      tickMargin={48}
                      height={140}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<TooltipValue />} />
                    <Bar dataKey="sessions" name="Sessions" radius={[8, 8, 0, 0]} fill="var(--chart-blue)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </Section>

        <Section title="Quality & Friction" subtitle="Low-score sessions and repeat diagnostics">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card title="Conversion Signals">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm text-gray-600 mb-1">Sessions with product_discovery</div>
                  <div className="text-4xl font-bold text-gray-900 mt-6">{formatInt(conversion.sessions_with_product_discovery)}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm text-gray-600 mb-1">Sessions with buy intent where to buy</div>
                  <div className="text-4xl font-bold text-gray-900 mt-6">{formatInt(conversion.sessions_with_buy_intent_or_where_to_buy)}</div>
                </div>
                {/* <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm text-gray-600 mb-1">Sessions moved PD → intent/WTB</div>
                  <div className="text-4xl font-bold text-gray-900 mt-6">{formatInt(conversion.sessions_moved_pd_to_intent_or_wtb)}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm text-gray-600 mb-1">Move rate</div>
                  <div className="text-4xl font-bold text-gray-900 mt-6">{formatPct(moveRate, { digits: 1 })}</div>
                </div> */}
              </div>
            </Card>

    {/* Conversion Signals label */}
    <div
      className="px-6 flex items-center"
      style={{
        width: '100%',
        height: '34px',
        backgroundColor: 'var(--color-surface-100)',
        opacity: 0.7,
      }}
    >
      <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Conversion Signals
      </span>
    </div>

    {/* Metrics row */}
    <div className="grid grid-cols-4 relative">
      
      {/* Sessions with product_discovery */}
      <div className="flex flex-col items-center py-8 px-6 gap-2 relative">
        <img src="/sessions.svg" alt="" className="w-8 h-8 text-blue-600" />
        <div className="text-4xl font-bold text-gray-900 mt-1">
          {formatInt(conversion.sessions_with_product_discovery)}
        </div>
        <div className="text-sm text-gray-500 text-center">
          Sessions with<br />product_discovery
        </div>
        {/* Custom Vertical Line - 25% Transparent at edges */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px]" 
             style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(229, 231, 235, 1) 25%, rgba(229, 231, 235, 1) 75%, transparent 100%)' }} />
      </div>

      {/* Sessions with buy intent */}
      <div className="flex flex-col items-center py-8 px-6 gap-2 relative">
        <img src="/sessions.svg" alt="" className="w-8 h-8 text-blue-600" />
        <div className="text-4xl font-bold text-gray-900 mt-1">
          {formatInt(conversion.sessions_with_buy_intent_or_where_to_buy)}
        </div>
        <div className="text-sm text-gray-500 text-center">
          Sessions with buy intent where<br />to buy
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[1px]" 
             style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(229, 231, 235, 1) 25%, rgba(229, 231, 235, 1) 75%, transparent 100%)' }} />
      </div>

      {/* Sessions moved PD → intent/WTB */}
      <div className="flex flex-col items-center py-8 px-6 gap-2 relative">
        <img src="/sessions.svg" alt="" className="w-8 h-8 text-blue-600" />
        <div className="text-4xl font-bold text-gray-900 mt-1">
          {formatInt(conversion.sessions_moved_pd_to_intent_or_wtb)}
        </div>
        <div className="text-sm text-gray-500 text-center">
          Sessions moved PD → intent/<br />WTB
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[1px]" 
             style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(229, 231, 235, 1) 25%, rgba(229, 231, 235, 1) 75%, transparent 100%)' }} />
      </div>

      {/* Move rate */}
      <div className="flex flex-col items-center py-8 px-6 gap-2">
        <img src="/moverate.svg" alt="" className="w-8 h-8 text-blue-600" />
        <div className="text-4xl font-bold text-gray-900 mt-1">
          {formatPct(moveRate, { digits: 1 })}
        </div>
        <div className="text-sm text-gray-500 text-center">
          Move rate
        </div>
      </div>
    </div>
  </div>
</Section>


        {/* <RepeatedQuestions
          questions={topOverallWithCategories}
          loading={loadingAIClusters}
          isAIEnhanced={!!aiClusters}
        />

        <Section title="Session Analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Top 'Stuck Sessions'" subtitle="Max repeat count per session">
              {stuckSessions.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stuckSessions.slice(0, 4)} margin={{ top: 8, right: 12, bottom: 32, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="session_id"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={0}
                      height={40}
                      tickFormatter={(v) => shortId(v).toUpperCase().slice(0, 1)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<TooltipValue labelFormatter={(l) => `Session ${shortId(l)}`} />} />
                    <Bar dataKey="max_repeat_count" name="Max repeat count" radius={[8, 8, 0, 0]} fill="var(--chart-amber)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Global Search Activity" subtitle="Users traffic across various regions">
              {countryData.length === 0 ? (
                <div className="flex items-center justify-center h-60 text-gray-500">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🌍</div>
                    <div className="text-base font-medium text-gray-900">No geographic data available</div>
                    <div className="text-sm text-gray-600 mt-2">Waiting for conversations with country information</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "var(--hex-gray-600)" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "var(--hex-gray-600)" }} />
                    <Tooltip content={<TooltipValue />} />
                    <Bar dataKey="value" name="Conversations" radius={[8, 8, 0, 0]} fill="var(--chart-emerald)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </Section>

        <Section title="">
          <Card
            title="Executive Summary"
            subtitle={aiSummary ? "✨ AI-enhanced insights" : loadingAISummary ? "⏳ Generating AI insights..." : undefined}
          >
            {loadingAISummary ? (
              <SkeletonLoader lines={5} />
            ) : !aiSummary || executiveSummary.length === 0 ? (
              <EmptyState text="AI insights will appear here once generated" />
            ) : (
              <div className="space-y-3">
                {executiveSummary.map((x, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-sm text-gray-900 font-normal">•</span>
                    <span className="text-sm text-gray-900 font-normal">{x}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section>

        <Section>
          <Card
            title="Recommendations (Action Steps)"
            subtitle={aiRecommendations ? "✨ AI-enhanced recommendations" : loadingAIRecommendations ? "⏳ Generating AI recommendations..." : undefined}
            background="bg-[var(--color-mint-bg)]"
          >
            {loadingAIRecommendations ? (
              <RecommendationSkeleton count={5} />
            ) : !aiRecommendations || recommendations.length === 0 ? (
              <EmptyState text="AI recommendations will appear here once generated" />
            ) : (
              <div className="space-y-4">
                {recommendations.map((x, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-200 py-3 px-3 flex gap-3 items-start"
                    style={{ backgroundColor: "var(--bg-green-ultra-light)" }}
                  >
                    <span className="text-[15px] font-normal" style={{ color: "var(--color-green-960)" }}>{i + 1}.</span>
                    <span className="text-[15px] text-gray-900 font-normal flex-1">{x}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section> */}

        {/* <div className="text-xs opacity-60 pb-10">
          Data source: <span className="font-mono">/api/analyze</span> (dynamically generated)
        </div> */}
      </div>

      {/* Chat Activity Modal */}
      {chatActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setChatActivityModal(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chat Activity Details</h3>
                <p className="text-sm text-gray-600 mt-1">Aggregated click counts per chat ID</p>
              </div>
              <button
                onClick={() => setChatActivityModal(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] space-y-3">
              {chatActivityModal.chatIds.map((item, idx) => (
                <div key={idx} className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">Chat ID : </span>
                    <a
                      href={`#`}
                      className="text-sm text-blue-600 hover:underline font-mono"
                    >
                      {item.chatId}
                    </a>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">
                    {item.count}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
