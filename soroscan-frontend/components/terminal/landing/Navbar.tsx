"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../Button"
import { LogOut } from "lucide-react"
import { isLoggedIn, clearTokens } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { HamburgerToggle } from "@/components/ui/hamburger-toggle"
import { NavDrawer } from "./NavDrawer"

const navLinks = [
  { href: "/docs",      label: "DOCS" },
  { href: "/features",  label: "FEATURES" },
  { href: "/api/docs/", label: "API_DOCS", external: true },
  { href: "https://github.com/SoroScan/soroscan", label: "GITHUB", external: true },
]

export function Navbar() {
  const [open, setOpen] = React.useState(false)
  const [authenticated, setAuthenticated] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    setAuthenticated(isLoggedIn())
  }, [pathname])

  const handleLogout = () => {
    clearTokens()
    setAuthenticated(false)
    router.push("/")
  }

  return (
    <nav className="border-b border-terminal-green/30 px-6 md:px-8 py-4 flex flex-col bg-terminal-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-terminal-green text-lg md:text-xl font-bold tracking-tighter hover:text-terminal-cyan transition-colors font-terminal-mono"
        >
          [SOROSCAN]
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
            {authenticated ? (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleLogout}
                className="group"
              >
                <LogOut size={14} className="mr-2 group-hover:text-terminal-danger transition-colors" />
                LOGOUT
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="secondary">SIGN_IN</Button>
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
