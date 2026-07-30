"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../Button"
import { Github } from "lucide-react"

const NAV_COLS = [
  {
    heading: "PRODUCT",
    links: [
      { label: "Home", href: "/" },
      { label: "Features", href: "/features" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    heading: "DEVELOPERS",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Docs (Swagger)", href: "/api/docs/", external: true },
      { label: "API Docs (ReDoc)", href: "/api/redoc/", external: true },
      { label: "SDK — Python", href: "https://github.com/SoroScan/soroscan", external: true },
      { label: "SDK — TypeScript", href: "https://github.com/SoroScan/soroscan", external: true },
    ],
  },
  {
    heading: "PROJECT",
    links: [
      { label: "GitHub", href: "https://github.com/SoroScan/soroscan", external: true },
      { label: "Contributing", href: "https://github.com/SoroScan/soroscan/blob/main/CONTRIBUTING.md", external: true },
      { label: "Stellar Network", href: "https://stellar.org", external: true },
      { label: "Soroban Docs", href: "https://soroban.stellar.org", external: true },
    ],
  },
]

export function Footer() {
  return (
    <>
      {/* CTA section */}
      <section className="border border-terminal-cyan/30 p-10 md:p-16 text-center space-y-6 relative overflow-hidden rounded-sm">
        <div className="scanline-overlay" />
        <div className="absolute top-3 left-4 text-[9px] text-terminal-cyan font-terminal-mono">SYSTEM_OVERRIDE_ACTIVE</div>
        <div className="absolute bottom-3 right-4 text-[9px] text-terminal-cyan font-terminal-mono">AUTH_MODE: DEV_OPEN</div>

        <h2 className="text-2xl md:text-3xl font-bold text-terminal-cyan tracking-tight font-terminal-mono">
          READY_TO_UPLINK?
        </h2>
        <p className="text-terminal-gray max-w-md mx-auto text-sm leading-relaxed">
          Join the decentralised indexing network and fuel your Soroban dApps with
          high-fidelity event data — free during open beta.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="/api/docs/" target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg">GET_API_KEY</Button>
          </a>
          <Link href="/docs">
            <Button variant="secondary" size="lg">READ_DOCS</Button>
          </Link>
        </div>
      </section>

      {/* Footer nav */}
      <footer className="border-t border-terminal-green/20 pt-12 pb-6 mt-12 font-terminal-mono">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-terminal-green text-lg font-bold tracking-tighter hover:text-terminal-cyan transition-colors">
              [SOROSCAN]
            </Link>
            <p className="text-[11px] text-terminal-gray mt-2 leading-relaxed max-w-xs">
              The Graph for Soroban. Real-time event indexing for the Stellar ecosystem.
            </p>
            <a
              href="https://github.com/SoroScan/soroscan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-terminal-gray hover:text-terminal-green transition-colors text-xs"
            >
              <Github size={14} />
              GitHub
            </a>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] text-terminal-green tracking-widest mb-3">{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-terminal-gray hover:text-terminal-green transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[11px] text-terminal-gray hover:text-terminal-green transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-terminal-green/10 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-terminal-gray gap-3">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span>&copy; 2026 SOROSCAN_INDEXER_SERVICES</span>
            <a href="#" className="hover:text-terminal-green underline underline-offset-4">TERMS_OF_SERVICE</a>
            <a href="#" className="hover:text-terminal-green underline underline-offset-4">PRIVACY_POLICY</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              STELLAR_MAINNET_UPLINK: ONLINE
            </span>
            <span className="border border-terminal-gray/30 px-2 py-0.5">
              LATENCY: 42MS
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
