import React, { useState } from "react";
import removeMd from "remove-markdown";
import MarkdownMessage, { replaceRedirectUrls } from "./MarkdownMessage";
import { toSydneyTime } from "../utils";
import { submitAnswerFeedback } from "../api";

function SourceLinks({ sources }) {
  if (!sources?.length) return null;

  const unique = Array.from(new Set(sources)).map((source) =>
    replaceRedirectUrls(source)
  );

  return (
    <div
      className="mt-2 p-3 rounded-lg"
      style={{
        width: "763px",
        backgroundColor: "var(--secondary-bg)",
        border: `1px solid var(--primary-border)`,
      }}
    >
      <div
        className="font-medium text-xs mb-2"
        style={{ color: "var(--color-gray-700)" }}
      >
        Sources used:
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {unique.slice(0, 8).map((url) => (
          <li key={url} className="text-xs">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--accent-blue)",
                textDecoration: "underline",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-blue-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--accent-blue)")
              }
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}



export default function ConversationThread({ convo }) {
  const [modal, setModal] = useState(null);
  // modal shape: { question, answer, messageId, messageCreatedAt }
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // "success" | "error" | null

  if (!convo) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary-bg)" }}
      >
        <div
          className="p-6 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--primary-bg)",
            color: "var(--secondary-text)",
            border: `1px solid var(--primary-border)`,
          }}
        >
          No Conversation Found
        </div>
      </div>
    );
  }

  const messages = (convo.messages ?? []).filter(
    (m) => typeof m.text === "string" && m.text.trim().length > 0
  );

  // Count how many assistant messages we've seen so far as we iterate
  let assistantCount = 0;

  function openModal(msgIndex) {
    const msg = messages[msgIndex];
    // Find last user message before this index
    let lastUserMsg = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsg = messages[i].text;
        break;
      }
    }
    setSubmitStatus(null);
    setModal({
      question: lastUserMsg,
      answer: removeMd(msg.text || ""),
      messageId: msg.id || "",
      messageCreatedAt: msg.createdAt || msg.timestamp || "",
    });
  }

  async function handleSubmit() {
    if (!modal) return;
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      await submitAnswerFeedback({
        conversationId: convo.id || "",
        messageId: modal.messageId,
        dateTime: modal.messageCreatedAt,
        question: modal.question,
        currentAnswer: removeMd(
          messages.find((m) => m.id === modal.messageId)?.text || ""
        ),
        expectedAnswer: modal.answer,
      });
      setSubmitStatus("success");
      // Show confirmation briefly, then close
      setTimeout(() => {
        setModal(null);
        setSubmitStatus(null);
      }, 1500);
    } catch (err) {
      console.error("submitAnswerFeedback failed:", err);
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Feedback Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div
            className="flex flex-col rounded-xl shadow-2xl"
            style={{
              width: "560px",
              maxHeight: "90vh",
              backgroundColor: "var(--primary-bg)",
              border: "1px solid var(--primary-border)",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--primary-border)" }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span className="font-semibold text-sm" style={{ color: "var(--primary-text)" }}>
                  Update Response
                </span>
              </div>
              <button
                onClick={() => setModal(null)}
                className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                style={{ color: "var(--secondary-text)" }}
              >
                x
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto flex-1">
              {/* Editable question */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--secondary-text)" }}>
                  Question
                </label>
                <input
                  type="text"
                  value={modal.question}
                  onChange={(e) => setModal((m) => ({ ...m, question: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)]"
                  style={{
                    backgroundColor: "var(--secondary-bg)",
                    borderColor: "var(--primary-border)",
                    color: "var(--primary-text)",
                  }}
                  placeholder="Enter the question..."
                />
              </div>

              {/* Expected answer textarea */}
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold" style={{ color: "var(--secondary-text)" }}>
                  Expected Answer
                </label>
                <textarea
                  value={modal.answer}
                  onChange={(e) => setModal((m) => ({ ...m, answer: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] resize-none"
                  style={{
                    backgroundColor: "var(--secondary-bg)",
                    borderColor: "var(--primary-border)",
                    color: "var(--primary-text)",
                    minHeight: "220px",
                  }}
                  placeholder="Enter the expected answer..."
                />
              </div>

              {/* Status messages */}
              {submitStatus === "success" && (
                <div
                  className="text-xs px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--color-primary-100)",
                    color: "var(--color-primary-600)",
                    borderColor: "rgba(0, 92, 232, 0.18)",
                  }}
                >
                  ✓ Feedback saved successfully.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  Failed to save feedback. Please try again.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-4 border-t"
              style={{ borderColor: "var(--primary-border)" }}
            >
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--primary-border)", color: "var(--secondary-text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || submitStatus === "success" || !modal.question.trim() || !modal.answer.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
              >
                {submitting ? "Saving…" : submitStatus === "success" ? "Saved ✓" : "Save Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Thread ── */}
      <div
        className="flex flex-col"
        style={{
          width: "100%",
          padding: "24px",
          gap: "24px",
          backgroundColor: "var(--primary-bg)",
        }}
      >
        <div className="flex flex-col grow gap-6">
          {messages.length === 0 ? (
            <div
              className="p-6 rounded-lg text-sm text-center"
              style={{
                backgroundColor: "var(--primary-bg)",
                color: "var(--secondary-text)",
                border: `1px solid var(--primary-border)`,
              }}
            >
              No readable text messages in this conversation.
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "user";
              const isAssistant = !isUser;

              // Track which assistant message this is (0-based)
              let thisAssistantIndex = -1;
              if (isAssistant) {
                thisAssistantIndex = assistantCount;
                assistantCount++;
              }

              // Show button only on assistant msgs that are NOT the first
              const showUpdateBtn = isAssistant;

              const timestamp = m.createdAt
                ? toSydneyTime(m.createdAt)
                : "";

              return (
                <div
                  key={`${m.createdAt ?? "t"}-${idx}`}
                  className="flex flex-col"
                  style={{ gap: "6px" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: isUser
                          ? "var(--hex-gray-50)"
                          : "rgba(240, 246, 255, 0.9)",
                      }}
                    >
                      <img
                        src={isUser ? "/Icon.svg" : "/Assistant.svg"}
                        alt={isUser ? "User" : "Assistant"}
                        className="h-4 w-4"
                      />
                    </div>

                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isUser
                          ? "var(--primary-text)"
                          : "var(--accent-blue)",
                      }}
                    >
                      {isUser ? "User" : "Assistant"}
                    </span>

                    {timestamp && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--tertiary-text)" }}
                      >
                        {timestamp}
                      </span>
                    )}

                    </div>

                    {/* Update Response link — only on non-first assistant messages */}
                    {showUpdateBtn && (
                      <span
                        onClick={() => openModal(idx)}
                        className="inline-flex items-center gap-1 text-[12px] space-x-2 pe-4 font-medium cursor-pointer select-none transition-opacity hover:opacity-60"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Update Response
                      </span>
                    )}
                  </div>

                  {/* Message Box */}
                  <div
                    style={{
                      width: "763px",
                      minHeight: "56.75px",
                      backgroundColor: "var(--color-gray-50)",
                      borderRadius: "8px",
                      border: "1px solid var(--primary-border)",
                      padding: "17px",
                      marginBottom: "6px",
                      boxShadow: "none",
                    }}
                  >
                    <div
                      className="whitespace-pre-wrap text-sm"
                      style={{ color: "var(--primary-text)" }}
                    >
                      {isUser ? m.text : <MarkdownMessage text={m.text} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
