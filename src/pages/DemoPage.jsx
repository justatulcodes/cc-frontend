import { useEffect } from "react";
import { createChatWidget } from "../services/chatWidget";

export default function DemoPage() {
  useEffect(() => {
    const chatWidget = createChatWidget({
      scriptId: "BirzDros6zCpamNHOggQF",
      defaultConfig: {
        closeOnClickOutside: true,
      },
      removeInjectedDomOnDestroy: true,
      playOnlyWhenMinimized: false,
    });

    chatWidget.init();

    // Register Chatbase client-side custom action
    window.chatbase?.("registerTools", {
      captured_lead_submission: async (args, user) => {
        try {
          const {
            lead_type,
            state,
            address_suburb_postcode,
            service_interest,
            rooms_or_area,
            property_type,
            timeline,
            preferred_measure_time,
            preferred_contact_time,
            customer_name,
            phone,
            email,
            notes,
            capturedAt,
          } = args;

          console.groupCollapsed(
            "%c📋 Captured Lead Submission",
            "color: #6366f1; font-size: 14px; font-weight: bold;"
          );

          console.log("%cLead Info", "color: #a78bfa; font-weight: bold; font-size: 12px;");
          console.table({
            "Lead Type":               lead_type              ?? "—",
            "Customer Name":           customer_name          ?? "—",
            "Phone":                   phone                  ?? "—",
            "Email":                   email                  ?? "—",
          });

          console.log("%cProperty Details", "color: #34d399; font-weight: bold; font-size: 12px;");
          console.table({
            "State":                   state                  ?? "—",
            "Address / Suburb / Post": address_suburb_postcode ?? "—",
            "Property Type":           property_type          ?? "—",
            "Rooms / Area":            rooms_or_area          ?? "—",
          });

          console.log("%cService & Scheduling", "color: #f59e0b; font-weight: bold; font-size: 12px;");
          console.table({
            "Service Interest":        service_interest       ?? "—",
            "Timeline":                timeline               ?? "—",
            "Preferred Measure Time":  preferred_measure_time ?? "—",
            "Preferred Contact Time":  preferred_contact_time ?? "—",
            "Captured At":             capturedAt             ?? "—",
          });

          console.log("%cNotes", "color: #94a3b8; font-weight: bold; font-size: 12px;");
          console.table({
            "Additional Notes":        notes                  ?? "—",
          });

          console.log("%cRaw Args", "color: #64748b; font-size: 11px;", args);
          console.log("%cChat User", "color: #64748b; font-size: 11px;", user);
          console.groupEnd();

          return {
            status: "success",
            data: "Lead submission recorded in the chat and will be stored on the next sync.",
          };
        } catch (error) {
          console.error("[captured_lead_submission] Action failed:", error);
          return {
            status: "error",
            error: error.message,
          };
        }
      },
    });

    return () => {
      chatWidget.destroy({ removeScript: true, removeDom: true, resetGlobal: true });
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-100)" }}>
      <div className="text-center">
        <p className="text-sm" style={{color: 'var(--secondary-text)'}}>
          The chatbot widget will appear in the bottom right corner
        </p>
      </div>
    </div>
  );
}
