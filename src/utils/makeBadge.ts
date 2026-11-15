/** Muted tones that sit well on the dark theme; white text passes contrast. */
const BADGE_COLORS = [
  '#3D5A43',
  '#34506A',
  '#6A4A38',
  '#57466B',
  '#2F5F5A',
  '#5C5A30',
  '#6B3F4A',
  '#3F4F6E',
] as const;

/** Stable colour and initial for a make, so each make looks the same everywhere. */
export function makeBadge(make: string): { initial: string; color: string } {
  const name = make.trim();
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.toLowerCase().charCodeAt(i)) % 1000003;
  }
  return {
    initial: (name[0] ?? '?').toUpperCase(),
    color: BADGE_COLORS[hash % BADGE_COLORS.length],
  };
}
