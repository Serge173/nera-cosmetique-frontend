import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe, DatePipe],
  template: `
    <div class="orders-history">
      <div class="container">
        <h1>Mes commandes</h1>
        <nav class="account-nav">
          <a routerLink="/compte">Profil</a>
          <a routerLink="/compte/commandes" routerLinkActive="active">Mes commandes</a>
        </nav>
        @if (orders.length === 0) {
          <p>Aucune commande</p>
        } @else {
          <div class="orders-list">
            @for (order of orders; track order.id) {
              <div class="order-card">
                <div class="order-header">
                  <span class="order-number">Commande #{{ order.orderNumber }}</span>
                  <span class="order-date">{{ order.createdAt | date }}</span>
                  <span class="order-status" [class]="'status-' + order.status">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
                <div class="order-items">
                  @for (item of order.items; track item.id) {
                    <div class="order-item">
                      {{ item.productName }} × {{ item.quantity }}
                    </div>
                  }
                </div>
                <div class="order-footer">
                  <span class="order-total">Total: {{ order.total | price }}</span>
                  <a [routerLink]="['/compte/commandes', order.id]">Voir détails</a>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .orders-history {
      padding: 32px 0;
    }
    .account-nav {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      border-bottom: 2px solid var(--border-color);
    }
    .account-nav a {
      padding: 12px 0;
      color: var(--text-dark);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }
    .account-nav a.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .order-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .order-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending { background: #ffc107; color: #000; }
    .status-paid { background: #4caf50; color: white; }
    .status-shipped { background: #2196f3; color: white; }
    .status-delivered { background: #4caf50; color: white; }
    .status-cancelled { background: #f44336; color: white; }
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }
    @media (max-width: 480px) {
      .orders-history {
        padding: 24px 0;
      }
      .order-card {
        padding: 16px;
      }
      .order-header {
        flex-wrap: wrap;
        gap: 8px;
      }
      .order-footer {
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  `]
})
export class OrdersHistoryComponent implements OnInit {
  orders: Order[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.api.get<Order[]>('/orders').subscribe(orders => {
      this.orders = orders;
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }
}
