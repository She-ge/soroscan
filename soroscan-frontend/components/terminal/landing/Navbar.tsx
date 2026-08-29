"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "../Button"
import { LogOut } from "lucide-react"
import { isLoggedIn, clearTokens } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { HamburgerToggle } from "@/components/ui/hamburger-toggle"
import { LanguageSelector } from "@/components/ui/LanguageSelector"
import { NavDrawer } from "./NavDrawer"

export function Navbar() {
  const [open, setOpen] = React.useState(false)
  const [authenticated, setAuthenticated] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("Navigation")

  const navLinks = [
    { href: "/docs", label: t("docs") },
    { href: "/features", label: t("features") },
    { href: "/developer/api-explorer", label: "API_Explorer" },
    { href: "https://github.com/SoroScan/soroscan", label: "GITHUB", external: true },
  ]

  React.useEffect(() => {
    setAuthenticated(isLoggedIn())
  }, [pathname])

  const handleLogout = () => {
    clearTokens()
    setAuthenticated(false)
    router.push("/")
  }

  return (
    <nav className="border-b border-[#00e5ff]/20 px-6 md:px-8 py-4 flex flex-col bg-[#091a21]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Image
            src="/soroscan-logo-dark.png"
            alt="SoroScan Logo"
            width={140}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-6 lg:gap-8 text-xs text-terminal-gray uppercase tracking-widest items-center">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-terminal-green transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-terminal-green transition-colors ${
                  pathname === link.href ? "text-terminal-green underline underline-offset-4" : ""
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />

            {authenticated ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleLogout}
                className="group"
              >
                <LogOut size={14} className="mr-2 group-hover:text-terminal-danger transition-colors" />
                {t("logout")}
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="secondary">{t("login")}</Button>
              </Link>
            )}

            <a
              href="/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block"
            >
              <Button size="sm" variant="secondary">GET_API_KEY</Button>
            </a>
          </div>

          {/* Mobile hamburger */}
          <HamburgerToggle
            isOpen={open}
            onClick={() => setOpen((o) => !o)}
            ariaControls="mobile-menu"
          />
        </div>

      {/* Mobile navigation drawer */}
      <NavDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        authenticated={authenticated}
        handleLogout={handleLogout}
        pathname={pathname}
      />
    </nav>
  )
}
