import { useTranslation } from 'react-i18next';
import { useSession } from '../store/session';
import { Switch } from './ui/Switch';

export function HideMaxedToggle() {
  const { t } = useTranslation();
  const hideMaxed = useSession((s) => s.hideMaxed);
  const toggle = useSession((s) => s.toggleHideMaxed);
  return <Switch checked={hideMaxed} onChange={toggle} label={t('common.hideMaxed')} />;
}
