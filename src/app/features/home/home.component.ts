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

      <section class="featured-products page-section section-cosmetic-rose">
        <div class="container">
          <span class="section-label-cosmetic">Sélection</span>
          <h2 class="section-title-cosmetic">Produits en vedette</h2>
          <p class="section-subtitle-cosmetic">Les incontournables de notre boutique</p>
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
      </div>
    </div>

    <section class="new-products page-section section-cosmetic-cream">
      <div class="container">
        <span class="section-label-cosmetic">Nouveautés</span>
        <h2 class="section-title-cosmetic">Dernières arrivées</h2>
        <p class="section-subtitle-cosmetic">Découvrez nos nouveautés</p>
        <div class="products-grid">
          @for (product of newProducts; track product.id) {
            <app-product-card [product]="product"></app-product-card>
          }
        </div>
      </div>
    </section>

    <section class="newsletter page-section section-cosmetic-gold">
      <div class="container">
        <span class="section-label-cosmetic">Newsletter</span>
        <h2 class="section-title-cosmetic">Recevez nos offres exclusives</h2>
        <p class="section-subtitle-cosmetic">Inscrivez-vous pour ne rien manquer de nos actualités et promos</p>
        <form (ngSubmit)="subscribeNewsletter()" class="newsletter-form">
          <input type="email" [(ngModel)]="newsletterEmail" name="newsletterEmail" placeholder="Votre email" required />
          <button type="submit" class="btn btn-primary">S'inscrire</button>
        </form>
      </div>
    </section>
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
      border-right: 1px solid var(--border-color);
      position: sticky;
      top: var(--header-height);
      align-self: flex-start;
      max-height: calc(100vh - var(--header-height));
      overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #fff7f2 100%);
    }
    .sidebar-inner {
      position: relative;
      z-index: 1;
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
      text-transform: uppercase;
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
      background: #050816;
    }
    .slider-track {
      display: flex;
      width: 100%;
      transition: transform 0.5s ease-in-out;
    }
    .slide {
      flex: 0 0 100%;
      min-height: 380px;
      padding: 24px 0 52px;
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
      background-repeat: no-repeat;
    }
    .slide-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%);
    }
    .slide-content {
      position: relative;
      z-index: 1;
      color: white;
      padding: 32px 36px;
      margin: 0 72px;
      max-width: 640px;
      background: rgba(10, 10, 20, 0.32);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 18px;
    }
    .slide-content h1 {
      font-size: clamp(28px, 5vw, 42px);
      margin-bottom: 16px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.45);
    }
    .slide-content p {
      font-size: clamp(16px, 2.5vw, 20px);
      margin-bottom: 24px;
      text-shadow: 0 1px 8px rgba(0,0,0,0.5);
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
    .featured-products .section-label-cosmetic,
    .featured-products .section-title-cosmetic,
    .featured-products .section-subtitle-cosmetic,
    .new-products .section-label-cosmetic,
    .new-products .section-title-cosmetic,
    .new-products .section-subtitle-cosmetic {
      text-align: center;
      display: block;
    }
    .featured-products .section-subtitle-cosmetic,
    .new-products .section-subtitle-cosmetic { margin-bottom: 32px; }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 24px;
    }
    .newsletter {
      padding: 60px 20px;
      text-align: center;
    }
    .newsletter .section-label-cosmetic,
    .newsletter .section-title-cosmetic,
    .newsletter .section-subtitle-cosmetic {
      display: block;
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
        padding: 24px 20px;
        margin: 0 60px;
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
      .slide-content {
        padding: 18px 16px;
        margin: 0 52px;
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

  readonly defaultSlides: SlideItem[] = [
    {
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2400&q=85',
      title: 'Bienvenue sur Nera Cosmétique',
      description: 'Votre boutique beauté, soins et maquillage importés de France pour sublimer toutes les peaux.',
      link: '/boutique',
      linkLabel: 'Découvrir la boutique'
    },
    {
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=2400&q=85',
      title: 'Rituels de beauté premium',
      description: 'Des routines complètes pour le visage et le corps, sélectionnées avec exigence.',
      link: '/boutique',
      linkLabel: 'Voir nos rituels'
    },
    {
      image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=2400&q=85',
      title: 'Livraison rapide en Côte d’Ivoire',
      description: 'Abidjan et intérieur du pays, paiement en espèces à la livraison.',
      link: '/boutique',
      linkLabel: 'Commander maintenant'
    }
  ];

  slides: SlideItem[] = [...this.defaultSlides];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadFeaturedProducts();
    this.loadNewProducts();
    this.loadSlides();
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

  loadSlides() {
    this.api.get<any[]>('/slides').subscribe({
      next: (data) => {
        const raw = data ?? [];
        if (raw.length) {
          const custom = raw.map(s => ({
            image: s.imageUrl || s.image || '',
            title: s.title,
            description: s.description || '',
            link: s.link || '/boutique',
            linkLabel: s.linkLabel || 'Découvrir',
          }));
          const taken = new Set(custom.map(sl => `${sl.title}|${sl.image}`));
          const base = this.defaultSlides.filter(d => !taken.has(`${d.title}|${d.image}`));
          this.slides = [...base, ...custom];
        } else {
          this.slides = [...this.defaultSlides];
        }
        if (this.slides.length === 0) {
          this.slides = [...this.defaultSlides];
        }
        this.currentSlideIndex = 0;
        this.resetTimer();
      },
      error: () => {
        this.slides = [...this.defaultSlides];
      }
    });
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
