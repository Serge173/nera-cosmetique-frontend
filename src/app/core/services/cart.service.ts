import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Product } from '../../models/product.model';

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
    const orderAmount = this.getCartValue().subtotal;
    return this.api.post<{ valid: boolean; message: string; discount?: number }>('/coupons/validate', { code, orderAmount }).pipe(
      tap((response) => {
        if (response.valid === true) {
          const cart = this.getCartValue();
          cart.discount = response.discount ?? 0;
          this.recalculateCart(cart);
        }
      }),
      map((response) => ({
        success: response.valid === true,
        message: response.message || (response.valid ? 'Code appliqué' : 'Code invalide'),
        discount: response.valid ? (response.discount ?? 0) : 0,
      }))
    );
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
    this.cartSubject.next(cart);
    if (!this.auth.isAuthenticated()) {
      this.storage.set('cart', cart);
    }
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
    cart.total = cart.subtotal + cart.shipping - cart.discount;
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
