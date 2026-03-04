import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';

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
  imports: [CommonModule, RouterModule, FormsModule, PricePipe, DatePipe],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <aside class="admin-sidebar">
          <div class="sidebar-logo">Nera Admin</div>
          <nav class="sidebar-menu">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tableau de bord</a>
            <a routerLink="/admin/categories" routerLinkActive="active">Catégories</a>
            <a routerLink="/admin/orders" routerLinkActive="active">Commandes</a>
            <a routerLink="/admin/products" routerLinkActive="active">Produits</a>
            <a routerLink="/admin/users" routerLinkActive="active">Utilisateurs</a>
          </nav>
        </aside>
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
                    <td>{{ order.createdAt | date:'short' }}</td>
                    <td>{{ order.firstName }} {{ order.lastName }}<br><small>{{ order.email }}</small></td>
                    <td>{{ order.total | price }}</td>
                    <td>
                      <select
                        [value]="order.status"
                        (change)="updateStatus(order, $any($event.target).value)"
                        [disabled]="updatingId === order.id">
                        @for (opt of statusOptions; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
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
                              <div>{{ item.productName }} × {{ item.quantity }} — {{ item.totalPrice | price }}</div>
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
    .admin-sidebar {
      width: 240px;
      background: var(--white);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 24px 16px;
      position: sticky;
      top: 90px;
      align-self: flex-start;
    }
    .sidebar-logo {
      font-weight: 700;
      font-size: 18px;
      color: var(--primary-color);
      margin-bottom: 16px;
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sidebar-menu a {
      padding: 8px 12px;
      border-radius: 6px;
      color: var(--text-dark);
      font-size: 14px;
    }
    .sidebar-menu a.active {
      background: var(--primary-color);
      color: var(--white);
    }
    .admin-main {
      flex: 1;
    }
    .orders-table-wrap { overflow-x: auto; background: white; border-radius: 8px; padding: 16px; }
    .orders-table { width: 100%; border-collapse: collapse; }
    .orders-table th, .orders-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
    .orders-table th { font-weight: 600; color: var(--text-light); font-size: 12px; text-transform: uppercase; }
    .orders-table select {
      padding: 6px 10px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
    }
    .btn-link { background: none; border: none; color: var(--primary-color); cursor: pointer; text-decoration: underline; }
    .detail-row td { background: var(--secondary-color); vertical-align: top; }
    .order-detail-panel { padding: 16px; max-width: 600px; }
    .order-detail-panel h3 { margin-bottom: 12px; }
    .order-detail-panel p { margin-bottom: 8px; font-size: 14px; }
    .detail-items { margin: 12px 0; font-size: 14px; }
    .detail-items div { padding: 4px 0; }
    .detail-totals { margin-top: 12px; font-size: 14px; color: var(--text-light); }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  updatingId: string | null = null;
  statusOptions = STATUS_OPTIONS;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
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
      },
      error: () => { this.updatingId = null; }
    });
  }
}
