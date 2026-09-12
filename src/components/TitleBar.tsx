import { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const win = isTauri() ? getCurrentWindow() : null;

const btn =
  'inline-flex h-full w-11 items-center justify-center text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink';

/** Barre de titre custom pour l'app Windows (fenêtre sans décorations natives). */
export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!win) return;
    win.isMaximized().then(setMaximized);
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setMaximized);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  if (!win) return null;

  return (
    <div
      data-tauri-drag-region
      onDoubleClick={() => win.toggleMaximize()}
      className="z-30 flex h-9 shrink-0 select-none items-center justify-between border-b border-border bg-bg"
    >
      <div data-tauri-drag-region className="text-brand flex h-full flex-1 items-center gap-1.5 px-3 text-xs font-bold">
        <span aria-hidden>⚔︎</span> CoC Tracker
      </div>
      <div className="flex h-full shrink-0 items-stretch">
        <button aria-label="Réduire" className={btn} onClick={() => win.minimize()}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 5h10" />
          </svg>
        </button>
        <button aria-label={maximized ? 'Restaurer' : 'Agrandir'} className={btn} onClick={() => win.toggleMaximize()}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M2 0h8v8M0 2h8v8H0V2Z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button aria-label="Fermer" className={`${btn} hover:bg-danger hover:text-white`} onClick={() => win.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 0l10 10M10 0 0 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
