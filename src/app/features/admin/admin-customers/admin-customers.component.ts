import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadCsv, formatDate, formatDateTime, formatPrice, initials, paymentLabel, statusLabel, statusTone } from '../shared/admin-format';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface CustomerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  stats: { ordersCount: number; totalSpent: number; averageOrder: number; lastAddress: string | null };
  orders: { id: string; orderNumber: string; createdAt: string; total: number; status: string; paymentMethod: string; items: number }[];
}

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Clients</h1>
        <p>Retrouvez vos clientes et clients, leur historique d'achat et leurs coordonnées.</p>
      </div>
      <div class="adm-page-actions">
        <button type="button" class="adm-btn" (click)="exportCsv()" [disabled]="!customers().length">
          <i class="fa-solid fa-file-arrow-down"></i> Exporter (CSV)
        </button>
      </div>
    </header>

    <div class="adm-stats">
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon"><i class="fa-solid fa-user-group"></i></span>
        <div><div class="adm-stat-label">Clients inscrits</div><div class="adm-stat-value">{{ stats().total }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon violet"><i class="fa-solid fa-user-plus"></i></span>
        <div><div class="adm-stat-label">Nouveaux (30 jours)</div><div class="adm-stat-value">{{ stats().recent }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon green"><i class="fa-solid fa-bag-shopping"></i></span>
        <div><div class="adm-stat-label">Ont déjà commandé</div><div class="adm-stat-value">{{ stats().buyers }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon blue"><i class="fa-solid fa-coins"></i></span>
        <div><div class="adm-stat-label">Panier moyen</div><div class="adm-stat-value">{{ formatPrice(stats().basket) }}</div></div>
      </div>
    </div>

    <section class="adm-card">
      <div class="adm-toolbar">
        <label class="adm-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input class="adm-input" type="search" [ngModel]="search" (ngModelChange)="onSearch($event)"
                 placeholder="Nom, email ou téléphone..." aria-label="Rechercher un client" />
        </label>
        <select class="adm-select sort" [ngModel]="sort()" (ngModelChange)="sort.set($event); page.set(1)" aria-label="Trier">
          <option value="recent">Plus récents</option>
          <option value="spent">Meilleurs clients</option>
          <option value="orders">Nombre de commandes</option>
          <option value="name">Nom (A → Z)</option>
        </select>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Inscrit le</th>
              <th>Commandes</th>
              <th>Total dépensé</th>
              <th>Dernière commande</th>
              <th>Statut</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading() && !customers().length) {
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr><td colspan="8"><div class="adm-skel" style="height: 30px"></div></td></tr>
              }
            } @else {
              @for (c of paged(); track c.id) {
                <tr class="clickable" (click)="open(c.id)">
                  <td>
                    <div class="who">
                      <span class="adm-avatar">{{ initialsOf(c) }}</span>
                      <div>
                        <div class="strong">{{ nameOf(c) }}</div>
                        <div class="muted">{{ c.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="muted">{{ c.phone || '—' }}</td>
                  <td class="muted nowrap">{{ formatDate(c.createdAt) }}</td>
                  <td>{{ c.ordersCount }}</td>
                  <td class="strong nowrap">{{ formatPrice(c.totalSpent) }}</td>
                  <td class="muted nowrap">{{ c.lastOrderAt ? formatDate(c.lastOrderAt) : '—' }}</td>
                  <td>
                    <span class="adm-badge dot" [class.green]="c.isActive" [class.red]="!c.isActive">{{ c.isActive ? 'Actif' : 'Suspendu' }}</span>
                  </td>
                  <td class="actions">
                    <button type="button" class="adm-btn adm-btn-xs" (click)="$event.stopPropagation(); open(c.id)">Voir</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">
                    <div class="adm-empty">
                      <i class="fa-solid fa-user-group"></i>
                      <strong>{{ search ? 'Aucun client trouvé' : 'Aucun client inscrit' }}</strong>
                      {{ search ? 'Essayez un autre nom, email ou numéro.' : 'Les comptes clients apparaîtront ici.' }}
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (pageCount() > 1) {
        <footer class="pager">
          <span>{{ sorted().length }} client(s) — page {{ page() }} / {{ pageCount() }}</span>
          <div>
            <button type="button" class="adm-icon-btn sm" [disabled]="page() <= 1" (click)="page.set(page() - 1)" aria-label="Page précédente"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" class="adm-icon-btn sm" [disabled]="page() >= pageCount()" (click)="page.set(page() + 1)" aria-label="Page suivante"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      }
    </section>

    @if (detailOpen()) {
      <div class="adm-overlay" (click)="close()"></div>
      <aside class="adm-drawer" role="dialog" aria-modal="true" aria-label="Fiche client">
        <div class="adm-drawer-head">
          <h2>Fiche client</h2>
          <button type="button" class="adm-icon-btn" (click)="close()" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="adm-drawer-body">
          @if (!detail()) {
            <div class="adm-skel" style="height: 90px; margin-bottom: 16px"></div>
            <div class="adm-skel" style="height: 220px"></div>
          } @else {
            @let d = detail()!;
            <div class="profile">
              <span class="adm-avatar xl">{{ initialsOf(d) }}</span>
              <div>
                <h3>{{ nameOf(d) }}</h3>
                <span class="adm-badge dot" [class.green]="d.isActive" [class.red]="!d.isActive">{{ d.isActive ? 'Compte actif' : 'Compte suspendu' }}</span>
              </div>
            </div>

            <div class="tiles">
              <div><span>Commandes</span><strong>{{ d.stats.ordersCount }}</strong></div>
              <div><span>Total dépensé</span><strong>{{ formatPrice(d.stats.totalSpent) }}</strong></div>
              <div><span>Panier moyen</span><strong>{{ formatPrice(d.stats.averageOrder) }}</strong></div>
            </div>

            <dl class="kv">
              <dt>Email</dt><dd><a href="mailto:{{ d.email }}">{{ d.email }}</a></dd>
              <dt>Téléphone</dt><dd>@if (d.phone) {<a href="tel:{{ d.phone }}">{{ d.phone }}</a>} @else {—}</dd>
              <dt>Client depuis</dt><dd>{{ formatDate(d.createdAt) }}</dd>
              <dt>Dernière adresse</dt><dd>{{ d.stats.lastAddress || '—' }}</dd>
            </dl>

            <h4 class="sec-title">Historique des commandes</h4>
            <ul class="order-list">
              @for (o of d.orders; track o.id) {
                <li>
                  <a [routerLink]="['/admin/orders']" [queryParams]="{ q: o.orderNumber }">
                    <div>
                      <strong>#{{ o.orderNumber }}</strong>
                      <small>{{ formatDateTime(o.createdAt) }} • {{ o.items }} article(s) • {{ paymentLabel(o.paymentMethod) }}</small>
                    </div>
                    <div class="right">
                      <b>{{ formatPrice(o.total) }}</b>
                      <span class="adm-badge {{ statusTone(o.status) }}">{{ statusLabel(o.status) }}</span>
                    </div>
                  </a>
                </li>
              } @empty {
                <li class="none">Aucune commande pour ce client.</li>
              }
            </ul>
          }
        </div>
        @if (detail(); as d) {
          <div class="adm-drawer-foot">
            <a class="adm-btn adm-btn-ghost" href="mailto:{{ d.email }}"><i class="fa-regular fa-envelope"></i> Écrire</a>
            <button type="button" class="adm-btn" [class.adm-btn-danger]="d.isActive" (click)="toggleActive(d)" [disabled]="toggling()">
              <i class="fa-solid" [class.fa-user-slash]="d.isActive" [class.fa-user-check]="!d.isActive"></i>
              {{ d.isActive ? 'Suspendre le compte' : 'Réactiver le compte' }}
            </button>
          </div>
        }
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .sort { width: 210px; flex-shrink: 0; }
    .clickable { cursor: pointer; }
    .nowrap { white-space: nowrap; }
    .who { display: flex; align-items: center; gap: 12px; }
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px; border-top: 1px solid var(--adm-line); font-size: .8rem; color: var(--adm-muted); }
    .pager div { display: flex; gap: 8px; }
    .profile { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .profile h3 { margin: 0 0 6px; font-size: 1.15rem; }
    .adm-avatar.xl { width: 60px; height: 60px; font-size: 1.1rem; }
    .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
    .tiles div { background: var(--adm-pink-50); border: 1px solid #f7dfe9; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .tiles span { font-size: .72rem; color: var(--adm-muted); }
    .tiles strong { font-size: .92rem; color: var(--adm-ink); }
    .kv { display: grid; grid-template-columns: 130px 1fr; gap: 8px 12px; margin: 0; font-size: .85rem; background: #fcf8fa; border-radius: 12px; padding: 14px 16px; }
    .kv dt { color: var(--adm-muted); }
    .kv dd { margin: 0; color: var(--adm-ink); word-break: break-word; }
    .kv a { color: var(--adm-pink-dark); }
    .sec-title { font-size: .88rem; margin: 22px 0 10px; }
    .order-list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--adm-line); border-radius: 12px; overflow: hidden; }
    .order-list li + li { border-top: 1px solid var(--adm-line); }
    .order-list a { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 14px; text-decoration: none; color: inherit; transition: background .15s; }
    .order-list a:hover { background: var(--adm-pink-50); }
    .order-list strong { display: block; font-size: .85rem; color: var(--adm-ink); }
    .order-list small { font-size: .74rem; color: var(--adm-muted); }
    .order-list .right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .order-list b { font-size: .85rem; color: var(--adm-ink); white-space: nowrap; }
    .order-list .none { padding: 18px; text-align: center; color: var(--adm-muted); font-size: .85rem; }
    @media (max-width: 640px) {
      .sort { width: 100%; }
      .tiles { grid-template-columns: 1fr; }
      .kv { grid-template-columns: 1fr; gap: 2px; }
      .kv dd { margin-bottom: 8px; }
    }
  `],
})
export class AdminCustomersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly detail = signal<CustomerDetail | null>(null);
  readonly detailOpen = signal(false);
  readonly toggling = signal(false);
  readonly sort = signal<'recent' | 'spent' | 'orders' | 'name'>('recent');
  readonly page = signal(1);
  search = '';
  private search$ = new Subject<string>();

  readonly stats = computed(() => {
    const list = this.customers();
    const since = Date.now() - 30 * 86_400_000;
    const orders = list.reduce((s, c) => s + c.ordersCount, 0);
    const spent = list.reduce((s, c) => s + c.totalSpent, 0);
    return {
      total: list.length,
      recent: list.filter((c) => new Date(c.createdAt).getTime() >= since).length,
      buyers: list.filter((c) => c.ordersCount > 0).length,
      basket: orders ? spent / orders : 0,
    };
  });

  readonly sorted = computed(() => {
    const list = [...this.customers()];
    switch (this.sort()) {
      case 'spent': return list.sort((a, b) => b.totalSpent - a.totalSpent);
      case 'orders': return list.sort((a, b) => b.ordersCount - a.ordersCount);
      case 'name': return list.sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b), 'fr'));
      default: return list;
    }
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sorted().length / PAGE_SIZE)));
  readonly paged = computed(() => {
    const p = Math.min(this.page(), this.pageCount());
    return this.sorted().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  });

  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly paymentLabel = paymentLabel;

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.load(q));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const id = p.get('id');
      if (id) this.open(id, false);
    });
    this.load('');
  }

  load(q: string): void {
    this.loading.set(true);
    this.api.get<Customer[]>('/admin/customers', q.trim() ? { search: q.trim() } : undefined).subscribe({
      next: (list) => {
        this.customers.set(list ?? []);
        this.page.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les clients.');
      },
    });
  }

  onSearch(value: string): void {
    this.search = value;
    this.search$.next(value);
  }

  nameOf(c: { firstName: string; lastName: string; email: string }): string {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email;
  }

  initialsOf(c: { firstName: string; lastName: string; email: string }): string {
    return initials(this.nameOf(c));
  }

  open(id: string, updateUrl = true): void {
    this.detailOpen.set(true);
    this.detail.set(null);
    if (updateUrl) this.router.navigate([], { queryParams: { id }, replaceUrl: true });
    this.api.get<CustomerDetail>(`/admin/customers/${encodeURIComponent(id)}`).subscribe({
      next: (d) => this.detail.set(d),
      error: () => {
        this.toast.error('Client introuvable.');
        this.close();
      },
    });
  }

  close(): void {
    this.detailOpen.set(false);
    this.detail.set(null);
    this.router.navigate([], { queryParams: { id: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  toggleActive(d: CustomerDetail): void {
    const next = !d.isActive;
    if (!next && !confirm(`Suspendre le compte de ${this.nameOf(d)} ? Le client ne pourra plus se connecter.`)) return;
    this.toggling.set(true);
    this.api.patch(`/admin/users/${d.id}/status`, { isActive: next }).subscribe({
      next: () => {
        this.detail.set({ ...d, isActive: next });
        this.customers.update((list) => list.map((c) => (c.id === d.id ? { ...c, isActive: next } : c)));
        this.toggling.set(false);
        this.toast.success(next ? 'Compte réactivé.' : 'Compte suspendu.');
      },
      error: (err) => {
        this.toggling.set(false);
        this.toast.error(err?.error?.message || 'Action impossible.');
      },
    });
  }

  exportCsv(): void {
    downloadCsv(`clients-nera-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Prénom', 'Nom', 'Email', 'Téléphone', 'Inscrit le', 'Commandes', 'Total dépensé', 'Dernière commande', 'Statut'],
      ...this.sorted().map((c) => [
        c.firstName, c.lastName, c.email, c.phone ?? '', formatDate(c.createdAt), c.ordersCount, c.totalSpent,
        c.lastOrderAt ? formatDate(c.lastOrderAt) : '', c.isActive ? 'Actif' : 'Suspendu',
      ]),
    ]);
  }
}
