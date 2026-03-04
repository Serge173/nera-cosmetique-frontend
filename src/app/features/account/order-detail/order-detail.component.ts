import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe, DatePipe],
  template: `
    <div class="order-detail">
      <div class="container">
        <nav class="account-nav">
          <a routerLink="/compte">Profil</a>
          <a routerLink="/compte/commandes" routerLinkActive="active">Mes commandes</a>
        </nav>
        @if (loading) {
          <p>Chargement...</p>
        } @else if (order) {
          <div class="detail-card">
            <h1>Commande {{ order.orderNumber }}</h1>
            <p class="order-date">Passée le {{ order.createdAt | date:'longDate' }}</p>
            <span class="order-status" [class]="'status-' + order.status">
              {{ getStatusLabel(order.status) }}
            </span>

            <section class="section">
              <h2>Adresse de livraison</h2>
              <p>{{ order.firstName }} {{ order.lastName }}</p>
              <p>{{ order.addressLine1 }}</p>
              @if (order.addressLine2) {
                <p>{{ order.addressLine2 }}</p>
              }
              <p>{{ order.city }}<span *ngIf="order.postalCode">, {{ order.postalCode }}</span></p>
              <p>Tél. {{ order.phone }}</p>
              <p>{{ order.email }}</p>
            </section>

            <section class="section">
              <h2>Articles</h2>
              <div class="items-list">
                @for (item of order.items; track item.id) {
                  <div class="item-row">
                    <span>{{ item.productName }} × {{ item.quantity }}</span>
                    <span>{{ item.totalPrice | price }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="section totals">
              <div class="row"><span>Sous-total</span><span>{{ order.subtotal | price }}</span></div>
              <div class="row"><span>Livraison</span><span>{{ order.shippingAmount | price }}</span></div>
              @if (order.discountAmount > 0) {
                <div class="row discount"><span>Réduction</span><span>-{{ order.discountAmount | price }}</span></div>
              }
              <div class="row total"><span>Total</span><span>{{ order.total | price }}</span></div>
            </section>

            <p class="payment-method">Paiement : {{ getPaymentLabel(order.paymentMethod) }}</p>
            <a routerLink="/compte/commandes" class="btn btn-outline">Retour à mes commandes</a>
          </div>
        } @else {
          <p>Commande introuvable.</p>
          <a routerLink="/compte/commandes" class="btn btn-primary">Retour à mes commandes</a>
        }
      </div>
    </div>
  `,
  styles: [`
    .order-detail { padding: 32px 0; }
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
    .detail-card {
      background: white;
      padding: 32px;
      border-radius: 8px;
      max-width: 640px;
    }
    .detail-card h1 { font-size: 24px; margin-bottom: 8px; }
    .order-date { color: var(--text-light); margin-bottom: 12px; }
    .order-status {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .status-pending { background: #ffc107; color: #000; }
    .status-paid { background: #4caf50; color: white; }
    .status-processing { background: #2196f3; color: white; }
    .status-shipped { background: #2196f3; color: white; }
    .status-delivered { background: #4caf50; color: white; }
    .status-cancelled { background: #f44336; color: white; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; margin-bottom: 12px; color: var(--text-light); }
    .items-list { border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }
    .item-row:last-child { border-bottom: none; }
    .totals .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .totals .row.total { font-size: 18px; font-weight: 600; margin-top: 12px; padding-top: 12px; border-top: 2px solid var(--border-color); }
    .totals .row.discount { color: var(--success); }
    .payment-method { margin-top: 16px; color: var(--text-light); font-size: 14px; }
    .btn { margin-top: 24px; display: inline-block; }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.api.get<Order>(`/orders/${id}`).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: () => {
        this.order = null;
        this.loading = false;
      }
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

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      mtn_momo: 'MTN Mobile Money',
      orange_money: 'Orange Money',
      moov: 'Moov Money',
      card: 'Carte bancaire',
      cash_on_delivery: 'Paiement à la livraison'
    };
    return labels[method] || method;
  }
}
