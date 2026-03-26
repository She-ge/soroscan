'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Endpoint, RequestConfig, ResponseData, HistoryEntry, HttpMethod, EndpointGroup } from './types';
import { API_ENDPOINTS } from './types';

interface ApiExplorerContextType {
  // Endpoints
  endpointGroups: EndpointGroup[];
  selectedEndpoint: Endpoint | null;
  setSelectedEndpoint: (endpoint: Endpoint | null) => void;
  
  // Request builder state
  method: HttpMethod;
  setMethod: (method: HttpMethod) => void;
  url: string;
  setUrl: (url: string) => void;
  headers: Record<string, string>;
  setHeaders: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  queryParams: Record<string, string>;
  setQueryParams: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  requestBody: string;
  setRequestBody: (body: string) => void;
  
  // Auth
  authToken: string;
  setAuthToken: (token: string) => void;
  
  // Request execution
  isLoading: boolean;
  response: ResponseData | null;
  error: string | null;
  executeRequest: () => Promise<void>;
  
  // History
  history: HistoryEntry[];
  clearHistory: () => void;
}

const ApiExplorerContext = createContext<ApiExplorerContextType | undefined>(undefined);

// Default API base URL - should be configured via environment
const DEFAULT_BASE_URL = 'http://localhost:8000';

export function ApiExplorerProvider({ children }: { children: ReactNode }) {
  const [endpointGroups] = useState<EndpointGroup[]>(API_ENDPOINTS);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  
  // Request builder state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>(DEFAULT_BASE_URL);
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
  });
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState<string>('{\n  \n}');
  
  // Auth
  const [authToken, setAuthToken] = useState<string>('');
  
  // Response state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const executeRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    const startTime = performance.now();
    
    // Build the full URL with query parameters
    let fullUrl = url;
    const queryString = Object.entries(queryParams)
      .filter(([, value]) => value !== '' && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
    
    // Build headers - add auth token if present
    const requestHeaders: Record<string, string> = {
      ...headers,
    };
    
    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    
    const requestConfig: RequestConfig = {
      method,
      url: fullUrl,
      headers: requestHeaders,
      queryParams,
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : undefined,
    };
    
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };
      
      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        try {
          // Validate JSON
          JSON.parse(requestBody);
          fetchOptions.body = requestBody;
        } catch {
          throw new Error('Invalid JSON in request body');
        }
      }
      
      const res = await fetch(fullUrl, fetchOptions);
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Parse response body
      let responseBody: unknown;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }
      
      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: responseTime,
      };
      
      setResponse(responseData);
      
      // Add to history
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        request: requestConfig,
        response: responseData,
      };
      
      setHistory((prev: HistoryEntry[]) => [historyEntry, ...prev].slice(0, 50)); // Keep last 50 entries
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Add failed request to history
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        request: requestConfig,
        error: errorMessage,
      };
      
      setHistory((prev: HistoryEntry[]) => [historyEntry, ...prev].slice(0, 50));
    } finally {
      setIsLoading(false);
    }
  }, [method, url, headers, queryParams, requestBody, authToken]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <ApiExplorerContext.Provider
      value={{
        endpointGroups,
        selectedEndpoint,
        setSelectedEndpoint,
        method,
        setMethod,
        url,
        setUrl,
        headers,
        setHeaders,
        queryParams,
        setQueryParams,
        requestBody,
        setRequestBody,
        authToken,
        setAuthToken,
        isLoading,
        response,
        error,
        executeRequest,
        history,
        clearHistory,
      }}
    >
      {children}
    </ApiExplorerContext.Provider>
  );
}

export function useApiExplorer() {
  const context = useContext(ApiExplorerContext);
  if (!context) {
    throw new Error('useApiExplorer must be used within an ApiExplorerProvider');
  }
  return context;
}
