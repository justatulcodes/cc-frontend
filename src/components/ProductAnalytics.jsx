function extractUrls(text) {
  const re = /https?:\/\/[^\s)"]+/g;
  return text.match(re) ?? [];
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.replace(/[.,]$/, "").replace(/\/$/, "");
  }
}

function slugToTitle(url) {
  const slug = url.split("/").pop() || url;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProductAnalytics({
  conversations,
  products = null,
  variant = "list",
  showViewDetails = false,
  onViewDetails,
  showGridColumns = false,
  compactGrid = false,
  dividerOnly = false,
}) {
  const MIN_ROWS = 5;
  const counts = {};
  const chatActivity = {};

  
  if (Array.isArray(products)) {
    if (products.length === 0) {
      return (
        <div className="py-8 text-sm text-center" style={{ color: "var(--tertiary-text)" }}>
          No Products Available to Show
        </div>
      );
    }

    const visibleProducts = products.slice(0, MIN_ROWS);
    const paddedProducts = [
      ...visibleProducts,
      ...Array.from({ length: Math.max(0, MIN_ROWS - visibleProducts.length) }, () => null),
    ];

    
    return (
      variant === "grid" ? (
        <div className={`${compactGrid ? "space-y-0" : "space-y-3"} w-full max-w-full`}>
          {showGridColumns && (
            <div
              className="h-[34px] -mx-5 px-5 flex items-center justify-between text-xs font-semibold w-[calc(100%+40px)]"
              style={{
                backgroundColor: "var(--color-surface-100)",
                opacity: 0.7,
                color: "var(--secondary-text)",
              }}
            >
              <span>Product Details</span>
              <span>Time</span>
            </div>
          )}
          {paddedProducts.map((product, index) => {
            const rowStyle = dividerOnly
              ? {
                  backgroundColor: "var(--color-surface-0)",
                  border: "none",
                  borderTop: index === 0 ? "none" : `1px solid var(--primary-border)`,
                }
              : {
                  backgroundColor: "var(--color-surface-0)",
                  border: `1px solid var(--primary-border)`,
                };
            if (!product) {
              return (
                <div
                  key={`placeholder-api-${index}`}
                  className="rounded-none h-[85px] px-4 py-3 flex items-center"
                  style={rowStyle}
                >
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold mb-2" style={{ color: "var(--secondary-text)" }}>
                        No product data
                      </h4>
                      <div className="text-xs" style={{ color: "var(--tertiary-text)" }}>
                        -
                      </div>
                    </div>
                    <div className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--color-neutral-700)" }}>
                      0x
                    </div>
                  </div>
                </div>
              );
            }

            const url = product.url || "";
            return (
              <div
                key={url || `product-api-${index}`}
                className="rounded-none h-[85px] px-4 py-3 transition flex items-center"
                style={rowStyle}
              >
                <div className="flex items-start justify-between gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-[15px] font-bold mb-2"
                      style={{ color: "var(--primary-text)" }}
                    >
                      {product.name || slugToTitle(url)}
                    </h4>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs block truncate"
                      style={{ color: "var(--accent-blue)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
                    >
                      {url}
                    </a>
                  </div>

                  <div className="flex flex-col items-end">
                    <div
                      className="px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap"
                      style={{
                        color: "var(--color-neutral-700)"
                      }}
                    >
                      {product.count}x
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="p-3 border-b"
          style={{ borderColor: "var(--primary-border)" }}
        >
          <div
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--primary-text)" }}
          >
            Top recommended products
          </div>

          <div className="space-y-2">
            {visibleProducts.map((product) => {
              const url = product.url || "";
              return (
                <div key={url} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--pa-text-main)" }}
                    >
                      {product.name || slugToTitle(url)}
                    </div>
                    <a
                      className="text-xs underline opacity-80 truncate block"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={url}
                      style={{ color: "var(--pa-text-link)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--pa-text-link-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--pa-text-link)")}
                    >
                      {url}
                    </a>
                  </div>

                  <span
                    className="text-xs opacity-70 whitespace-nowrap"
                    style={{ color: "var(--pa-text-secondary)" }}
                  >
                    {product.count}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )
    );
  }

  // Fall back to parsing conversations
  (conversations ?? []).forEach((c) => {
    const chatId = c.id || c.sessionId || c.chatId;
    (c.messages ?? [])
      .filter((m) => m.role === "assistant")
      .forEach((m) => {
        const textUrls = extractUrls(m.text || "");
        const sourceUrls = m.sources ?? [];
        const urls = [...textUrls, ...sourceUrls];

        urls
          .filter((u) => u.includes("richgro.com.au/product/"))
          .map(normalizeUrl)
          .forEach((u) => {
            counts[u] = (counts[u] || 0) + 1;
            if (!chatActivity[u]) chatActivity[u] = {};
            chatActivity[u][chatId] = (chatActivity[u][chatId] || 0) + 1;
          });
      });
  });

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MIN_ROWS);

  const paddedTop = [
    ...top,
    ...Array.from({ length: Math.max(0, MIN_ROWS - top.length) }, () => null),
  ];

  
  const isLoading = !products && (!conversations || conversations.length === 0);

  if (!top.length && variant !== "grid") {
    return (
      <div className="py-8 text-sm opacity-70" style={{ color: "var(--tertiary-text)" }}>
        {isLoading
          ? "Loading product recommendations..."
          : "No product recommendations found."}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`${compactGrid ? "space-y-0" : "space-y-3"} w-full max-w-full`}>
        {showGridColumns && (
          <div
            className="h-[34px] -mx-5 px-5 flex items-center justify-between text-xs font-semibold w-[calc(100%+40px)]"
            style={{
              backgroundColor: "var(--color-surface-100)",
              opacity: 0.7,
              color: "var(--secondary-text)",
            }}
          >
            <span>Product Details</span>
            <span>Time</span>
          </div>
        )}
        {paddedTop.map((item, index) => {
          const rowStyle = dividerOnly
            ? {
                backgroundColor: "var(--color-surface-0)",
                border: "none",
                borderTop: index === 0 ? "none" : `1px solid var(--primary-border)`,
              }
            : {
                backgroundColor: "var(--color-surface-0)",
                border: `1px solid var(--primary-border)`,
              };
          if (!item) {
            return (
              <div
                key={`placeholder-fallback-${index}`}
                className="rounded-none h-[85px] px-4 py-3 flex items-center"
                style={rowStyle}
              >
                <div className="flex items-start justify-between gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold mb-2" style={{ color: "var(--secondary-text)" }}>
                      No product data
                    </h4>
                    <div className="text-xs" style={{ color: "var(--tertiary-text)" }}>
                      -
                    </div>
                  </div>
                  <div className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--color-neutral-700)" }}>
                    0x
                  </div>
                </div>
              </div>
            );
          }

          const [url, n] = item;
          const handleViewDetails = () => {
            if (onViewDetails && chatActivity[url]) {
              const chatIds = Object.entries(chatActivity[url])
                .map(([chatId, count]) => ({ chatId, count }))
                .sort((a, b) => b.count - a.count);
              onViewDetails({ url, productName: slugToTitle(url), totalClicks: n, chatIds });
            }
          };

          return (
            <div
              key={url}
              className="rounded-none h-[85px] px-4 py-3 transition flex items-center"
              style={rowStyle}
            >
              <div className="flex items-start justify-between gap-4 w-full">
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-[15px] font-bold mb-2"
                    style={{ color: "var(--primary-text)" }}
                  >
                    {slugToTitle(url)}
                  </h4>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs block truncate"
                    style={{ color: "var(--accent-blue)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
                  >
                    {url}
                  </a>
                </div>

                <div className="flex flex-col items-end">
                  <div
                    className="px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap"
                    style={{
                      color: "var(--color-neutral-700)"
                    }}
                  >
                    {n}x
                  </div>
                  {showViewDetails && (
                    <a
                      onClick={handleViewDetails}
                      className="text-xs mt-2 cursor-pointer inline-block"
                      style={{ color: "var(--accent-blue)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
                    >
                      View details
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default list variant
  return (
    <div
      className="p-3 border-b"
      style={{ borderColor: "var(--primary-border)" }}
    >
      <div
        className="text-sm font-semibold mb-2"
        style={{ color: "var(--primary-text)" }}
      >
        Top recommended products
      </div>

      <div className="space-y-2">
        {top.map(([url, n]) => (
          <div key={url} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "var(--pa-text-main)" }}
              >
                {slugToTitle(url)}
              </div>
              <a
                className="text-xs underline opacity-80 truncate block"
                href={url}
                target="_blank"
                rel="noreferrer"
                title={url}
                style={{ color: "var(--pa-text-link)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--pa-text-link-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--pa-text-link)")}
              >
                {url}
              </a>
            </div>

            <span
              className="text-xs opacity-70 whitespace-nowrap"
              style={{ color: "var(--pa-text-secondary)" }}
            >
              {n}×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
