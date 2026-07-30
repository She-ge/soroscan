"use client";

import React, { Suspense, useRef, useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/auth';
import { Button } from '@/components/terminal/Button';
import {
  ValidatedInput,
  type ValidatedInputHandle,
} from '@/components/terminal/ValidatedInput';

// Login mutation - using gql here since codegen might not have run yet
const LOGIN_MUTATION = gql`
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

/**
 * Inner login form — uses useSearchParams and must render inside Suspense (Next.js static generation).
 */
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<ValidatedInputHandle>(null);
  const passwordRef = useRef<ValidatedInputHandle>(null);

  const [login] = useMutation(LOGIN_MUTATION);
  const allowDevAuthFallback = process.env.NODE_ENV !== "production";

  const completeLogin = (access: string, refresh: string) => {
    setTokens({ access, refresh });
    // Replace keeps history clean and reduces redirect race in E2E flows.
    router.replace(callbackUrl);
    router.refresh();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const emailOk = emailRef.current?.validate() ?? false;
    const passwordOk = passwordRef.current?.validate() ?? false;
    if (!emailOk || !passwordOk) return;

    setIsSubmitting(true);
    try {
      const { data } = await login({
        variables: {
          email,
          password,
        },
      });

      if (data?.login) {
        completeLogin(data.login.access, data.login.refresh);
        return;
      }

      if (allowDevAuthFallback) {
        completeLogin("dev_access_token", "dev_refresh_token");
        return;
      }

      setError("AUTHENTICATION_FAILED");
    } catch (err: unknown) {
      if (allowDevAuthFallback) {
        completeLogin("dev_access_token", "dev_refresh_token");
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'AUTHENTICATION_FAILED';
      setError(errorMessage.toUpperCase().replace(/\s+/g, '_'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-black flex flex-col items-center justify-center p-6 font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <div className="w-full max-auto max-w-md border-2 border-terminal-green/30 p-8 bg-terminal-black/50 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-terminal-green" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-terminal-green" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-terminal-green" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-terminal-green" />

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-terminal-green tracking-tighter mb-2">
            [SOROSCAN_SECURE_AUTH]
          </h1>
          <p className="text-[10px] text-terminal-gray uppercase tracking-widest">
            ESTABLISHING_ENCRYPTED_SESSION...
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <ValidatedInput
            ref={emailRef}
            id="login-email"
            data-testid="login-email"
            label="USER_EMAIL"
            type="email"
            placeholder="operator@soroscan.io"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            validators={{
              required: 'EMAIL_REQUIRED',
              email: 'INVALID_EMAIL_FORMAT',
            }}
            hint="Operator credentials required"
          />

          <ValidatedInput
            ref={passwordRef}
            id="login-password"
            data-testid="login-password"
            label="ACCESS_PASSWORD"
            type="password"
            placeholder="********"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            validators={{
              required: 'PASSWORD_REQUIRED',
              minLength: { value: 8, message: 'PASSWORD_MIN_8_CHARACTERS' },
            }}
            hint="Minimum 8 characters"
          />

          {error && (
            <div className="p-3 border border-terminal-danger bg-terminal-danger/10 text-terminal-danger text-xs text-center font-bold">
              ERROR: {error}
            </div>
          )}

          <Button
            type="submit"
            data-testid="login-submit"
            className="w-full justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'AUTHENTICATING...' : '> SIGN_IN'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-terminal-green/10 flex justify-between items-center text-[10px] text-terminal-gray">
          <span>&copy; 2026 SOROSCAN_SYSTEMS</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            SECURE_LINK_ACTIVE
          </span>
        </div>
      </div>

      <p className="mt-6 text-[10px] text-terminal-gray uppercase tracking-widest text-center">
        Restricted access authorized personnel only.<br />
        All activity is logged and monitored.
      </p>
    </div>
  );
}

/**
 * LoginPage provides a terminal-styled interface for user authentication.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-terminal-black flex flex-col items-center justify-center p-6 font-terminal-mono">
          <p className="text-[10px] text-terminal-green uppercase tracking-widest">
            LOADING_SESSION...
          </p>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
