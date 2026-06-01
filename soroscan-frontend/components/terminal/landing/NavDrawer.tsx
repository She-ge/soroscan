"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "../Button";

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  authenticated: boolean;
  handleLogout: () => void;
  pathname: string;
}

const navLinks = [
  { href: "/docs",      label: "DOCS" },
  { href: "/features",  label: "FEATURES" },
  { href: "/api/docs/", label: "API_DOCS", external: true },
  { href: "https://github.com/SoroScan/soroscan", label: "GITHUB", external: true },
];

export function NavDrawer({
  isOpen,
  onClose,
  authenticated,
  handleLogout,
  pathname,
}: NavDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="left"
      title="[SOROSCAN]"
      className="md:hidden"
    >
      <div className="flex flex-col gap-5 pt-4 text-xs uppercase tracking-widest text-terminal-gray">
        {navLinks.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal-green transition-colors py-3 px-2 border border-transparent hover:border-terminal-green/20 rounded-sm font-terminal-mono"
              onClick={onClose}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-terminal-green transition-colors py-3 px-2 border rounded-sm font-terminal-mono ${
                pathname === link.href
                  ? "border-terminal-green/30 text-terminal-green bg-terminal-green/10"
                  : "border-transparent"
              }`}
              onClick={onClose}
            >
              {link.label}
            </Link>
          )
        )}

        {authenticated ? (
          <button
            onClick={() => {
              handleLogout();
              onClose();
            }}
            className="flex items-center gap-2 hover:text-terminal-danger transition-colors py-3 px-2 text-left border border-transparent hover:border-terminal-danger/20 rounded-sm font-terminal-mono"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        ) : (
          <Link
            href="/login"
            className={`hover:text-terminal-green transition-colors py-3 px-2 border rounded-sm font-terminal-mono ${
              pathname === "/login"
                ? "border-terminal-green/30 text-terminal-green bg-terminal-green/10"
                : "border-transparent"
            }`}
            onClick={onClose}
          >
            SIGN_IN
          </Link>
        )}

        <a
          href="/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4"
          onClick={onClose}
        >
          <Button size="sm" variant="secondary" className="w-full justify-center py-5 font-terminal-mono">
            GET_API_KEY
          </Button>
        </a>
      </div>
    </Drawer>
  );
}
