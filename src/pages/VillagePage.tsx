import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { ease } from '../lib/motion';
import { BuildingsPanel } from './Buildings';
import { ResearchPanel } from './Research';
import { Onboarding } from './Onboarding';

type Tab = 'buildings' | 'research';

export function VillagePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const loading = useVillages((s) => s.loading);
  const village = useCurrentVillage();

  const active: Tab = tab === 'research' ? 'research' : 'buildings';

  if (loading) return <p className="text-ink-dim">{t('common.loading')}</p>;
  if (!village) return <Onboarding />;

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex self-start rounded-lg bg-surface-2 p-1 text-sm">
        {(['buildings', 'research'] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => navigate(`/village/${tb}`)}
            className={`relative rounded-md px-4 py-1.5 font-medium transition-colors ${
              active === tb ? 'text-ink' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {active === tb && (
              <motion.span layoutId="village-tab" className="absolute inset-0 rounded-md bg-surface-3" transition={ease} />
            )}
            <span className="relative">{t(tb === 'buildings' ? 'nav.buildings' : 'nav.research')}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {active === 'buildings' ? <BuildingsPanel /> : <ResearchPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
