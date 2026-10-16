import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, combineLatest, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product, ProductFilter, ProductListResponse } from '../../models/product.model';
import { CategoryWithCount } from '../../models/product.model';

interface CategorySection {
  category: CategoryWithCount;
  products: Product[];
  total: number;
}

const SECTION_SIZE = 6;

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="shop page-section section-cosmetic-lavender">
      <header class="shop-hero shop-hero-cosmetic">
        <div class="shop-hero-bg" aria-hidden="true"></div>
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
          <h1 class="shop-title">
            {{ selectedCategoryName || 'BIENVENUE SUR LA BOUTIQUE NERACOSMETIQUE' }}
          </h1>
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
              @if (grouped) {
                {{ total }} produit{{ total !== 1 ? 's' : '' }} dans {{ sections.length }} catégorie{{ sections.length !== 1 ? 's' : '' }}
              } @else if (filters.category) {
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
            } @else if (loading && !hasContent) {
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
            } @else if (!loading && !hasContent) {
              <div class="state-message state-empty">
                <p>Aucun produit ne correspond à vos critères.</p>
                <button type="button" class="btn btn-outline" (click)="resetFilters()">
                  Voir tous les produits
                </button>
              </div>
            } @else if (grouped) {
              <div class="cat-sections">
                @for (s of sections; track s.category.id) {
                  <section class="cat-section" [attr.aria-labelledby]="'cat-' + s.category.id">
                    <header class="cat-section-head">
                      <div class="cat-section-title">
                        <h2 [id]="'cat-' + s.category.id">{{ s.category.name }}</h2>
                        <span class="cat-section-count">{{ s.total }} produit{{ s.total !== 1 ? 's' : '' }}</span>
                      </div>
                      <a [routerLink]="['/boutique', s.category.slug]" class="cat-see-all">
                        Voir tout <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                      </a>
                    </header>
                    <div class="products-grid products-grid--section">
                      @for (product of s.products; track product.id) {
                        <app-product-card [product]="product" />
                      }
                    </div>
                    @if (s.total > s.products.length) {
                      <div class="cat-section-more">
                        <a [routerLink]="['/boutique', s.category.slug]" class="btn btn-outline">
                          Voir les {{ s.total }} produits {{ s.category.name }}
                        </a>
                      </div>
                    }
                  </section>
                }
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

    .shop-hero-cosmetic {
      background: linear-gradient(135deg, var(--cosmetic-cream) 0%, var(--cosmetic-rose) 50%, var(--white) 100%);
      padding: 40px 0 48px;
      margin-bottom: 32px;
      border-bottom: 1px solid rgba(255, 102, 0, 0.08);
      position: relative;
      overflow: hidden;
    }
    .shop-hero-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      animation: shopHeroSlideshow 18s ease-in-out infinite;
      z-index: 0;
      pointer-events: none;
    }
    .shop-hero-cosmetic::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(90deg, rgba(255, 250, 247, 0.94) 0%, rgba(255, 250, 247, 0.78) 45%, rgba(255, 250, 247, 0.1) 100%);
      pointer-events: none;
    }
    .shop-hero-cosmetic .container { position: relative; z-index: 2; }

    @keyframes shopHeroSlideshow {
      0%, 30% {
        background-image: url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2400&q=85');
      }
      33%, 63% {
        background-image: url('https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=2400&q=85');
      }
      66%, 96% {
        background-image: url('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=2400&q=85');
      }
      100% {
        background-image: url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2400&q=85');
      }
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
      text-transform: uppercase;
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
      top: calc(var(--header-height) + 16px);
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

    .cat-sections {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .cat-section-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border-color);
      position: relative;
    }

    .cat-section-head::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 64px;
      height: 2px;
      background: var(--primary-color);
    }

    .cat-section-title {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .cat-section-title h2 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-dark);
    }

    .cat-section-count {
      font-size: 0.85rem;
      color: var(--text-light);
      white-space: nowrap;
    }

    .cat-see-all {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
      white-space: nowrap;
    }

    .cat-see-all:hover {
      text-decoration: underline;
    }

    .products-grid--section {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .cat-section-more {
      display: flex;
      justify-content: center;
      margin-top: 18px;
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
    }

    @media (max-width: 600px) {
      .products-grid {
        gap: 8px;
      }
      .cat-sections {
        gap: 28px;
      }
      .cat-section-head {
        margin-bottom: 12px;
        padding-bottom: 8px;
      }
      .cat-section-title h2 {
        font-size: 1.1rem;
      }
      .cat-section-count {
        font-size: 0.75rem;
      }
      .cat-see-all {
        font-size: 0.8rem;
      }
      .cat-section-more .btn {
        width: 100%;
        text-align: center;
      }
      .skeleton-line {
        height: 10px;
        margin: 8px 8px 0;
      }
      .skeleton-line.price {
        margin-bottom: 10px;
      }
    }

    @media (max-width: 480px) {
      .shop-hero {
        padding: 24px 0 32px;
      }

      .shop-toolbar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        margin-bottom: 16px;
      }

      .toolbar-actions {
        justify-content: space-between;
        gap: 8px;
      }

      .btn-filters-mobile,
      .sort-label {
        flex: 1;
      }

      .sort-select {
        width: 100%;
      }

      .btn-filters-mobile,
      .sort-select,
      .pagination-btn {
        min-height: 44px;
      }

      .sort-label-text {
        display: none;
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
  sections: CategorySection[] = [];
  categories: CategoryWithCount[] = [];
  private categories$!: Observable<CategoryWithCount[]>;
  private requestId = 0;
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

  /** Vue « Toutes les catégories » : une section par catégorie. */
  get grouped(): boolean {
    return this.filters.category == null && !this.filters.q;
  }

  get hasContent(): boolean {
    return this.grouped ? this.sections.length > 0 : this.products.length > 0;
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

  private baseParams(): Record<string, unknown> {
    const params: Record<string, unknown> = { sort: this.sortBy };
    if (this.filters.minPrice != null) params['minPrice'] = this.filters.minPrice;
    if (this.filters.maxPrice != null) params['maxPrice'] = this.filters.maxPrice;
    return params;
  }

  loadProducts(): void {
    const id = ++this.requestId;
    this.loading = true;
    this.errorMessage = null;
    if (this.grouped) {
      this.loadSections(id);
      return;
    }
    const params: Record<string, unknown> = {
      ...this.baseParams(),
      page: this.filters.page ?? 1,
      limit: this.filters.limit ?? 12,
    };
    if (this.filters.category != null) params['category'] = this.filters.category;
    if (this.filters.q) params['q'] = this.filters.q;

    this.api.get<ProductListResponse>('/products', params).subscribe({
      next: response => {
        if (id !== this.requestId) return;
        this.products = response.products;
        this.currentPage = response.page;
        this.totalPages = response.totalPages;
        this.total = response.total;
        this.loading = false;
      },
      error: () => {
        if (id !== this.requestId) return;
        this.errorMessage = 'Impossible de charger les produits. Vérifiez votre connexion.';
        this.loading = false;
      },
    });
  }

  private loadSections(id: number): void {
    const params = { ...this.baseParams(), page: 1, limit: SECTION_SIZE };
    this.categories$
      .pipe(
        switchMap(cats => {
          const withProducts = cats.filter(c => c.productCount > 0);
          if (!withProducts.length) return of<CategorySection[]>([]);
          return forkJoin(
            withProducts.map(category =>
              this.api
                .get<ProductListResponse>('/products', { ...params, category: category.id })
                .pipe(map(r => ({ category, products: r.products, total: r.total }))),
            ),
          );
        }),
      )
      .subscribe({
        next: sections => {
          if (id !== this.requestId) return;
          this.sections = sections.filter(s => s.products.length > 0);
          this.total = this.sections.reduce((sum, s) => sum + s.total, 0);
          this.currentPage = 1;
          this.totalPages = 1;
          this.loading = false;
        },
        error: () => {
          if (id !== this.requestId) return;
          this.errorMessage = 'Impossible de charger les produits. Vérifiez votre connexion.';
          this.loading = false;
        },
      });
  }

  loadCategories(): void {
    this.categories$ = this.api.get<CategoryWithCount[]>('/categories/with-counts').pipe(
      map(cats => cats ?? []),
      catchError(() => of<CategoryWithCount[]>([])),
      shareReplay(1),
    );
    this.categories$.subscribe(cats => (this.categories = cats));
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
