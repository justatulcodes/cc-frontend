import { useState } from "react";

export default function LeadsPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const LEADS_PASSWORD = "richgro123";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === LEADS_PASSWORD) {
      onSuccess();
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div
        className="w-[380px] rounded-xl p-6"
        style={{
          backgroundColor: "var(--primary-bg)",
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Protected Leads
        </h2>

        <p
          className="text-sm mb-4"
          style={{ color: "var(--secondary-text)" }}
        >
          Enter password to view leads data
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="
              w-full px-3 py-2
              rounded-lg border border-gray-300
              text-gray-900 bg-white
              outline-none
              focus:ring-2 focus:ring-[var(--color-primary-500)]
              focus:border-[var(--color-primary-500)]
            "
          />

          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="
                text-sm px-3 py-1.5 rounded-lg
                border border-gray-300
                text-gray-700 hover:bg-gray-100
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                text-sm px-4 py-1.5 rounded-lg font-semibold
                bg-[var(--color-primary-500)] text-white
                hover:bg-[var(--color-primary-600)]
              "
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
