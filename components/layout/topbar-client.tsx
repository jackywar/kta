"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogoutButton } from "@/components/layout/logout-button";

export type TopbarNavLink = { href: string; label: string };

type Props = {
  displayName: string;
  roleLine: string;
  navLinks: TopbarNavLink[];
};

export function TopbarClient({ displayName, roleLine, navLinks }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      first?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    function onViewportChange() {
      if (mq.matches) setOpen(false);
    }
    mq.addEventListener("change", onViewportChange);
    return () => mq.removeEventListener("change", onViewportChange);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const showMobileMenu = navLinks.length > 0;

  return (
    <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        {showMobileMenu ? (
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-haspopup="dialog"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => {
              setOpen((v) => {
                const next = !v;
                if (!next) {
                  requestAnimationFrame(() => menuButtonRef.current?.focus());
                }
                return next;
              });
            }}
          >
            <span className="text-lg leading-none" aria-hidden>
              {open ? "✕" : "☰"}
            </span>
          </button>
        ) : null}

        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900"
        >
          KTA
        </Link>

        {navLinks.length > 0 ? (
          <nav
            className="hidden min-w-0 flex-wrap items-center gap-x-4 gap-y-1 md:flex"
            aria-label="Navigation principale"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/profile"
          className="max-w-[40vw] truncate text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline sm:max-w-none"
        >
          {displayName}
        </Link>
        <LogoutButton />
      </div>

      {mounted &&
        showMobileMenu &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[100] md:hidden">
            <button
              type="button"
              className="absolute inset-0 z-0 bg-zinc-900/40 backdrop-blur-[1px]"
              aria-label="Fermer le menu"
              onClick={close}
            />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute left-0 top-0 z-10 flex h-full w-[min(20rem,88vw)] flex-col border-r border-zinc-200 bg-white shadow-xl"
            >
              <div className="border-b border-zinc-100 px-4 py-4">
                <p id={titleId} className="text-sm font-semibold text-zinc-900">
                  {displayName}
                </p>
                {roleLine ? (
                  <p className="mt-0.5 text-xs text-zinc-500">{roleLine}</p>
                ) : null}
              </div>
              <nav
                className="flex-1 overflow-y-auto px-2 py-3"
                aria-label="Menu"
              >
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href="/"
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={close}
                    >
                      Accueil
                    </Link>
                  </li>
                  {navLinks.map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        onClick={close}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
