// Lightweight id helper. Avoids pulling in a uuid dep — collisions are
// effectively impossible at editor scale.
export function uid(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
