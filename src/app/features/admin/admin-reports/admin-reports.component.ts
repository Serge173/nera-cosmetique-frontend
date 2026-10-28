import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdmDonutChartComponent, AdmLineChartComponent, LinePoint } from '../shared/admin-charts';
import { downloadCsv, formatNumber, formatPrice, paymentLabel, statusLabel, statusTone } from '../shared/admin-format';
import { DashboardData, PERIODS, toDonut } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [AdmLineChartComponent, AdmDonutChartComponent],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Rapports & Analyses</h1>
        <p>Analysez les performances de votre boutique sur la période de votre choix.</p>
      </div>
      <div class="adm-page-actions">
        <div class="adm-chips" role="tablist" aria-label="Période">
          @for (p of periods; track p.days) {
            <button type="button" class="adm-chip" [class.active]="days() === p.days" (click)="setDays(p.days)">{{ p.label }}</button>
          }
        </div>
        <button type="button" class="adm-btn" (click)="exportCsv()" [disabled]="!data()"><i class="fa-solid fa-file-arrow-down"></i> Exporter</button>
      </div>
    </header>

    @if (data(); as d) {
      <div class="adm-stats">
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon"><i class="fa-solid fa-sack-dollar"></i></span>
          <div>
            <div class="adm-stat-label">Chiffre d'affaires</div>
            <div class="adm-stat-value">{{ formatPrice(d.kpis.sales.value) }}</div>
            <div class="chg {{ tone(d.kpis.sales.change) }}">{{ changeText(d.kpis.sales.change) }} <span>vs période préc.</span></div>
          </div>
        </div>
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon violet"><i class="fa-solid fa-cart-shopping"></i></span>
          <div>
            <div class="adm-stat-label">Commandes</div>
            <div class="adm-stat-value">{{ formatNumber(d.kpis.orders.value) }}</div>
            <div class="chg {{ tone(d.kpis.orders.change) }}">{{ changeText(d.kpis.orders.change) }} <span>vs période préc.</span></div>
          </div>
        </div>
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon blue"><i class="fa-solid fa-basket-shopping"></i></span>
          <div>
            <div class="adm-stat-label">Panier moyen</div>
            <div class="adm-stat-value">{{ formatPrice(d.kpis.averageOrder) }}</div>
            <div class="chg flat"><span>par commande valide</span></div>
          </div>
        </div>
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon green"><i class="fa-solid fa-user-plus"></i></span>
          <div>
            <div class="adm-stat-label">Nouveaux clients</div>
            <div class="adm-stat-value">{{ formatNumber(d.kpis.customers.newInPeriod) }}</div>
            <div class="chg {{ tone(d.kpis.customers.change) }}">{{ changeText(d.kpis.customers.change) }} <span>vs période préc.</span></div>
          </div>
        </div>
      </div>

      <section class="adm-card">
        <div class="adm-card-head">
          <h2>{{ metric() === 'sales' ? salesTitle : 'Évolution des commandes' }}</h2>
          <div class="seg" role="tablist">
            <button type="button" [class.on]="metric() === 'sales'" (click)="metric.set('sales')">Chiffre d'affaires</button>
            <button type="button" [class.on]="metric() === 'orders'" (click)="metric.set('orders')">Commandes</button>
          </div>
        </div>
        <div class="adm-card-body">
          <adm-line-chart [points]="points()" [height]="290" [format]="metric() === 'sales' ? priceFormat : countFormat" ariaLabel="Évolution sur la période" />
        </div>
      </section>

      <div class="grid-2">
        <section class="adm-card">
          <div class="adm-card-head"><h2>Ventes par catégorie</h2></div>
          <div class="adm-card-body">
            <adm-donut-chart [data]="donut()" [centerValue]="formatNumber(categoriesTotal())" centerLabel="F CFA" />
          </div>
        </section>
        <section class="adm-card">
          <div class="adm-card-head"><h2>Commandes par statut</h2></div>
          <div class="adm-card-body">
            <ul class="hbars">
              @for (s of statusRows(); track s.status) {
                <li>
                  <div class="hb-top">
                    <span class="adm-badge {{ statusTone(s.status) }}">{{ statusLabel(s.status) }}</span>
                    <span class="hb-val"><b>{{ s.count }}</b> • {{ formatPrice(s.total) }}</span>
                  </div>
                  <div class="hb-bar"><i class="{{ statusTone(s.status) }}" [style.width.%]="s.percent"></i></div>
                </li>
              } @empty {
                <li class="none">Aucune commande sur la période</li>
              }
            </ul>
          </div>
        </section>
      </div>

      <div class="grid-2 wide-left">
        <section class="adm-card">
          <div class="adm-card-head"><h2>Top produits</h2><span class="adm-sub">Par quantités vendues</span></div>
          <div class="adm-card-body">
            <div class="adm-table-wrap">
              <table class="adm-table">
                <thead><tr><th>#</th><th>Produit</th><th class="num">Quantité</th><th class="num">Chiffre d'affaires</th><th class="num">Part</th></tr></thead>
                <tbody>
                  @for (p of d.topProducts; track p.productId; let i = $index) {
                    <tr>
                      <td class="muted">{{ i + 1 }}</td>
                      <td>
                        <div class="prod">
                          @if (p.image) { <img class="adm-thumb sm" [src]="p.image" alt="" loading="lazy" /> } @else { <span class="adm-thumb sm"><i class="fa-solid fa-bottle-droplet"></i></span> }
                          <span class="strong">{{ p.name }}</span>
                        </div>
                      </td>
                      <td class="num">{{ formatNumber(p.quantity) }}</td>
                      <td class="num strong">{{ formatPrice(p.revenue) }}</td>
                      <td class="num muted">{{ share(p.revenue) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5"><div class="adm-empty"><i class="fa-solid fa-chart-column"></i><strong>Aucune vente sur la période</strong></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section class="adm-card">
          <div class="adm-card-head"><h2>Moyens de paiement</h2></div>
          <div class="adm-card-body">
            <ul class="pay">
              @for (p of d.byPayment; track p.method) {
                <li>
                  <span class="pay-icon"><i class="fa-solid fa-wallet"></i></span>
                  <div><strong>{{ paymentLabel(p.method) }}</strong><small>{{ p.count }} commande(s)</small></div>
                  <b>{{ formatPrice(p.total) }}</b>
                </li>
              } @empty {
                <li class="none">Aucun paiement sur la période</li>
              }
            </ul>
          </div>
        </section>
      </div>
    } @else {
      <div class="adm-stats">
        @for (i of [1, 2, 3, 4]; track i) { <div class="adm-card adm-stat"><div class="adm-skel" style="height: 56px; width: 100%"></div></div> }
      </div>
      <div class="adm-card adm-card-pad"><div class="adm-skel" style="height: 300px"></div></div>
    }
  `,
  styles: [`
    :host { display: block; }
    .chg { font-size: .74rem; font-weight: 600; margin-top: 2px; }
    .chg span { font-weight: 400; color: var(--adm-muted); }
    .chg.up { color: #2b9a5a; } .chg.down { color: #d0485a; } .chg.flat { color: var(--adm-muted); }
    .seg { display: inline-flex; background: #f6f2ef; border-radius: 10px; padding: 3px; }
    .seg button { background: none; padding: 7px 14px; border-radius: 8px; font-size: .78rem; font-weight: 600; color: var(--adm-muted); }
    .seg button.on { background: #fff; color: var(--adm-orange-dark); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 20px; }
    .grid-2.wide-left { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
    .hbars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
    .hb-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 10px; }
    .hb-val { font-size: .8rem; color: var(--adm-muted); white-space: nowrap; }
    .hb-val b { color: var(--adm-ink); }
    .hb-bar { height: 8px; border-radius: 99px; background: #f5f0ed; overflow: hidden; }
    .hb-bar i { display: block; height: 100%; border-radius: 99px; background: var(--adm-orange); transition: width .4s; }
    .hb-bar i.amber { background: #e8a93a; } .hb-bar i.orange { background: #ec8a3c; } .hb-bar i.violet { background: #8b6be0; }
    .hb-bar i.blue { background: #4f84e8; } .hb-bar i.green { background: #3aa86a; } .hb-bar i.red { background: #d9566a; }
    .none { color: var(--adm-muted); font-size: .86rem; padding: 16px 0; text-align: center; list-style: none; }
    .prod { display: flex; align-items: center; gap: 10px; }
    .adm-thumb.sm { width: 34px; height: 34px; border-radius: 8px; }
    .pay { list-style: none; margin: 0; padding: 0; }
    .pay li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--adm-line); }
    .pay li:last-child { border-bottom: none; }
    .pay-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; }
    .pay div { flex: 1; display: flex; flex-direction: column; }
    .pay strong { font-size: .85rem; color: var(--adm-ink); }
    .pay small { font-size: .75rem; color: var(--adm-muted); }
    .pay b { font-size: .85rem; color: var(--adm-ink); white-space: nowrap; }
    @media (max-width: 1100px) { .grid-2, .grid-2.wide-left { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .adm-page-actions { width: 100%; } .adm-chips { width: 100%; } .adm-chip { flex: 1 1 auto; justify-content: center; } }
  `],
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly periods = PERIODS;
  readonly salesTitle = "Évolution du chiffre d'affaires";
  readonly days = signal(30);
  readonly metric = signal<'sales' | 'orders'>('sales');
  readonly data = signal<DashboardData | null>(null);

  readonly points = computed<LinePoint[]>(() =>
    (this.data()?.salesSeries ?? []).map((p) => ({
      label: p.label,
      value: this.metric() === 'sales' ? p.total : p.orders,
      hint: this.metric() === 'sales' ? `${p.orders} commande(s)` : formatPrice(p.total),
    })),
  );
  readonly donut = computed(() => toDonut(this.data()?.categories ?? []));
  readonly categoriesTotal = computed(() => (this.data()?.categories ?? []).reduce((s, c) => s + c.total, 0));
  readonly statusRows = computed(() => {
    const rows = this.data()?.byStatus ?? [];
    const max = Math.max(1, ...rows.map((r) => r.count));
    const order = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    return [...rows]
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
      .map((r) => ({ ...r, percent: (r.count / max) * 100 }));
  });

  readonly formatPrice = formatPrice;
  readonly formatNumber = formatNumber;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly paymentLabel = paymentLabel;
  readonly priceFormat = (n: number) => formatPrice(n);
  readonly countFormat = (n: number) => `${formatNumber(n)} commande${n > 1 ? 's' : ''}`;

  ngOnInit(): void {
    this.load();
  }

  setDays(days: number): void {
    if (days === this.days()) return;
    this.days.set(days);
    this.load();
  }

  load(): void {
    this.data.set(null);
    this.api.get<DashboardData>('/admin/dashboard', { days: this.days(), top: 10 }).subscribe({
      next: (d) => this.data.set(d),
      error: () => this.toast.error('Impossible de charger le rapport.'),
    });
  }

  tone(change: number | null): string {
    if (change === null) return 'up';
    return change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  }

  changeText(change: number | null): string {
    if (change === null) return 'Nouveau';
    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`;
  }

  share(revenue: number): string {
    const total = this.data()?.kpis.sales.value ?? 0;
    return total ? `${((revenue / total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%` : '—';
  }

  exportCsv(): void {
    const d = this.data();
    if (!d) return;
    const label = PERIODS.find((p) => p.days === d.period.days)?.label ?? '';
    const rows: (string | number)[][] = [
      ['Rapport Nera Cosmétique', label],
      [],
      ['Indicateur', 'Valeur'],
      ["Chiffre d'affaires (F CFA)", d.kpis.sales.value],
      ['Commandes', d.kpis.orders.value],
      ['Panier moyen (F CFA)', Math.round(d.kpis.averageOrder)],
      ['Nouveaux clients', d.kpis.customers.newInPeriod],
      [],
      ['Période', "Chiffre d'affaires (F CFA)", 'Commandes'],
      ...d.salesSeries.map((p) => [p.label, p.total, p.orders]),
      [],
      ['Catégorie', "Chiffre d'affaires (F CFA)", 'Part (%)'],
      ...d.categories.map((c) => [c.name, c.total, c.percent]),
      [],
      ['Produit', 'Quantité', "Chiffre d'affaires (F CFA)"],
      ...d.topProducts.map((p) => [p.name, p.quantity, p.revenue]),
      [],
      ['Statut', 'Commandes', 'Montant (F CFA)'],
      ...d.byStatus.map((s) => [statusLabel(s.status), s.count, s.total]),
    ];
    downloadCsv(`rapport-nera-${d.period.days}j-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }
}
