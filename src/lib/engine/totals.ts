import type { Resource, UpgradeStep } from './types';

export type ResourceTotals = Partial<Record<Resource, number>>;

export function sumByResource(steps: ReadonlyArray<{ resource: Resource; cost: number }>): ResourceTotals {
  const out: ResourceTotals = {};
  for (const s of steps) out[s.resource] = (out[s.resource] ?? 0) + s.cost;
  return out;
}

export function sumXp(steps: UpgradeStep[]): number {
  return steps.reduce((a, s) => a + s.xp, 0);
}

/** Temps total "ouvrier" cumulé (si un seul ouvrier faisait tout, à la suite). */
export function sumBuilderSeconds(steps: UpgradeStep[]): number {
  return steps.reduce((a, s) => a + s.timeSeconds, 0);
}

/**
 * Estimation de la durée réelle avec N ouvriers : ordonnancement LPT
 * (Longest Processing Time first) — approximation classique du makespan.
 * Les marches à durée nulle (murs) sont ignorées.
 */
export function wallClockSeconds(steps: UpgradeStep[], builders: number): number {
  const n = Math.max(1, Math.floor(builders));
  const durations = steps.map((s) => s.timeSeconds).filter((d) => d > 0).sort((a, b) => b - a);
  const load = new Array(n).fill(0);
  for (const d of durations) {
    let min = 0;
    for (let i = 1; i < n; i++) if (load[i] < load[min]) min = i;
    load[min] += d;
  }
  return Math.max(...load, 0);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  if (m && !d) parts.push(`${m}min`);
  return parts.join(' ') || '<1min';
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k';
  return String(n);
}
