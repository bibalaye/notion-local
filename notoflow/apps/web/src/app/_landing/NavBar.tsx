"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="NotoFlow" width={28} height={28} className="rounded-md" />
          <span
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: "#e8e8e8" }}
          >
            NotoFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm md:flex" style={{ color: "#666" }}>
          {[
            { href: "#features", label: "Fonctionnalités" },
            { href: "#desktop", label: "Desktop" },
            { href: "/pricing", label: "Tarifs" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors duration-150 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 hover:bg-white/5"
            style={{ color: "#888" }}
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 0 0 1px rgba(124,58,237,0.3)",
            }}
          >
            Commencer
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          style={{ color: "#888" }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t md:hidden"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(8,8,8,0.95)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {[
                { href: "#features", label: "Fonctionnalités" },
                { href: "#desktop", label: "Desktop" },
                { href: "/pricing", label: "Tarifs" },
                { href: "/login", label: "Connexion" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                  style={{ color: "#888" }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/signup"
                className="mt-2 rounded-lg px-3 py-2.5 text-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                onClick={() => setOpen(false)}
              >
                Commencer gratuitement
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
