import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { TopBar } from './TopBar';
import { Toaster } from './Toaster';
import { GlobalSearch } from './GlobalSearch';

const inTauri = isTauri();

const NAV = [
  { to: '/', key: 'dashboard', icon: '🏠', end: true },
  { to: '/village', key: 'village', icon: '🏰' },
  { to: '/upgrades', key: 'upgrades', icon: '⬆️' },
  { to: '/planner', key: 'planner', icon: '🗺️' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 md:flex-row">
        {/* Sidebar desktop */}
        <aside className="hidden shrink-0 flex-col justify-between overflow-y-auto border-r border-border p-4 md:flex md:w-52">
          <div className="flex flex-col gap-1">
            <div className="text-brand mb-4 px-2 text-sm font-bold">⚔︎ CoC Tracker</div>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-surface-2 text-ink' : 'text-ink-dim hover:bg-surface-2/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="glow-brand-sm absolute inset-y-1.5 left-0 w-0.5 rounded-full [background-image:var(--gradient-brand)]" />
                    )}
                    <span aria-hidden>{n.icon}</span>
                    <span className={isActive ? 'text-brand font-semibold' : undefined}>{t(`nav.${n.key}`)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-surface-2 text-ink' : 'text-ink-dim hover:bg-surface-2/60'}`
            }
          >
            <span aria-hidden>⚙️</span>
            {t('nav.settings')}
          </NavLink>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">{children}</main>
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-4 py-2 md:px-6 md:py-2.5">
            <p className="line-clamp-1 text-[10px] leading-snug text-ink-dim/60 md:line-clamp-none md:text-[11px]">
              {t('footer.disclaimer')}
            </p>
            {inTauri && (
              <button
                onClick={() => getCurrentWindow().close()}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-ink-dim transition-colors hover:bg-danger/15 hover:text-danger"
              >
                {t('common.quit')}
              </button>
            )}
          </footer>
          {/* Barre du bas mobile — en flux, ne chevauche plus le contenu */}
          <nav className="flex shrink-0 border-t border-border bg-surface md:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="glow-brand-sm absolute inset-x-6 top-0 h-0.5 rounded-full [background-image:var(--gradient-brand)]" />
                    )}
                    <span aria-hidden className="text-lg">
                      {n.icon}
                    </span>
                    <span className={isActive ? 'text-brand font-semibold' : 'text-ink-dim'}>{t(`nav.${n.key}`)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <Toaster />
      <GlobalSearch />
    </div>
  );
}
