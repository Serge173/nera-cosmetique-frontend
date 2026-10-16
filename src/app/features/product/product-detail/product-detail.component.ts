import { Component, OnInit, inject } from '@angular/core';
import { FavoritesService } from '../../../core/services/favorites.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../models/product.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    <div class="product-detail page-section section-cosmetic-cream">
      <div class="container">
        @if (product) {
          <div class="product-content">
            <div class="product-images">
              <img [src]="safeImage(mainImage)" [alt]="product.name" class="main-image" />
              <div class="image-thumbnails">
                @for (img of product.images; track img.id) {
                  <img [src]="safeImage(img.url)" [alt]="img.alt" (click)="mainImage = img.url" />
                }
              </div>
            </div>

            <div class="product-info">
              <h1>{{ product.name }}</h1>
              @if (product.brandName) {
                <p class="brand">{{ product.brandName }}</p>
              }
              <div class="price-section">
                @if (product.promoPrice) {
                  <span class="old-price">{{ product.price | price }}</span>
                  <span class="current-price">{{ product.promoPrice | price }}</span>
                } @else {
                  <span class="current-price">{{ product.price | price }}</span>
                }
              </div>
              <p class="stock" [class.in-stock]="product.stockQuantity > 0">
                {{ product.stockQuantity > 0 ? 'En stock' : 'Rupture de stock' }}
              </p>

              <div class="quantity-selector">
                <button (click)="decreaseQuantity()">-</button>
                <input type="number" [(ngModel)]="quantity" name="quantity" min="1" [max]="product.stockQuantity" />
                <button (click)="increaseQuantity()">+</button>
              </div>

              <div class="actions">
                <button (click)="addToCart()" class="btn btn-primary" [disabled]="product.stockQuantity === 0">
                  Ajouter au panier
                </button>
                <button (click)="buyNow()" class="btn btn-outline" [disabled]="product.stockQuantity === 0">
                  Acheter maintenant
                </button>
                <button type="button" class="fav-toggle" [class.active]="favorites.isFavorite(product.id)"
                  (click)="favorites.toggle(product.id)"
                  [attr.aria-pressed]="favorites.isFavorite(product.id)"
                  [attr.aria-label]="favorites.isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                  [title]="favorites.isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'">
                  <i class="fa-heart" [class.fa-solid]="favorites.isFavorite(product.id)" [class.fa-regular]="!favorites.isFavorite(product.id)"></i>
                </button>
              </div>

              <div class="tabs">
                <button [class.active]="activeTab === 'description'" (click)="activeTab = 'description'">Description</button>
                <button [class.active]="activeTab === 'ingredients'" (click)="activeTab = 'ingredients'">Ingrédients</button>
                <button [class.active]="activeTab === 'usage'" (click)="activeTab = 'usage'">Utilisation</button>
              </div>

              <div class="tab-content">
                @if (activeTab === 'description') {
                  <div [innerHTML]="product.description"></div>
                }
                @if (activeTab === 'ingredients') {
                  <div [innerHTML]="product.ingredients"></div>
                }
                @if (activeTab === 'usage') {
                  <div [innerHTML]="product.usageInstructions"></div>
                }
              </div>
            </div>
          </div>
        } @else if (loading) {
          <div class="pd-state" aria-busy="true"><span class="pd-spinner"></span> Chargement du produit…</div>
        } @else {
          <div class="pd-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <h1>Produit introuvable</h1>
            <p>Ce produit n’existe pas ou n’est plus disponible.</p>
            <a routerLink="/boutique" class="btn btn-primary">Voir la boutique</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .pd-state { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 72px 16px; color: var(--text-light); }
    .pd-state > i { font-size: 2rem; color: var(--primary-color); }
    .pd-state h1 { margin: 0; font-size: 1.5rem; color: var(--text-dark); }
    .pd-state p { margin: 0 0 8px; }
    .pd-spinner { width: 28px; height: 28px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: pd-spin .8s linear infinite; }
    @keyframes pd-spin { to { transform: rotate(360deg); } }
    .product-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-top: 32px;
    }
    .main-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 8px;
    }
    .image-thumbnails {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .image-thumbnails img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
    }
    .image-thumbnails img:hover {
      border-color: var(--primary-color);
    }
    .product-info h1 {
      font-size: clamp(1.5rem, 4vw, 2rem);
      margin-bottom: 8px;
      word-wrap: break-word;
    }
    .brand {
      color: var(--text-light);
      margin-bottom: 16px;
    }
    .price-section {
      margin-bottom: 16px;
    }
    .old-price {
      text-decoration: line-through;
      color: var(--text-light);
      margin-right: 12px;
    }
    .current-price {
      font-size: 28px;
      font-weight: 600;
      color: var(--primary-color);
    }
    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0;
    }
    .quantity-selector button {
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-color);
      background: white;
      border-radius: 4px;
    }
    .quantity-selector input {
      width: 60px;
      text-align: center;
      padding: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }
    .actions .btn {
      min-width: 140px;
    }
    .fav-toggle {
      width: 48px;
      min-height: 44px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: white;
      color: #7a716b;
      font-size: 1.15rem;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .fav-toggle:hover, .fav-toggle.active {
      color: #ff6600;
      border-color: #ffc499;
      background: #fff7f0;
    }
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 24px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .tabs button {
      padding: 12px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .tabs button.active {
      border-bottom-color: var(--primary-color);
      color: var(--primary-color);
    }
    @media (max-width: 768px) {
      .product-content {
        grid-template-columns: 1fr;
        gap: 24px;
        margin-top: 20px;
      }
      .product-info h1 {
        font-size: 1.5rem;
      }
      .current-price {
        font-size: 1.5rem;
      }
      .quantity-selector button {
        min-width: 44px;
        min-height: 44px;
      }
    }
    @media (max-width: 480px) {
      .actions {
        flex-direction: column;
      }
      .actions .btn {
        width: 100%;
      }
      .fav-toggle {
        width: 100%;
      }
      .image-thumbnails img {
        width: 60px;
        height: 60px;
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  readonly favorites = inject(FavoritesService);
  private title = inject(Title);
  product: Product | null = null;
  loading = true;
  mainImage = '';
  quantity = 1;
  activeTab = 'description';

  safeImage(url: string): string {
    return safeProductImageUrl(url);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cartService: CartService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadProduct(params['slug']);
    });
  }

  loadProduct(slug: string) {
    this.product = null;
    this.loading = true;
    this.quantity = 1;
    this.activeTab = 'description';
    this.api.get<Product>(`/products/slug/${encodeURIComponent(slug)}`).subscribe({
      next: product => {
        this.loading = false;
        this.product = product;
        if (product?.name) this.title.setTitle(`${product.name} — Nera Cosmétique`);
        this.mainImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '';
      },
      error: () => {
        this.loading = false;
        this.title.setTitle('Produit introuvable — Nera Cosmétique');
      },
    });
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.stockQuantity) {
      this.quantity++;
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addItem(this.product.id, this.quantity, this.product).subscribe({
        next: () => {
          this.toast.success('Produit ajouté au panier.');
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Impossible d\'ajouter le produit au panier.';
          this.toast.error(msg);
        },
      });
    }
  }

  buyNow() {
    if (this.product) {
      this.cartService.addItem(this.product.id, this.quantity, this.product).subscribe({
        next: () => {
          this.toast.success('Produit ajouté au panier, vous pouvez finaliser votre commande.');
          this.router.navigate(['/commander']);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Impossible d\'ajouter le produit au panier.';
          this.toast.error(msg);
        },
      });
    }
  }
}
