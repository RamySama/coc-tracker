import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUI } from '../store/ui';
import { VillageSwitcher } from './VillageSwitcher';

const iconBtn = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-dim hover:bg-surface-2 hover:text-ink';

export function TopBar() {
  const { t } = useTranslation();
  const openSearch = useUI((s) => s.openSearch);

  return (
    <header className="z-20 flex shrink-0 items-center gap-2 border-b border-border bg-bg px-3 py-2 md:px-6">
      <Link to="/" className="text-brand shrink-0 text-sm font-bold md:hidden">
        ⚔︎
      </Link>
      <div className="min-w-0 flex-1">
        <VillageSwitcher />
      </div>

      <button onClick={openSearch} aria-label={t('search.open')} className={iconBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      </button>

      <Link to="/settings" aria-label={t('nav.settings')} className={iconBtn}>
        <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
          <path d="M8.93 1.03a1.2 1.2 0 0 0-1.86 0l-.62.77a.42.42 0 0 1-.44.14l-.93-.28a1.2 1.2 0 0 0-1.5 1.1l-.05.97a.42.42 0 0 1-.27.37l-.9.36a1.2 1.2 0 0 0-.57 1.76l.54.8a.42.42 0 0 1 0 .47l-.54.8a1.2 1.2 0 0 0 .57 1.76l.9.36c.16.06.26.2.27.37l.05.97a1.2 1.2 0 0 0 1.5 1.1l.93-.28c.16-.05.34 0 .44.14l.62.77a1.2 1.2 0 0 0 1.86 0l.62-.77a.42.42 0 0 1 .44-.14l.93.28a1.2 1.2 0 0 0 1.5-1.1l.05-.97a.42.42 0 0 1 .27-.37l.9-.36a1.2 1.2 0 0 0 .57-1.76l-.54-.8a.42.42 0 0 1 0-.47l.54-.8a1.2 1.2 0 0 0-.57-1.76l-.9-.36a.42.42 0 0 1-.27-.37l-.05-.97a1.2 1.2 0 0 0-1.5-1.1l-.93.28a.42.42 0 0 1-.44-.14l-.62-.77ZM8 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Z" />
        </svg>
      </Link>
    </header>
  );
}
