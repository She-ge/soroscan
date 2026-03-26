'use client';

import React, { useEffect } from 'react';
import { useApiExplorer } from './context';
import type { HttpMethod, Parameter } from './types';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-orange-400',
  DELETE: 'text-red-400',
};

export function RequestBuilder() {
  const {
    selectedEndpoint,
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
    executeRequest,
    isLoading,
  } = useApiExplorer();

  // Auto-fill from selected endpoint
  useEffect(() => {
    if (selectedEndpoint) {
      setMethod(selectedEndpoint.method);
      setUrl(`http://localhost:8000${selectedEndpoint.path}`);
      
      // Set query params from endpoint parameters
      const queryParamsObj: Record<string, string> = {};
      selectedEndpoint.parameters?.forEach((param) => {
        if (param.in === 'query' && param.example) {
          queryParamsObj[param.name] = String(param.example);
        }
      });
      setQueryParams(queryParamsObj);
      
      // Set request body template
      if (selectedEndpoint.requestBody?.content?.['application/json']?.schema) {
        const schema = selectedEndpoint.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema);
        setRequestBody(JSON.stringify(example, null, 2));
      }
    }
  }, [selectedEndpoint, setMethod, setUrl, setQueryParams, setRequestBody]);

  const handleHeaderChange = (key: string, value: string) => {
    if (value === '') {
      const newHeaders = { ...headers };
      delete newHeaders[key];
      setHeaders(newHeaders);
    } else {
      setHeaders({ ...headers, [key]: String(value) });
    }
  };

  const handleQueryParamChange = (key: string, value: string) => {
    if (value === '') {
      const newParams = { ...queryParams };
      delete newParams[key];
      setQueryParams(newParams);
    } else {
      setQueryParams({ ...queryParams, [key]: String(value) });
    }
  };

  const addHeader = () => {
    const key = `Header-${Object.keys(headers).length + 1}`;
    setHeaders({ ...headers, [key]: '' });
  };

  const addQueryParam = () => {
    const key = `param${Object.keys(queryParams).length + 1}`;
    setQueryParams({ ...queryParams, [key]: '' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Endpoint Info */}
      {selectedEndpoint && (
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100">{selectedEndpoint.summary}</h3>
          {selectedEndpoint.description && (
            <p className="text-sm text-zinc-400 mt-1">{selectedEndpoint.description}</p>
          )}
          {selectedEndpoint.requiresAuth && (
            <span className="inline-block mt-2 text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
              Requires Authentication
            </span>
          )}
        </div>
      )}

      {/* Request Configuration */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* URL Bar */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Request URL</label>
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className={`px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium ${METHOD_COLORS[method]}`}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m} className="text-zinc-100">
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
              placeholder="Enter request URL"
            />
            <button
              onClick={executeRequest}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Authentication */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Authentication</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
              placeholder="JWT token (will be added as Authorization: Bearer)"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Enter your JWT token. It will be automatically added as Authorization header.
          </p>
        </div>

        {/* Query Parameters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Query Parameters</label>
            <button
              onClick={addQueryParam}
              className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
            >
              + Add
            </button>
          </div>
          {selectedEndpoint?.parameters
            ?.filter((p) => p.in === 'query')
            .map((param) => (
              <div key={param.name} className="flex gap-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={param.name}
                    readOnly
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-400 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={queryParams[param.name] || ''}
                    onChange={(e) => handleQueryParamChange(param.name, e.target.value)}
                    placeholder={param.description || `Value for ${param.name}`}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
                  />
                </div>
              </div>
            ))}
          {Object.entries(queryParams).map(([key, value]) => {
            const isBuiltIn = selectedEndpoint?.parameters?.some((p) => p.in === 'query' && p.name === key);
            if (isBuiltIn) return null;
            return (
              <div key={key} className="flex gap-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newParams = { ...queryParams };
                      delete newParams[key];
                      if (e.target.value) {
                        newParams[e.target.value] = value;
                      }
                      setQueryParams(newParams);
                    }}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => handleQueryParamChange(key, e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Headers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Headers</label>
            <button
              onClick={addHeader}
              className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
            >
              + Add
            </button>
          </div>
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newHeaders = { ...headers };
                  delete newHeaders[key];
                  if (e.target.value) {
                    newHeaders[e.target.value] = value;
                  }
                  setHeaders(newHeaders);
                }}
                className="w-1/3 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
              />
              <input
                type="text"
                value={String(value)}
                onChange={(e) => handleHeaderChange(key, e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono"
              />
            </div>
          ))}
        </div>

        {/* Request Body */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Request Body</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono resize-none"
              placeholder="Enter JSON request body"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function generateExampleFromSchema(schema: { example?: unknown; type?: string; properties?: Record<string, unknown>; items?: unknown; format?: string; enum?: unknown[] }): unknown {
  if (!schema) return {};
  
  if (schema.example) {
    return schema.example;
  }
  
  if (schema.type === 'object' && schema.properties) {
    const obj: Record<string, any> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      obj[key] = generateExampleFromSchema(propSchema);
    }
    return obj;
  }
  
  if (schema.type === 'array' && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }
  
  if (schema.type === 'string') {
    if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
    if (schema.enum) return schema.enum[0];
    return 'string';
  }
  
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return true;
  
  return null;
}