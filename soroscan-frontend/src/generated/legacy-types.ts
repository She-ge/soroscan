export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
