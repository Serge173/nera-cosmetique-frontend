import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, tap, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Product } from '../../models/product.model';

const COUPON_KEY = 'couponCode';

export interface CartItem {
  id?: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImage?: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>(this.getInitialCart());
  public cart$ = this.cartSubject.asObservable();

  /** Remise validée par le serveur pour un code et un sous-total donnés. */
  private couponState: { code: string; subtotal: number; discount: number } | null = null;
  private couponCheck?: Subscription;
  private couponCheckKey: string | null = null;
  private couponRejectedSubject = new Subject<{ code: string; message: string }>();
  /** Émis quand un code enregistré n'est plus applicable au panier (minimum non atteint, expiré…). */
  public couponRejected$ = this.couponRejectedSubject.asObservable();

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private auth: AuthService
  ) {
    this.loadCart();
  }

  getCart(): Observable<Cart> {
    return this.cart$;
  }

  getCartValue(): Cart {
    return this.cartSubject.value;
  }

  addItem(productId: number, quantity: number = 1, product?: Product): Observable<Cart> {
    if (this.auth.isAuthenticated()) {
      return this.api.post<Cart>('/cart/items', { productId, quantity }).pipe(
        tap(cart => this.updateCart(cart))
      );
    } else {
      const cart = this.getCartValue();
      const existingItem = cart.items.find(item => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // Pour un utilisateur invité, on s'appuie sur les infos du produit passé depuis l'UI
        const unitPrice = product ? (product.promoPrice ?? product.price) : 0;
        const productImage = product?.images?.find(img => img.isPrimary)?.url ?? product?.images?.[0]?.url;

        cart.items.push({
          productId,
          productName: product?.name ?? 'Produit',
          productSlug: product?.slug ?? '',
          productImage,
          price: unitPrice,
          quantity
        } as CartItem);
      }

      this.recalculateCart(cart);
      return of(cart);
    }
  }

  updateQuantity(item: CartItem, quantity: number): void {
    const cart = this.getCartValue();
    const found = cart.items.find(i => (item.id != null ? i.id === item.id : i.productId === item.productId));
    if (!found) return;
    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }
    if (this.auth.isAuthenticated() && item.id != null) {
      this.api.patch<Cart>(`/cart/items/${item.id}`, { quantity }).subscribe(updated => this.updateCart(updated));
    } else {
      found.quantity = quantity;
      this.recalculateCart(cart);
    }
  }

  removeItem(item: CartItem): void {
    if (this.auth.isAuthenticated() && item.id != null) {
      this.api.delete<Cart>(`/cart/items/${item.id}`).subscribe(cart => this.updateCart(cart));
    } else {
      const cart = this.getCartValue();
      cart.items = cart.items.filter(i => (item.id != null ? i.id !== item.id : i.productId !== item.productId));
      this.recalculateCart(cart);
    }
  }

  clearCart(): void {
    if (this.auth.isAuthenticated()) {
      this.api.delete<Cart>('/cart').subscribe(cart => this.updateCart(cart));
    } else {
      this.updateCart(this.getInitialCart());
    }
  }

  applyCoupon(code: string): Observable<{ success: boolean; message: string; discount: number }> {
    const normalized = code.trim().toUpperCase().substring(0, 40);
    const orderAmount = this.getCartValue().subtotal;
    return this.validateCoupon(normalized, orderAmount).pipe(
      tap((response) => {
        if (response.valid === true) {
          this.storage.set(COUPON_KEY, normalized);
          this.couponState = { code: normalized, subtotal: orderAmount, discount: this.capDiscount(response.discount, orderAmount) };
          this.updateCart(this.getCartValue());
        }
      }),
      map((response) => ({
        success: response.valid === true,
        message: response.message || (response.valid ? 'Code appliqué' : 'Code invalide'),
        discount: response.valid ? (response.discount ?? 0) : 0,
      }))
    );
  }

  validateCoupon(code: string, orderAmount: number): Observable<{ valid: boolean; message: string; discount?: number }> {
    return this.api.post<{ valid: boolean; message: string; discount?: number }>('/coupons/validate', { code, orderAmount });
  }

  getCouponCode(): string | null {
    return this.storage.get<string>(COUPON_KEY) || null;
  }

  clearCoupon(): void {
    this.storage.remove(COUPON_KEY);
    this.couponState = null;
    this.cancelCouponCheck();
    this.updateCart(this.getCartValue());
  }

  getItemCount(): number {
    return this.getCartValue().items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private loadCart(): void {
    if (this.auth.isAuthenticated()) {
      this.api.get<Cart>('/cart').subscribe(cart => this.updateCart(cart));
    } else {
      const savedCart = this.storage.get<Cart>('cart');
      if (savedCart) {
        this.updateCart(savedCart);
      }
    }
  }

  private updateCart(cart: Cart): void {
    cart.discount = this.resolveDiscount(cart);
    cart.total = Math.max(0, cart.subtotal - cart.discount) + (Number(cart.shipping) || 0);
    this.cartSubject.next(cart);
    if (!this.auth.isAuthenticated()) {
      this.storage.set('cart', cart);
    }
  }

  /** La remise suit le sous-total : elle est revalidée par le serveur dès que le panier change. */
  private resolveDiscount(cart: Cart): number {
    const code = this.getCouponCode();
    if (!code || !cart.items.length || cart.subtotal <= 0) {
      this.cancelCouponCheck();
      return 0;
    }
    const state = this.couponState;
    if (state && state.code === code && state.subtotal === cart.subtotal) return state.discount;
    this.revalidateCoupon(code, cart.subtotal);
    return state && state.code === code ? Math.min(state.discount, cart.subtotal) : 0;
  }

  private revalidateCoupon(code: string, subtotal: number): void {
    const key = `${code}|${subtotal}`;
    if (this.couponCheckKey === key) return;
    this.cancelCouponCheck();
    this.couponCheckKey = key;
    this.couponCheck = this.validateCoupon(code, subtotal).subscribe({
      next: (res) => {
        this.couponCheckKey = null;
        if (this.getCouponCode() !== code) return;
        if (res.valid === true) {
          this.couponState = { code, subtotal, discount: this.capDiscount(res.discount, subtotal) };
        } else {
          this.couponState = null;
          this.storage.remove(COUPON_KEY);
          this.couponRejectedSubject.next({ code, message: res.message || 'Code invalide' });
        }
        this.updateCart(this.getCartValue());
      },
      error: () => {
        this.couponCheckKey = null;
      },
    });
  }

  private cancelCouponCheck(): void {
    this.couponCheck?.unsubscribe();
    this.couponCheck = undefined;
    this.couponCheckKey = null;
  }

  private capDiscount(discount: unknown, subtotal: number): number {
    const n = Number(discount);
    return Number.isFinite(n) && n > 0 ? Math.min(n, subtotal) : 0;
  }

  private recalculateCart(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => {
      const price = Number(item.price ?? 0);
      const qty = Number(item.quantity ?? 0);
      if (!isFinite(price) || !isFinite(qty)) {
        return sum;
      }
      return sum + price * qty;
    }, 0);
    this.updateCart(cart);
  }

  private getInitialCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0
    };
  }
}
