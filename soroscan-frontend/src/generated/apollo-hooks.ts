import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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


export const GetSystemMetricsDocument = gql`
    query GetSystemMetrics {
  systemMetrics {
    eventsIndexedToday
    eventsIndexedTotal
    webhookSuccessRate
    avgWebhookDeliveryTime
    activeContracts
    lastSynced
    dbStatus
    redisStatus
  }
  recentErrors(limit: 10) {
    id
    timestamp
    level
    message
    context
  }
}
    `;

/**
 * __useGetSystemMetricsQuery__
 *
 * To run a query within a React component, call `useGetSystemMetricsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSystemMetricsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSystemMetricsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSystemMetricsQuery(baseOptions?: Apollo.QueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
      }
export function useGetSystemMetricsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
        }
// @ts-ignore
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>;
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSystemMetricsQuery | undefined, GetSystemMetricsQueryVariables>;
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
        }
export type GetSystemMetricsQueryHookResult = ReturnType<typeof useGetSystemMetricsQuery>;
export type GetSystemMetricsLazyQueryHookResult = ReturnType<typeof useGetSystemMetricsLazyQuery>;
export type GetSystemMetricsSuspenseQueryHookResult = ReturnType<typeof useGetSystemMetricsSuspenseQuery>;
export type GetSystemMetricsQueryResult = Apollo.QueryResult<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>;
export const SaveSearchPlaceholderDocument = gql`
    query SaveSearchPlaceholder {
  me {
    id
    email
  }
}
    `;

/**
 * __useSaveSearchPlaceholderQuery__
 *
 * To run a query within a React component, call `useSaveSearchPlaceholderQuery` and pass it any options that fit your needs.
 * When your component renders, `useSaveSearchPlaceholderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSaveSearchPlaceholderQuery({
 *   variables: {
 *   },
 * });
 */
export function useSaveSearchPlaceholderQuery(baseOptions?: Apollo.QueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
      }
export function useSaveSearchPlaceholderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
        }
// @ts-ignore
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>): Apollo.UseSuspenseQueryResult<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>;
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>): Apollo.UseSuspenseQueryResult<SaveSearchPlaceholderQuery | undefined, SaveSearchPlaceholderQueryVariables>;
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
        }
export type SaveSearchPlaceholderQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderQuery>;
export type SaveSearchPlaceholderLazyQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderLazyQuery>;
export type SaveSearchPlaceholderSuspenseQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderSuspenseQuery>;
export type SaveSearchPlaceholderQueryResult = Apollo.QueryResult<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    access
    refresh
    user {
      id
      email
    }
export const RequestDataGdprExportDocument = gql`
    mutation RequestDataGDPRExport($organizationId: String!, $format: String!) {
  requestGDPRDataExport(organizationId: $organizationId, format: $format) {
    requestId
    status
    expiresAt
    downloadUrl
  }
}
    `;
export type RequestDataGdprExportMutationFn = Apollo.MutationFunction<RequestDataGdprExportMutation, RequestDataGdprExportMutationVariables>;

/**
 * __useRequestDataGdprExportMutation__
 *
 * To run a mutation, you first call `useRequestDataGdprExportMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestDataGdprExportMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestDataGdprExportMutation, { data, loading, error }] = useRequestDataGdprExportMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      format: // value for 'format'
 *   },
 * });
 */
export function useRequestDataGdprExportMutation(baseOptions?: Apollo.MutationHookOptions<RequestDataGdprExportMutation, RequestDataGdprExportMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestDataGdprExportMutation, RequestDataGdprExportMutationVariables>(RequestDataGdprExportDocument, options);
      }
export type RequestDataGdprExportMutationHookResult = ReturnType<typeof useRequestDataGdprExportMutation>;
export type RequestDataGdprExportMutationResult = Apollo.MutationResult<RequestDataGdprExportMutation>;
export type RequestDataGdprExportMutationOptions = Apollo.BaseMutationOptions<RequestDataGdprExportMutation, RequestDataGdprExportMutationVariables>;
export const RequestRightToBeForgottenDocument = gql`
    mutation RequestRightToBeForgotten($userId: String!, $reason: String) {
  requestRightToBeForgotten(userId: $userId, reason: $reason) {
    requestId
    status
    approvalDate
  }
}
    `;
export type RequestRightToBeForgottenMutationFn = Apollo.MutationFunction<RequestRightToBeForgottenMutation, RequestRightToBeForgottenMutationVariables>;

/**
 * __useRequestRightToBeForgottenMutation__
 *
 * To run a mutation, you first call `useRequestRightToBeForgottenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestRightToBeForgottenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestRightToBeForgottenMutation, { data, loading, error }] = useRequestRightToBeForgottenMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useRequestRightToBeForgottenMutation(baseOptions?: Apollo.MutationHookOptions<RequestRightToBeForgottenMutation, RequestRightToBeForgottenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestRightToBeForgottenMutation, RequestRightToBeForgottenMutationVariables>(RequestRightToBeForgottenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ContractDependencyGraphDocument = gql`
    query ContractDependencyGraph($contractId: String) {
  contracts(filter: {}) {
    id
    name
    address
    riskScore
    reachabilityPct
    vulnerabilities {
      id
      title
      severity
      impactedContracts
    }
    dependencies {
      id
      contractAddress
      contractName
      dependencyType
    }
    dependents {
      id
      contractAddress
      contractName
    }
  }
}
    `;

/**
 * __useContractDependencyGraphQuery__
 *
 * To run a query within a React component, call `useContractDependencyGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useContractDependencyGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContractDependencyGraphQuery({
 *   variables: {
 *      contractId: // value for 'contractId'
 *   },
 * });
 */
export function useContractDependencyGraphQuery(baseOptions?: Apollo.QueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
      }
export function useContractDependencyGraphLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
        }
// @ts-ignore
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>): Apollo.UseSuspenseQueryResult<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>;
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>): Apollo.UseSuspenseQueryResult<ContractDependencyGraphQuery | undefined, ContractDependencyGraphQueryVariables>;
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
        }
export type ContractDependencyGraphQueryHookResult = ReturnType<typeof useContractDependencyGraphQuery>;
export type ContractDependencyGraphLazyQueryHookResult = ReturnType<typeof useContractDependencyGraphLazyQuery>;
export type ContractDependencyGraphSuspenseQueryHookResult = ReturnType<typeof useContractDependencyGraphSuspenseQuery>;
export type ContractDependencyGraphQueryResult = Apollo.QueryResult<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>;
export const OnContractEventDocument = gql`
    subscription OnContractEvent($contractId: String!) {
  contractEvent(contractId: $contractId) {
    id
    eventType
    ledgerSequence
    timestamp
    payload
  }
}
    `;
export type RequestRightToBeForgottenMutationHookResult = ReturnType<typeof useRequestRightToBeForgottenMutation>;
export type RequestRightToBeForgottenMutationResult = Apollo.MutationResult<RequestRightToBeForgottenMutation>;
export type RequestRightToBeForgottenMutationOptions = Apollo.BaseMutationOptions<RequestRightToBeForgottenMutation, RequestRightToBeForgottenMutationVariables>;

export type AuthPayload = {
  __typename?: 'AuthPayload';
  access: Scalars['String']['output'];
  refresh: Scalars['String']['output'];
  user: User;
};

export type ContractEvent = {
  __typename?: 'ContractEvent';
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ledgerSequence: Scalars['Int']['output'];
  payload: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
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


export const GetSystemMetricsDocument = gql`
    query GetSystemMetrics {
  systemMetrics {
    eventsIndexedToday
    eventsIndexedTotal
    webhookSuccessRate
    avgWebhookDeliveryTime
    activeContracts
    lastSynced
    dbStatus
    redisStatus
  }
  recentErrors(limit: 10) {
    id
    timestamp
    level
    message
    context
  }
}
    `;

/**
 * __useGetSystemMetricsQuery__
 *
 * To run a query within a React component, call `useGetSystemMetricsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSystemMetricsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSystemMetricsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSystemMetricsQuery(baseOptions?: Apollo.QueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
      }
export function useGetSystemMetricsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
        }
// @ts-ignore
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>;
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSystemMetricsQuery | undefined, GetSystemMetricsQueryVariables>;
export function useGetSystemMetricsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>(GetSystemMetricsDocument, options);
        }
export type GetSystemMetricsQueryHookResult = ReturnType<typeof useGetSystemMetricsQuery>;
export type GetSystemMetricsLazyQueryHookResult = ReturnType<typeof useGetSystemMetricsLazyQuery>;
export type GetSystemMetricsSuspenseQueryHookResult = ReturnType<typeof useGetSystemMetricsSuspenseQuery>;
export type GetSystemMetricsQueryResult = Apollo.QueryResult<GetSystemMetricsQuery, GetSystemMetricsQueryVariables>;
export const SaveSearchPlaceholderDocument = gql`
    query SaveSearchPlaceholder {
  me {
    id
    email
  }
}
    `;

/**
 * __useSaveSearchPlaceholderQuery__
 *
 * To run a query within a React component, call `useSaveSearchPlaceholderQuery` and pass it any options that fit your needs.
 * When your component renders, `useSaveSearchPlaceholderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSaveSearchPlaceholderQuery({
 *   variables: {
 *   },
 * });
 */
export function useSaveSearchPlaceholderQuery(baseOptions?: Apollo.QueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
      }
export function useSaveSearchPlaceholderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
        }
// @ts-ignore
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>): Apollo.UseSuspenseQueryResult<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>;
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>): Apollo.UseSuspenseQueryResult<SaveSearchPlaceholderQuery | undefined, SaveSearchPlaceholderQueryVariables>;
export function useSaveSearchPlaceholderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>(SaveSearchPlaceholderDocument, options);
        }
export type SaveSearchPlaceholderQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderQuery>;
export type SaveSearchPlaceholderLazyQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderLazyQuery>;
export type SaveSearchPlaceholderSuspenseQueryHookResult = ReturnType<typeof useSaveSearchPlaceholderSuspenseQuery>;
export type SaveSearchPlaceholderQueryResult = Apollo.QueryResult<SaveSearchPlaceholderQuery, SaveSearchPlaceholderQueryVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    access
    refresh
    user {
      id
      email
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RefreshTokenDocument = gql`
    mutation RefreshToken($refresh: String!) {
  refreshToken(refresh: $refresh) {
    access
    refresh
  }
}
    `;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutation, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *      refresh: // value for 'refresh'
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: Apollo.MutationHookOptions<RefreshTokenMutation, RefreshTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RefreshTokenMutation, RefreshTokenMutationVariables>(RefreshTokenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ContractDependencyGraphDocument = gql`
    query ContractDependencyGraph($contractId: String) {
  contracts(filter: {}) {
    id
    name
    address
    riskScore
    reachabilityPct
    vulnerabilities {
      id
      title
      severity
      impactedContracts
    }
    dependencies {
      id
      contractAddress
      contractName
      dependencyType
    }
    dependents {
      id
      contractAddress
      contractName
    }
  }
}
    `;

/**
 * __useContractDependencyGraphQuery__
 *
 * To run a query within a React component, call `useContractDependencyGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useContractDependencyGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContractDependencyGraphQuery({
 *   variables: {
 *      contractId: // value for 'contractId'
 *   },
 * });
 */
export function useContractDependencyGraphQuery(baseOptions?: Apollo.QueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
      }
export function useContractDependencyGraphLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
        }
// @ts-ignore
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>): Apollo.UseSuspenseQueryResult<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>;
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>): Apollo.UseSuspenseQueryResult<ContractDependencyGraphQuery | undefined, ContractDependencyGraphQueryVariables>;
export function useContractDependencyGraphSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>(ContractDependencyGraphDocument, options);
        }
export type ContractDependencyGraphQueryHookResult = ReturnType<typeof useContractDependencyGraphQuery>;
export type ContractDependencyGraphLazyQueryHookResult = ReturnType<typeof useContractDependencyGraphLazyQuery>;
export type ContractDependencyGraphSuspenseQueryHookResult = ReturnType<typeof useContractDependencyGraphSuspenseQuery>;
export type ContractDependencyGraphQueryResult = Apollo.QueryResult<ContractDependencyGraphQuery, ContractDependencyGraphQueryVariables>;
export const OnContractEventDocument = gql`
    subscription OnContractEvent($contractId: String!) {
  contractEvent(contractId: $contractId) {
    id
    eventType
    ledgerSequence
    timestamp
    payload
  }
}
    `;

/**
 * __useOnContractEventSubscription__
 *
 * To run a query within a React component, call `useOnContractEventSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnContractEventSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnContractEventSubscription({
 *   variables: {
 *      contractId: // value for 'contractId'
 *   },
 * });
 */
export function useOnContractEventSubscription(baseOptions: Apollo.SubscriptionHookOptions<OnContractEventSubscription, OnContractEventSubscriptionVariables> & ({ variables: OnContractEventSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OnContractEventSubscription, OnContractEventSubscriptionVariables>(OnContractEventDocument, options);
      }
export type OnContractEventSubscriptionHookResult = ReturnType<typeof useOnContractEventSubscription>;
export type OnContractEventSubscriptionResult = Apollo.SubscriptionResult<OnContractEventSubscription>;
export const GetEventsDocument = gql`
    query GetEvents($contractId: String!, $first: Int!) {
  events(contractId: $contractId, first: $first) {
    edges {
      node {
        id
        contractId
        eventType
        data
        createdAt
      }
    }
  }
}
    `;

/**
 * __useGetEventsQuery__
 *
 * To run a query within a React component, call `useGetEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEventsQuery({
 *   variables: {
 *      contractId: // value for 'contractId'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useGetEventsQuery(baseOptions: Apollo.QueryHookOptions<GetEventsQuery, GetEventsQueryVariables> & ({ variables: GetEventsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument, options);
      }
export function useGetEventsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEventsQuery, GetEventsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument, options);
        }
// @ts-ignore
// @ts-expect-error Apollo overload typing for SuspenseQuery generated signatures
export function useGetEventsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetEventsQuery, GetEventsQueryVariables>): Apollo.UseSuspenseQueryResult<GetEventsQuery, GetEventsQueryVariables>;
export function useGetEventsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetEventsQuery, GetEventsQueryVariables>): Apollo.UseSuspenseQueryResult<GetEventsQuery | undefined, GetEventsQueryVariables>;
export function useGetEventsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetEventsQuery, GetEventsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetEventsQuery, GetEventsQueryVariables>(GetEventsDocument, options);
        }
export type GetEventsQueryHookResult = ReturnType<typeof useGetEventsQuery>;
export type GetEventsLazyQueryHookResult = ReturnType<typeof useGetEventsLazyQuery>;
export type GetEventsSuspenseQueryHookResult = ReturnType<typeof useGetEventsSuspenseQuery>;
export type GetEventsQueryResult = Apollo.QueryResult<GetEventsQuery, GetEventsQueryVariables>;
export const MyOrganizationsDocument = gql`
    query MyOrganizations {
  myOrganizations {
    id
    name
    billingContact
    dataRegion
    createdAt
    contractCount
    webhookLimit
  }
}
    `;

/**
 * __useMyOrganizationsQuery__
 *
 * To run a query within a React component, call `useMyOrganizationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyOrganizationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyOrganizationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyOrganizationsQuery(baseOptions?: Apollo.QueryHookOptions<MyOrganizationsQuery, MyOrganizationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyOrganizationsQuery, MyOrganizationsQueryVariables>(MyOrganizationsDocument, options);
      }
export function useMyOrganizationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyOrganizationsQuery, MyOrganizationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyOrganizationsQuery, MyOrganizationsQueryVariables>(MyOrganizationsDocument, options);
        }
// @ts-ignore
export function useMyOrganizationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyOrganizationsQuery, MyOrganizationsQueryVariables>): Apollo.UseSuspenseQueryResult<MyOrganizationsQuery, MyOrganizationsQueryVariables>;
export function useMyOrganizationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyOrganizationsQuery, MyOrganizationsQueryVariables>): Apollo.UseSuspenseQueryResult<MyOrganizationsQuery | undefined, MyOrganizationsQueryVariables>;
export function useMyOrganizationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyOrganizationsQuery, MyOrganizationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyOrganizationsQuery, MyOrganizationsQueryVariables>(MyOrganizationsDocument, options);
        }
export type MyOrganizationsQueryHookResult = ReturnType<typeof useMyOrganizationsQuery>;
export type MyOrganizationsLazyQueryHookResult = ReturnType<typeof useMyOrganizationsLazyQuery>;
export type MyOrganizationsSuspenseQueryHookResult = ReturnType<typeof useMyOrganizationsSuspenseQuery>;
export type MyOrganizationsQueryResult = Apollo.QueryResult<MyOrganizationsQuery, MyOrganizationsQueryVariables>;
export const OrganizationDetailsDocument = gql`
    query OrganizationDetails($id: String!) {
  organization(id: $id) {
    id
    name
    billingContact
    dataRegion
    createdAt
    contractCount
    webhookLimit
  }
}
    `;

/**
 * __useOrganizationDetailsQuery__
 *
 * To run a query within a React component, call `useOrganizationDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationDetailsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useOrganizationDetailsQuery(baseOptions: Apollo.QueryHookOptions<OrganizationDetailsQuery, OrganizationDetailsQueryVariables> & ({ variables: OrganizationDetailsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>(OrganizationDetailsDocument, options);
      }
export function useOrganizationDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>(OrganizationDetailsDocument, options);
        }
// @ts-ignore
export function useOrganizationDetailsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>): Apollo.UseSuspenseQueryResult<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>;
export function useOrganizationDetailsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>): Apollo.UseSuspenseQueryResult<OrganizationDetailsQuery | undefined, OrganizationDetailsQueryVariables>;
export function useOrganizationDetailsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>(OrganizationDetailsDocument, options);
        }
export type OrganizationDetailsQueryHookResult = ReturnType<typeof useOrganizationDetailsQuery>;
export type OrganizationDetailsLazyQueryHookResult = ReturnType<typeof useOrganizationDetailsLazyQuery>;
export type OrganizationDetailsSuspenseQueryHookResult = ReturnType<typeof useOrganizationDetailsSuspenseQuery>;
export type OrganizationDetailsQueryResult = Apollo.QueryResult<OrganizationDetailsQuery, OrganizationDetailsQueryVariables>;
export const TeamMembersDocument = gql`
    query TeamMembers($organizationId: String!) {
  teamMembers(organizationId: $organizationId) {
    id
    email
    role
    joinedAt
    lastActiveAt
  }
}
    `;

/**
 * __useTeamMembersQuery__
 *
 * To run a query within a React component, call `useTeamMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useTeamMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTeamMembersQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useTeamMembersQuery(baseOptions: Apollo.QueryHookOptions<TeamMembersQuery, TeamMembersQueryVariables> & ({ variables: TeamMembersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TeamMembersQuery, TeamMembersQueryVariables>(TeamMembersDocument, options);
      }
export function useTeamMembersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TeamMembersQuery, TeamMembersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TeamMembersQuery, TeamMembersQueryVariables>(TeamMembersDocument, options);
        }
// @ts-ignore
export function useTeamMembersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TeamMembersQuery, TeamMembersQueryVariables>): Apollo.UseSuspenseQueryResult<TeamMembersQuery, TeamMembersQueryVariables>;
export function useTeamMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TeamMembersQuery, TeamMembersQueryVariables>): Apollo.UseSuspenseQueryResult<TeamMembersQuery | undefined, TeamMembersQueryVariables>;
export function useTeamMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TeamMembersQuery, TeamMembersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TeamMembersQuery, TeamMembersQueryVariables>(TeamMembersDocument, options);
        }
export type TeamMembersQueryHookResult = ReturnType<typeof useTeamMembersQuery>;
export type TeamMembersLazyQueryHookResult = ReturnType<typeof useTeamMembersLazyQuery>;
export type TeamMembersSuspenseQueryHookResult = ReturnType<typeof useTeamMembersSuspenseQuery>;
export type TeamMembersQueryResult = Apollo.QueryResult<TeamMembersQuery, TeamMembersQueryVariables>;
export const TeamInvitationsDocument = gql`
    query TeamInvitations($organizationId: String!) {
  teamInvitations(organizationId: $organizationId) {
    id
    email
    role
    invitedAt
    expiresAt
    status
  }
}
    `;

/**
 * __useTeamInvitationsQuery__
 *
 * To run a query within a React component, call `useTeamInvitationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTeamInvitationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTeamInvitationsQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useTeamInvitationsQuery(baseOptions: Apollo.QueryHookOptions<TeamInvitationsQuery, TeamInvitationsQueryVariables> & ({ variables: TeamInvitationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TeamInvitationsQuery, TeamInvitationsQueryVariables>(TeamInvitationsDocument, options);
      }
export function useTeamInvitationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TeamInvitationsQuery, TeamInvitationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TeamInvitationsQuery, TeamInvitationsQueryVariables>(TeamInvitationsDocument, options);
        }
// @ts-ignore
export function useTeamInvitationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TeamInvitationsQuery, TeamInvitationsQueryVariables>): Apollo.UseSuspenseQueryResult<TeamInvitationsQuery, TeamInvitationsQueryVariables>;
export function useTeamInvitationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TeamInvitationsQuery, TeamInvitationsQueryVariables>): Apollo.UseSuspenseQueryResult<TeamInvitationsQuery | undefined, TeamInvitationsQueryVariables>;
export function useTeamInvitationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TeamInvitationsQuery, TeamInvitationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TeamInvitationsQuery, TeamInvitationsQueryVariables>(TeamInvitationsDocument, options);
        }
export type TeamInvitationsQueryHookResult = ReturnType<typeof useTeamInvitationsQuery>;
export type TeamInvitationsLazyQueryHookResult = ReturnType<typeof useTeamInvitationsLazyQuery>;
export type TeamInvitationsSuspenseQueryHookResult = ReturnType<typeof useTeamInvitationsSuspenseQuery>;
export type TeamInvitationsQueryResult = Apollo.QueryResult<TeamInvitationsQuery, TeamInvitationsQueryVariables>;
export const OrganizationActivityDocument = gql`
    query OrganizationActivity($organizationId: String!) {
  organizationActivity(organizationId: $organizationId) {
    id
    action
    actorEmail
    targetEmail
    detail
    timestamp
  }
}
    `;

/**
 * __useOrganizationActivityQuery__
 *
 * To run a query within a React component, call `useOrganizationActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationActivityQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useOrganizationActivityQuery(baseOptions: Apollo.QueryHookOptions<OrganizationActivityQuery, OrganizationActivityQueryVariables> & ({ variables: OrganizationActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationActivityQuery, OrganizationActivityQueryVariables>(OrganizationActivityDocument, options);
      }
export function useOrganizationActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationActivityQuery, OrganizationActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationActivityQuery, OrganizationActivityQueryVariables>(OrganizationActivityDocument, options);
        }
// @ts-ignore
export function useOrganizationActivitySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<OrganizationActivityQuery, OrganizationActivityQueryVariables>): Apollo.UseSuspenseQueryResult<OrganizationActivityQuery, OrganizationActivityQueryVariables>;
export function useOrganizationActivitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OrganizationActivityQuery, OrganizationActivityQueryVariables>): Apollo.UseSuspenseQueryResult<OrganizationActivityQuery | undefined, OrganizationActivityQueryVariables>;
export function useOrganizationActivitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OrganizationActivityQuery, OrganizationActivityQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<OrganizationActivityQuery, OrganizationActivityQueryVariables>(OrganizationActivityDocument, options);
        }
export type OrganizationActivityQueryHookResult = ReturnType<typeof useOrganizationActivityQuery>;
export type OrganizationActivityLazyQueryHookResult = ReturnType<typeof useOrganizationActivityLazyQuery>;
export type OrganizationActivitySuspenseQueryHookResult = ReturnType<typeof useOrganizationActivitySuspenseQuery>;
export type OrganizationActivityQueryResult = Apollo.QueryResult<OrganizationActivityQuery, OrganizationActivityQueryVariables>;
export const CreateOrganizationDocument = gql`
    mutation CreateOrganization($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    id
    name
    billingContact
    dataRegion
    createdAt
    contractCount
    webhookLimit
  }
}
    `;
export type CreateOrganizationMutationFn = Apollo.MutationFunction<CreateOrganizationMutation, CreateOrganizationMutationVariables>;

/**
 * __useCreateOrganizationMutation__
 *
 * To run a mutation, you first call `useCreateOrganizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOrganizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOrganizationMutation, { data, loading, error }] = useCreateOrganizationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOrganizationMutation(baseOptions?: Apollo.MutationHookOptions<CreateOrganizationMutation, CreateOrganizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateOrganizationMutation, CreateOrganizationMutationVariables>(CreateOrganizationDocument, options);
      }
export type CreateOrganizationMutationHookResult = ReturnType<typeof useCreateOrganizationMutation>;
export type CreateOrganizationMutationResult = Apollo.MutationResult<CreateOrganizationMutation>;
export type CreateOrganizationMutationOptions = Apollo.BaseMutationOptions<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const UpdateOrganizationDocument = gql`
    mutation UpdateOrganization($id: String!, $input: UpdateOrganizationInput!) {
  updateOrganization(id: $id, input: $input) {
    id
    name
    billingContact
    dataRegion
    createdAt
    contractCount
    webhookLimit
  }
}
    `;
export type UpdateOrganizationMutationFn = Apollo.MutationFunction<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;

/**
 * __useUpdateOrganizationMutation__
 *
 * To run a mutation, you first call `useUpdateOrganizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrganizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrganizationMutation, { data, loading, error }] = useUpdateOrganizationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateOrganizationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(UpdateOrganizationDocument, options);
      }
export type UpdateOrganizationMutationHookResult = ReturnType<typeof useUpdateOrganizationMutation>;
export type UpdateOrganizationMutationResult = Apollo.MutationResult<UpdateOrganizationMutation>;
export type UpdateOrganizationMutationOptions = Apollo.BaseMutationOptions<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const InviteTeamMemberDocument = gql`
    mutation InviteTeamMember($organizationId: String!, $email: String!, $role: OrgRole!) {
  inviteTeamMember(organizationId: $organizationId, email: $email, role: $role) {
    success
    invitationId
    message
  }
}
    `;
export type InviteTeamMemberMutationFn = Apollo.MutationFunction<InviteTeamMemberMutation, InviteTeamMemberMutationVariables>;

/**
 * __useInviteTeamMemberMutation__
 *
 * To run a mutation, you first call `useInviteTeamMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInviteTeamMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [inviteTeamMemberMutation, { data, loading, error }] = useInviteTeamMemberMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      email: // value for 'email'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useInviteTeamMemberMutation(baseOptions?: Apollo.MutationHookOptions<InviteTeamMemberMutation, InviteTeamMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InviteTeamMemberMutation, InviteTeamMemberMutationVariables>(InviteTeamMemberDocument, options);
      }
export type InviteTeamMemberMutationHookResult = ReturnType<typeof useInviteTeamMemberMutation>;
export type InviteTeamMemberMutationResult = Apollo.MutationResult<InviteTeamMemberMutation>;
export type InviteTeamMemberMutationOptions = Apollo.BaseMutationOptions<InviteTeamMemberMutation, InviteTeamMemberMutationVariables>;
export const UpdateTeamMemberRoleDocument = gql`
    mutation UpdateTeamMemberRole($organizationId: String!, $memberId: String!, $role: OrgRole!) {
  updateTeamMemberRole(
    organizationId: $organizationId
    memberId: $memberId
    role: $role
  ) {
    id
    email
    role
    joinedAt
    lastActiveAt
  }
}
    `;
export type UpdateTeamMemberRoleMutationFn = Apollo.MutationFunction<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>;

/**
 * __useUpdateTeamMemberRoleMutation__
 *
 * To run a mutation, you first call `useUpdateTeamMemberRoleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTeamMemberRoleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTeamMemberRoleMutation, { data, loading, error }] = useUpdateTeamMemberRoleMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      memberId: // value for 'memberId'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useUpdateTeamMemberRoleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>(UpdateTeamMemberRoleDocument, options);
      }
export type UpdateTeamMemberRoleMutationHookResult = ReturnType<typeof useUpdateTeamMemberRoleMutation>;
export type UpdateTeamMemberRoleMutationResult = Apollo.MutationResult<UpdateTeamMemberRoleMutation>;
export type UpdateTeamMemberRoleMutationOptions = Apollo.BaseMutationOptions<UpdateTeamMemberRoleMutation, UpdateTeamMemberRoleMutationVariables>;
export const RemoveTeamMemberDocument = gql`
    mutation RemoveTeamMember($organizationId: String!, $memberId: String!) {
  removeTeamMember(organizationId: $organizationId, memberId: $memberId)
}
    `;
export type RemoveTeamMemberMutationFn = Apollo.MutationFunction<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>;

/**
 * __useRemoveTeamMemberMutation__
 *
 * To run a mutation, you first call `useRemoveTeamMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveTeamMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeTeamMemberMutation, { data, loading, error }] = useRemoveTeamMemberMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      memberId: // value for 'memberId'
 *   },
 * });
 */
export function useRemoveTeamMemberMutation(baseOptions?: Apollo.MutationHookOptions<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>(RemoveTeamMemberDocument, options);
      }
export type RemoveTeamMemberMutationHookResult = ReturnType<typeof useRemoveTeamMemberMutation>;
export type RemoveTeamMemberMutationResult = Apollo.MutationResult<RemoveTeamMemberMutation>;
export type RemoveTeamMemberMutationOptions = Apollo.BaseMutationOptions<RemoveTeamMemberMutation, RemoveTeamMemberMutationVariables>;
export const ResendInvitationDocument = gql`
    mutation ResendInvitation($organizationId: String!, $invitationId: String!) {
  resendInvitation(organizationId: $organizationId, invitationId: $invitationId) {
    id
    email
    role
    invitedAt
    expiresAt
    status
  }
}
    `;
export type ResendInvitationMutationFn = Apollo.MutationFunction<ResendInvitationMutation, ResendInvitationMutationVariables>;

/**
 * __useResendInvitationMutation__
 *
 * To run a mutation, you first call `useResendInvitationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResendInvitationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resendInvitationMutation, { data, loading, error }] = useResendInvitationMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      invitationId: // value for 'invitationId'
 *   },
 * });
 */
export function useResendInvitationMutation(baseOptions?: Apollo.MutationHookOptions<ResendInvitationMutation, ResendInvitationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResendInvitationMutation, ResendInvitationMutationVariables>(ResendInvitationDocument, options);
      }
export type ResendInvitationMutationHookResult = ReturnType<typeof useResendInvitationMutation>;
export type ResendInvitationMutationResult = Apollo.MutationResult<ResendInvitationMutation>;
export type ResendInvitationMutationOptions = Apollo.BaseMutationOptions<ResendInvitationMutation, ResendInvitationMutationVariables>;
export const CancelInvitationDocument = gql`
    mutation CancelInvitation($organizationId: String!, $invitationId: String!) {
  cancelInvitation(organizationId: $organizationId, invitationId: $invitationId)
}
    `;
export type CancelInvitationMutationFn = Apollo.MutationFunction<CancelInvitationMutation, CancelInvitationMutationVariables>;

/**
 * __useCancelInvitationMutation__
 *
 * To run a mutation, you first call `useCancelInvitationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelInvitationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelInvitationMutation, { data, loading, error }] = useCancelInvitationMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      invitationId: // value for 'invitationId'
 *   },
 * });
 */
export function useCancelInvitationMutation(baseOptions?: Apollo.MutationHookOptions<CancelInvitationMutation, CancelInvitationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelInvitationMutation, CancelInvitationMutationVariables>(CancelInvitationDocument, options);
      }
export type CancelInvitationMutationHookResult = ReturnType<typeof useCancelInvitationMutation>;
export type CancelInvitationMutationResult = Apollo.MutationResult<CancelInvitationMutation>;
export type CancelInvitationMutationOptions = Apollo.BaseMutationOptions<CancelInvitationMutation, CancelInvitationMutationVariables>;
export const SwitchOrganizationDocument = gql`
    mutation SwitchOrganization($organizationId: String!) {
  switchOrganization(organizationId: $organizationId) {
    id
    name
    billingContact
    dataRegion
    createdAt
    contractCount
    webhookLimit
  }
}
    `;
export type SwitchOrganizationMutationFn = Apollo.MutationFunction<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>;

/**
 * __useSwitchOrganizationMutation__
 *
 * To run a mutation, you first call `useSwitchOrganizationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSwitchOrganizationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [switchOrganizationMutation, { data, loading, error }] = useSwitchOrganizationMutation({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useSwitchOrganizationMutation(baseOptions?: Apollo.MutationHookOptions<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>(SwitchOrganizationDocument, options);
      }
export type SwitchOrganizationMutationHookResult = ReturnType<typeof useSwitchOrganizationMutation>;
export type SwitchOrganizationMutationResult = Apollo.MutationResult<SwitchOrganizationMutation>;
export type SwitchOrganizationMutationOptions = Apollo.BaseMutationOptions<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>;