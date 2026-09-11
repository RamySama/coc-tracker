import { useState } from 'react';

interface Props {
  icon: string | null;
  name: string;
  size?: number;
  className?: string;
}

/** Icône de bâtiment avec repli sur une tuile colorée + initiale. */
export function BuildingIcon({ icon, name, size = 40, className = '' }: Props) {
  const [broken, setBroken] = useState(false);
  const px = { width: size, height: size };

  if (!icon || broken) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-surface-2 font-bold text-ink-dim ${className}`}
        style={{ ...px, fontSize: size * 0.42 }}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={icon}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={`shrink-0 rounded-lg object-contain ${className}`}
      style={px}
    />
  );
}
