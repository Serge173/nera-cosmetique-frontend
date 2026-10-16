import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject, isDevMode } from '@angular/core';
import { NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

const CHECK_INTERVAL_MS = 5 * 60_000;
const MIN_GAP_MS = 60_000;
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|MIME type/i;
const RELOAD_FLAG = 'nera:reloaded-for';

/** Recharge l'application quand une nouvelle version a été déployée, pour ne jamais afficher d'anciens écrans. */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private router = inject(Router);
  private zone = inject(NgZone);
  private document = inject(DOCUMENT);

  private readonly currentBundle = this.loadedBundle();
  private updateAvailable = false;
  private lastCheck = 0;
  private checking = false;

  start(): void {
    if (isDevMode() || !this.currentBundle) return;
    sessionStorage.removeItem(RELOAD_FLAG);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && this.updateAvailable) {
        this.hardNavigate(event.url);
      } else if (event instanceof NavigationEnd) {
        this.check();
      } else if (event instanceof NavigationError && CHUNK_ERROR.test(String(event.error?.message ?? event.error))) {
        this.hardNavigate(event.url);
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

  private async check(): Promise<void> {
    const now = Date.now();
    if (this.checking || this.updateAvailable || now - this.lastCheck < MIN_GAP_MS) return;
    this.checking = true;
    this.lastCheck = now;
    try {
      const res = await fetch(`/index.html?v=${now}`, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      const latest = (await res.text()).match(/main-[\w]+\.js/)?.[0];
      if (latest && latest !== this.currentBundle) this.updateAvailable = true;
    } catch {
      /* hors ligne : on réessaiera plus tard */
    } finally {
      this.checking = false;
    }
  }

  private hardNavigate(url: string): void {
    if (sessionStorage.getItem(RELOAD_FLAG) === url) return;
    sessionStorage.setItem(RELOAD_FLAG, url);
    this.document.location.assign(url);
  }
}
