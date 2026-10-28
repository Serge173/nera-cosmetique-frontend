import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../models/order.model';
import { AdminSummaryService } from '../shared/admin-summary.service';
import {
  ORDER_STATUS_LIST,
  OrderStatus,
  deliveryLabel,
  downloadCsv,
  formatDate,
  formatDateTime,
  formatPrice,
  paymentLabel,
  statusLabel,
  statusTone,
} from '../shared/admin-format';

type AdminOrder = Order & { notes?: string | null };

const PAGE_SIZE = 15;
const FLOW: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private summary = inject(AdminSummaryService);

  readonly statuses = ORDER_STATUS_LIST;
  readonly flow = FLOW;
  readonly orders = signal<AdminOrder[]>([]);
  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);
  readonly selected = signal<AdminOrder | null>(null);

  readonly search = signal('');
  readonly status = signal<OrderStatus | 'all'>('all');
  readonly period = signal<'all' | '1' | '7' | '30'>('all');
  readonly page = signal(1);

  readonly counts = computed(() => {
    const c: Record<string, number> = { all: this.orders().length };
    for (const o of this.orders()) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  });

  readonly stats = computed(() => {
    const list = this.orders();
    const valid = list.filter((o) => o.status !== 'cancelled');
    return {
      total: list.length,
      pending: list.filter((o) => o.status === 'pending').length,
      inProgress: list.filter((o) => ['paid', 'processing', 'shipped'].includes(o.status)).length,
      delivered: list.filter((o) => o.status === 'delivered').length,
      revenue: valid.reduce((s, o) => s + Number(o.total || 0), 0),
    };
  });

  readonly filtered = computed(() => {
    const q = this.normalize(this.search());
    const st = this.status();
    const days = this.period() === 'all' ? 0 : Number(this.period());
    const since = days ? Date.now() - days * 86_400_000 : 0;
    return this.orders().filter((o) => {
      if (st !== 'all' && o.status !== st) return false;
      if (since && new Date(o.createdAt).getTime() < since) return false;
      if (!q) return true;
      const hay = this.normalize(`${o.orderNumber} ${o.firstName} ${o.lastName} ${o.email} ${o.phone} ${o.city}`);
      return hay.includes(q);
    });
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly paged = computed(() => {
    const p = Math.min(this.page(), this.pageCount());
    return this.filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  });

  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly paymentLabel = paymentLabel;
  readonly deliveryLabel = deliveryLabel;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const q = params.get('q') ?? '';
      const st = params.get('status') as OrderStatus | null;
      this.search.set(q);
      this.status.set(st && this.statuses.some((s) => s.value === st) ? st : 'all');
      this.page.set(1);
      this.autoOpen();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<AdminOrder[]>('/admin/orders').subscribe({
      next: (list) => {
        this.orders.set(list ?? []);
        this.loading.set(false);
        this.autoOpen();
        const sel = this.selected();
        if (sel) this.selected.set(this.orders().find((o) => o.id === sel.id) ?? null);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les commandes.');
      },
    });
  }

  private autoOpen(): void {
    const q = this.search().trim().toLowerCase();
    if (!q || this.loading()) return;
    const match = this.orders().find((o) => o.orderNumber.toLowerCase() === q);
    if (match) this.selected.set(match);
  }

  private normalize(s: string): string {
    return (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  setStatus(value: OrderStatus | 'all'): void {
    this.status.set(value);
    this.page.set(1);
  }

  setPeriod(value: 'all' | '1' | '7' | '30'): void {
    this.period.set(value);
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.period.set('all');
    this.page.set(1);
    this.router.navigate([], { queryParams: {} });
  }

  open(order: AdminOrder): void {
    this.selected.set(order);
  }

  close(): void {
    this.selected.set(null);
    if (this.route.snapshot.queryParamMap.get('q')) {
      this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  stepIndex(status: string): number {
    return FLOW.indexOf(status as OrderStatus);
  }

  addressOf(o: AdminOrder): string {
    return [o.addressLine1, o.addressLine2, [o.city, o.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  }

  itemsCount(order: AdminOrder): number {
    return (order.items ?? []).reduce((s, i) => s + Number(i.quantity || 0), 0);
  }

  updateStatus(order: AdminOrder, status: OrderStatus): void {
    if (status === order.status || this.updatingId()) return;
    if (status === 'cancelled' && !confirm(`Annuler la commande #${order.orderNumber} ?`)) return;
    this.updatingId.set(order.id);
    this.api.patch<AdminOrder>(`/admin/orders/${order.id}/status`, { status }).subscribe({
      next: (updated) => {
        const next = { ...order, status: updated?.status ?? status };
        this.orders.update((list) => list.map((o) => (o.id === order.id ? next : o)));
        if (this.selected()?.id === order.id) this.selected.set(next);
        this.updatingId.set(null);
        this.summary.refresh();
        this.toast.success(`Commande #${order.orderNumber} : ${statusLabel(next.status)}.`);
      },
      error: (err) => {
        this.updatingId.set(null);
        this.toast.error(err?.error?.message || 'Impossible de mettre à jour le statut.');
      },
    });
  }

  exportCsv(): void {
    const rows: (string | number)[][] = [
      ['N° commande', 'Date', 'Client', 'Email', 'Téléphone', 'Ville', 'Articles', 'Sous-total', 'Livraison', 'Remise', 'Total', 'Paiement', 'Statut'],
      ...this.filtered().map((o) => [
        o.orderNumber,
        formatDateTime(o.createdAt),
        `${o.firstName} ${o.lastName}`.trim(),
        o.email,
        o.phone,
        o.city,
        this.itemsCount(o),
        Number(o.subtotal || 0),
        Number(o.shippingAmount || 0),
        Number(o.discountAmount || 0),
        Number(o.total || 0),
        paymentLabel(o.paymentMethod),
        statusLabel(o.status),
      ]),
    ];
    downloadCsv(`commandes-nera-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }
}
