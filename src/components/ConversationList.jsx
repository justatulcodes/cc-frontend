export default function ConversationList({ items, selectedId, onSelect }) {
  return (
    <div
      className="p-2"
      style={{ backgroundColor: "var(--primary-bg)" }}
    >
      {items.map((c) => {
        const active = c.id === selectedId;

        const containerStyle = active
          ? {
              backgroundColor: "var(--conv-active-bg)",
              border: '1px solid var(--accent-green)',
            }
          : {
              backgroundColor: "var(--secondary-bg)",
            };

        return (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left p-4 rounded-lg mb-2 transition-colors hover:cursor-pointer"
            style={containerStyle}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--primary-text)" }}
              >
                {c.source}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--secondary-text)" }}
              >
                {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ""}
              </span>
            </div>

            <div
              className="mt-1 text-xs line-clamp-2"
              style={{ color: "var(--color-gray-700)" }}
            >
              {c.preview || "No user message yet"}
            </div>

            <div
              className="mt-2 flex gap-2 text-[11px]"
              style={{ color: "var(--secondary-text)" }}
            >
              {c.country && <span>• {c.country}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
