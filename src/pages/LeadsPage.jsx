import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads } from "../api";
import { toSydneyTime } from "../utils";

export default function LeadsPage({
  onToggleDetails,
  dateFilter = {},
  selectedLead,
  setSelectedLead,
}) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchLeads() {
      try {
        setLoading(true);
        const data = await getLeads(200, dateFilter.from, dateFilter.to);
        if (isMounted) {
          setLeads(data?.collectedCustomers?.data || []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setLeads([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLeads();
    return () => {
      isMounted = false;
    };
  }, [dateFilter.from, dateFilter.to]);

  const filteredLeads = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return leads;

    return leads.filter((lead) => {
      const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.service_interest,
        lead.address_suburb_postcode,
        lead.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [leads, searchTerm]);

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    if (onToggleDetails) onToggleDetails(true);
    navigate(`/leads/${encodeURIComponent(lead.id)}`, { state: { lead } });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-surface-100)]">
        <div className="w-10 h-10 border-4 animate-spin border-[var(--color-primary-500)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex p-5 flex-col bg-[var(--color-surface-100)]">
      <div className="w-full">
        <div className="grid grid-cols-2 gap-4" style={{ maxWidth: "1168px" }}>
          <div className="rounded-2xl border p-5 bg-white border-gray-200 relative overflow-hidden">
            <div className="text-sm font-semibold mb-2 text-gray-800">Total Leads</div>
            <div className="text-3xl font-semibold text-gray-900">{leads.length}</div>
          </div>
          <div className="rounded-2xl border p-5 bg-white border-gray-200 relative overflow-hidden">
            <div className="text-sm font-semibold mb-2 text-gray-800">With Email</div>
            <div className="text-3xl font-semibold text-gray-900">
              {leads.filter((lead) => lead.email).length}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5 flex-1 overflow-hidden">
        <div className="bg-white rounded-[14px] border-y border-slate-200 h-full flex flex-col overflow-hidden" style={{ maxWidth: "1168px" }}>
          <div
            className="px-5 py-4 bg-white flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(229, 231, 235, 0.2)" }}
          >
            <h2 className="text-slate-900 font-semibold">Captured Leads ({filteredLeads.length})</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-[var(--color-primary-500)] rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] w-72"
                style={{ backgroundColor: "var(--color-surface-100)" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Service</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Captured At</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-16 text-center text-sm text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedLead?.id === lead.id ? "bg-emerald-50" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {lead.name || "Anonymous Lead"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {lead.email || lead.phone || "No contact details"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {lead.service_interest || lead.lead_type || "Support enquiry"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {lead.status || "captured"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {lead.created_at ? toSydneyTime(lead.created_at) : "—"}
                      </td>
                      <td className="px-5 py-4 text-left">
                        <span className="py-1 rounded-md text-sm font-semibold text-emerald-600">
                          View Details
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
