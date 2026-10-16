import { Component, OnInit } from '@angular/core';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { ToastService } from '../../../core/services/toast.service';

const STATUS_OPTIONS: { value: Order['status']; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payée' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' }
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [AdminSidebarComponent, CommonModule, RouterModule, FormsModule, PricePipe, DatePipe],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <app-admin-sidebar></app-admin-sidebar>
        <main class="admin-main">
        <h1>Gestion des commandes</h1>
        @if (loading) {
          <p>Chargement...</p>
        } @else {
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>N° commande</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (order of orders; track order.id) {
                  <tr>
                    <td>{{ order.orderNumber }}</td>
                    <td>{{ order.createdAt | date:'short':'GMT' }}</td>
                    <td>{{ order.firstName }} {{ order.lastName }}<br><small>{{ order.email }}</small></td>
                    <td>{{ order.total | price }}</td>
                    <td>
                      <div class="status-cell">
                        <span class="status-badge" [ngClass]="'status-' + order.status">
                          {{ getStatusLabel(order.status) }}
                        </span>
                        <select
                          class="status-select"
                          [value]="order.status"
                          (change)="updateStatus(order, $any($event.target).value)"
                          [disabled]="updatingId === order.id">
                          @for (opt of statusOptions; track opt.value) {
                            <option [value]="opt.value">{{ opt.label }}</option>
                          }
                        </select>
                      </div>
                    </td>
                    <td>
                      <button type="button" class="btn-link" (click)="toggleDetail(order)">
                        {{ selectedOrder?.id === order.id ? 'Masquer' : 'Détails' }}
                      </button>
                    </td>
                  </tr>
                  @if (selectedOrder?.id === order.id) {
                    <tr class="detail-row">
                      <td colspan="6">
                        <div class="order-detail-panel">
                          <h3>Commande {{ order.orderNumber }}</h3>
                          <p><strong>Adresse:</strong> {{ order.addressLine1 }}, {{ order.city }} — {{ order.phone }}</p>
                          <p><strong>Livraison:</strong> {{ order.deliveryMethod }} — <strong>Paiement:</strong> {{ order.paymentMethod }}</p>
                          <div class="detail-items">
                            <strong>Articles:</strong>
                            @for (item of order.items; track item.id) {
                              <div class="item-block">
                                <div class="item-name">{{ item.productName }} × {{ item.quantity }} — {{ item.totalPrice | price }}</div>
                                @if (item.productBrandName) {
                                  <div class="item-meta">Marque: {{ item.productBrandName }}</div>
                                }
                                @if (item.productShortDescription) {
                                  <div class="item-desc">{{ item.productShortDescription }}</div>
                                }
                              </div>
                            }
                          </div>
                          <div class="detail-totals">
                            Sous-total: {{ order.subtotal | price }} — Livraison: {{ order.shippingAmount | price }}
                            — Total: {{ order.total | price }}
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          @if (orders.length === 0) {
            <p>Aucune commande.</p>
          }
        }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { padding: 32px 0; }
    .admin-layout-inner {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    .admin-main {
      flex: 1;
    }
    .orders-table-wrap { overflow-x: auto; background: white; border-radius: 8px; padding: 16px; }
    .orders-table { width: 100%; border-collapse: collapse; }
    .orders-table th, .orders-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
    .orders-table th { font-weight: 600; color: var(--text-light); font-size: 12px; text-transform: uppercase; }
    .status-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .status-select {
      padding: 4px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 13px;
      background: #fff;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .02em;
      text-transform: uppercase;
    }
    .status-pending {
      background: #fff3e0; /* orange pâle */
      color: #ef6c00;
    }
    .status-processing {
      background: #e1f5fe; /* bleu clair */
      color: #0277bd;
    }
    .status-shipped {
      background: #ede7f6; /* violet clair */
      color: #5e35b1;
    }
    .status-paid {
      background: #c8e6c9; /* vert moyen */
      color: #1b5e20;
    }
    .status-delivered {
      background: #e8f5e9; /* vert différent, plus doux */
      color: #2e7d32;
    }
    .status-cancelled {
      background: #ffebee; /* rouge pâle */
      color: #c62828;
    }
    .btn-link { background: none; border: none; color: var(--primary-color); cursor: pointer; text-decoration: underline; }
    .detail-row td { background: var(--secondary-color); vertical-align: top; }
    .order-detail-panel { padding: 16px; max-width: 600px; }
    .order-detail-panel h3 { margin-bottom: 12px; }
    .order-detail-panel p { margin-bottom: 8px; font-size: 14px; }
    .detail-items { margin: 12px 0; font-size: 14px; }
    .detail-items .item-block { padding: 8px 0; border-bottom: 1px solid var(--border-color); }
    .detail-items .item-block:last-child { border-bottom: none; }
    .detail-items .item-name { font-weight: 600; }
    .detail-items .item-meta { font-size: 12px; color: var(--text-light); margin-top: 2px; }
    .detail-items .item-desc { font-size: 12px; color: var(--text-dark); margin-top: 4px; max-width: 400px; }
    .detail-totals { margin-top: 12px; font-size: 14px; color: var(--text-light); }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  updatingId: string | null = null;
  statusOptions = STATUS_OPTIONS;

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  getStatusLabel(status: Order['status']): string {
    const found = this.statusOptions.find(o => o.value === status);
    return found?.label ?? status;
  }

  loadOrders() {
    this.api.get<Order[]>('/admin/orders').subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleDetail(order: Order) {
    this.selectedOrder = this.selectedOrder?.id === order.id ? null : order;
  }

  updateStatus(order: Order, status: string) {
    if (status === order.status) return;
    this.updatingId = order.id;
    this.api.patch<Order>(`/admin/orders/${order.id}/status`, { status }).subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.updatingId = null;
        this.toast.success('Statut de la commande mis à jour.');
      },
      error: (err) => {
        this.updatingId = null;
        const msg = err?.error?.message || 'Impossible de mettre à jour le statut.';
        this.toast.error(msg);
      }
    });
  }
}
