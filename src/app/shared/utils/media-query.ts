import { DestroyRef, Signal, inject, signal } from '@angular/core';

/** Signal suivant une media query CSS. À appeler dans un contexte d'injection (initialiseur de champ). */
export function mediaQuery(query: string): Signal<boolean> {
  const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null;
  const matches = signal(mql?.matches ?? false);
  if (mql) {
    const update = () => matches.set(mql.matches);
    mql.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', update));
  }
  return matches.asReadonly();
}
