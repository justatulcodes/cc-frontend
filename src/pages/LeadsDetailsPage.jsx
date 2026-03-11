import { useEffect, useMemo, useState } from "react";
import { getLeadDetails, updateLead } from "../api";
import { toSydneyTime } from "../utils";

const STATUS_OPTIONS = [
  "captured",
  "reached",
  "non_contactable",
  "qualified",
  "converted",
  "closed",
];

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

export default function LeadsDetailsPage({ lead, onBack, onViewChat }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState(lead?.status || "captured");
  const [leadUpdate, setLeadUpdate] = useState(lead?.lead_update || "");

  useEffect(() => {
    if (!lead?.id) return;

    let isMounted = true;

    async function fetchDetails() {
      try {
        setLoading(true);
        setError("");
        const data = await getLeadDetails(lead.id);
        if (!isMounted) return;
        setDetails(data);
        setStatus(data?.lead?.status || "captured");
        setLeadUpdate(data?.lead?.lead_update || "");
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load lead details");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [lead?.id]);

  const leadRecord = details?.lead || lead;
  const conversations = useMemo(() => details?.conversations || [], [details]);

  if (!lead) return null;

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const data = await updateLead(lead.id, {
        status,
        lead_update: leadUpdate,
      });
      setDetails(data);
    } catch (err) {
      console.error(err);
      setError("Failed to save lead update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-[var(--color-surface-100)] p-5">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <p className="text-md font-bold text-gray-900">Lead Details</p>
            <p className="text-sm text-gray-500">Captured service lead, contact info, and follow-up status.</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading lead details...
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{leadRecord?.name || "Anonymous Lead"}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {leadRecord?.service_interest || leadRecord?.lead_type || "Support enquiry"}
                    </div>
                  </div>
                  <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700">
                    {leadRecord?.status || "captured"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Email" value={leadRecord?.email} />
                  <Field label="Phone" value={leadRecord?.phone} />
                  <Field label="Lead Type" value={leadRecord?.lead_type} />
                  <Field label="State" value={leadRecord?.state} />
                  <Field label="Property Type" value={leadRecord?.property_type} />
                  <Field label="Rooms / Area" value={leadRecord?.rooms_or_area} />
                  <Field label="Timeline" value={leadRecord?.timeline} />
                  <Field label="Captured At" value={leadRecord?.created_at ? toSydneyTime(leadRecord.created_at) : null} />
                  <Field label="Preferred Measure Time" value={leadRecord?.preferred_measure_time} />
                  <Field label="Preferred Contact Time" value={leadRecord?.preferred_contact_time} />
                </div>

                <Field label="Address / Suburb / Postcode" value={leadRecord?.address_suburb_postcode} />
                <Field label="Customer Notes" value={leadRecord?.notes} />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Follow-up</div>
                  <div className="text-sm text-gray-500">Track outreach status and internal notes.</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="lead-status">
                    Lead Status
                  </label>
                  <select
                    id="lead-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="lead-update">
                    Lead Update
                  </label>
                  <textarea
                    id="lead-update"
                    rows="10"
                    value={leadUpdate}
                    onChange={(event) => setLeadUpdate(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    placeholder="Add follow-up notes, call outcomes, or conversion updates"
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Last updated: {leadRecord?.updated_at ? toSydneyTime(leadRecord.updated_at) : "—"}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-primary-500)" }}
                >
                  {saving ? "Saving..." : "Save Lead Update"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="text-lg font-semibold text-gray-900">Conversations</div>
                <div className="text-sm text-gray-500">Related chat sessions linked to this lead.</div>
              </div>

              {conversations.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No conversations linked yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation, index) => (
                    <div key={conversation.conversation_id || index} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">
                          Session {index + 1} {conversation.source_system ? `· ${conversation.source_system}` : ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          Started: {conversation.started_at ? toSydneyTime(conversation.started_at) : "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last message: {conversation.last_message || "—"}
                        </div>
                      </div>

                      {conversation.conversation_id ? (
                        <button
                          type="button"
                          onClick={() => onViewChat?.(conversation.conversation_id)}
                          className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-primary-500)] bg-[var(--color-primary-100)]"
                        >
                          View Chat
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
