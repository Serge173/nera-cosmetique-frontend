import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdmDonutChartComponent,
  AdmLineChartComponent,
  AdmSparklineComponent,
  DONUT_COLORS,
  DonutSlice,
  LinePoint,
} from '../shared/admin-charts';
import { formatCompact, formatDateTime, formatNumber, formatPrice, statusLabel, statusTone } from '../shared/admin-format';

export interface DashboardData {
  period: { days: number; from: string; monthly: boolean };
  kpis: {
    sales: { value: number; change: number | null; spark: number[] };
    orders: { value: number; change: number | null; spark: number[] };
    customers: { value: number; newInPeriod: number; change: number | null; spark: number[] };
    stock: { value: number; units: number; outOfStock: number; lowStock: number; spark: number[] };
    averageOrder: number;
  };
  salesSeries: { key: string; label: string; total: number; orders: number }[];
  categories: { id: number; name: string; total: number; percent: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    status: string;
    customer: string;
    image: string | null;
    items: number;
  }[];
  topProducts: { productId: number; name: string; quantity: number; revenue: number; image: string | null }[];
  byStatus: { status: string; count: number; total: number }[];
  byPayment: { method: string; count: number; total: number }[];
  hero: { name: string; image: string } | null;
}

export const PERIODS = [
  { days: 7, label: '7 derniers jours', short: 'vs. 7 j préc.' },
  { days: 30, label: '30 derniers jours', short: 'vs. 30 j préc.' },
  { days: 90, label: '3 derniers mois', short: 'vs. 3 mois préc.' },
  { days: 365, label: '12 derniers mois', short: 'vs. année préc.' },
];

export function toDonut(categories: DashboardData['categories'], max = 6): DonutSlice[] {
  const sorted = [...categories].filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const head = sorted.slice(0, sorted.length > max ? max - 1 : max);
  const rest = sorted.slice(head.length);
  const slices = head.map((c, i) => ({ label: c.name, value: c.total, percent: c.percent, color: DONUT_COLORS[i] }));
  if (rest.length) {
    slices.push({
      label: 'Autres',
      value: rest.reduce((s, c) => s + c.total, 0),
      percent: rest.reduce((s, c) => s + c.percent, 0),
      color: DONUT_COLORS[5],
    });
  }
  return slices;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, AdmLineChartComponent, AdmDonutChartComponent, AdmSparklineComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly periods = PERIODS;
  days = 7;
  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal(false);

  readonly firstName = this.auth.getCurrentUser()?.firstName?.trim() || 'Admin';
  readonly today = this.formatToday();

  readonly periodShort = computed(() => PERIODS.find((p) => p.days === (this.data()?.period.days ?? 7))?.short ?? '');

  readonly linePoints = computed<LinePoint[]>(() =>
    (this.data()?.salesSeries ?? []).map((p) => ({
      label: p.label,
      value: p.total,
      hint: `${p.orders} commande${p.orders > 1 ? 's' : ''}`,
    })),
  );

  readonly donut = computed(() => toDonut(this.data()?.categories ?? []));
  readonly donutTotal = computed(() => (this.data()?.categories ?? []).reduce((s, c) => s + c.total, 0));

  readonly formatPrice = formatPrice;
  readonly formatNumber = formatNumber;
  readonly formatCompact = formatCompact;
  readonly formatDateTime = formatDateTime;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly priceFormat = (n: number) => formatPrice(n);

  readonly quickActions = [
    { icon: 'fa-plus', title: 'Ajouter un produit', text: 'Gérer votre catalogue', link: '/admin/products', query: { nouveau: '1' } },
    { icon: 'fa-cube', title: 'Gérer les stocks', text: 'Suivre les disponibilités', link: '/admin/stock' },
    { icon: 'fa-tag', title: 'Créer une promotion', text: 'Booster vos ventes', link: '/admin/promotions', query: { nouveau: '1' } },
    { icon: 'fa-chart-column', title: 'Voir les rapports', text: 'Analyser vos performances', link: '/admin/rapports' },
    { icon: 'fa-user-group', title: 'Gérer les clients', text: 'Voir la liste des clients', link: '/admin/clients' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(manual = false): void {
    if (manual) this.refreshing.set(true);
    this.error.set(false);
    this.api
      .get<DashboardData>('/admin/dashboard', { days: this.days })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.loading.set(false);
          this.refreshing.set(false);
          if (manual) this.toast.success('Tableau de bord actualisé.', 2500);
        },
        error: () => {
          this.loading.set(false);
          this.refreshing.set(false);
          this.error.set(true);
        },
      });
  }

  changePeriod(days: number): void {
    this.days = Number(days);
    this.load();
  }

  changeClass(change: number | null): string {
    if (change === null) return 'up';
    return change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  }

  changeText(change: number | null): string {
    if (change === null) return 'Nouveau';
    const v = Math.abs(change).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${v}%`;
  }

  private formatToday(): string {
    const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
