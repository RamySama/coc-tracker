import { useEffect } from 'react';
import { useSession } from '../store/session';
import { useVillages } from '../store/villages';
import type { VillageDoc } from '../lib/appTypes';

/** Village actuellement sélectionné, avec auto-sélection du premier si besoin. */
export function useCurrentVillage(): VillageDoc | null {
  const villages = useVillages((s) => s.villages);
  const currentVillageId = useSession((s) => s.currentVillageId);
  const setCurrentVillage = useSession((s) => s.setCurrentVillage);

  const current = villages.find((v) => v.id === currentVillageId) ?? null;

  useEffect(() => {
    if (villages.length === 0) return;
    if (!current) setCurrentVillage(villages[0].id);
  }, [villages, current, setCurrentVillage]);

  return current ?? villages[0] ?? null;
}
