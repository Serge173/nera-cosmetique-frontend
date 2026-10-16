import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, concatMap, from, map, of, reduce, tap } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderItem } from '../../../models/order.model';

@Injectable({ providedIn: 'root' })
export class ReorderService {
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  /** Ajoute au panier les articles d'une ancienne commande ; les produits indisponibles sont ignorés. */
  reorder(items: OrderItem[]): Observable<number> {
    const lines = items.filter((i) => i.productId && i.quantity > 0);
    return from(lines).pipe(
      concatMap((i) => this.cart.addItem(i.productId, i.quantity).pipe(
        map(() => 1),
        catchError(() => of(0)),
      )),
      reduce((added, ok) => added + ok, 0),
      tap((added) => {
        if (!added) {
          this.toast.error('Ces produits ne sont plus disponibles pour le moment.');
          return;
        }
        const skipped = lines.length - added;
        this.toast.success(skipped
          ? `${added} produit${added > 1 ? 's ajoutés' : ' ajouté'} au panier (${skipped} indisponible${skipped > 1 ? 's' : ''}).`
          : 'Les articles ont été ajoutés à votre panier.');
        this.router.navigate(['/panier']);
      }),
    );
  }
}
