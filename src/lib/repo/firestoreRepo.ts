import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VillageDoc, VillageInput, VillagePatch, VillageRepo } from '../appTypes';

/** Dépôt Firestore : users/{uid}/villages/{id}. */
export function createFirestoreRepo(uid: string): VillageRepo {
  if (!db) throw new Error('Firestore non initialisé');
  const col = collection(db, 'users', uid, 'villages');

  return {
    subscribe(cb) {
      const q = query(col, orderBy('order', 'asc'));
      return onSnapshot(q, (snap) => {
        const villages: VillageDoc[] = snap.docs.map((d) => {
          const data = d.data() as Omit<VillageDoc, 'id' | 'updatedAt'> & { updatedAt?: { toMillis?: () => number } };
          return {
            id: d.id,
            name: data.name,
            base: data.base,
            hall: data.hall,
            builders: data.builders,
            order: data.order ?? 0,
            buildings: data.buildings ?? {},
            research: data.research,
            resources: data.resources,
            plan: data.plan,
            updatedAt: data.updatedAt?.toMillis?.() ?? 0,
          };
        });
        cb(villages);
      });
    },
    async create(input: VillageInput) {
      const ref = await addDoc(col, { ...input, order: Date.now(), buildings: {}, updatedAt: serverTimestamp() });
      return ref.id;
    },
    async update(id: string, patch: VillagePatch) {
      await setDoc(doc(col, id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    },
    async remove(id: string) {
      await deleteDoc(doc(col, id));
    },
  };
}
