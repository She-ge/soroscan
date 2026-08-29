/** Domain types for contract source code viewer (#914). */

export type VerificationStatus = 'verified' | 'unverified' | 'malicious';
export type CodeLanguage = 'rust' | 'wasm';

export interface ABIParameter {
  name: string;
  type: string;
}

export interface ABIFunction {
  name: string;
  parameters: ABIParameter[];
  returnType: string | null;
  isInvokable: boolean;
}

export interface ConstructorArg {
  name: string;
  type: string;
  value: string;
}

export interface ContractCode {
  sourceCode: string;
  language: CodeLanguage;
  compiledHash: string;
  onChainHash: string;
  verificationStatus: VerificationStatus;
  abi: ABIFunction[];
  constructorArgs: ConstructorArg[] | null;
}
