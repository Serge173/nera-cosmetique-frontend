import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
          <span class="stock-badge out-of-stock">Rupture de stock</span>
        } @else {
          <span class="stock-badge in-stock">En stock</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .product-card {
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
    .product-info {
      padding: 16px;
    }
    .product-info h3 {
      font-size: 0.9375rem;
      margin-bottom: 8px;
      color: var(--text-dark);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .brand {
      font-size: 12px;
      color: var(--text-light);
      margin-bottom: 8px;
    }
    .price {
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
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;

  get productImage(): string {
    const url = this.product.images?.find(img => img.isPrimary)?.url || this.product.images?.[0]?.url;
    return safeProductImageUrl(url);
  }

  get discountPercent(): number {
    if (!this.product.promoPrice) return 0;
    return Math.round(((this.product.price - this.product.promoPrice) / this.product.price) * 100);
  }
}
