import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ToastService } from '../../../core/services/toast.service';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { formatPrice } from '../../admin/shared/admin-format';
import { FavoriteProduct, effectivePrice } from '../shared/account.models';

type Sort = 'recent' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-account-favorites',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mes favoris</h1>
        <p>Retrouvez les produits que vous aimez et ajoutez-les à votre panier en un clic.</p>
      </div>
      @if (items().length > 1) {
        <label class="sort">
          <span>Trier par</span>
          <select class="adm-select" [value]="sort()" (change)="sort.set($any($event.target).value)">
            <option value="recent">Ajout récent</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="name">Nom (A → Z)</option>
          </select>
        </label>
      }
    </div>

    @if (loading()) {
      <div class="grid">
        @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) { <div class="adm-skel sk-card"></div> }
      </div>
    } @else if (error()) {
      <div class="adm-card adm-empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Impossible de charger vos favoris.</p>
        <button type="button" class="adm-btn adm-btn-sm" (click)="load()">Réessayer</button>
      </div>
    } @else if (!items().length) {
      <div class="adm-card empty">
        <span class="empty-icon"><i class="fa-regular fa-heart"></i></span>
        <h2>Votre liste de favoris est vide</h2>
        <p>Touchez le cœur <i class="fa-solid fa-heart"></i> sur un produit pour le retrouver ici à tout moment.</p>
        <a routerLink="/boutique" class="adm-btn">Découvrir la boutique</a>
      </div>
    } @else {
      <p class="count">{{ items().length }} produit{{ items().length > 1 ? 's' : '' }} dans vos favoris</p>
      <div class="grid">
        @for (p of items(); track p.productId) {
          <article class="adm-card card">
            <a [routerLink]="['/produit', p.slug]" class="img">
              <img [src]="image(p.image)" [alt]="p.name" loading="lazy" />
              @if (p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price) {
                <span class="promo">−{{ discount(p) }}%</span>
              }
              @if (p.stock <= 0) { <span class="oos">Rupture de stock</span> }
            </a>
            <button type="button" class="heart" (click)="remove(p)" aria-label="Retirer des favoris" title="Retirer des favoris">
              <i class="fa-solid fa-heart"></i>
            </button>
            <div class="body">
              @if (p.brandName) { <small class="brand">{{ p.brandName }}</small> }
              <a [routerLink]="['/produit', p.slug]" class="name">{{ p.name }}</a>
              <p class="price">
                <strong>{{ formatPrice(effectivePrice(p)) }}</strong>
                @if (p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price) { <s>{{ formatPrice(p.price) }}</s> }
              </p>
              <button type="button" class="adm-btn adm-btn-sm add" (click)="addToCart(p)" [disabled]="p.stock <= 0 || adding() === p.productId">
                @if (adding() === p.productId) { <i class="fa-solid fa-spinner fa-spin"></i> } @else { <i class="fa-solid fa-cart-plus"></i> }
                {{ p.stock <= 0 ? 'Indisponible' : 'Ajouter au panier' }}
              </button>
            </div>
          </article>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .sort { display: flex; align-items: center; gap: 10px; font-size: .84rem; color: var(--adm-muted); }
    .sort .adm-select { width: auto; min-width: 180px; }
    .count { margin: -4px 0 16px; font-size: .86rem; color: var(--adm-muted); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; }
    .card { position: relative; overflow: hidden; display: flex; flex-direction: column; transition: transform .2s, box-shadow .2s; }
    .card:hover { transform: translateY(-3px); box-shadow: var(--adm-shadow-lg); }
    .img { position: relative; display: block; aspect-ratio: 1; background: #fbf6f2; }
    .img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .promo { position: absolute; top: 12px; left: 12px; padding: 4px 9px; border-radius: 999px; background: var(--adm-orange); color: #fff; font-size: .72rem; font-weight: 700; }
    .oos { position: absolute; left: 0; right: 0; bottom: 0; padding: 7px; text-align: center; background: rgba(42, 37, 33, .78); color: #fff; font-size: .76rem; font-weight: 600; }
    .heart { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; border-radius: 50%; background: #fff; color: var(--adm-orange); box-shadow: 0 4px 12px rgba(42, 37, 33, .12); display: inline-flex; align-items: center; justify-content: center; transition: transform .2s; }
    .heart:hover { transform: scale(1.1); }
    .body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .brand { font-size: .72rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--adm-muted); }
    .name { color: var(--adm-ink); font-weight: 600; font-size: .9rem; line-height: 1.35; text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7em; }
    .name:hover { color: var(--adm-orange); }
    .price { margin: 4px 0 10px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .price strong { color: var(--adm-orange-dark); font-size: 1rem; }
    .price s { color: var(--adm-muted); font-size: .8rem; }
    .add { margin-top: auto; width: 100%; }
    .empty { padding: 56px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty-icon { width: 84px; height: 84px; border-radius: 50%; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 8px; }
    .empty h2 { margin: 0; font-size: 1.15rem; }
    .empty p { margin: 0 0 12px; color: var(--adm-muted); max-width: 420px; }
    .empty p i { color: var(--adm-orange); }
    .sk-card { height: 340px; border-radius: var(--adm-radius); }
    @media (max-width: 520px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .body { padding: 10px 12px 12px; }
      .add { font-size: .74rem; padding: 0 8px; }
      .sort { width: 100%; }
      .sort .adm-select { flex: 1; min-width: 0; }
    }
  `],
})
export class AccountFavoritesComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  readonly favorites = inject(FavoritesService);

  private readonly all = signal<FavoriteProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly sort = signal<Sort>('recent');
  readonly adding = signal<number | null>(null);

  readonly items = computed(() => {
    const list = this.favorites.loaded() ? this.all().filter((p) => this.favorites.isFavorite(p.productId)) : [...this.all()];
    switch (this.sort()) {
      case 'price-asc': return list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case 'price-desc': return list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case 'name': return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      default: return list;
    }
  });

  readonly formatPrice = formatPrice;
  readonly effectivePrice = effectivePrice;
  readonly image = safeProductImageUrl;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<FavoriteProduct[]>('/account/favorites').subscribe({
      next: (list) => {
        this.all.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  discount(p: FavoriteProduct): number {
    return Math.round((1 - effectivePrice(p) / p.price) * 100);
  }

  remove(p: FavoriteProduct): void {
    if (!this.favorites.loaded()) this.all.update((list) => list.filter((x) => x.productId !== p.productId));
    this.favorites.remove(p.productId);
  }

  addToCart(p: FavoriteProduct): void {
    if (this.adding() || p.stock <= 0) return;
    this.adding.set(p.productId);
    this.cart.addItem(p.productId, 1).subscribe({
      next: () => {
        this.adding.set(null);
        this.toast.success(`« ${p.name} » a été ajouté à votre panier.`);
      },
      error: (err) => {
        this.adding.set(null);
        this.toast.error(err?.error?.message ?? 'Impossible d’ajouter ce produit au panier.');
      },
    });
  }
}
