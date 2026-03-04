import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product, ProductFilter, ProductListResponse } from '../../models/product.model';
import { CategoryWithCount } from '../../models/product.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="shop">
      <!-- En-tête de page -->
      <header class="shop-hero">
        <div class="container">
          <nav class="breadcrumb" aria-label="Fil d'Ariane">
            <a routerLink="/">Accueil</a>
            <span class="sep">/</span>
            @if (selectedCategoryName) {
              <a routerLink="/boutique">Boutique</a>
              <span class="sep">/</span>
              <span class="current">{{ selectedCategoryName }}</span>
            } @else {
              <span class="current">Boutique</span>
            }
          </nav>
          <h1 class="shop-title">{{ selectedCategoryName || 'Boutique' }}</h1>
          <p class="shop-subtitle">
            {{ selectedCategoryName ? 'Découvrez nos produits dans cette catégorie.' : 'Découvrez notre sélection de soins et cosmétiques.' }}
          </p>
        </div>
      </header>

      <div class="container shop-body">
        <!-- Barre d'outils (tri + filtre mobile) -->
        <div class="shop-toolbar">
          <p class="results-count" aria-live="polite">
            @if (!loading && !errorMessage) {
              @if (filters.category) {
                {{ total }} produit{{ total !== 1 ? 's' : '' }} dans cette catégorie
              } @else {
                {{ total }} produit{{ total !== 1 ? 's' : '' }} au total
              }
            }
          </p>
          <div class="toolbar-actions">
            <button
              type="button"
              class="btn-filters-mobile"
              (click)="toggleFilters()"
              [attr.aria-expanded]="filtersOpen"
              aria-label="Ouvrir les filtres"
            >
              Filtres
            </button>
            <label class="sort-label">
              <span class="sort-label-text">Trier par</span>
              <select
                [(ngModel)]="sortBy"
                name="sortBy"
                (change)="applyFilters()"
                class="sort-select"
                aria-label="Trier les produits"
              >
                <option value="newest">Nouveautés</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="popularity">Popularité</option>
              </select>
            </label>
          </div>
        </div>

        <div class="shop-content">
          <!-- Panneau des filtres -->
          <aside
            class="filters-panel"
            [class.open]="filtersOpen"
            role="search"
            aria-label="Filtres des produits"
          >
            <div class="filters-panel-inner">
              <div class="filters-header">
                <h2 class="filters-title">Filtres</h2>
                <button
                  type="button"
                  class="btn-close-filters"
                  (click)="closeFilters()"
                  aria-label="Fermer les filtres"
                >
                  &times;
                </button>
              </div>

              <form class="filters-form" (submit)="applyFilters(); $event.preventDefault()">
                <div class="filter-group">
                  <label for="filter-category">Catégorie</label>
                  <select
                    id="filter-category"
                    [(ngModel)]="filters.category"
                    name="category"
                    class="filter-select"
                    (change)="onCategoryChange()"
                  >
                    <option [ngValue]="undefined">Toutes les catégories</option>
                    @for (cat of categories; track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }} ({{ cat.productCount }})</option>
                    }
                  </select>
                </div>

                <div class="filter-group">
                  <label for="filter-min-price">Prix min (FCFA)</label>
                  <input
                    id="filter-min-price"
                    type="number"
                    [(ngModel)]="filters.minPrice"
                    name="minPrice"
                    class="filter-input"
                    placeholder="Ex. 1000"
                    min="0"
                    step="100"
                  />
                </div>
                <div class="filter-group">
                  <label for="filter-max-price">Prix max (FCFA)</label>
                  <input
                    id="filter-max-price"
                    type="number"
                    [(ngModel)]="filters.maxPrice"
                    name="maxPrice"
                    class="filter-input"
                    placeholder="Ex. 50000"
                    min="0"
                    step="100"
                  />
                </div>

                <div class="filter-actions">
                  <button type="submit" class="btn btn-primary btn-block">Appliquer</button>
                  <button type="button" class="btn btn-outline btn-block" (click)="resetFilters()">
                    Réinitialiser
                  </button>
                </div>
              </form>
            </div>
            @if (filtersOpen) {
              <div class="filters-overlay" (click)="closeFilters()" aria-hidden="true"></div>
            }
          </aside>

          <!-- Zone principale : grille de produits -->
          <main class="products-main" [attr.aria-busy]="loading">
            @if (errorMessage) {
              <div class="state-message state-error" role="alert">
                <p>{{ errorMessage }}</p>
                <button type="button" class="btn btn-primary" (click)="loadProducts()">Réessayer</button>
              </div>
            } @else if (loading && products.length === 0) {
              <div class="products-grid products-grid--skeleton">
                @for (i of skeletonCount; track i) {
                  <div class="product-skeleton" aria-hidden="true">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line price"></div>
                  </div>
                }
              </div>
            } @else if (!loading && products.length === 0) {
              <div class="state-message state-empty">
                <p>Aucun produit ne correspond à vos critères.</p>
                <button type="button" class="btn btn-outline" (click)="resetFilters()">
                  Voir tous les produits
                </button>
              </div>
            } @else {
              <div class="products-grid">
                @for (product of products; track product.id) {
                  <app-product-card [product]="product" />
                }
              </div>

              @if (totalPages > 1) {
                <nav class="pagination" aria-label="Pagination des produits">
                  <button
                    type="button"
                    class="pagination-btn"
                    [disabled]="currentPage <= 1"
                    (click)="goToPage(currentPage - 1)"
                    aria-label="Page précédente"
                  >
                    Précédent
                  </button>
                  <div class="pagination-numbers">
                    @for (page of visiblePages; track page) {
                      @if (page === -1) {
                        <span class="pagination-ellipsis">…</span>
                      } @else {
                        <button
                          type="button"
                          class="pagination-btn pagination-num"
                          [class.active]="currentPage === page"
                          (click)="goToPage(page)"
                          [attr.aria-current]="currentPage === page ? 'page' : null"
                          [attr.aria-label]="'Page ' + page"
                        >
                          {{ page }}
                        </button>
                      }
                    }
                  </div>
                  <button
                    type="button"
                    class="pagination-btn"
                    [disabled]="currentPage >= totalPages"
                    (click)="goToPage(currentPage + 1)"
                    aria-label="Page suivante"
                  >
                    Suivant
                  </button>
                </nav>
              }
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop {
      min-height: 60vh;
      padding-bottom: 48px;
    }

    .shop-hero {
      background: linear-gradient(135deg, var(--secondary-color) 0%, #fff 100%);
      padding: 32px 0 40px;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border-color);
    }

    .breadcrumb {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-bottom: 12px;
    }

    .breadcrumb a {
      color: var(--primary-color);
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .breadcrumb .sep {
      margin: 0 8px;
      color: var(--border-color);
    }

    .breadcrumb .current {
      color: var(--text-dark);
      font-weight: 500;
    }

    .shop-title {
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }

    .shop-subtitle {
      font-size: 1rem;
      color: var(--text-light);
      margin: 0;
    }

    .shop-body {
      padding: 0;
    }

    .shop-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .results-count {
      font-size: 0.9375rem;
      color: var(--text-light);
      margin: 0;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-filters-mobile {
      display: none;
      padding: 10px 16px;
      border: 1px solid var(--border-color);
      background: #fff;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-dark);
      cursor: pointer;
    }

    .btn-filters-mobile:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .sort-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    .sort-label-text {
      font-size: 0.875rem;
      color: var(--text-light);
    }

    .sort-select {
      padding: 10px 36px 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.9375rem;
      background: #fff;
      color: var(--text-dark);
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }

    .sort-select:hover,
    .sort-select:focus {
      border-color: var(--primary-color);
      outline: none;
    }

    .shop-content {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      align-items: start;
    }

    .filters-panel {
      position: sticky;
      top: 24px;
    }

    .filters-panel-inner {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .filters-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .filters-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-dark);
    }

    .btn-close-filters {
      display: none;
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-light);
      border-radius: 8px;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--text-light);
      cursor: pointer;
    }

    .btn-close-filters:hover {
      background: var(--border-color);
      color: var(--text-dark);
    }

    .filter-group {
      margin-bottom: 20px;
    }

    .filter-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .filter-select,
    .filter-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.9375rem;
      background: #fff;
      color: var(--text-dark);
    }

    .filter-input::-webkit-outer-spin-button,
    .filter-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .filter-select:focus,
    .filter-input:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.15);
    }

    .filter-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 24px;
    }

    .btn-block {
      width: 100%;
      text-align: center;
    }

    .products-main {
      min-width: 0;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 24px;
    }

    .products-grid--skeleton .product-skeleton {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .skeleton-image {
      width: 100%;
      padding-top: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-shine 1.2s ease-in-out infinite;
    }

    .skeleton-line {
      height: 14px;
      margin: 12px 16px 0;
      border-radius: 4px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-shine 1.2s ease-in-out infinite;
    }

    .skeleton-line.short {
      width: 60%;
    }

    .skeleton-line.price {
      width: 40%;
      margin-top: 12px;
      margin-bottom: 16px;
    }

    @keyframes skeleton-shine {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .state-message {
      text-align: center;
      padding: 48px 24px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid var(--border-color);
    }

    .state-message p {
      margin: 0 0 16px;
      font-size: 1.0625rem;
      color: var(--text-light);
    }

    .state-error p {
      color: var(--error);
    }

    .state-message .btn {
      margin-top: 8px;
    }

    .pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .pagination-btn {
      padding: 10px 16px;
      border: 1px solid var(--border-color);
      background: #fff;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-dark);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, color 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-color);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #fff;
    }

    .pagination-num {
      min-width: 44px;
    }

    .pagination-ellipsis {
      padding: 0 4px;
      color: var(--text-light);
      font-size: 0.9375rem;
    }

    .pagination-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    @media (max-width: 900px) {
      .shop-content {
        grid-template-columns: 1fr;
      }

      .filters-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        pointer-events: none;
        padding: 0;
      }

      .filters-panel.open {
        pointer-events: auto;
      }

      .filters-panel-inner {
        position: absolute;
        top: 0;
        left: 0;
        width: min(320px, 85vw);
        height: 100%;
        border-radius: 0;
        border-right: 1px solid var(--border-color);
        overflow-y: auto;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }

      .filters-panel.open .filters-panel-inner {
        transform: translateX(0);
      }

      .btn-close-filters {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .filters-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
      }

      .btn-filters-mobile {
        display: inline-block;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .shop-hero {
        padding: 24px 0 32px;
      }

      .shop-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .toolbar-actions {
        justify-content: space-between;
      }

      .btn-filters-mobile,
      .sort-select,
      .pagination-btn {
        min-height: 44px;
      }

      .sort-label-text {
        display: none;
      }

      .products-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .pagination {
        gap: 8px;
      }

      .pagination-btn {
        padding: 10px 14px;
        font-size: 0.875rem;
        min-width: 44px;
      }
    }
  `],
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryWithCount[] = [];
  loading = false;
  filtersOpen = false;
  errorMessage: string | null = null;
  filters: ProductFilter = { page: 1, limit: 12 };
  sortBy: ProductFilter['sort'] = 'newest';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  readonly skeletonCount = Array.from({ length: 8 }, (_, i) => i + 1);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  get selectedCategoryName(): string | null {
    if (!this.filters.category) return null;
    const cat = this.categories.find(c => c.id === this.filters.category);
    return cat?.name ?? null;
  }

  get visiblePages(): number[] {
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (start > 2) pages.unshift(-1);
    if (start > 1) pages.unshift(1);
    if (end < this.totalPages - 1) pages.push(-1);
    if (end < this.totalPages) pages.push(this.totalPages);
    return pages;
  }

  ngOnInit(): void {
    this.loadCategories();
    combineLatest([this.route.params, this.route.queryParams]).subscribe(([params, queryParams]) => {
      const slug = params['categorySlug'];
      const q = (queryParams['q'] ?? '').trim();
      this.filters.q = q || undefined;
      this.filters.page = 1;
      if (slug) {
        this.api.get<{ id: number; name: string }>('/categories/slug/' + slug).subscribe({
          next: cat => {
            this.filters.category = cat.id;
            this.loadProducts();
          },
          error: () => {
            this.filters.category = undefined;
            this.loadProducts();
          },
        });
      } else {
        this.filters.category = undefined;
        this.loadProducts();
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = null;
    const params: Record<string, unknown> = {
      page: this.filters.page ?? 1,
      limit: this.filters.limit ?? 12,
      sort: this.sortBy,
    };
    if (this.filters.category != null) params['category'] = this.filters.category;
    if (this.filters.minPrice != null) params['minPrice'] = this.filters.minPrice;
    if (this.filters.maxPrice != null) params['maxPrice'] = this.filters.maxPrice;
    if (this.filters.q) params['q'] = this.filters.q;

    this.api.get<ProductListResponse>('/products', params).subscribe({
      next: response => {
        this.products = response.products;
        this.currentPage = response.page;
        this.totalPages = response.totalPages;
        this.total = response.total;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les produits. Vérifiez votre connexion.';
        this.loading = false;
      },
    });
  }

  loadCategories(): void {
    this.api.get<CategoryWithCount[]>('/categories/with-counts').subscribe({
      next: cats => (this.categories = cats ?? []),
      error: () => (this.categories = []),
    });
  }

  onCategoryChange(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.closeFilters();
    this.loadProducts();
  }

  resetFilters(): void {
    this.filters = { page: 1, limit: 12 };
    this.sortBy = 'newest';
    this.closeFilters();
    this.router.navigate(['/boutique'], { queryParams: {} });
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  closeFilters(): void {
    this.filtersOpen = false;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filters.page = page;
    this.loadProducts();
  }
}
