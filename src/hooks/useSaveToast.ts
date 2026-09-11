import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { toast } from '../store/toast';

/** Renvoie une fonction qui affiche un toast « Enregistré · Annuler » après une modif. */
export function useSaveToast() {
  const { t } = useTranslation();
  const undoLast = useVillages((s) => s.undoLast);
  return (name: string) =>
    toast.success(t('toast.saved', { name }), { label: t('common.undo'), run: undoLast });
}
