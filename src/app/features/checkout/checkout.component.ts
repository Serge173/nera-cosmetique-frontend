import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cart, CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CreateOrderDto, CheckoutFormData, Order } from '../../models/order.model';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { formatNumber } from '../admin/shared/admin-format';
import { Address } from '../account/shared/account.models';

interface DeliveryOption { method: string; price: number; freeFrom: number | null }

const DEFAULT_DELIVERY: DeliveryOption[] = [
  { method: 'abidjan', price: 1500, freeFrom: null },
  { method: 'interior', price: 3000, freeFrom: null },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    <div class="checkout page-section section-cosmetic-mint">
      <div class="container">
        @if (orderConfirmed) {
          <div class="confirmation-block">
            <div class="confirmation-icon">✓</div>
            <h1>Commande enregistrée</h1>
            <p class="confirmation-message">
              VOTRE COMMANDE SERA LIVRÉE DANS 48H, NOTRE SERVICE CLIENT VA VOUS CONTACTER.
            </p>
            <p class="order-number">Numéro de commande : <strong>{{ confirmedOrderNumber }}</strong></p>
            <div class="confirmation-actions">
              <a routerLink="/boutique" class="btn btn-primary">Continuer mes achats</a>
              <a routerLink="/" class="btn btn-outline">Retour à l'accueil</a>
            </div>
          </div>
        } @else {
        <span class="section-label-cosmetic">Commande</span>
        <h1 class="section-title-cosmetic">Commander</h1>
        <p class="checkout-intro section-subtitle-cosmetic">Renseignez vos coordonnées et le mode de livraison ci-dessous.</p>
        <div class="checkout-content">
          <form (ngSubmit)="submitOrder()" class="checkout-form">
            <h2>Informations de livraison</h2>
            @if (savedAddresses.length > 1) {
              <div class="form-group">
                <label for="saved-address">Mes adresses enregistrées</label>
                <select id="saved-address" class="saved-select" [ngModel]="selectedAddressId" name="savedAddress" (ngModelChange)="useAddress($event)">
                  @for (a of savedAddresses; track a.id) {
                    <option [ngValue]="a.id">{{ a.label || 'Adresse' }} — {{ a.addressLine1 }}, {{ a.city }}</option>
                  }
                </select>
              </div>
            } @else if (savedAddresses.length === 1) {
              <p class="prefill-note">Adresse « {{ savedAddresses[0].label || 'par défaut' }} » pré-remplie depuis votre compte.</p>
            }
            <div class="form-row">
              <div class="form-group">
                <label for="co-first">Prénom *</label>
                <input id="co-first" type="text" [(ngModel)]="orderData.firstName" name="firstName" required maxlength="100" autocomplete="given-name" />
              </div>
              <div class="form-group">
                <label for="co-last">Nom *</label>
                <input id="co-last" type="text" [(ngModel)]="orderData.lastName" name="lastName" required maxlength="100" autocomplete="family-name" />
              </div>
            </div>
            <div class="form-group">
              <label for="co-email">Email *</label>
              <input id="co-email" type="email" [(ngModel)]="orderData.email" name="email" required maxlength="255" autocomplete="email" />
            </div>
            <div class="form-group">
              <label for="co-phone">Téléphone *</label>
              <input id="co-phone" type="tel" [(ngModel)]="orderData.phone" name="phone" required maxlength="30" autocomplete="tel" inputmode="tel" />
            </div>
            <div class="form-group">
              <label for="co-addr">Adresse *</label>
              <input id="co-addr" type="text" [(ngModel)]="orderData.addressLine1" name="addressLine1" required maxlength="255" autocomplete="address-line1" />
            </div>
            <div class="form-group">
              <label for="co-city">Ville *</label>
              <input id="co-city" type="text" [(ngModel)]="orderData.city" name="city" required maxlength="100" autocomplete="address-level2" />
            </div>

            <h2>Mode de livraison</h2>
            <div class="form-group">
              <label>
                <input type="radio" [(ngModel)]="orderData.deliveryMethod" name="delivery" value="abidjan" />
                Livraison à domicile en moins de 48h - {{ deliveryLabel('abidjan') }}
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.deliveryMethod" name="delivery" value="interior" />
                Expédition (paiement avant expédition) - {{ deliveryLabel('interior') }}
              </label>
            </div>

            <h2>Mode de paiement</h2>
            <div class="form-group">
              <label>
                <input type="radio" name="payment" value="mtn_momo" disabled />
                ⛔ Mobile Money MTN
              </label>
              <label>
                <input type="radio" name="payment" value="orange_money" disabled />
                ⛔ Orange Money
              </label>
              <label>
                <input type="radio" name="payment" value="moov" disabled />
                ⛔ Moov Money
              </label>
              <label>
                <input type="radio" name="payment" value="card" disabled />
                ⛔ Carte bancaire
              </label>
              <label>
                <input type="radio" [(ngModel)]="orderData.paymentMethod" name="payment" value="cash_on_delivery" />
                Paiement à la livraison
              </label>
            </div>

            @if (formError) {
              <p class="form-error" role="alert">{{ formError }}</p>
            }
            <button type="submit" class="btn btn-primary btn-large" [disabled]="submitting || !cart.items.length">
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
                <span>{{ orderData.deliveryMethod ? (shippingCost > 0 ? (shippingCost | price) : 'Offerte') : '—' }}</span>
              </div>
              @if (discount > 0) {
                <div class="summary-row discount">
                  <span>Réduction ({{ couponCode }})</span>
                  <span>-{{ discount | price }}</span>
                </div>
              }
              @if (couponMessage) {
                <p class="coupon-note">{{ couponMessage }}</p>
              }
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
      grid-template-columns: 3fr 2fr;
      gap: 20px;
      align-items: flex-start;
    }
    .checkout-content > * {
      min-width: 0;
    }
    .checkout-form {
      background: white;
      padding: 20px 18px;
      border-radius: 8px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group {
      margin-bottom: 16px;
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
      top: calc(var(--header-height) + 16px);
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      overflow-wrap: anywhere;
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
    .summary-row.discount {
      color: var(--success, #2b8a52);
    }
    .coupon-note {
      margin: -4px 0 12px;
      font-size: 13px;
      color: var(--text-light);
    }
    .form-error {
      margin: 0 0 16px;
      padding: 12px 14px;
      border-radius: 8px;
      background: #fdeceb;
      color: #8c1d18;
      font-size: 14px;
    }
    .prefill-note {
      margin: 0 0 16px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #fff7f0;
      color: #a84300;
      font-size: 14px;
    }
    .saved-select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: white;
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
      .checkout-form,
      .checkout-summary {
        padding: 16px;
      }
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
export class CheckoutComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 };
  orderData: CheckoutFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    deliveryMethod: '',
    paymentMethod: 'cash_on_delivery'
  };
  submitting = false;
  orderConfirmed = false;
  confirmedOrderNumber = '';
  formError = '';

  deliveryOptions: DeliveryOption[] = DEFAULT_DELIVERY;
  savedAddresses: Address[] = [];
  selectedAddressId: number | null = null;

  couponCode: string | null = null;
  discount = 0;
  couponMessage = '';
  private subs = new Subscription();

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.subs.add(this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
      this.couponCode = this.cartService.getCouponCode();
      this.discount = this.couponCode ? Math.min(Number(cart.discount) || 0, cart.subtotal) : 0;
    }));
    this.subs.add(this.cartService.couponRejected$.subscribe(({ code, message }) => {
      this.couponMessage = `Code ${code} non appliqué : ${message}`;
    }));
    this.subs.add(this.api.get<DeliveryOption[]>('/orders/delivery-options').subscribe({
      next: (options) => {
        if (Array.isArray(options) && options.length) this.deliveryOptions = options;
      },
      error: () => {},
    }));
    this.prefill();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private option(method: string): DeliveryOption | undefined {
    return this.deliveryOptions.find(o => o.method === method);
  }

  deliveryLabel(method: string): string {
    const o = this.option(method);
    if (!o) return '';
    if (o.freeFrom != null && this.cart.subtotal >= o.freeFrom) return 'offerte';
    const price = `${formatNumber(o.price)} FCFA`;
    return o.freeFrom != null ? `${price} (offerte dès ${formatNumber(o.freeFrom)} FCFA)` : price;
  }

  get shippingCost(): number {
    const o = this.option(this.orderData.deliveryMethod);
    if (!o) return 0;
    return o.freeFrom != null && this.cart.subtotal >= o.freeFrom ? 0 : o.price;
  }

  get total(): number {
    return Math.max(0, this.cart.subtotal - this.discount) + this.shippingCost;
  }

  useAddress(id: number) {
    const a = this.savedAddresses.find(x => x.id === id);
    if (!a) return;
    this.selectedAddressId = a.id;
    this.orderData.firstName = a.firstName;
    this.orderData.lastName = a.lastName;
    this.orderData.phone = a.phone;
    this.orderData.addressLine1 = [a.addressLine1, a.addressLine2].filter(Boolean).join(', ');
    this.orderData.city = a.city;
  }

  private prefill() {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.orderData.firstName = user.firstName ?? '';
    this.orderData.lastName = user.lastName ?? '';
    this.orderData.email = user.email ?? '';
    this.orderData.phone = user.phone ?? '';
    this.subs.add(this.api.get<Address[]>('/account/addresses').subscribe({
      next: (list) => {
        this.savedAddresses = Array.isArray(list) ? list : [];
        const preferred = this.savedAddresses.find(a => a.isDefault) ?? this.savedAddresses[0];
        if (preferred && !this.orderData.addressLine1) this.useAddress(preferred.id);
      },
      error: () => {},
    }));
  }

  submitOrder() {
    this.formError = '';
    if (!this.cart.items.length) {
      this.formError = 'Votre panier est vide.';
      return;
    }
    const required: [keyof CheckoutFormData, string][] = [
      ['firstName', 'le prénom'], ['lastName', 'le nom'], ['email', 'l’e-mail'],
      ['phone', 'le téléphone'], ['addressLine1', 'l’adresse'], ['city', 'la ville'],
    ];
    const missing = required.filter(([key]) => !String(this.orderData[key] ?? '').trim()).map(([, label]) => label);
    if (missing.length) {
      this.formError = `Merci de renseigner ${missing.join(', ')}.`;
      return;
    }
    if (!this.option(this.orderData.deliveryMethod)) {
      this.formError = 'Choisissez un mode de livraison.';
      return;
    }
    this.submitting = true;
    const order: CreateOrderDto = {
      ...this.orderData,
      couponCode: this.couponCode ?? undefined,
      subtotal: this.cart.subtotal,
      shippingAmount: this.shippingCost,
      discountAmount: this.discount,
      total: this.total,
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
        this.cartService.clearCoupon();
        this.cartService.clearCart();
        this.confirmedOrderNumber = created.orderNumber;
        this.orderConfirmed = true;
        this.toast.success(
          `Commande ${created.orderNumber} enregistrée avec succès. Votre commande sera livrée dans 48h, notre service client va vous contacter.`
        );
      },
      error: (err) => {
        this.submitting = false;
        const message = err?.error?.message;
        this.formError = typeof message === 'string' && message
          ? message
          : 'Erreur lors de la création de la commande. Vérifiez vos informations.';
        this.toast.error(this.formError);
        if (/code promo|bon fidélité/i.test(this.formError)) {
          this.couponCode = null;
          this.discount = 0;
          this.cartService.clearCoupon();
        }
      }
    });
  }
}
