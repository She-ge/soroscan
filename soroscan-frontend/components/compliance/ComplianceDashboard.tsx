import React from "react";
import DataResidencyViewer from "./DataResidencyViewer";
import ComplianceStatusCard from "./ComplianceStatusCard";
import RetentionPolicyEditor from "./RetentionPolicyEditor";
import DataExportForm from "./DataExportForm";
import DeletionRequestForm from "./DeletionRequestForm";

export default function ComplianceDashboard() {
  return (
    <div className="flex flex-col space-y-8">
      {/* Overview section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataResidencyViewer />
        <ComplianceStatusCard />
      </div>

      <div className="h-[1px] w-full bg-green-500/20" />

      {/* Retention section */}
      <RetentionPolicyEditor />

      <div className="h-[1px] w-full bg-green-500/20" />

      {/* GDPR Data Requests section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataExportForm />
        <DeletionRequestForm />
      </div>
    </div>
  );
}
