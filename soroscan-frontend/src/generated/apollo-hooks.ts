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

export type Mutation = {
  __typename?: 'Mutation';
  login: AuthPayload;
  refreshToken: AuthPayload;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRefreshTokenArgs = {
  refresh: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  events: EventConnection;
  me?: Maybe<User>;
  recentErrors: Array<ErrorLog>;
  systemMetrics: SystemMetrics;
};


export type QueryEventsArgs = {
  contractId?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


export type QueryRecentErrorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
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

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

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

export type OnContractEventSubscriptionVariables = Exact<{
  contractId: Scalars['String']['input'];
}>;


export type OnContractEventSubscription = { __typename?: 'Subscription', contractEvent: { __typename?: 'ContractEvent', id: string, eventType: string, ledgerSequence: number, timestamp: string, payload: string } };

export type GetEventsQueryVariables = Exact<{
  contractId: Scalars['String']['input'];
  first: Scalars['Int']['input'];
}>;


export type GetEventsQuery = { __typename?: 'Query', events: { __typename?: 'EventConnection', edges: Array<{ __typename?: 'EventEdge', node: { __typename?: 'Event', id: string, contractId: string, eventType: string, data: string, createdAt: string } }> } };


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
// @ts-expect-error Apollo overload typing for SuspenseQuery generated signatures
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
// @ts-expect-error Apollo overload typing for SuspenseQuery generated signatures
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