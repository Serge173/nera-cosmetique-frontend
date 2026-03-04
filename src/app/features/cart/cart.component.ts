import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/services/cart.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { safeThumbImageUrl } from '../../shared/utils/placeholder-image';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23eee" width="80" height="80"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Image</text></svg>');

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    <div class="cart">
      <div class="container">
        <h1>Mon panier</h1>
        @if (cart.items.length === 0) {
          <div class="empty-cart">
            <p>Votre panier est vide</p>
            <a routerLink="/boutique" class="btn btn-primary">Continuer mes achats</a>
          </div>
        } @else {
          <div class="cart-content">
            <div class="cart-items">
              @for (item of cart.items; track item.id || item.productId) {
                <div class="cart-item">
                  <img [src]="getItemImage(item)" [alt]="item.productName" />
                  <div class="item-info">
                    <h3>{{ item.productName }}</h3>
                    <p>{{ item.price | price }} × {{ item.quantity }}</p>
                  </div>
                  <div class="item-quantity">
                    <button (click)="updateQuantity(item, item.quantity - 1)">-</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="updateQuantity(item, item.quantity + 1)">+</button>
                  </div>
                  <div class="item-total">
                    {{ (item.price * item.quantity) | price }}
                  </div>
                  <button (click)="removeItem(item)" class="remove-btn">×</button>
                </div>
              }
            </div>

            <div class="cart-summary">
              <div class="coupon-section">
                <input type="text" [(ngModel)]="couponCode" name="couponCode" placeholder="Code promo" />
                <button (click)="applyCoupon()" class="btn btn-secondary">Appliquer</button>
                @if (couponMessage) {
                  <p class="coupon-message" [class.success]="couponSuccess">{{ couponMessage }}</p>
                }
              </div>

              <div class="summary">
                <div class="summary-row">
                  <span>Sous-total</span>
                  <span>{{ cart.subtotal | price }}</span>
                </div>
                <div class="summary-row">
                  <span>Livraison</span>
                  <span>{{ cart.shipping | price }}</span>
                </div>
                @if (cart.discount > 0) {
                  <div class="summary-row discount">
                    <span>Réduction</span>
                    <span>-{{ cart.discount | price }}</span>
                  </div>
                }
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ cart.total | price }}</span>
                </div>
              </div>

              <button (click)="goToCheckout()" class="btn btn-primary btn-large">
                Commander
              </button>
              <a routerLink="/boutique" class="btn btn-outline">Continuer mes achats</a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cart {
      padding: 32px 0;
    }
    .empty-cart {
      text-align: center;
      padding: 60px 20px;
    }
    .cart-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 32px;
    }
    .cart-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .cart-item img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }
    .item-info {
      flex: 1;
    }
    .item-quantity {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .item-quantity button {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color);
      background: white;
      border-radius: 4px;
    }
    .item-total {
      font-weight: 600;
      font-size: 18px;
    }
    .remove-btn {
      background: var(--error);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      font-size: 20px;
    }
    .cart-summary {
      background: white;
      padding: 24px;
      border-radius: 8px;
      height: fit-content;
      position: sticky;
      top: 100px;
    }
    .coupon-section {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }
    .coupon-section input {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    .coupon-message {
      margin-top: 8px;
      font-size: 14px;
    }
    .coupon-message.success {
      color: var(--success-color, green);
    }
    .summary {
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 0;
      margin-bottom: 24px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .summary-row.total {
      font-size: 20px;
      font-weight: 600;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid var(--border-color);
    }
    .summary-row.discount {
      color: var(--success);
    }
    .btn-large {
      width: 100%;
      padding: 16px;
      margin-bottom: 12px;
    }
    @media (max-width: 768px) {
      .cart {
        padding: 24px 0;
      }
      .cart-content {
        grid-template-columns: 1fr;
      }
      .cart-summary {
        position: static;
      }
    }
    @media (max-width: 480px) {
      .cart-item {
        flex-wrap: wrap;
        gap: 12px;
      }
      .cart-item img {
        width: 64px;
        height: 64px;
      }
      .item-info {
        flex: 1 1 100%;
        order: 1;
      }
      .item-quantity {
        order: 2;
      }
      .item-quantity button {
        min-width: 44px;
        min-height: 44px;
      }
      .item-total {
        order: 3;
        flex: 1;
        text-align: right;
      }
      .remove-btn {
        order: 4;
        min-width: 44px;
        min-height: 44px;
      }
      .coupon-section {
        flex-direction: column;
      }
      .btn-large {
        min-height: 48px;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cart = { items: [] as CartItem[], subtotal: 0, shipping: 0, discount: 0, total: 0 };
  couponCode = '';
  placeholderImage = PLACEHOLDER_IMAGE;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  getItemImage(item: CartItem): string {
    return safeThumbImageUrl(item.productImage);
  }

  ngOnInit() {
    this.cart = this.cartService.getCartValue();
    this.cartService.getCart().subscribe(cart => {
      this.cart = cart;
    });
  }

  updateQuantity(item: CartItem, quantity: number) {
    this.cartService.updateQuantity(item, quantity);
  }

  removeItem(item: CartItem) {
    this.cartService.removeItem(item);
  }

  couponMessage = '';
  couponSuccess = false;

  applyCoupon() {
    this.couponMessage = '';
    if (this.couponCode) {
      this.cartService.applyCoupon(this.couponCode).subscribe({
        next: (res) => {
          this.couponMessage = res.message;
          this.couponSuccess = res.success;
        },
        error: (err) => {
          this.couponMessage = err.error?.message || 'Erreur lors de l\'application du code';
          this.couponSuccess = false;
        },
      });
    }
  }

  goToCheckout() {
    this.router.navigate(['/commander']);
  }
}
