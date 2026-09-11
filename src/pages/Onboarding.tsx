import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { Base } from '../lib/engine/types';
import { getHall, maxHall } from '../lib/engine/catalog';
import { presetBuildings, type PresetMode } from '../lib/engine/presets';
import { presetResearch } from '../lib/engine/research';
import { useVillages } from '../store/villages';
import { useSession } from '../store/session';
import { BuildingIcon } from '../components/BuildingIcon';
import { RangeSlider } from '../components/ui/RangeSlider';
import { Button } from '../components/ui/Button';
import { ease } from '../lib/motion';

export function Onboarding({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createVillage = useVillages((s) => s.createVillage);
  const updateVillage = useVillages((s) => s.updateVillage);
  const hasVillages = useVillages((s) => s.villages.length > 0);
  const setCurrentVillage = useSession((s) => s.setCurrentVillage);

  const [step, setStep] = useState<0 | 1 | 2>(hasVillages ? 1 : 0);
  const [name, setName] = useState('');
  const [base, setBase] = useState<Base>('home');
  const [hall, setHall] = useState(11);
  const [builders, setBuilders] = useState(5);
  const [busy, setBusy] = useState(false);

  const hallMax = maxHall(base);
  const hallKey = base === 'home' ? 'base.hallHome' : 'base.hallBuilder';
  const shortHall = t(base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const hallIcon = getHall(base, hall)?.icon ?? null;

  async function start(mode: PresetMode | 'manual') {
    if (busy) return;
    setBusy(true);
    const id = await createVillage({ name: name.trim() || t('onboarding.namePlaceholder'), base, hall, builders });
    if (id) {
      setCurrentVillage(id);
      if (mode === 'advanced') {
        await updateVillage(id, {
          buildings: presetBuildings(base, hall, 'advanced'),
          research: presetResearch(base, hall, 'advanced'),
        });
      }
    }
    setBusy(false);
    onDone?.();
    navigate(mode === 'manual' ? '/village/buildings' : '/');
  }

  const slide = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: ease,
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      {step > 0 && (
        <div className="flex items-center gap-1.5">
          {[1, 2].map((s) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'glow-brand-sm [background-image:var(--gradient-brand)]' : 'bg-surface-2'}`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="welcome" {...slide} className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="text-5xl" aria-hidden>
              ⚔︎
            </div>
            <div>
              <h1 className="text-brand text-2xl font-bold">CoC Tracker</h1>
              <p className="mt-2 text-sm text-ink-dim">{t('app.tagline')}</p>
            </div>
            <Button variant="glow" size="lg" onClick={() => setStep(1)} className="mt-2">
              {t('onboarding.createFirst')}
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" {...slide} className="flex flex-col gap-5">
            <h1 className="text-brand text-xl font-bold">{t('onboarding.title')}</h1>

            <label className="flex flex-col gap-1.5 text-sm">
              {t('onboarding.name')}
              <input
                autoFocus
                className="rounded-lg bg-surface-2 px-3 py-2 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.namePlaceholder')}
              />
            </label>

            <div className="flex flex-col gap-1.5 text-sm">
              {t('onboarding.chooseBase')}
              <div className="grid grid-cols-2 gap-2">
                {(['home', 'builder'] as Base[]).map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => {
                      setBase(b);
                      setHall(b === 'home' ? 11 : 6);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      base === b ? 'border-brand-2 bg-surface-2 text-ink' : 'border-border text-ink-dim'
                    }`}
                  >
                    {t(`base.${b}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BuildingIcon icon={hallIcon} name={shortHall} size={52} />
              <label className="flex flex-1 flex-col gap-1.5 text-sm">
                {t(hallKey)} — {t('onboarding.hallLevel', { hall })}
                <RangeSlider min={1} max={hallMax} value={hall} onChange={setHall} />
              </label>
            </div>

            <Button size="lg" onClick={() => setStep(2)}>
              {t('common.next')}
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" {...slide} className="flex flex-col gap-5">
            <button onClick={() => setStep(1)} className="text-brand self-start text-sm font-medium">
              ‹ {t('common.back')}
            </button>

            <label className="flex flex-col gap-1.5 text-sm">
              {t('common.builders')} — {builders}
              <RangeSlider min={1} max={6} value={builders} onChange={setBuilders} />
              <span className="text-xs text-ink-dim">{t('onboarding.buildersHelp')}</span>
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-ink-dim">{t('onboarding.presetQuestion')}</span>
              <button
                disabled={busy}
                onClick={() => start('advanced')}
                className="spotlight glow-brand rounded-lg px-4 py-2.5 text-left font-semibold text-white [background-image:var(--gradient-brand)] [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] disabled:opacity-50"
              >
                {t('onboarding.presetAdvanced', { hall: `${shortHall} ${Math.max(1, hall - 1)}` })}
                <span className="block text-xs font-normal opacity-80">{t('onboarding.presetAdvancedHelp')}</span>
              </button>
              <button
                disabled={busy}
                onClick={() => start('manual')}
                className="rounded-lg border border-border px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-2/50 disabled:opacity-50"
              >
                {t('onboarding.presetManual')}
                <span className="block text-xs text-ink-dim">{t('onboarding.presetManualHelp')}</span>
              </button>
              <button
                disabled={busy}
                onClick={() => start('fresh')}
                className="rounded-lg border border-border px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-2/50 disabled:opacity-50"
              >
                {t('onboarding.presetFresh')}
                <span className="block text-xs text-ink-dim">{t('onboarding.presetFreshHelp')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
