import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useVillages } from '../store/villages';
import { useSession, type Locale } from '../store/session';
import { maxHall, meta } from '../lib/engine/catalog';
import { Stepper } from '../components/Stepper';
import { Button } from '../components/ui/Button';
import { Onboarding } from './Onboarding';

export function Settings() {
  const { t } = useTranslation();
  const { user, firebaseEnabled, signOut, signInGoogle } = useAuth();
  const villages = useVillages((s) => s.villages);
  const updateVillage = useVillages((s) => s.updateVillage);
  const removeVillage = useVillages((s) => s.removeVillage);
  const repoKind = useVillages((s) => s.repoKind);
  const { locale, setLocale, setCurrentVillage, currentVillageId } = useSession();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-brand text-xl font-bold">{t('settings.title')}</h1>

      {/* Langue */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink-dim">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {(['fr', 'en'] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`rounded-lg border px-4 py-1.5 text-sm transition-colors ${
                locale === l ? 'border-brand-2 bg-surface-2 text-ink' : 'border-border text-ink-dim hover:text-ink'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Compte */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink-dim">{t('settings.account')}</h2>
        {!firebaseEnabled ? (
          <p className="text-sm text-ink-dim">{t('login.localOnly')}</p>
        ) : user ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>{user.isAnonymous ? t('settings.anonAccount') : t('settings.signedInAs', { name: user.displayName ?? user.email ?? '—' })}</span>
            <Button variant="soft" size="sm" onClick={() => signOut()}>
              {t('settings.signOut')}
            </Button>
          </div>
        ) : (
          <Button variant="soft" size="sm" className="self-start" onClick={() => signInGoogle()}>
            {t('settings.signIn')}
          </Button>
        )}
        <p className="text-xs text-ink-dim/70">
          {t('settings.dataSource', { package: meta.sourcePackage, version: meta.sourceVersion })} · {repoKind}
        </p>
      </section>

      {/* Villages */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-dim">{t('settings.villages')}</h2>
          <Button variant="soft" size="sm" onClick={() => setAdding((v) => !v)}>
            {adding ? t('common.cancel') : '+ ' + t('dashboard.addVillage')}
          </Button>
        </div>

        {adding && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <Onboarding onDone={() => setAdding(false)} />
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {villages.map((v) => (
            <li key={v.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md bg-surface-2 px-2 py-1 text-sm outline-none"
                  defaultValue={v.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== v.name) updateVillage(v.id, { name });
                  }}
                />
                <span className="text-xs text-ink-dim">
                  {t(v.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort')} {v.hall}
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(t('settings.deleteConfirm'))) {
                      removeVillage(v.id);
                      if (currentVillageId === v.id) setCurrentVillage(null);
                    }
                  }}
                >
                  {t('common.delete')}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-dim">
                <label className="flex items-center gap-2">
                  {t(v.base === 'home' ? 'base.hallHome' : 'base.hallBuilder')}
                  <Stepper value={v.hall} min={1} max={maxHall(v.base)} size="sm" onChange={(hall) => updateVillage(v.id, { hall })} />
                </label>
                <label className="flex items-center gap-2">
                  {t('common.builders')}
                  <Stepper value={v.builders} min={1} max={6} size="sm" onChange={(builders) => updateVillage(v.id, { builders })} />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
