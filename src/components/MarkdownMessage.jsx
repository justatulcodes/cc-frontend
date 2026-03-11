import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import React from "react";

export function replaceRedirectUrls(text) {
  if (typeof text !== "string") return text;

  return text.replace(/https?:\/\/[^\s)]+/g, (raw) => {
    try {
      const parsed = new URL(raw);

      if (parsed.pathname === "/api/redirect") {
        const target = parsed.searchParams.get("url");

        if (target) {
          return target;
        }
      }
    } catch (error) {
      return raw;
    }

    return raw;
  });
}

export default function MarkdownMessage({ text }) {
  return (
    <div className="chat-markdown text-sm text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              className="chat-markdown-link"
            />
          ),
          pre: ({ className, children, ...props }) => (
            <pre {...props} className={["chat-markdown-pre", className].filter(Boolean).join(" ")}>
              {children}
            </pre>
          ),
          code: ({ inline, className, children, ...props }) => (
            <code {...props} className={[inline ? "chat-markdown-code-inline" : "", className].filter(Boolean).join(" ")}>
              {children}
            </code>
          ),
        }}
      >
        {replaceRedirectUrls(text)}
      </ReactMarkdown>
    </div>
  );
}
