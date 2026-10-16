import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { AboutContent, SiteService } from '../../core/services/site.service';
import { TextBlocksComponent } from '../../shared/components/text-blocks/text-blocks.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterModule, TextBlocksComponent],
  template: `
    @if (content(); as c) {
    <div class="about">
      <header class="about-hero">
        <div class="about-hero-bg" aria-hidden="true"></div>
        <div class="container">
          @if (c.heroLabel) { <p class="about-hero-label">{{ fill(c.heroLabel) }}</p> }
          <h1 class="about-hero-title">{{ fill(c.heroTitle) }}</h1>
          @if (c.heroTagline) { <p class="about-hero-tagline">{{ fill(c.heroTagline) }}</p> }
        </div>
      </header>

      @if (c.storyTitle || c.storyLead || c.storyBody || c.imageUrl) {
        <section class="about-section about-section--light">
          <div class="container">
            <div class="about-section-inner" [class.no-image]="!c.imageUrl">
              <div class="about-section-content">
                @if (c.storyLabel) { <span class="about-section-label">{{ fill(c.storyLabel) }}</span> }
                @if (c.storyTitle) { <h2 class="about-section-title">{{ fill(c.storyTitle) }}</h2> }
                @if (c.storyLead) { <p class="about-section-lead">{{ fill(c.storyLead) }}</p> }
                @if (c.storyBody) { <app-text-blocks class="about-story-body" [text]="fill(c.storyBody)" /> }
              </div>
              @if (c.imageUrl) {
                <div class="about-section-visual">
                  <div class="about-image-wrap">
                    <img [src]="c.imageUrl" [alt]="'Sélection de produits ' + site.settings().storeName" width="600" height="400" loading="lazy" />
                    @if (c.imageBadge) { <span class="about-image-badge">{{ c.imageBadge }}</span> }
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      }

      @if (c.missionText || c.visionText) {
        <section class="about-section about-section--accent">
          <div class="container">
            <div class="about-mission-grid" [class.single]="!c.missionText || !c.visionText">
              @if (c.missionText) {
                <article class="about-mission-card">
                  <div class="about-mission-icon" aria-hidden="true">◆</div>
                  <h3>{{ fill(c.missionTitle) }}</h3>
                  <p>{{ fill(c.missionText) }}</p>
                </article>
              }
              @if (c.visionText) {
                <article class="about-mission-card">
                  <div class="about-mission-icon" aria-hidden="true">◇</div>
                  <h3>{{ fill(c.visionTitle) }}</h3>
                  <p>{{ fill(c.visionText) }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }

      @if (c.commitments.length) {
        <section class="about-section about-section--light">
          <div class="container">
            @if (c.commitmentsLabel) { <span class="about-section-label about-section-label--center">{{ fill(c.commitmentsLabel) }}</span> }
            @if (c.commitmentsTitle) { <h2 class="about-section-title about-section-title--center">{{ fill(c.commitmentsTitle) }}</h2> }
            <div class="about-commitments">
              @for (item of c.commitments; track $index) {
                <div class="about-commitment">
                  <span class="about-commitment-icon" aria-hidden="true">✓</span>
                  <div>
                    <h4>{{ fill(item.title) }}</h4>
                    <p>{{ fill(item.text) }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <section class="about-cta">
        <div class="container">
          <div class="about-cta-inner">
            @if (c.ctaTitle) { <h2 class="about-cta-title">{{ fill(c.ctaTitle) }}</h2> }
            @if (c.ctaText) { <p class="about-cta-text">{{ fill(c.ctaText) }}</p> }
            <div class="about-cta-actions">
              <a routerLink="/boutique" class="btn btn-primary">Voir la boutique</a>
              <a routerLink="/contact" class="btn btn-outline">Nous contacter</a>
            </div>
          </div>
        </div>
      </section>
    </div>
    } @else if (error()) {
      <div class="about-state">
        <p>Impossible de charger cette page pour le moment.</p>
        <button type="button" class="btn btn-primary" (click)="load()">Réessayer</button>
      </div>
    } @else {
      <div class="about-state"><span class="about-spinner" aria-label="Chargement"></span></div>
    }
  `,
  styles: [`
    .about {
      padding-bottom: 0;
    }

    .about-hero {
      position: relative;
      padding: 64px 0 80px;
      overflow: hidden;
    }

    .about-hero-bg {
      position: absolute;
      inset: 0;
      background: url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=2400&q=85');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
    }

    .about-hero-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(255, 250, 247, 0.95) 0%, rgba(255, 250, 247, 0.8) 45%, rgba(255, 250, 247, 0.12) 100%);
      pointer-events: none;
    }

    .about-hero .container {
      position: relative;
      z-index: 1;
    }

    .about-hero-label {
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primary-color);
      margin-bottom: 12px;
    }

    .about-hero-title {
      font-size: clamp(2.25rem, 5vw, 3.5rem);
      font-weight: 700;
      color: var(--text-dark);
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 16px;
    }

    .about-hero-tagline {
      font-size: clamp(1.0625rem, 2vw, 1.25rem);
      color: var(--text-light);
      max-width: 520px;
      line-height: 1.5;
    }

    .about-section {
      padding: 64px 0;
    }

    .about-section--light {
      background: linear-gradient(180deg, var(--cosmetic-pearl) 0%, #fff 100%);
    }

    .about-section--accent {
      background: linear-gradient(180deg, var(--cosmetic-rose) 0%, var(--cosmetic-cream) 50%, #fff 100%);
    }

    .about-section-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }

    .about-section-content {
      max-width: 560px;
    }

    .about-section-label {
      display: inline-block;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary-color);
      margin-bottom: 12px;
    }

    .about-section-title {
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 700;
      color: var(--text-dark);
      letter-spacing: -0.02em;
      margin-bottom: 20px;
      line-height: 1.25;
    }

    .about-section-title--center {
      text-align: center;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }

    .about-section-lead {
      font-size: 1.125rem;
      color: var(--text-dark);
      line-height: 1.6;
      margin-bottom: 20px;
      font-weight: 500;
    }

    .about-section-content p {
      font-size: 1rem;
      color: var(--text-light);
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .about-section-content p:last-child {
      margin-bottom: 0;
    }

    .about-story-body {
      font-size: 1rem;
      color: var(--text-light);
      line-height: 1.7;
    }

    .about-section-inner.no-image {
      grid-template-columns: 1fr;
    }

    .about-section-inner.no-image .about-section-content {
      max-width: 760px;
    }

    .about-section-label--center {
      display: block;
      text-align: center;
    }

    .about-mission-grid.single {
      grid-template-columns: 1fr;
      max-width: 560px;
    }

    .about-state {
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: var(--text-light);
    }

    .about-spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid rgba(255, 102, 0, 0.2);
      border-top-color: var(--primary-color);
      animation: about-spin .8s linear infinite;
    }

    @keyframes about-spin { to { transform: rotate(360deg); } }

    .about-section-visual {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .about-image-wrap {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 102, 0, 0.12);
      box-shadow: 0 24px 56px rgba(0, 0, 0, 0.1), 0 12px 24px rgba(255, 102, 0, 0.06);
      max-width: 520px;
      aspect-ratio: 4 / 3;
    }

    .about-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }

    .about-image-wrap:hover img {
      transform: scale(1.03);
    }

    .about-image-badge {
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--primary-color);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      z-index: 2;
    }

    .about-mission-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
      max-width: 900px;
      margin: 0 auto;
    }

    .about-mission-card {
      background: #fff;
      padding: 36px 32px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow);
      text-align: center;
    }

    .about-mission-icon {
      font-size: 1.75rem;
      color: var(--primary-color);
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .about-mission-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 12px;
    }

    .about-mission-card p {
      font-size: 0.9375rem;
      color: var(--text-light);
      line-height: 1.65;
      margin: 0;
    }

    .about-commitments {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px 48px;
      max-width: 900px;
      margin: 32px auto 0;
    }

    .about-commitment {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .about-commitment-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--secondary-color);
      color: var(--primary-color);
      font-size: 1.125rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .about-commitment h4 {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 6px;
    }

    .about-commitment p {
      font-size: 0.9375rem;
      color: var(--text-light);
      line-height: 1.6;
      margin: 0;
    }

    .about-cta {
      padding: 72px 0;
      background: linear-gradient(180deg, #fff 0%, var(--secondary-color) 100%);
    }

    .about-cta-inner {
      text-align: center;
      max-width: 520px;
      margin: 0 auto;
    }

    .about-cta-title {
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 12px;
    }

    .about-cta-text {
      font-size: 1rem;
      color: var(--text-light);
      margin-bottom: 28px;
    }

    .about-cta-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }

    .about-cta-actions .btn {
      min-width: 160px;
    }

    @media (max-width: 768px) {
      .about-hero {
        padding: 48px 0 56px;
      }

      .about-section-inner {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .about-section-content {
        max-width: none;
      }

      .about-section-visual {
        order: -1;
      }

      .about-image-wrap {
        max-width: 100%;
        aspect-ratio: 16 / 11;
      }

      .about-image-badge {
        bottom: 14px;
        right: 14px;
        padding: 8px 14px;
        font-size: 0.75rem;
      }

      .about-section {
        padding: 48px 0;
      }

      .about-mission-grid {
        grid-template-columns: 1fr;
      }

      .about-commitments {
        grid-template-columns: 1fr;
        gap: 28px;
      }

      .about-cta {
        padding: 56px 0;
      }

      .about-cta-actions {
        flex-direction: column;
      }

      .about-cta-actions .btn {
        width: 100%;
        min-width: 0;
        min-height: 48px;
      }
    }

    @media (max-width: 480px) {
      .about-hero {
        padding: 32px 0 40px;
      }
      .about-hero-title {
        font-size: 1.75rem;
      }
      .about-section {
        padding: 32px 0;
      }
    }
  `],
})
export class AboutComponent implements OnInit {
  readonly site = inject(SiteService);
  private destroyRef = inject(DestroyRef);

  readonly content = signal<AboutContent | null>(null);
  readonly error = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set(false);
    this.site.page<AboutContent>('a-propos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => this.content.set(page.content),
      error: () => this.error.set(true),
    });
  }

  fill(text: string): string {
    return this.site.fill(text);
  }
}
