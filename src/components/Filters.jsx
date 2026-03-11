export default function Filters({ search, setSearch, source, setSource, sources }) {
  return (
    <div
      className="p-3 flex gap-2 items-center"
      style={{ borderBottom: `1px solid var(--primary-border)` }}
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search user prompts…"
        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        style={{
          backgroundColor: "var(--color-gray-50)",
          border: `1px solid var(--primary-border)`,
          color: "var(--primary-text)",
        }}
      />
      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm"
        style={{
          backgroundColor: "var(--color-gray-50)",
          border: `1px solid var(--primary-border)`,
          color: "var(--primary-text)",
        }}
      >
        <option value="" style={{ color: "var(--primary-text)" }}>All sources</option>
        {sources.map((s) => (
          <option key={s} value={s} style={{ color: "var(--primary-text)" }}>{s}</option>
        ))}
      </select>
    </div>
  );
}
