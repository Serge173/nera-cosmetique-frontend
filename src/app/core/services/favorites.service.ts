import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private readonly ids = signal<ReadonlySet<number>>(new Set());
  private readonly pending = new Set<number>();
  readonly count = computed(() => this.ids().size);
  readonly loaded = signal(false);

  constructor() {
    let lastUserId: string | null = null;
    this.auth.currentUser$.subscribe((user) => {
      const id = user?.id ?? null;
      if (id === lastUserId) return;
      lastUserId = id;
      this.ids.set(new Set());
      this.loaded.set(false);
      if (id) this.reload();
    });
  }

  reload(): void {
    this.api.get<number[]>('/account/favorites/ids').subscribe({
      next: (ids) => {
        this.ids.set(new Set((ids ?? []).map(Number)));
        this.loaded.set(true);
      },
      error: () => {},
    });
  }

  isFavorite(productId: number): boolean {
    return this.ids().has(productId);
  }

  toggle(productId: number): void {
    this.set(productId, !this.isFavorite(productId));
  }

  remove(productId: number): void {
    this.set(productId, false);
  }

  private set(productId: number, favorite: boolean): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Connectez-vous pour enregistrer vos produits favoris.');
      this.router.navigate(['/compte/connexion'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.pending.has(productId)) return;
    const wasFavorite = !favorite;
    this.pending.add(productId);
    this.setLocal(productId, !wasFavorite);
    const request = wasFavorite
      ? this.api.delete(`/account/favorites/${productId}`)
      : this.api.post(`/account/favorites/${productId}`, {});
    request.subscribe({
      next: () => {
        this.pending.delete(productId);
        if (!wasFavorite) this.toast.success('Ajouté à vos favoris.');
      },
      error: (err) => {
        this.pending.delete(productId);
        this.setLocal(productId, wasFavorite);
        this.toast.error(err?.error?.message ?? 'Impossible de mettre à jour vos favoris.');
      },
    });
  }

  private setLocal(productId: number, favorite: boolean): void {
    const next = new Set(this.ids());
    if (favorite) next.add(productId);
    else next.delete(productId);
    this.ids.set(next);
  }
}
