/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import en from "../messages/en.json"

const messagesByLocale: Record<string, any> = { en }

function resolve(namespace: string | undefined, key: string, locale: string) {
  const root = messagesByLocale[locale] ?? en
  const scoped = namespace
    ? namespace.split(".").reduce<any>((acc, part) => acc?.[part], root)
    : root
  const value = key.split(".").reduce<any>((acc, part) => acc?.[part], scoped)
  return typeof value === "string" ? value : key
}

export function useTranslations(namespace?: string) {
  return (key: string) => resolve(namespace, key, "en")
}

export function useLocale() {
  return "en"
}

export function useMessages() {
  return messagesByLocale.en
}

export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
