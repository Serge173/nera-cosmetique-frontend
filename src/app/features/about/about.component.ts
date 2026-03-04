import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="about">
      <!-- Hero -->
      <header class="about-hero">
        <div class="about-hero-bg" aria-hidden="true"></div>
        <div class="container">
          <p class="about-hero-label">Notre histoire</p>
          <h1 class="about-hero-title">Nera Cosmétique</h1>
          <p class="about-hero-tagline">La beauté authentique, importée de France pour la Côte d'Ivoire.</p>
        </div>
      </header>

      <!-- Notre histoire -->
      <section class="about-section about-section--light">
        <div class="container">
          <div class="about-section-inner">
            <div class="about-section-content">
              <span class="about-section-label">Qui sommes-nous</span>
              <h2 class="about-section-title">Une passion devenue projet</h2>
              <p class="about-section-lead">
                Nera Cosmétique est née de l'envie d'offrir aux femmes ivoiriennes un accès simple et fiable aux meilleurs soins et cosmétiques français.
              </p>
              <p>
                Convaincus que la qualité ne doit pas être un luxe réservé à quelques-uns, nous sélectionnons avec soin des marques reconnues et des produits authentiques, importés directement de France. Chaque article que nous proposons répond à des critères stricts : formulation sûre, efficacité prouvée et traçabilité garantie.
              </p>
              <p>
                Aujourd'hui, Nera Cosmétique s'impose comme un partenaire de confiance pour prendre soin de sa peau et de son bien-être au quotidien, partout en Côte d'Ivoire.
              </p>
            </div>
            <div class="about-section-visual" aria-hidden="true">
              <div class="about-visual-card">
                <span class="about-visual-icon">✦</span>
                <span class="about-visual-text">Import France</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Mission & Vision -->
      <section class="about-section about-section--accent">
        <div class="container">
          <div class="about-mission-grid">
            <article class="about-mission-card">
              <div class="about-mission-icon" aria-hidden="true">◆</div>
              <h3>Notre mission</h3>
              <p>Proposer une gamme de cosmétiques et soins d'origine française, authentiques et accessibles, pour que chaque cliente puisse prendre soin d'elle en toute confiance.</p>
            </article>
            <article class="about-mission-card">
              <div class="about-mission-icon" aria-hidden="true">◇</div>
              <h3>Notre vision</h3>
              <p>Devenir la référence du cosmétique français en Côte d'Ivoire, en alliant qualité des produits, transparence et un service client à l'écoute de vos besoins.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Nos engagements -->
      <section class="about-section about-section--light">
        <div class="container">
          <span class="about-section-label">Ce qui nous engage</span>
          <h2 class="about-section-title about-section-title--center">Nos engagements</h2>
          <div class="about-commitments">
            <div class="about-commitment">
              <span class="about-commitment-icon" aria-hidden="true">✓</span>
              <div>
                <h4>Produits 100% importés de France</h4>
                <p>Chaque produit est sourcé auprès de fournisseurs et marques français reconnus. Aucune contrefaçon, aucune provenance floue.</p>
              </div>
            </div>
            <div class="about-commitment">
              <span class="about-commitment-icon" aria-hidden="true">✓</span>
              <div>
                <h4>Qualité et traçabilité</h4>
                <p>Formulations contrôlées, ingrédients identifiés. Nous privilégions les marques qui partagent nos exigences en matière de sécurité et d'efficacité.</p>
              </div>
            </div>
            <div class="about-commitment">
              <span class="about-commitment-icon" aria-hidden="true">✓</span>
              <div>
                <h4>Service client réactif</h4>
                <p>Une équipe disponible pour répondre à vos questions sur les produits, les commandes et la livraison. Votre satisfaction guide nos priorités.</p>
              </div>
            </div>
            <div class="about-commitment">
              <span class="about-commitment-icon" aria-hidden="true">✓</span>
              <div>
                <h4>Livraison en Côte d'Ivoire</h4>
                <p>Livraison rapide et soignée à Abidjan et à l'intérieur du pays. Colis protégés pour que vos produits arrivent dans les meilleures conditions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="about-cta">
        <div class="container">
          <div class="about-cta-inner">
            <h2 class="about-cta-title">Prête à découvrir notre sélection ?</h2>
            <p class="about-cta-text">Parcourez notre boutique ou contactez-nous pour toute question.</p>
            <div class="about-cta-actions">
              <a routerLink="/boutique" class="btn btn-primary">Voir la boutique</a>
              <a routerLink="/contact" class="btn btn-outline">Nous contacter</a>
            </div>
          </div>
        </div>
      </section>
    </div>
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
      background: linear-gradient(160deg, var(--secondary-color) 0%, #fff 45%, rgba(255, 245, 240, 0.6) 100%);
      z-index: 0;
    }

    .about-hero-bg::before {
      content: '';
      position: absolute;
      top: -20%;
      right: -10%;
      width: 50%;
      max-width: 400px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 102, 0, 0.08) 0%, transparent 70%);
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
      background: #fff;
    }

    .about-section--accent {
      background: linear-gradient(180deg, var(--secondary-color) 0%, #fff 100%);
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

    .about-section-visual {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .about-visual-card {
      width: 200px;
      height: 200px;
      border-radius: 24px;
      background: linear-gradient(145deg, var(--secondary-color) 0%, #fff 100%);
      border: 1px solid rgba(255, 102, 0, 0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 12px 40px rgba(255, 102, 0, 0.08);
    }

    .about-visual-icon {
      font-size: 2.5rem;
      color: var(--primary-color);
      opacity: 0.9;
    }

    .about-visual-text {
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--primary-color);
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

      .about-visual-card {
        width: 160px;
        height: 160px;
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
export class AboutComponent {}
