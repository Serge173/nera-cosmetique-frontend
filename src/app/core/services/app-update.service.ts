import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject, isDevMode } from '@angular/core';
import { NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

const CHECK_INTERVAL_MS = 5 * 60_000;
const MIN_GAP_MS = 60_000;
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|MIME type/i;
/** Version vers laquelle on a déjà rechargé : jamais deux fois, même si le CDN sert encore l'ancienne. */
const UPDATE_FLAG = 'nera:reloaded-to';
/** URL déjà rechargée après un fichier introuvable : évite une boucle si le fichier manque toujours. */
const CHUNK_FLAG = 'nera:reloaded-for';

/** Recharge l'application quand une nouvelle version a été déployée, pour ne jamais afficher d'anciens écrans. */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private router = inject(Router);
  private zone = inject(NgZone);
  private document = inject(DOCUMENT);

  private readonly currentBundle = this.loadedBundle();
  private latestBundle: string | null = null;
  private lastCheck = 0;
  private checking = false;

  start(): void {
    if (isDevMode() || !this.currentBundle) return;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && this.latestBundle) {
        this.reloadForUpdate(event.url);
      } else if (event instanceof NavigationEnd) {
        sessionStorage.removeItem(CHUNK_FLAG);
        this.check(true);
      } else if (event instanceof NavigationError && CHUNK_ERROR.test(String(event.error?.message ?? event.error))) {
        if (sessionStorage.getItem(CHUNK_FLAG) === event.url) return;
        sessionStorage.setItem(CHUNK_FLAG, event.url);
        this.document.location.assign(event.url);
      }
    });

    this.zone.runOutsideAngular(() => {
      setInterval(() => this.check(), CHECK_INTERVAL_MS);
      this.document.addEventListener('visibilitychange', () => {
        if (this.document.visibilityState === 'visible') this.check();
      });
    });
  }

  private loadedBundle(): string | null {
    const script = this.document.querySelector<HTMLScriptElement>('script[src*="main-"]');
    return script?.getAttribute('src')?.match(/main-[\w]+\.js/)?.[0] ?? null;
  }

  /** `reloadNow` : l'utilisateur vient d'arriver sur la page, on peut la recharger sans perdre de saisie. */
  private async check(reloadNow = false): Promise<void> {
    const now = Date.now();
    if (this.checking || this.latestBundle || now - this.lastCheck < MIN_GAP_MS) return;
    this.checking = true;
    this.lastCheck = now;
    try {
      const res = await fetch(`/index.html?v=${now}`, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      const latest = (await res.text()).match(/main-[\w]+\.js/)?.[0];
      if (!latest || latest === this.currentBundle || sessionStorage.getItem(UPDATE_FLAG) === latest) return;
      this.latestBundle = latest;
      if (reloadNow) this.zone.run(() => this.reloadForUpdate(this.router.url));
    } catch {
      /* hors ligne : on réessaiera plus tard */
    } finally {
      this.checking = false;
    }
  }

  private reloadForUpdate(url: string): void {
    sessionStorage.setItem(UPDATE_FLAG, this.latestBundle!);
    this.document.location.assign(url);
  }
}
