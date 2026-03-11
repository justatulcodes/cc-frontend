function normalizeMessage(m) {
  const content = m.content;

  // Filter out tool role messages
  if (m.role === "tool") return null;

  // Filter out array content (tool calls and results)
  if (Array.isArray(content)) return null;

  // Filter out stringified tool call arrays
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("[") && (trimmed.includes("tool-call") || trimmed.includes("tool-result"))) {
      return null;
    }
  }

  // Detect tool messages
  const isTool =
    content &&
    typeof content === "object" &&
    (content.type === "tool-call" ||
     content.type === "tool_call" ||
     content.type === "tool-result");

  if (isTool) return null;

  if (typeof content === "string") {
    return {
      role: m.role,
      text: content,
      createdAt: m.createdAt ?? null,
      sources: (m.matchedSources ?? []).map(s => s.name).filter(Boolean),
    };
  }

  return null;
}

export function mapConversation(raw) {
  const messages = (raw.messages ?? [])
    .map(normalizeMessage)
    .filter(Boolean);

  const lastUserMsg =
    [...messages].reverse().find(m => m.role === "user")?.text ?? "";

  return {
    id: raw.id,
    source: raw.source,
    created_at: raw.created_at,
    last_message_at: raw.last_message_at,
    last_message : raw.last_message,
    min_score: raw.min_score,
    country: raw.country,
    preview: lastUserMsg.slice(0, 80),
    messages,
  };
}
