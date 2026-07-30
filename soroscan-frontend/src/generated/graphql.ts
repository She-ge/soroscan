/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  access: Scalars['String']['output'];
  refresh: Scalars['String']['output'];
  user: User;
};

export type ContractDependency = {
  __typename?: 'ContractDependency';
  contractAddress: Scalars['String']['output'];
  contractName: Scalars['String']['output'];
  dependencyType: DependencyType;
  id: Scalars['ID']['output'];
};

export type ContractDependent = {
  __typename?: 'ContractDependent';
  contractAddress: Scalars['String']['output'];
  contractName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type ContractEvent = {
  __typename?: 'ContractEvent';
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ledgerSequence: Scalars['Int']['output'];
  payload: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type ContractFilter = {
  name?: InputMaybe<Scalars['String']['input']>;
  vulnerabilityType?: InputMaybe<Scalars['String']['input']>;
};

export type ContractVulnerability = {
  __typename?: 'ContractVulnerability';
  id: Scalars['ID']['output'];
  impactedContracts: Array<Scalars['String']['output']>;
  severity: VulnerabilitySeverity;
  title: Scalars['String']['output'];
};

export type ContractWithDeps = {
  __typename?: 'ContractWithDeps';
  address: Scalars['String']['output'];
  dependencies: Array<ContractDependency>;
  dependents: Array<ContractDependent>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  reachabilityPct: Scalars['Float']['output'];
  riskScore: Scalars['Float']['output'];
  vulnerabilities: Array<ContractVulnerability>;
};

export type CreateOrganizationInput = {
  billingContact: Scalars['String']['input'];
  dataRegion: DataRegion;
  name: Scalars['String']['input'];
};

export enum DataRegion {
  ApSoutheast = 'ap_southeast',
  EuWest = 'eu_west',
  UsEast = 'us_east'
}

export enum DependencyType {
  Circular = 'CIRCULAR',
  Direct = 'DIRECT',
  Indirect = 'INDIRECT'
}

export type DataExportResponse = {
  __typename?: 'DataExportResponse';
  downloadUrl?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['String']['output'];
  requestId: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type DeletionRequestResponse = {
  __typename?: 'DeletionRequestResponse';
  approvalDate?: Maybe<Scalars['String']['output']>;
  requestId: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type ErrorLog = {
  __typename?: 'ErrorLog';
  context?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type Event = {
  __typename?: 'Event';
  contractId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  data: Scalars['String']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type EventConnection = {
  __typename?: 'EventConnection';
  edges: Array<EventEdge>;
};

export type EventEdge = {
  __typename?: 'EventEdge';
  node: Event;
};

export type InviteResult = {
  __typename?: 'InviteResult';
  invitationId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cancelInvitation: Scalars['Boolean']['output'];
  createOrganization: Organization;
  inviteTeamMember: InviteResult;
  login: AuthPayload;
  refreshToken: AuthPayload;
  removeTeamMember: Scalars['Boolean']['output'];
  resendInvitation: TeamInvitation;
  switchOrganization: Organization;
  updateOrganization: Organization;
  updateTeamMemberRole: TeamMember;
};


export type MutationCancelInvitationArgs = {
  invitationId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationInviteTeamMemberArgs = {
  email: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  role: OrgRole;
  requestGDPRDataExport: DataExportResponse;
  requestRightToBeForgotten: DeletionRequestResponse;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRefreshTokenArgs = {
  refresh: Scalars['String']['input'];
};


export type MutationRemoveTeamMemberArgs = {
  memberId: Scalars['String']['input'];
export type MutationRequestGdprDataExportArgs = {
  format: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type MutationResendInvitationArgs = {
  invitationId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type MutationSwitchOrganizationArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['String']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdateTeamMemberRoleArgs = {
  memberId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  role: OrgRole;
};

export type OrgActivityEntry = {
  __typename?: 'OrgActivityEntry';
  action: Scalars['String']['output'];
  actorEmail: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  targetEmail?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['String']['output'];
};

export enum OrgRole {
  Admin = 'admin',
  Operator = 'operator',
  Owner = 'owner',
  Viewer = 'viewer'
}

export type Organization = {
  __typename?: 'Organization';
  billingContact: Scalars['String']['output'];
  contractCount: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  dataRegion: DataRegion;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  webhookLimit: Scalars['Int']['output'];
export type MutationRequestRightToBeForgottenArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  contracts: Array<ContractWithDeps>;
  events: EventConnection;
  me?: Maybe<User>;
  myOrganizations: Array<Organization>;
  organization?: Maybe<Organization>;
  organizationActivity: Array<OrgActivityEntry>;
  recentErrors: Array<ErrorLog>;
  systemMetrics: SystemMetrics;
  teamInvitations: Array<TeamInvitation>;
  teamMembers: Array<TeamMember>;
};


export type QueryContractsArgs = {
  filter?: InputMaybe<ContractFilter>;
};


export type QueryEventsArgs = {
  contractId?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryOrganizationActivityArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryRecentErrorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTeamInvitationsArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryTeamMembersArgs = {
  organizationId: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  contractEvent: ContractEvent;
};


export type SubscriptionContractEventArgs = {
  contractId: Scalars['String']['input'];
};

export type SystemMetrics = {
  __typename?: 'SystemMetrics';
  activeContracts: Scalars['Int']['output'];
  avgWebhookDeliveryTime: Scalars['Float']['output'];
  dbStatus: Scalars['String']['output'];
  eventsIndexedToday: Scalars['Int']['output'];
  eventsIndexedTotal: Scalars['Int']['output'];
  lastSynced?: Maybe<Scalars['String']['output']>;
  redisStatus: Scalars['String']['output'];
  webhookSuccessRate: Scalars['Float']['output'];
};

export type TeamInvitation = {
  __typename?: 'TeamInvitation';
  email: Scalars['String']['output'];
  expiresAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  invitedAt: Scalars['String']['output'];
  role: OrgRole;
  status: Scalars['String']['output'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  joinedAt: Scalars['String']['output'];
  lastActiveAt?: Maybe<Scalars['String']['output']>;
  role: OrgRole;
};

export type UpdateOrganizationInput = {
  billingContact?: InputMaybe<Scalars['String']['input']>;
  dataRegion?: InputMaybe<DataRegion>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  activeOrganizationId?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export enum VulnerabilitySeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
  None = 'NONE'
}

export type GetSystemMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSystemMetricsQuery = { __typename?: 'Query', systemMetrics: { __typename?: 'SystemMetrics', eventsIndexedToday: number, eventsIndexedTotal: number, webhookSuccessRate: number, avgWebhookDeliveryTime: number, activeContracts: number, lastSynced?: string | null, dbStatus: string, redisStatus: string }, recentErrors: Array<{ __typename?: 'ErrorLog', id: string, timestamp: string, level: string, message: string, context?: string | null }> };

export type RequestDataGdprExportMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  format: Scalars['String']['input'];
}>;


export type RequestDataGdprExportMutation = { __typename?: 'Mutation', requestGDPRDataExport: { __typename?: 'DataExportResponse', requestId: string, status: string, expiresAt: string, downloadUrl?: string | null } };

export type RequestRightToBeForgottenMutationVariables = Exact<{
  userId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type RequestRightToBeForgottenMutation = { __typename?: 'Mutation', requestRightToBeForgotten: { __typename?: 'DeletionRequestResponse', requestId: string, status: string, approvalDate?: string | null } };
export type SaveSearchPlaceholderQueryVariables = Exact<{ [key: string]: never; }>;


export type SaveSearchPlaceholderQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email: string } | null };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', access: string, refresh: string, user: { __typename?: 'User', id: string, email: string } } };

export type RefreshTokenMutationVariables = Exact<{
  refresh: Scalars['String']['input'];
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', access: string, refresh: string } };

export type ContractDependencyGraphQueryVariables = Exact<{
  contractId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ContractDependencyGraphQuery = { __typename?: 'Query', contracts: Array<{ __typename?: 'ContractWithDeps', id: string, name: string, address: string, riskScore: number, reachabilityPct: number, vulnerabilities: Array<{ __typename?: 'ContractVulnerability', id: string, title: string, severity: VulnerabilitySeverity, impactedContracts: Array<string> }>, dependencies: Array<{ __typename?: 'ContractDependency', id: string, contractAddress: string, contractName: string, dependencyType: DependencyType }>, dependents: Array<{ __typename?: 'ContractDependent', id: string, contractAddress: string, contractName: string }> }> };

export type OnContractEventSubscriptionVariables = Exact<{
  contractId: Scalars['String']['input'];
}>;


export type OnContractEventSubscription = { __typename?: 'Subscription', contractEvent: { __typename?: 'ContractEvent', id: string, eventType: string, ledgerSequence: number, timestamp: string, payload: string } };

export type GetEventsQueryVariables = Exact<{
  contractId: Scalars['String']['input'];
  first: Scalars['Int']['input'];
}>;


export type GetEventsQuery = { __typename?: 'Query', events: { __typename?: 'EventConnection', edges: Array<{ __typename?: 'EventEdge', node: { __typename?: 'Event', id: string, contractId: string, eventType: string, data: string, createdAt: string } }> } };

export type MyOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyOrganizationsQuery = { __typename?: 'Query', myOrganizations: Array<{ __typename?: 'Organization', id: string, name: string, billingContact: string, dataRegion: DataRegion, createdAt: string, contractCount: number, webhookLimit: number }> };

export type OrganizationDetailsQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OrganizationDetailsQuery = { __typename?: 'Query', organization?: { __typename?: 'Organization', id: string, name: string, billingContact: string, dataRegion: DataRegion, createdAt: string, contractCount: number, webhookLimit: number } | null };

export type TeamMembersQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type TeamMembersQuery = { __typename?: 'Query', teamMembers: Array<{ __typename?: 'TeamMember', id: string, email: string, role: OrgRole, joinedAt: string, lastActiveAt?: string | null }> };

export type TeamInvitationsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type TeamInvitationsQuery = { __typename?: 'Query', teamInvitations: Array<{ __typename?: 'TeamInvitation', id: string, email: string, role: OrgRole, invitedAt: string, expiresAt: string, status: string }> };

export type OrganizationActivityQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type OrganizationActivityQuery = { __typename?: 'Query', organizationActivity: Array<{ __typename?: 'OrgActivityEntry', id: string, action: string, actorEmail: string, targetEmail?: string | null, detail: string, timestamp: string }> };

export type CreateOrganizationMutationVariables = Exact<{
  input: CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string, name: string, billingContact: string, dataRegion: DataRegion, createdAt: string, contractCount: number, webhookLimit: number } };

export type UpdateOrganizationMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization: { __typename?: 'Organization', id: string, name: string, billingContact: string, dataRegion: DataRegion, createdAt: string, contractCount: number, webhookLimit: number } };

export type InviteTeamMemberMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  role: OrgRole;
}>;


export type InviteTeamMemberMutation = { __typename?: 'Mutation', inviteTeamMember: { __typename?: 'InviteResult', success: boolean, invitationId?: string | null, message: string } };

export type UpdateTeamMemberRoleMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  memberId: Scalars['String']['input'];
  role: OrgRole;
}>;


export type UpdateTeamMemberRoleMutation = { __typename?: 'Mutation', updateTeamMemberRole: { __typename?: 'TeamMember', id: string, email: string, role: OrgRole, joinedAt: string, lastActiveAt?: string | null } };

export type RemoveTeamMemberMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  memberId: Scalars['String']['input'];
}>;


export type RemoveTeamMemberMutation = { __typename?: 'Mutation', removeTeamMember: boolean };

export type ResendInvitationMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  invitationId: Scalars['String']['input'];
}>;


export type ResendInvitationMutation = { __typename?: 'Mutation', resendInvitation: { __typename?: 'TeamInvitation', id: string, email: string, role: OrgRole, invitedAt: string, expiresAt: string, status: string } };

export type CancelInvitationMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
  invitationId: Scalars['String']['input'];
}>;


export type CancelInvitationMutation = { __typename?: 'Mutation', cancelInvitation: boolean };

export type SwitchOrganizationMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type SwitchOrganizationMutation = { __typename?: 'Mutation', switchOrganization: { __typename?: 'Organization', id: string, name: string, billingContact: string, dataRegion: DataRegion, createdAt: string, contractCount: number, webhookLimit: number } };


export const GetSystemMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSystemMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventsIndexedToday"}},{"kind":"Field","name":{"kind":"Name","value":"eventsIndexedTotal"}},{"kind":"Field","name":{"kind":"Name","value":"webhookSuccessRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgWebhookDeliveryTime"}},{"kind":"Field","name":{"kind":"Name","value":"activeContracts"}},{"kind":"Field","name":{"kind":"Name","value":"lastSynced"}},{"kind":"Field","name":{"kind":"Name","value":"dbStatus"}},{"kind":"Field","name":{"kind":"Name","value":"redisStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentErrors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"context"}}]}}]}}]} as unknown as DocumentNode<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>;
export const RequestDataGdprExportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestDataGDPRExport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"format"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestGDPRDataExport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"format"},"value":{"kind":"Variable","name":{"kind":"Name","value":"format"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<RequestDataGdprExportMutation, RequestDataGdprExportMutationVariables>;
export const RequestRightToBeForgottenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestRightToBeForgotten"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestRightToBeForgotten"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvalDate"}}]}}]}}]} as unknown as DocumentNode<RequestRightToBeForgottenMutation, RequestRightToBeForgottenMutationVariables>;
export const SaveSearchPlaceholderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SaveSearchPlaceholder"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"access"}},{"kind":"Field","name":{"kind":"Name","value":"refresh"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refresh"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"refresh"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refresh"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"access"}},{"kind":"Field","name":{"kind":"Name","value":"refresh"}}]}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ContractDependencyGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContractDependencyGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contractId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contracts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"riskScore"}},{"kind":"Field","name":{"kind":"Name","value":"reachabilityPct"}},{"kind":"Field","name":{"kind":"Name","value":"vulnerabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"impactedContracts"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contractAddress"}},{"kind":"Field","name":{"kind":"Name","value":"contractName"}},{"kind":"Field","name":{"kind":"Name","value":"dependencyType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contractAddress"}},{"kind":"Field","name":{"kind":"Name","value":"contractName"}}]}}]}}]}}]} as unknown as DocumentNode<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>;
export const OnContractEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnContractEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contractId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contractEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contractId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contractId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"ledgerSequence"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]} as unknown as DocumentNode<OnContractEventSubscription, OnContractEventSubscriptionVariables>;
export const GetEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contractId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contractId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contractId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contractId"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetEventsQuery, GetEventsQueryVariables>;
export const MyOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"billingContact"}},{"kind":"Field","name":{"kind":"Name","value":"dataRegion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"contractCount"}},{"kind":"Field","name":{"kind":"Name","value":"webhookLimit"}}]}}]}}]} as unknown as DocumentNode<MyOrganizationsQuery, MyOrganizationsQueryVariables>;
export const OrganizationDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"billingContact"}},{"kind":"Field","name":{"kind":"Name","value":"dataRegion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"contractCount"}},{"kind":"Field","name":{"kind":"Name","value":"webhookLimit"}}]}}]}}]} as unknown as DocumentNode<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>;
export const TeamMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastActiveAt"}}]}}]}}]} as unknown as DocumentNode<TeamMembersQuery, TeamMembersQueryVariables>;
export const TeamInvitationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamInvitations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamInvitations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<TeamInvitationsQuery, TeamInvitationsQueryVariables>;
export const OrganizationActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"actorEmail"}},{"kind":"Field","name":{"kind":"Name","value":"targetEmail"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<OrganizationActivityQuery, OrganizationActivityQueryVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"billingContact"}},{"kind":"Field","name":{"kind":"Name","value":"dataRegion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"contractCount"}},{"kind":"Field","name":{"kind":"Name","value":"webhookLimit"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const UpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"billingContact"}},{"kind":"Field","name":{"kind":"Name","value":"dataRegion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"contractCount"}},{"kind":"Field","name":{"kind":"Name","value":"webhookLimit"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const InviteTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrgRole"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"invitationId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<InviteTeamMemberMutation, InviteTeamMemberMutationVariables>;
export const UpdateTeamMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeamMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrgRole"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeamMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastActiveAt"}}]}}]}}]} as unknown as DocumentNode<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>;
export const RemoveTeamMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTeamMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}]}]}}]} as unknown as DocumentNode<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>;
export const ResendInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"invitedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ResendInvitationMutation, ResendInvitationMutationVariables>;
export const CancelInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<CancelInvitationMutation, CancelInvitationMutationVariables>;
export const SwitchOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SwitchOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"billingContact"}},{"kind":"Field","name":{"kind":"Name","value":"dataRegion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"contractCount"}},{"kind":"Field","name":{"kind":"Name","value":"webhookLimit"}}]}}]}}]} as unknown as DocumentNode<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>;