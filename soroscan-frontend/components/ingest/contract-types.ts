export type VerificationStatus = "pending" | "verified" | "failed";

export interface ContractVerificationInfo {
  status: VerificationStatus;
  compilerVersion?: string;
  verifiedAt?: string;
  bytecodeHash?: string;
}

export interface Contract {
  id: string;
  contractId: string;
  name: string;
  description?: string;
  tags?: string[];
  status: "active" | "inactive";
  eventCount: number;
  createdAt: string;
  updatedAt: string;
  /** Verification status from ContractVerification model. Null when no verification record exists. */
  verificationStatus?: VerificationStatus | null;
  /** Full verification details, populated when verificationStatus is "verified". */
  verification?: ContractVerificationInfo | null;
}

export interface ContractFormData {
  contractId: string;
  name: string;
  description?: string;
  tags?: string[];
  status: "active" | "inactive";
}

export interface BackfillTask {
  taskId: string;
  contractId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  message?: string;
}
