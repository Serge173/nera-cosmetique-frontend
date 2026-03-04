import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CartService } from '../services/cart.service';

export const checkoutGuard: CanActivateFn = (route, state) => {
  const cartService = inject(CartService);
  const router = inject(Router);

  const cart = cartService.getCartValue();
  if (cart.items.length > 0) {
    return true;
  }

  router.navigate(['/panier']);
  return false;
};
