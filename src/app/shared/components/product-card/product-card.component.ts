import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';
import { Product } from '../../../models/product.model';
import { safeProductImageUrl } from '../../utils/placeholder-image';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-card" [routerLink]="['/produit', product.slug]">
      <div class="product-image">
        <img [src]="productImage" [alt]="product.name" />
        @if (product.promoPrice) {
          <span class="promo-badge">-{{ discountPercent }}%</span>
        }
        <button type="button" class="fav-btn" [class.active]="isFavorite"
          (click)="toggleFavorite($event)"
          [attr.aria-pressed]="isFavorite"
          [attr.aria-label]="isFavorite ? 'Retirer ' + product.name + ' des favoris' : 'Ajouter ' + product.name + ' aux favoris'"
          [title]="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
          <i class="fa-heart" [class.fa-solid]="isFavorite" [class.fa-regular]="!isFavorite"></i>
        </button>
      </div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        @if (product.brandName) {
          <p class="brand">{{ product.brandName }}</p>
        }
        <div class="price">
          @if (product.promoPrice) {
            <span class="old-price">{{ product.price | number }} FCFA</span>
            <span class="current-price">{{ product.promoPrice | number }} FCFA</span>
          } @else {
            <span class="current-price">{{ product.price | number }} FCFA</span>
          }
        </div>
        @if (product.stockQuantity === 0) {
          <span class="stock-badge out-of-stock"><span class="stock-label">Rupture de stock</span><span class="stock-short">Rupture</span></span>
        } @else {
          <span class="stock-badge in-stock"><span class="stock-label">En stock</span><span class="stock-short">En stock</span></span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      container-type: inline-size;
    }
    .product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: transform 0.3s, box-shadow 0.3s;
      cursor: pointer;
      min-width: 0;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .product-image {
      position: relative;
      width: 100%;
      padding-top: 100%;
      background: var(--bg-light);
    }
    .product-image img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .promo-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--error);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .fav-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.92);
      color: #7a716b;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      cursor: pointer;
      transition: transform 0.2s, color 0.2s;
      z-index: 1;
    }
    .fav-btn:hover { transform: scale(1.1); color: #ff6600; }
    .fav-btn.active { color: #ff6600; }
    .fav-btn:focus-visible { outline: 2px solid #ff6600; outline-offset: 2px; }
    .product-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
      padding: 16px;
    }
    .product-info h3 {
      font-size: 0.9375rem;
      line-height: 1.3;
      min-height: 2.6em;
      margin-bottom: 8px;
      color: var(--text-dark);
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .brand {
      font-size: 12px;
      color: var(--text-light);
      margin-bottom: 8px;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .price {
      margin-top: auto;
      margin-bottom: 8px;
    }
    .old-price {
      text-decoration: line-through;
      color: var(--text-light);
      font-size: 14px;
      margin-right: 8px;
    }
    .current-price {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
    }
    .stock-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .stock-badge.in-stock {
      background: var(--success);
      color: white;
    }
    .stock-badge.out-of-stock {
      background: #ccc;
      color: #666;
    }
    .stock-short { display: none; }

    @container (max-width: 200px) {
      .product-info { padding: 10px; }
      .product-info h3 { font-size: 0.82rem; margin-bottom: 4px; }
      .brand { font-size: 11px; margin-bottom: 4px; }
      .price { display: flex; flex-direction: column; margin-bottom: 6px; }
      .old-price { font-size: 11px; margin-right: 0; }
      .current-price { font-size: 0.92rem; }
      .fav-btn { width: 30px; height: 30px; top: 6px; left: 6px; font-size: 0.8rem; }
      .promo-badge { top: 6px; right: 6px; padding: 2px 6px; font-size: 11px; }
    }

    @container (max-width: 140px) {
      .product-info { padding: 7px 7px 8px; }
      .product-info h3 { font-size: 0.72rem; line-height: 1.25; min-height: 2.5em; }
      .brand { font-size: 10px; margin-bottom: 3px; }
      .old-price { font-size: 10px; }
      .current-price { font-size: 0.78rem; font-weight: 700; }
      .price { margin-bottom: 4px; }
      .stock-badge { padding: 0; background: none; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; }
      .stock-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .stock-badge.in-stock { background: none; color: var(--success); }
      .stock-badge.out-of-stock { background: none; color: #999; }
      .stock-label { display: none; }
      .stock-short { display: inline; }
      .fav-btn { width: 26px; height: 26px; top: 5px; left: 5px; font-size: 0.72rem; }
      .promo-badge { top: 5px; right: 5px; padding: 1px 5px; font-size: 10px; }
      .product-card:hover { transform: none; }
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  private favorites = inject(FavoritesService);

  get isFavorite(): boolean {
    return this.favorites.isFavorite(this.product.id);
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.product.id);
  }

  get productImage(): string {
    const url = this.product.images?.find(img => img.isPrimary)?.url || this.product.images?.[0]?.url;
    return safeProductImageUrl(url);
  }

  get discountPercent(): number {
    if (!this.product.promoPrice) return 0;
    return Math.round(((this.product.price - this.product.promoPrice) / this.product.price) * 100);
  }
}
