import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../models/product.model';
import { Category } from '../../models/product.model';

interface SlideItem {
  image?: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="home">
      <aside class="home-sidebar" aria-label="Catégories">
        <div class="sidebar-inner">
          <h2 class="sidebar-title">Catégories</h2>
          <nav class="sidebar-nav">
            <a routerLink="/boutique" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="sidebar-link">Toutes les catégories</a>
            @for (cat of categories; track cat.id) {
              <a [routerLink]="['/boutique', cat.slug]" routerLinkActive="active" class="sidebar-link">{{ cat.name }}</a>
            }
          </nav>
        </div>
      </aside>
      <div class="home-main">
      <section class="hero-slider">
        <div class="slider-track" [style.transform]="'translateX(-' + currentSlideIndex * 100 + '%)'">
          @for (slide of slides; track $index) {
            <div class="slide" [class.active]="currentSlideIndex === $index">
              <div class="slide-bg" [style.backgroundImage]="slide.image ? 'url(' + slide.image + ')' : ''"></div>
              <div class="slide-content">
                <h1>{{ slide.title }}</h1>
                @if (slide.description) {
                  <p>{{ slide.description }}</p>
                }
                @if (slide.link) {
                  <a [routerLink]="slide.link" class="btn btn-primary">{{ slide.linkLabel || 'Découvrir' }}</a>
                } @else {
                  <a routerLink="/boutique" class="btn btn-primary">Découvrir la boutique</a>
                }
              </div>
            </div>
          }
        </div>
        <button type="button" class="slider-btn prev" (click)="prev(); resetTimer()" aria-label="Précédent">
          ‹
        </button>
        <button type="button" class="slider-btn next" (click)="next(); resetTimer()" aria-label="Suivant">
          ›
        </button>
        <div class="slider-dots">
          @for (slide of slides; track $index) {
            <button type="button" class="dot" [class.active]="currentSlideIndex === $index" (click)="goTo($index); resetTimer()" [attr.aria-label]="'Slide ' + ($index + 1)"></button>
          }
        </div>
      </section>

      <section class="featured-products">
        <div class="container">
          <h2>Produits en vedette</h2>
          <div class="products-grid">
            @for (product of featuredProducts; track product.id) {
              <app-product-card [product]="product"></app-product-card>
            }
          </div>
          <div class="text-center" style="margin-top: 24px;">
            <a routerLink="/boutique" class="btn btn-outline">Voir toute la boutique</a>
          </div>
        </div>
      </section>

      <section class="new-products">
        <div class="container">
          <h2>Nouveautés</h2>
          <div class="products-grid">
            @for (product of newProducts; track product.id) {
              <app-product-card [product]="product"></app-product-card>
            }
          </div>
        </div>
      </section>

      <section class="newsletter">
        <div class="container">
          <h2>Newsletter</h2>
          <p>Recevez nos offres exclusives</p>
          <form (ngSubmit)="subscribeNewsletter()" class="newsletter-form">
            <input type="email" [(ngModel)]="newsletterEmail" name="newsletterEmail" placeholder="Votre email" required />
            <button type="submit" class="btn btn-primary">S'inscrire</button>
          </form>
        </div>
      </section>
      </div>
    </div>
  `,
  styles: [`
    .home {
      display: flex;
      min-height: 100%;
      min-width: 0;
    }
    .home-sidebar {
      flex: 0 0 260px;
      width: 260px;
      min-width: 0;
      background: #fff;
      border-right: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      align-self: start;
      max-height: 100vh;
      overflow-y: auto;
    }
    .sidebar-inner {
      padding: 24px 20px 32px;
    }
    .sidebar-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--primary-color);
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-link {
      display: block;
      padding: 10px 14px;
      border-radius: 8px;
      color: var(--text-dark);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.2s, color 0.2s;
    }
    .sidebar-link:hover {
      background: var(--secondary-color);
      color: var(--primary-color);
    }
    .sidebar-link.active {
      background: var(--secondary-color);
      color: var(--primary-color);
    }
    .home-main {
      flex: 1;
      min-width: 0;
    }
    .hero-slider {
      position: relative;
      overflow: hidden;
      min-height: 380px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    }
    .slider-track {
      display: flex;
      width: 100%;
      transition: transform 0.5s ease-in-out;
    }
    .slide {
      flex: 0 0 100%;
      min-height: 380px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .slide-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.25;
    }
    .slide-content {
      position: relative;
      z-index: 1;
      color: white;
      padding: 48px 24px;
      max-width: 720px;
      width: 100%;
    }
    .slide-content h1 {
      font-size: clamp(28px, 5vw, 42px);
      margin-bottom: 16px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .slide-content p {
      font-size: clamp(16px, 2.5vw, 20px);
      margin-bottom: 24px;
      opacity: 0.95;
    }
    .slide-content .btn {
      display: inline-block;
    }
    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      color: white;
      font-size: 28px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .slider-btn:hover {
      background: rgba(255,255,255,0.4);
    }
    .slider-btn.prev { left: 16px; }
    .slider-btn.next { right: 16px; }
    .slider-dots {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 10px;
      z-index: 2;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.5);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }
    .dot:hover, .dot.active {
      background: white;
      transform: scale(1.2);
    }
    .featured-products, .new-products {
      padding: 60px 0;
    }
    .featured-products h2, .new-products h2 {
      text-align: center;
      margin-bottom: 40px;
      color: var(--text-dark);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 24px;
    }
    .newsletter {
      background: var(--secondary-color);
      padding: 60px 20px;
      text-align: center;
    }
    .newsletter-form {
      display: flex;
      gap: 12px;
      max-width: 500px;
      margin: 24px auto 0;
    }
    .newsletter-form input {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    @media (max-width: 900px) {
      .home {
        flex-direction: column;
      }
      .home-sidebar {
        flex: none;
        width: 100%;
        max-height: none;
        position: static;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      .sidebar-inner {
        padding: 16px 20px;
      }
      .sidebar-nav {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }
      .sidebar-link {
        padding: 8px 12px;
        font-size: 0.875rem;
      }
    }
    @media (max-width: 768px) {
      .hero-slider, .slide {
        min-height: 280px;
      }
      .slide-content {
        padding: 32px 20px;
      }
      .slider-btn {
        width: 44px;
        height: 44px;
        font-size: 24px;
      }
      .slider-btn.prev { left: 12px; }
      .slider-btn.next { right: 12px; }
      .featured-products, .new-products {
        padding: 40px 0;
      }
      .featured-products h2, .new-products h2 {
        margin-bottom: 24px;
        font-size: 1.375rem;
      }
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .newsletter {
        padding: 40px 16px;
      }
      .newsletter-form {
        flex-direction: column;
      }
    }
    @media (max-width: 480px) {
      .hero-slider, .slide {
        min-height: 240px;
      }
      .slide-content h1 {
        font-size: 1.5rem;
      }
      .products-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .featured-products, .new-products {
        padding: 32px 0;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  featuredProducts: Product[] = [];
  newProducts: Product[] = [];
  newsletterEmail = '';
  currentSlideIndex = 0;
  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;
  private readonly AUTO_PLAY_MS = 6000;

  slides: SlideItem[] = [
    {
      title: 'Bienvenue chez Nera Cosmétique',
      description: 'Découvrez nos produits cosmétiques importés de France, pour une peau sublimée.',
      link: '/boutique',
      linkLabel: 'Découvrir la boutique'
    },
    {
      title: 'Nouveautés et tendances',
      description: 'Des soins et maquillages soigneusement sélectionnés pour vous.',
      link: '/boutique',
      linkLabel: 'Voir les nouveautés'
    },
    {
      title: 'Livraison en Côte d\'Ivoire',
      description: 'Abidjan et intérieur du pays. Paiement à la livraison ou Mobile Money.',
      link: '/boutique',
      linkLabel: 'Commander'
    }
  ];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadFeaturedProducts();
    this.loadNewProducts();
    this.startAutoPlay();
  }

  loadCategories() {
    this.api.get<Category[]>('/categories').subscribe({
      next: cats => (this.categories = cats ?? []),
      error: () => (this.categories = []),
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  next() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
  }

  prev() {
    this.currentSlideIndex = this.currentSlideIndex === 0 ? this.slides.length - 1 : this.currentSlideIndex - 1;
  }

  goTo(index: number) {
    this.currentSlideIndex = index;
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => this.next(), this.AUTO_PLAY_MS);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetTimer() {
    this.startAutoPlay();
  }

  loadFeaturedProducts() {
    this.api.get<Product[]>('/products/featured').subscribe(products => {
      this.featuredProducts = products;
    });
  }

  loadNewProducts() {
    this.api.get<Product[]>('/products/new').subscribe(products => {
      this.newProducts = products;
    });
  }

  subscribeNewsletter() {
    if (this.newsletterEmail) {
      this.api.post('/newsletter/subscribe', { email: this.newsletterEmail }).subscribe({
        next: () => {
          this.toast.success('Inscription à la newsletter réussie !');
          this.newsletterEmail = '';
        },
        error: () => this.toast.error('Erreur lors de l\'inscription à la newsletter')
      });
    }
  }
}
