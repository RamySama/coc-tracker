import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export function Login() {
  const { t } = useTranslation();
  const { signInGoogle, signInAnon } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) => async () => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="grid flex-1 place-items-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <div>
          <div className="text-brand text-2xl font-bold">⚔︎ CoC Tracker</div>
          <p className="mt-1 text-sm text-ink-dim">{t('app.tagline')}</p>
        </div>
        <Button variant="glow" size="lg" onClick={run(signInGoogle)}>
          {t('login.google')}
        </Button>
        <Button variant="soft" size="lg" onClick={run(signInAnon)}>
          {t('login.anon')}
        </Button>
        {err && <p className="text-sm text-danger">{err}</p>}
      </div>
    </div>
  );
}
