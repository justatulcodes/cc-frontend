import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { 
  getConversations, 
  analyzeConversationsBase,
  getAIQuestionClusters,
  getAIExecutiveSummary,
  getAIRecommendations,
  getTopRecommendedProducts,
  getTopClickedProducts,
} from "../api";
import { mapConversation } from "../mapConversation";

const DataCacheContext = createContext(null);

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within DataCacheProvider");
  }
  return context;
}

export function DataCacheProvider({ children, dateFilter = {} }) {
  const [cachedData, setCachedData] = useState({
    conversations: [],
    rawConversations: [],
    report: null,
    aiClusters: null,
    aiSummary: null,
    aiRecommendations: null,
    topRecommendedProducts: [],
    topClickedProducts: [],
    lastConversationId: null,
    timestamp: null,
  });

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingAIClusters, setLoadingAIClusters] = useState(false);
  const [loadingAISummary, setLoadingAISummary] = useState(false);
  const [loadingAIRecommendations, setLoadingAIRecommendations] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingConversationsRef = useRef(false);
  const isFetchingAnalyticsRef = useRef(false);
  const initializedRef = useRef(false);

  // Fetch conversations data (fast)
  const fetchConversations = useCallback(async (force = false) => {
    // Prevent duplicate fetches
    if (isFetchingConversationsRef.current) {
      return;
    }

    // If we have cached data and not forcing refresh, skip
    if (!force && cachedData.conversations.length > 0) {
      console.log("Using cached conversations");
      return;
    }

    isFetchingConversationsRef.current = true;
    setLoadingConversations(true);
    setError(null);

    try {
      const conversationsRes = await getConversations("all", dateFilter.from, dateFilter.to);
      const rawList = Array.isArray(conversationsRes?.data) ? conversationsRes.data : [];
      const mappedConversations = rawList.map(mapConversation);
      const latestId = rawList[0]?.id || null;

      setCachedData(prev => ({
        ...prev,
        conversations: mappedConversations,
        rawConversations: rawList,
        lastConversationId: latestId,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
      setError(e.message || "Failed to load conversations");
      throw e;
    } finally {
      setLoadingConversations(false);
      isFetchingConversationsRef.current = false;
    }
  }, [cachedData.conversations.length, dateFilter.from, dateFilter.to]);

  // Fetch all analytics in parallel (base + AI sections)
  const fetchAnalytics = useCallback(async (force = false) => {
    // Prevent duplicate fetches
    if (isFetchingAnalyticsRef.current) {
      return;
    }

    // If we have cached report and not forcing refresh, skip
    if (!force && cachedData.report) {
      console.log("Using cached analytics report");
      return;
    }

    isFetchingAnalyticsRef.current = true;
    setLoadingAnalytics(true);
    setLoadingAIClusters(true);
    setLoadingAISummary(true);
    setLoadingAIRecommendations(true);

    try {
      console.log("[TIMING Frontend] Starting ALL analytics fetches in parallel...");
      const startTime = performance.now();
      
      // Start base analytics first to get enriched data (needed for AI calls)
      const basePromise = analyzeConversationsBase(null, dateFilter.from, dateFilter.to);
      const topRecProductsPromise = getTopRecommendedProducts(5, dateFilter.from, dateFilter.to);
      const topClickedProductsPromise = getTopClickedProducts(5, dateFilter.from, dateFilter.to);
      
      // Wait for base to complete first (we need the data for AI calls)
      const [analysisRes, topRecProductsRes, topClickedProductsRes] = await Promise.all([basePromise, topRecProductsPromise, topClickedProductsPromise]);
      
      const baseDuration = performance.now() - startTime;
      console.log(`[TIMING Frontend] Base analytics completed: ${baseDuration.toFixed(0)}ms`);

      // Update base data immediately
      setCachedData(prev => ({
        ...prev,
        report: analysisRes?.report || null,
        topRecommendedProducts: topRecProductsRes?.products || [],
        topClickedProducts: topClickedProductsRes?.products || [],
      }));
      
      setLoadingAnalytics(false);

      // ============================================
      // AI CALLS DISABLED - Commenting out for now
      // ============================================
      // Set AI loading states to false since we're not fetching them
      setLoadingAIClusters(false);
      setLoadingAISummary(false);
      setLoadingAIRecommendations(false);

      /* 
      // Extract data needed for AI calls
      const enriched = analysisRes?.enriched;
      const report = analysisRes?.report;
      const kpis = report?.D_data_table?.kpis;
      const conv = report?.D_data_table?.conversion_signals;
      const friction = report?.D_data_table?.friction;

      console.log("[DEBUG] enriched:", !!enriched, "kpis:", !!kpis, "conv:", !!conv, "friction:", !!friction);

      if (!enriched || !kpis || !conv || !friction) {
        console.warn("Missing data for AI sections", { enriched: !!enriched, kpis: !!kpis, conv: !!conv, friction: !!friction });
        setLoadingAIClusters(false);
        setLoadingAISummary(false);
        setLoadingAIRecommendations(false);
        isFetchingAnalyticsRef.current = false;
        return;
      }

      console.log("[TIMING Frontend] Starting all AI fetches in parallel...");

      // Now fire all 3 AI calls in parallel
      const clustersPromise = getAIQuestionClusters(enriched)
        .then(clusters => {
          console.log("✓ AI clusters loaded");
          setCachedData(prev => ({ ...prev, aiClusters: clusters }));
        })
        .catch(err => console.error("AI clustering failed:", err))
        .finally(() => setLoadingAIClusters(false));

      const summaryPromise = getAIExecutiveSummary(kpis, conv, friction)
        .then(summary => {
          console.log("✓ AI summary loaded");
          setCachedData(prev => ({ ...prev, aiSummary: summary.executive_summary }));
        })
        .catch(err => console.error("AI summary failed:", err))
        .finally(() => setLoadingAISummary(false));

      const recommendationsPromise = getAIRecommendations(kpis, conv, friction)
        .then(recs => {
          console.log("✓ AI recommendations loaded");
          setCachedData(prev => ({ ...prev, aiRecommendations: recs.recommendations }));
        })
        .catch(err => console.error("AI recommendations failed:", err))
        .finally(() => setLoadingAIRecommendations(false));

      // Wait for all AI sections to complete
      await Promise.all([clustersPromise, summaryPromise, recommendationsPromise]);
      
      const totalDuration = performance.now() - startTime;
      console.log(`[TIMING Frontend] All analytics completed: ${totalDuration.toFixed(0)}ms`);
      console.log("✓ All AI sections loaded");
      */

    } catch (e) {
      console.error("Failed to fetch analytics:", e);
      setError(e.message || "Failed to load analytics");
      setLoadingAnalytics(false);
      setLoadingAIClusters(false);
      setLoadingAISummary(false);
      setLoadingAIRecommendations(false);
      throw e;
    } finally {
      isFetchingAnalyticsRef.current = false;
    }
  }, [cachedData.report, dateFilter.from, dateFilter.to]);

  // Fetch all data (for backward compatibility or force refresh)
  const fetchAllData = useCallback(async (force = false) => {
    await Promise.all([
      fetchConversations(force),
      fetchAnalytics(force),
    ]);
  }, [fetchConversations, fetchAnalytics]);

  // Initial data fetch on mount - fetch conversations and analytics independently
  useEffect(() => {
    // Force refetch whenever date filter changes (including on mount and when clearing filter)
    // This ensures we always get fresh data matching the current filter state
    fetchConversations(true);
    fetchAnalytics(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.from, dateFilter.to, dateFilter.preset]);

  const value = {
    ...cachedData,
    dateFilter,
    loadingConversations,
    loadingAnalytics,
    loadingAIClusters,
    loadingAISummary,
    loadingAIRecommendations,
    loading: loadingConversations || loadingAnalytics, // For backward compatibility
    error,
    refetch: fetchAllData,
    refetchConversations: fetchConversations,
    refetchAnalytics: fetchAnalytics,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}
