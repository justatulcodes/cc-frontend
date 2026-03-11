import { useEffect, useMemo, useState } from "react";
import { useDataCache } from "../contexts/DataCacheContext";
import ConversationThread from "../components/ConversationThread";
import AnalyticsBar from "../components/AnalyticsBar";
import { syncChats, getConversation } from "../api";
import { toSydneyTime } from "../utils";
import removeMd from "remove-markdown";

export default function LiveDashboard() {
  const { conversations, loadingConversations, error: cacheError, refetchConversations, refetchAnalytics } = useDataCache();
  const [selectedId, setSelectedId] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversationWithMessages, setSelectedConversationWithMessages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const conversationsWithLabel = useMemo(() => {
    const withTimestamps = conversations.map((c) => {
      const lastMessageAt = c.last_message_at || c.created_at;

      return {
        ...c,
        lastUserTimestamp: lastMessageAt
          ? new Date(lastMessageAt).getTime()
          : 0,
      };
    });

    const sorted = withTimestamps.sort(
      (a, b) => b.lastUserTimestamp - a.lastUserTimestamp
    );

    return sorted.map((c, idx) => ({
      ...c,
      sessionLabel: `User Session : ${idx + 1}`,
      sessionNumber: String(idx + 1),
    }));
  }, [conversations]);



  const filteredConversations = useMemo(() => {
    if (!searchId.trim()) return conversationsWithLabel;
    const normalize = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const searchNorm = normalize(searchId.trim());

    return conversationsWithLabel.filter((c) => {
      const idNorm = normalize(c.id);
      const labelNorm = normalize(c.sessionLabel);
      const previewNorm = normalize(c.preview);
      return (
        idNorm.includes(searchNorm) ||
        labelNorm.includes(searchNorm) ||
        c.sessionNumber === searchNorm ||
        previewNorm.includes(searchNorm)
      );
    });
  }, [conversationsWithLabel, searchId]);

  // Pagination logic
  const paginatedConversations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredConversations.slice(startIndex, endIndex);
  }, [filteredConversations, currentPage]);

  const totalPages = Math.ceil(filteredConversations.length / ITEMS_PER_PAGE);

  // Calculate the starting session number for the current page
  const startSessionNumber = (currentPage - 1) * ITEMS_PER_PAGE + 1;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchId]);

  // Select first item on current page when page changes
  useEffect(() => {
    if (paginatedConversations.length > 0) {
      setSelectedId(paginatedConversations[0].id);
    }
  }, [currentPage]);
  useEffect(() => {
    if (!selectedId) {
      setSelectedConversationWithMessages(null);
      return;
    }

    async function fetchMessages() {
      setLoadingMessages(true);
      try {
        const fullConversation = await getConversation(selectedId);
        // Map the conversation to match the expected format
        const mapped = {
          ...fullConversation,
          messages: (fullConversation.messages || [])
            .filter(m => {
              // Ignore tool messages
              if (m.role === "tool") return false;

              // Ignore assistant messages with tool-call content
              if (m.role === "assistant" && typeof m.content === "string" && m.content.includes("tool-call")) {
                return false;
              }

              return true;
            })
            .map(m => ({
              ...m,
              text: m.content,
              sender: m.role === "user" ? "User" : "AI",
              timestamp: m.createdAt,
            }))
        };
        setSelectedConversationWithMessages(mapped);
      } catch (error) {
        console.error("Failed to fetch conversation messages:", error);
        setSelectedConversationWithMessages(null);
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [selectedId]);

  // Get base conversation data for metadata (without messages)
  const selected = useMemo(() => {
    return selectedId
      ? conversations.find((c) => c.id === selectedId) ?? null
      : null;
  }, [selectedId, conversations]);

  const lastActiveTime = useMemo(() => {
    const hasSelectedMessages =
      selectedConversationWithMessages?.id &&
      selectedConversationWithMessages.id === selectedId &&
      Array.isArray(selectedConversationWithMessages.messages) &&
      selectedConversationWithMessages.messages.length > 0;

    if (hasSelectedMessages) {
      const latest = selectedConversationWithMessages.messages.reduce((latestMsg, msg) => {
        const ts = msg.timestamp || msg.createdAt;
        if (!ts) return latestMsg;
        const tsDate = new Date(ts);
        if (Number.isNaN(tsDate.getTime())) return latestMsg;
        if (!latestMsg) return { date: tsDate };
        return tsDate > latestMsg.date ? { date: tsDate } : latestMsg;
      }, null);

      if (latest?.date) return latest.date;
    }

    if (!selected?.last_message_at) return null;
    const fallback = new Date(selected.last_message_at);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }, [selectedConversationWithMessages, selectedId, selected?.last_message_at]);

  const sessionCreatedTime = useMemo(() => {
    const hasSelectedMessages =
      selectedConversationWithMessages?.id &&
      selectedConversationWithMessages.id === selectedId &&
      Array.isArray(selectedConversationWithMessages.messages) &&
      selectedConversationWithMessages.messages.length > 0;

    if (hasSelectedMessages) {
      const earliest = selectedConversationWithMessages.messages.reduce((acc, msg) => {
        const ts = msg.timestamp || msg.createdAt;
        if (!ts) return acc;
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return acc;
        if (!acc) return date;
        return date < acc ? date : acc;
      }, null);

      if (earliest) return earliest;
    }

    if (!selected?.created_at) return null;
    const fallback = new Date(selected.created_at);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }, [selectedConversationWithMessages, selectedId, selected?.created_at]);

  useEffect(() => {
    if (filteredConversations.length > 0 && !selectedId) {
      setSelectedId(filteredConversations[0].id);
    }
  }, [filteredConversations, selectedId]);

  useEffect(() => {
    if (!selectedId || filteredConversations.length === 0) return;
    const exists = filteredConversations.some((c) => c.id === selectedId);
    if (!exists) setSelectedId(filteredConversations[0]?.id ?? null);
  }, [filteredConversations, selectedId]);

  // --- LOADING CHECK (Moved below all hooks) ---
  if (loadingConversations) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: "var(--secondary-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 animate-spin" style={{ borderColor: 'var(--primary-border)', borderTopColor: 'var(--accent-green)', borderRadius: '50%' }} />
          <div className="text-sm" style={{ color: 'var(--secondary-text)' }}>Loading conversations...</div>
        </div>
      </div>
    );
  }

  const formattedLastActive = lastActiveTime
    ? toSydneyTime(lastActiveTime.toISOString())
    : "-";


  const hasNoConversations = filteredConversations.length === 0;

  return (
    <div className="app-container h-full flex flex-col" style={{ backgroundColor: "var(--color-surface-100)" }}>
      <div className="w-full px-6 pb-4 -mt-2" style={{ backgroundColor: "var(--color-surface-100)" }}>
        <AnalyticsBar />
      </div>

      <div className="px-6 pb-6" style={{ backgroundColor: "var(--color-surface-100)" }}>
        <div className="flex gap-4" style={{ width: "1168px" }}>

          {/* LEFT PANEL: CONVERSATION LIST */}
          <div
            className="flex flex-col rounded-[14px] border overflow-hidden"
            style={{
              width: "280px",
              height: "600px",
              backgroundColor: 'var(--color-surface-0)',
              borderColor: 'var(--primary-border)',
              boxShadow: "none"
            }}
          >
            {/* Search Header */}
            <div className="px-5 py-4 border-b shrink-0" style={{ borderBottom: '1px solid var(--primary-border)', backgroundColor: 'var(--color-surface-0)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "16px", color: 'var(--primary-text)' }}>
                  Conversations
                </h2>
                <button
                  onClick={async () => {
                    if (syncing) return;
                    setSyncing(true);
                    try {
                      await syncChats();

                      // Stop the refresh animation as soon as:
                      // 1) /api/sync/chats finishes, and
                      // 2) /api/conversations finishes (via refetchConversations)
                      await refetchConversations(true);
                    } catch (error) {
                      console.error("Sync chats failed:", error);
                    } finally {
                      setSyncing(false);

                      // Refresh analytics in the background (can be slower).
                      Promise.resolve(refetchAnalytics(true)).catch((err) => {
                        console.error("Refetch analytics failed:", err);
                      });
                    }
                  }}
                  disabled={syncing}
                  className="group rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title={syncing ? "Syncing with database..." : "Refresh conversations"}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-primary-cta)] group-hover:bg-[var(--color-primary-cta)] transition-colors">
                    <img
                      src="/conversations2.svg"
                      alt=""
                      className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                      style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                    />
                  </div>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search Chat"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] placeholder:text-gray-400 text-gray-900 transition-all"
                style={{ backgroundColor: 'var(--color-surface-100)' }}
              />
            </div>

            {/* Conversation List Items */}
            <div className="flex-1 overflow-auto">
              {cacheError ? (
                <div className="p-5 text-red-600 text-sm">{cacheError}</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-5 text-gray-500 text-sm text-center">No conversations found</div>
              ) : (
                paginatedConversations.map((c, idx) => {
                  const isSelected = selectedId === c.id;
                  // Use last_message field directly from API

                  const previewText = c.last_message
                    ? removeMd(c.last_message).substring(0, 60) +
                    (removeMd(c.last_message).length > 100 ? "..." : "")
                    : "No messages yet";

                  const timestamp = c.last_message_at || c.created_at
                    ? toSydneyTime(c.last_message_at || c.created_at)
                    : "—";

                  // Calculate session number based on current page
                  const sessionNum = startSessionNumber + idx;

                  return (
                    <div key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className={`session-row w-full text-left transition-all px-4 py-3 border-0 !rounded-none focus:outline-none focus:ring-0 !border-transparent hover:!border-transparent ${
                          isSelected
                            ? "bg-[var(--color-primary-100)]"
                            : "bg-white hover:bg-[var(--color-primary-100)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {c.sessionLabel || `User Session : ${sessionNum}`}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600 line-clamp-1 mb-2">
                          {previewText}
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{timestamp}</span>
                          {/* <span
                            className="px-1.5 py-0.5 rounded-full text-gray-700 font-medium"
                            style={{ backgroundColor: "var(--location-textindia)" }}
                          >
                            {c.country || "Country Unknown"}
                          </span> */}
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 shrink-0" style={{ backgroundColor: 'var(--color-surface-0)', gap: '12px' }}>
                <div className="flex items-center" style={{ gap: '6.75px' }}>
                  <div 
                    className="flex items-center justify-center"
                    style={{
                      width: '27.5px',
                      height: '27.5px',
                      borderRadius: '67.5px',
                      backgroundColor: 'var(--color-primary-100)',
                      top: '3px',
                      left: '2.99px',
                      padding: '6.75px',
                      opacity: 1
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 9L4.5 6L7.5 3" stroke="var(--color-primary-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-primary-500)" }}>Prev</span>
                </div>
                <div className="flex items-center" style={{ gap: '6.75px' }}>
                  <span className="text-xs font-medium" style={{ color: "var(--color-primary-500)" }}>Next</span>
                  <div 
                    className="flex items-center justify-center"
                    style={{
                      width: '27.5px',
                      height: '27.5px',
                      borderRadius: '67.5px',
                      backgroundColor: 'var(--color-primary-100)',
                      top: '3px',
                      left: '2.99px',
                      padding: '6.75px',
                      opacity: 1
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="var(--color-primary-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: SELECTED THREAD */}
          <div
            className="flex flex-col rounded-[14px] border border-slate-200 overflow-hidden"
            style={{ width: "872px", height: "600px", backgroundColor: "var(--color-surface-0)", boxShadow: "none" }}
          >
            <div className="px-6 py-4 border-b border-slate-200 shrink-0" style={{ background: 'var(--color-surface-0)' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-slate-900 font-semibold text-base">{"User Session"}</h2>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Last active:</span> {hasNoConversations ? "-" : formattedLastActive}
                  </div>
                </div>
                {/* <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {hasNoConversations ? "-" : (selected?.country || "Country Unknown")}
                </div> */}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono px-2 py-0.5 rounded-full -ml-1 flex items-center gap-0.5" style={{ backgroundColor: "var(--color-primary-100)", color: "var(--color-primary-500)" }}>
                  ID: {selected?.id || "-"}
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(selected?.id || ""); }}
                    className="hover:opacity-70 transition-opacity"
                    title="Copy ID"
                  >
                    <img src="/copy.svg" alt="Copy" className="w-3 h-3" />
                  </button>
                </span>
                <span className="text-gray-500 whitespace-nowrap">
                  Created: {sessionCreatedTime ? toSydneyTime(sessionCreatedTime.toISOString()) : "-"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--color-surface-0)" }}>
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 animate-spin rounded-full" style={{ borderColor: 'var(--primary-border)', borderTopColor: 'var(--accent-green)' }} />
                    <div className="text-sm text-gray-500">Loading messages...</div>
                  </div>
                </div>
              ) : selected?.id && selected?.created_at ? (
                <div className="px-6 py-4">
                  <ConversationThread convo={selectedConversationWithMessages} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm" style={{ color: "var(--tertiary-text)" }}>
                    No Conversations Found
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
