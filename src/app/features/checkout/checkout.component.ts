import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CreateOrderDto, CheckoutFormData, Order } from '../../models/order.model';
import { PricePipe } from '../../shared/pipes/price.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    <div class="checkout">
      <div class="container">
        @if (orderConfirmed) {
          <div class="confirmation-block">
            <div class="confirmation-icon">✓</div>
            <h1>Commande enregistrée</h1>
            <p class="confirmation-message">Merci pour votre commande. Nous vous contacterons pour confirmer la livraison.</p>
            <p class="order-number">Numéro de commande : <strong>{{ confirmedOrderNumber }}</strong></p>
            <div class="confirmation-actions">
              <a routerLink="/boutique" class="btn btn-primary">Continuer mes achats</a>
              <a routerLink="/" class="btn btn-outline">Retour à l'accueil</a>
            </div>
          </div>
        } @else {
        <h1>Commander</h1>
        <p class="checkout-intro">Vous pouvez passer commande avec ou sans compte. Renseignez vos coordonnées ci-dessous.</p>
        <div class="checkout-content">
          <form (ngSubmit)="submitOrder()" class="checkout-form">
            <h2>Informations de livraison</h2>
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" [(ngModel)]="orderData.firstName" name="firstName" required />
              </div>
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" [(ngModel)]="orderData.lastName" name="lastName" required />
              </div>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" [(ngModel)]="orderData.email" name="email" required />
            </div>
            <div class="form-group">
              <label>Téléphone *</label>
              <input type="tel" [(ngModel)]="orderData.phone" name="phone" required />
            </div>
            <div class="form-group">
              <label>Adresse *</label>
              <input type="text" [(ngModel)]="orderData.addressLine1" name="addressLine1" required />
            </div>
            <div class="form-group">
              <label>Ville *</label>
              <input type="text" [(ngModel)]="orderData.city" name="city" required />
            </div>

            <h2>Mode de livraison</h2>
            <div class="form-group">
              <label>
                <input type="radio" [(ngModel)]="orderData.deliveryMethod" name="delivery" value="abidjan" />
                Abidjan - 2 000 FCFA
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.deliveryMethod" name="delivery" value="interior" />
                Intérieur pays - 5 000 FCFA
              </label>
            </div>

            <h2>Mode de paiement</h2>
            <div class="form-group">
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="mtn_momo" />
                Mobile Money MTN
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="orange_money" />
                Orange Money
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="moov" />
                Moov Money
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="card" />
                Carte bancaire
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="cash_on_delivery" />
                Paiement à la livraison
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-large" [disabled]="submitting">
              {{ submitting ? 'Traitement...' : 'Confirmer la commande' }}
            </button>
          </form>

          <div class="checkout-summary">
            <h2>Récapitulatif</h2>
            <div class="summary-items">
              @for (item of cart.items; track item.productId) {
                <div class="summary-item">
                  <span>{{ item.productName }} × {{ item.quantity }}</span>
                  <span>{{ (item.price * item.quantity) | price }}</span>
                </div>
              }
            </div>
            <div class="summary-totals">
              <div class="summary-row">
                <span>Sous-total</span>
                <span>{{ cart.subtotal | price }}</span>
              </div>
              <div class="summary-row">
                <span>Livraison</span>
                <span>{{ shippingCost | price }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ total | price }}</span>
              </div>
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .confirmation-block {
      text-align: center;
      max-width: 480px;
      margin: 48px auto;
      padding: 48px 32px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .confirmation-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: var(--success, #22c55e);
      color: white;
      font-size: 32px;
      font-weight: bold;
      line-height: 64px;
      border-radius: 50%;
    }
    .confirmation-block h1 { margin-bottom: 12px; font-size: 24px; }
    .confirmation-message { color: var(--text-light); margin-bottom: 24px; }
    .order-number { font-size: 18px; margin-bottom: 32px; }
    .order-number strong { color: var(--primary-color); }
    .confirmation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .checkout-intro {
      color: var(--text-light);
      margin-bottom: 24px;
      font-size: 14px;
    }
    .checkout-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }
    .checkout-form {
      background: white;
      padding: 32px;
      border-radius: 8px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group {
      margin-bottom: 24px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="tel"] {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .form-group input[type="radio"] {
      margin-right: 8px;
    }
    .checkout-summary {
      background: white;
      padding: 24px;
      border-radius: 8px;
      height: fit-content;
      position: sticky;
      top: 100px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .summary-totals {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid var(--border-color);
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .summary-row.total {
      font-size: 20px;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .checkout-content {
        grid-template-columns: 1fr;
      }
      .checkout-form {
        padding: 24px;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .checkout-summary {
        position: static;
      }
    }
    @media (max-width: 480px) {
      .confirmation-block {
        margin: 24px auto;
        padding: 32px 20px;
      }
      .confirmation-block h1 {
        font-size: 1.25rem;
      }
      .checkout-form {
        padding: 20px;
      }
      .form-group input[type="radio"] + span,
      .form-group label {
        font-size: 0.9375rem;
      }
      .btn-large {
        min-height: 48px;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cart = { items: [] as any[], subtotal: 0, shipping: 0, discount: 0, total: 0 };
  orderData: CheckoutFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    deliveryMethod: '',
    paymentMethod: ''
  };
  submitting = false;
  orderConfirmed = false;
  confirmedOrderNumber = '';

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cart = this.cartService.getCartValue();
    this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
    });
  }

  get shippingCost(): number {
    return this.orderData.deliveryMethod === 'abidjan' ? 2000 : 
           this.orderData.deliveryMethod === 'interior' ? 5000 : 0;
  }

  get total(): number {
    return this.cart.subtotal + this.shippingCost - this.cart.discount;
  }

  submitOrder() {
    this.submitting = true;
    const shippingAmount = this.shippingCost;
    const total = this.total;
    const order: CreateOrderDto = {
      ...this.orderData,
      deliveryZoneId: this.orderData.deliveryMethod === 'abidjan' ? 1 : 2,
      subtotal: this.cart.subtotal,
      shippingAmount,
      discountAmount: this.cart.discount,
      total,
      items: this.cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        quantity: item.quantity,
        unitPrice: item.price,
        productImageUrl: item.productImage
      }))
    };

    this.api.post<Order>('/orders', order).subscribe({
      next: (created) => {
        this.submitting = false;
        this.cartService.clearCart();
        this.confirmedOrderNumber = created.orderNumber;
        this.orderConfirmed = true;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur lors de la création de la commande. Vérifiez vos informations.');
        this.submitting = false;
      }
    });
  }
}
