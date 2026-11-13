import React from 'react';
import { User } from 'firebase/auth';
import {
  Bus,
  LogIn,
  LogOut,
  Phone,
  QrCode,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { MAHAVEER_HELPLINE } from '../lib/defaults';

export type AppTab = 'BOOK' | 'BOOKINGS' | 'ADMIN';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: User | null;
  isAdmin: boolean;
  supportPhone: string;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  isAdmin,
  supportPhone,
  onSignIn,
  onSignOut,
  onOpenShare,
}) => {
  const helpline = supportPhone || MAHAVEER_HELPLINE;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-navy-900 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => onTabChange('BOOK')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-inner">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight sm:text-lg">
                  Easy Ticket
                </span>
                <span className="hidden rounded-full bg-brand-600/20 px-2 py-0.5 text-[11px] font-semibold text-brand-200 sm:inline-block">
                  AC Seater Deluxe
                </span>
              </div>
              <p className="text-xs text-slate-300">Mahaveer Travels, Vidisha</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => onTabChange('BOOK')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === 'BOOK'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bus className="h-4 w-4" />
              Book Ticket
            </button>
            <button
              type="button"
              onClick={() => onTabChange('BOOKINGS')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === 'BOOKINGS'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Ticket className="h-4 w-4" />
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => onTabChange('ADMIN')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === 'ADMIN'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin {isAdmin ? '•' : ''}
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${helpline}`}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700 sm:inline-flex"
              title="Call Mahaveer Travels Helpline"
            >
              <Phone className="h-3.5 w-3.5 text-brand-400" />
              <span>{helpline}</span>
            </a>

            <button
              type="button"
              onClick={onOpenShare}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
              title="Share App Link & QR"
            >
              <QrCode className="h-4 w-4 text-brand-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden text-right lg:block">
                  <p className="max-w-[130px] truncate text-xs font-semibold text-white">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-[10px] text-emerald-300">
                    {isAdmin ? 'Admin Signed In' : 'Synced'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-rose-600 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-brand-500"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <button
          type="button"
          onClick={() => onTabChange('BOOK')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            activeTab === 'BOOK' ? 'text-brand-600' : 'text-slate-500'
          }`}
        >
          <Bus className="h-5 w-5" />
          <span>Book Bus</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('BOOKINGS')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            activeTab === 'BOOKINGS' ? 'text-brand-600' : 'text-slate-500'
          }`}
        >
          <Ticket className="h-5 w-5" />
          <span>My Bookings</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('ADMIN')}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            activeTab === 'ADMIN' ? 'text-brand-600' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          <span>Admin</span>
        </button>
      </nav>
    </>
  );
};
