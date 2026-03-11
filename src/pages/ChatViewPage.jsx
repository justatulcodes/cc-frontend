import React, { useEffect, useState } from "react";
import { getConversation } from "../api";
import { toSydneyTime } from "../utils";
import MarkdownMessage from "../components/MarkdownMessage";

export default function ChatViewPage({ onBack, conversationId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConversation() {
      if (!conversationId) {
        setError("No conversation ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getConversation(conversationId);
        // Transform raw messages to the format expected by ChatViewPage
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages
            .filter((msg) => {
              if (msg.role === "tool") return false;
              if (Array.isArray(msg.content)) return false;
              if (msg.type === "tool-call" || msg.type === "tool-result") return false;
              
              // Filter out stringified tool call arrays
              if (typeof msg.content === "string") {
                const trimmed = msg.content.trim();
                if (trimmed.startsWith("[") && (trimmed.includes("tool-call") || trimmed.includes("tool-result"))) {
                  return false;
                }
              }
              
              return typeof msg.content === "string";
            })
            .map((msg) => {
              // Safely extract text content
              let textContent = "";
              if (typeof msg.text === "string") {
                textContent = msg.text;
              } else if (typeof msg.content === "string") {
                textContent = msg.content;
              } else if (typeof msg.text === "object" && msg.text?.text) {
                textContent = msg.text.text;
              } else if (typeof msg.content === "object" && msg.content?.text) {
                textContent = msg.content.text;
              }

              const isAssistant = msg.role !== "user";
              const formattedTime = msg.createdAt ? toSydneyTime(msg.createdAt) : "—";

              return {
                text: textContent || "—",
                sender: isAssistant ? "AI" : "User",
                isMarkdown: isAssistant, // Mark assistant messages as markdown
                timestamp: formattedTime,
              };
            })
            .filter((msg) => msg.text !== "—" || msg.sender); // Filter out empty messages

          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("Failed to fetch conversation:", err);
        setError(err.message || "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    }

    fetchConversation();
  }, [conversationId]);
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--primary-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-6 flex items-center gap-4 shrink-0 border-b"
        style={{ backgroundColor: "var(--primary-bg)", borderColor: "var(--color-gray-100)" }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-full transition-all"
          style={{ color: "var(--secondary-text)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-100)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div>
          <h2 className="font-bold text-base leading-tight" style={{ color: "var(--color-gray-800)" }}>
            Conversation History
          </h2>
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary-text)" }}>
            Viewing Lead Transcript
          </p>
        </div>
      </div>

      {/* Dynamic Chat Container */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8" style={{ backgroundColor: "var(--primary-bg)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <div className="w-10 h-10 border-4 animate-spin border-[var(--color-primary-500)] border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            {error}
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, index) => {
            const isUser = msg.sender?.toLowerCase() === "user";

            return (
              <div
                key={index}
                className={`${isUser ? "self-start" : "self-end text-right"} max-w-[80%] lg:max-w-[60%]`}
              >
                <div
                  style={{
                    backgroundColor: isUser ? "var(--color-white)" : "var(--color-primary-100)",
                    borderColor: isUser ? "var(--color-gray-200)" : "var(--color-blue-300)"
                  }}
                  className={`p-4 rounded-2xl border ${isUser ? "rounded-tl-none" : "rounded-tr-none text-left"}`}
                >
                  <p
                    className="text-[14px] whitespace-pre-wrap"
                    style={{ color: isUser ? "var(--color-gray-700)" : "var(--color-primary-500)" }}
                  >
                    {isUser ? msg.text : <MarkdownMessage text={msg.text} />}
                  </p>
                </div>
                <span
                  className={`text-[10px] mt-2 block font-bold uppercase tracking-tighter ${isUser ? "ml-1" : "mr-1"}`}
                  style={{ color: isUser ? "var(--secondary-text)" : "var(--color-primary-500)" }}
                >
                  {isUser ? "User" : "Assistant"} • {msg.timestamp}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--secondary-text)" }}>
            No conversation history available.
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div
        className="px-8 py-6 border-t text-center"
        style={{ backgroundColor: "var(--primary-bg)", borderColor: "var(--color-gray-100)" }}
      >
        <p className="text-[11px] italic" style={{ color: "var(--secondary-text)" }}>
          This is a read-only transcript of the conversation.
        </p>
      </div>
    </div>
  );
}