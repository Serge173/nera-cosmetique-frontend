import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { formatDate, formatPrice, statusLabel, statusTone } from '../../admin/shared/admin-format';
import { ReorderService } from '../shared/reorder.service';

type Filter = 'toutes' | 'en-cours' | 'livrees' | 'annulees';

const IN_PROGRESS = new Set(['pending', 'paid', 'processing', 'shipped']);

const FILTERS: { key: Filter; label: string; icon: string; tone: string }[] = [
  { key: 'toutes', label: 'Toutes', icon: 'fa-solid fa-box-open', tone: 'peach' },
  { key: 'en-cours', label: 'En cours', icon: 'fa-regular fa-clock', tone: 'amber' },
  { key: 'livrees', label: 'Livrées', icon: 'fa-solid fa-truck', tone: 'green' },
  { key: 'annulees', label: 'Annulées', icon: 'fa-solid fa-ban', tone: 'grey' },
];

function matches(order: Order, filter: Filter): boolean {
  switch (filter) {
    case 'en-cours': return IN_PROGRESS.has(order.status);
    case 'livrees': return order.status === 'delivered';
    case 'annulees': return order.status === 'cancelled';
    default: return true;
  }
}

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mes commandes</h1>
        <p>Suivez vos commandes en cours et retrouvez tout votre historique d'achats.</p>
      </div>
      <a routerLink="/boutique" class="adm-btn"><i class="fa-solid fa-bag-shopping"></i> Continuer mes achats</a>
    </div>

    <div class="stats">
      @for (f of filters; track f.key) {
        <button type="button" class="adm-card stat" [class.active]="filter() === f.key" (click)="setFilter(f.key)" [attr.aria-pressed]="filter() === f.key">
          <span class="stat-icon {{ f.tone }}"><i class="{{ f.icon }}"></i></span>
          <span class="stat-text">
            <small>{{ f.label }}</small>
            <strong>{{ loading() ? '—' : counts()[f.key] }}</strong>
          </span>
        </button>
      }
    </div>

    <div class="adm-card list-card">
      <div class="toolbar">
        <div class="adm-chips" role="tablist" aria-label="Filtrer les commandes">
          @for (f of filters; track f.key) {
            <button type="button" role="tab" class="adm-chip" [class.active]="filter() === f.key" [attr.aria-selected]="filter() === f.key" (click)="setFilter(f.key)">
              {{ f.label }} <span class="chip-count">{{ counts()[f.key] }}</span>
            </button>
          }
        </div>
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" placeholder="N° de commande ou produit…" [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Rechercher une commande" maxlength="80" />
        </label>
      </div>

      @if (loading()) {
        @for (i of [1, 2, 3]; track i) { <div class="adm-skel sk-order"></div> }
      } @else if (error()) {
        <div class="adm-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Impossible de charger vos commandes.</p>
          <button type="button" class="adm-btn adm-btn-sm" (click)="load()">Réessayer</button>
        </div>
      } @else if (!visible().length) {
        <div class="adm-empty">
          <i class="fa-solid fa-bag-shopping"></i>
          @if (orders().length) {
            <p>Aucune commande ne correspond à votre recherche.</p>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="resetFilters()">Voir toutes mes commandes</button>
          } @else {
            <p>Vous n'avez pas encore passé de commande.</p>
            <a routerLink="/boutique" class="adm-btn adm-btn-sm">Découvrir la boutique</a>
          }
        </div>
      } @else {
        <ul class="orders">
          @for (o of visible(); track o.id) {
            <li class="order">
              <div class="thumbs">
                @for (item of o.items.slice(0, 3); track item.id) {
                  <img [src]="image(item.productImageUrl)" [alt]="item.productName" loading="lazy" />
                }
                @if (o.items.length > 3) { <span class="more">+{{ o.items.length - 3 }}</span> }
              </div>
              <div class="info">
                <p class="num">
                  <strong>Commande #{{ o.orderNumber }}</strong>
                  <span class="adm-badge {{ statusTone(o.status) }}">{{ statusLabel(o.status) }}</span>
                </p>
                <p class="meta">
                  <span><i class="fa-regular fa-calendar"></i> {{ formatDate(o.createdAt) }}</span>
                  <span><i class="fa-solid fa-cube"></i> {{ itemCount(o) }} article{{ itemCount(o) > 1 ? 's' : '' }}</span>
                </p>
                <p class="names">{{ names(o) }}</p>
              </div>
              <div class="side">
                <span class="total">{{ formatPrice(o.total) }}</span>
                <div class="btns">
                  @if (o.status === 'delivered' || o.status === 'cancelled') {
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="reorder(o)" [disabled]="reordering() === o.id">
                      @if (reordering() === o.id) { <i class="fa-solid fa-spinner fa-spin"></i> } @else { <i class="fa-solid fa-rotate-right"></i> }
                      Commander à nouveau
                    </button>
                  }
                  <a [routerLink]="['/compte/commandes', o.id]" class="adm-btn adm-btn-soft adm-btn-sm">Voir le détail <i class="fa-solid fa-arrow-right"></i></a>
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat { display: flex; align-items: center; gap: 14px; padding: 18px; text-align: left; border: 1.5px solid transparent; transition: border-color .2s, transform .2s, box-shadow .2s; cursor: pointer; font: inherit; }
    .stat:hover { transform: translateY(-2px); }
    .stat.active { border-color: var(--adm-orange); box-shadow: 0 8px 24px rgba(255, 102, 0, .14); }
    .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    .stat-icon.peach { background: var(--adm-orange-soft); color: var(--adm-orange); }
    .stat-icon.amber { background: #fff4d6; color: #c98a00; }
    .stat-icon.green { background: #e3f5ea; color: #2b8a52; }
    .stat-icon.grey { background: #f1eeec; color: #7d7570; }
    .stat-text { display: flex; flex-direction: column; min-width: 0; }
    .stat-text small { font-size: .8rem; color: var(--adm-muted); }
    .stat-text strong { font-size: 1.5rem; color: var(--adm-ink); line-height: 1.2; }
    .list-card { padding: 20px 22px; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
    .chip-count { margin-left: 4px; font-size: .72rem; opacity: .7; }
    .search { position: relative; flex: 0 1 300px; min-width: 200px; }
    .search i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--adm-muted); font-size: .85rem; }
    .search input { width: 100%; height: 40px; border-radius: 999px; border: 1px solid var(--adm-line-strong); padding: 0 16px 0 38px; font: inherit; font-size: .86rem; background: #fff; color: var(--adm-ink); }
    .search input:focus { outline: none; border-color: var(--adm-orange); box-shadow: 0 0 0 3px rgba(255, 102, 0, .15); }
    .orders { list-style: none; margin: 0; padding: 0; }
    .order { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 18px 0; border-top: 1px solid var(--adm-line); }
    .order:first-child { border-top: 0; }
    .thumbs { display: flex; align-items: center; }
    .thumbs img, .more { width: 58px; height: 58px; border-radius: 12px; object-fit: cover; background: #fbf6f2; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(42, 37, 33, .08); }
    .thumbs > * + * { margin-left: -14px; }
    .more { display: inline-flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: var(--adm-orange-deep); background: var(--adm-orange-soft); }
    .info { min-width: 0; }
    .num { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 4px; color: var(--adm-ink); }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; margin: 0 0 4px; font-size: .8rem; color: var(--adm-muted); }
    .meta i { margin-right: 4px; }
    .names { margin: 0; font-size: .82rem; color: var(--adm-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .total { font-weight: 700; font-size: 1.05rem; color: var(--adm-ink); white-space: nowrap; }
    .btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .sk-order { height: 84px; border-radius: 12px; margin: 12px 0; }
    @media (max-width: 1100px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 760px) {
      .order { grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .side { flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
      .search { flex: 1 1 100%; }
      .list-card { padding: 16px; }
    }
    @media (max-width: 480px) {
      .stats { gap: 10px; }
      .stat { padding: 14px; gap: 10px; }
      .stat-icon { width: 40px; height: 40px; font-size: .95rem; }
      .btns, .btns .adm-btn { width: 100%; }
    }
  `],
})
export class OrdersHistoryComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reorderService = inject(ReorderService);

  readonly filters = FILTERS;
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly filter = signal<Filter>('toutes');
  readonly query = signal('');
  readonly reordering = signal<string | null>(null);

  readonly counts = computed(() => {
    const list = this.orders();
    return Object.fromEntries(FILTERS.map((f) => [f.key, list.filter((o) => matches(o, f.key)).length])) as Record<Filter, number>;
  });

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.orders().filter((o) => matches(o, this.filter())
      && (!q || o.orderNumber.toLowerCase().includes(q) || o.items.some((i) => i.productName.toLowerCase().includes(q))));
  });

  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly image = safeProductImageUrl;

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.route.queryParamMap.subscribe((params) => {
      const s = params.get('statut') as Filter | null;
      this.filter.set(s && FILTERS.some((f) => f.key === s) ? s : 'toutes');
    }));
    this.load();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.subs.add(this.api.get<Order[]>('/orders').subscribe({
      next: (orders) => {
        this.orders.set(Array.isArray(orders) ? orders : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    }));
  }

  setFilter(key: Filter): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { statut: key === 'toutes' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  resetFilters(): void {
    this.query.set('');
    this.setFilter('toutes');
  }

  itemCount(o: Order): number {
    return o.items.reduce((n, i) => n + Number(i.quantity || 0), 0);
  }

  names(o: Order): string {
    return o.items.map((i) => i.productName).join(' • ');
  }

  reorder(o: Order): void {
    if (this.reordering()) return;
    this.reordering.set(o.id);
    this.reorderService.reorder(o.items).subscribe({
      complete: () => this.reordering.set(null),
      error: () => this.reordering.set(null),
    });
  }
}
