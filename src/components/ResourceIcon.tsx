import type { Resource } from '../lib/engine/types';
import { RESOURCE_COLORS } from '../lib/labels';

/** Petite icône SVG d'une ressource (pièce d'or, goutte d'élixir…). */
export function ResourceIcon({ resource, size = 14 }: { resource: Resource; size?: number }) {
  const c = RESOURCE_COLORS[resource];
  const isDrop = resource === 'elixir' || resource === 'darkElixir' || resource === 'builderElixir';

  if (resource === 'goldOrElixir') {
    return (
      <span className="inline-flex" style={{ width: size, height: size }} aria-hidden>
        <svg viewBox="0 0 16 16" width={size} height={size}>
          <path d="M8 1 A7 7 0 0 1 8 15 Z" fill={RESOURCE_COLORS.elixir} />
          <path d="M8 1 A7 7 0 0 0 8 15 Z" fill={RESOURCE_COLORS.gold} />
        </svg>
      </span>
    );
  }

  return (
    <span className="inline-flex" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 16 16" width={size} height={size}>
        {isDrop ? (
          <path d="M8 1.5 C11 6 13 8.5 13 11 a5 5 0 0 1-10 0 C3 8.5 5 6 8 1.5 Z" fill={c} />
        ) : (
          <>
            <circle cx="8" cy="8" r="6.5" fill={c} />
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1.2" />
            <ellipse cx="6" cy="6" rx="2" ry="1.3" fill="rgb(255 255 255 / 0.5)" />
          </>
        )}
      </svg>
    </span>
  );
}
