import ComplianceDashboard from "@/components/compliance/ComplianceDashboard";

export default function ComplianceSettings() {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-3xl border border-green-500/20 bg-[#061120]/90 p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-xl font-bold text-green-400">Data Governance & Compliance</h2>
        <p className="text-sm text-green-300/70 mb-6">
          Manage your data residency, retention policies, and GDPR requests in one place.
        </p>
        <ComplianceDashboard />
      </div>
    </section>
  );
}
