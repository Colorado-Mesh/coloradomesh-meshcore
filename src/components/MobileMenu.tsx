'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import BrandMark from './brand/BrandMark';
import { COMMUNITY_NAME, DISCORD_INVITE_URL } from '@/lib/constants';

export interface MobileNavLink {
  href: string;
  label: string;
  external?: boolean;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: MobileNavLink[];
}

function DiscordIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function MobileMenu({ isOpen, onClose, navLinks }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-night-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-card-border shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        inert={!isOpen}
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-card-border">
            <BrandMark size="sm" href="/" />

            <button
              ref={closeButtonRef}
              type="button"
              className="p-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-card/60 transition-colors duration-200 focus-ring"
              onClick={onClose}
              aria-label="Close menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 text-base font-medium text-foreground hover:text-mesh hover:bg-card/60 rounded-lg transition-colors duration-200 focus-ring"
                    onClick={onClose}
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                  >
                    <span>{link.label}</span>
                    {link.external && (
                      <svg
                        className="h-4 w-4 text-foreground-dim"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-4 py-6 border-t border-card-border bg-background-secondary">
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full btn-accent py-3 text-base focus-ring"
              aria-label="Join the Colorado MeshCore Discord"
            >
              <DiscordIcon />
              Join Discord
            </a>

            <p className="mt-4 text-center text-sm text-foreground-muted">
              Connect with the {COMMUNITY_NAME} community
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
