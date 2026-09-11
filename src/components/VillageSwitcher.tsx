import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useSession } from '../store/session';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { toEngineVillage } from '../hooks/useVillageEngine';
import { completion } from '../lib/engine/progress';
import { getResearch, researchMaxForHall } from '../lib/engine/research';
import { Sheet } from './ui/Sheet';

function villageRatio(v: ReturnType<typeof useVillages.getState>['villages'][number]) {
  const ev = toEngineVillage(v);
  const b = completion(ev);
  let rd = 0;
  let rt = 0;
  for (const it of getResearch(ev.base)) {
    const target = researchMaxForHall(it, ev.hall);
    rt += target;
    rd += Math.min(v.research?.[it.key]?.level ?? 0, target);
  }
  const total = b.total + rt;
  return total === 0 ? 0 : (b.done + rd) / total;
}

export function VillageSwitcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const villages = useVillages((s) => s.villages);
  const setCurrentVillage = useSession((s) => s.setCurrentVillage);
  const current = useCurrentVillage();
  const [open, setOpen] = useState(false);

  if (!current) return null;

  const shortHall = (base: string) => t(base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-brand flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-sm transition-colors hover:bg-surface-3"
      >
        <span className="truncate">{current.name}</span>
        <span className="shrink-0 text-ink-dim">
          {shortHall(current.base)} {current.hall}
        </span>
        <span className="shrink-0 text-ink-dim/60" aria-hidden>
          ▾
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={t('base.home') + ' / ' + t('base.builder')}>
        <div className="flex flex-col gap-1.5">
          {villages.map((v) => {
            const pct = Math.round(villageRatio(v) * 100);
            return (
              <button
                key={v.id}
                onClick={() => {
                  setCurrentVillage(v.id);
                  setOpen(false);
                }}
                className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
                  v.id === current.id ? 'border-brand-2/50 bg-surface-2' : 'border-border hover:bg-surface-2/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{v.name}</span>
                  <span className="shrink-0 text-xs text-ink-dim">
                    {shortHall(v.base)} {v.hall} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full [background-image:var(--gradient-brand)]" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
          <button
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
            className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-ink-dim hover:text-ink"
          >
            + {t('dashboard.addVillage')}
          </button>
        </div>
      </Sheet>
    </>
  );
}
