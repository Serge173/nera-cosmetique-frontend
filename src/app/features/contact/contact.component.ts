import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SiteService } from '../../core/services/site.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="contact">
      <!-- Hero -->
      <header class="contact-hero">
        <div class="contact-hero-bg" aria-hidden="true"></div>
        <div class="container">
          <p class="contact-hero-label">Échangez avec nous</p>
          <h1 class="contact-hero-title">Contactez-nous</h1>
          <p class="contact-hero-tagline">Une question, un avis ou une demande ? Notre équipe vous répond avec plaisir.</p>
        </div>
      </header>

      <div class="contact-body page-section section-cosmetic-mint">
        <div class="container">
          <div class="contact-grid">
            <!-- Formulaire -->
            <section class="contact-form-section" aria-labelledby="form-title">
              <div class="contact-form-card">
                <h2 id="form-title" class="contact-form-title">Envoyez-nous un message</h2>
                <p class="contact-form-intro">Remplissez le formulaire ci-dessous. Nous vous recontacterons dans les plus brefs délais.</p>
                <form (ngSubmit)="submitContact()" class="contact-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="contact-name">Nom complet *</label>
                      <input
                        id="contact-name"
                        type="text"
                        [(ngModel)]="formData.name"
                        name="name"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div class="form-group">
                      <label for="contact-email">Email *</label>
                      <input
                        id="contact-email"
                        type="email"
                        [(ngModel)]="formData.email"
                        name="email"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="contact-phone">Téléphone</label>
                      <input
                        id="contact-phone"
                        type="tel"
                        [(ngModel)]="formData.phone"
                        name="phone"
                        placeholder="+225 07 00 00 00 00"
                      />
                    </div>
                    <div class="form-group">
                      <label for="contact-subject">Sujet</label>
                      <input
                        id="contact-subject"
                        type="text"
                        [(ngModel)]="formData.subject"
                        name="subject"
                        placeholder="Ex. Commande, Produit, Livraison"
                      />
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="contact-message">Message *</label>
                    <textarea
                      id="contact-message"
                      [(ngModel)]="formData.message"
                      name="message"
                      rows="5"
                      placeholder="Décrivez votre demande ou votre message..."
                      required
                    ></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary btn-submit" [disabled]="submitting">
                    {{ submitting ? 'Envoi en cours...' : 'Envoyer le message' }}
                  </button>
                </form>
              </div>
            </section>

            <!-- Infos & Carte -->
            <aside class="contact-sidebar">
              @let s = site.settings();
              <div class="contact-info-card">
                <h3 class="contact-info-title">Coordonnées</h3>
                @if (s.responseTime) { <p class="contact-info-desc">{{ s.responseTime }}</p> }
                <ul class="contact-info-list">
                  @if (s.email) {
                    <li>
                      <span class="contact-info-icon" aria-hidden="true"><i class="fa-regular fa-envelope"></i></span>
                      <div>
                        <span class="contact-info-label">E-mail</span>
                        <a [href]="'mailto:' + s.email" class="contact-info-value">{{ s.email }}</a>
                      </div>
                    </li>
                  }
                  @if (site.whatsappUrl()) {
                    <li>
                      <span class="contact-info-icon" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
                      <div>
                        <span class="contact-info-label">WhatsApp</span>
                        <a [href]="site.whatsappUrl()" target="_blank" rel="noopener noreferrer" class="contact-info-value">{{ s.whatsapp }}</a>
                      </div>
                    </li>
                  }
                  @if (s.phone && s.phone !== s.whatsapp) {
                    <li>
                      <span class="contact-info-icon" aria-hidden="true"><i class="fa-solid fa-phone"></i></span>
                      <div>
                        <span class="contact-info-label">Téléphone</span>
                        <a [href]="site.phoneHref()" class="contact-info-value">{{ s.phone }}</a>
                      </div>
                    </li>
                  }
                  @if (site.fullAddress()) {
                    <li>
                      <span class="contact-info-icon" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></span>
                      <div>
                        <span class="contact-info-label">Adresse</span>
                        <span class="contact-info-text">{{ site.fullAddress() }}</span>
                      </div>
                    </li>
                  }
                  @if (s.openingHours) {
                    <li>
                      <span class="contact-info-icon" aria-hidden="true"><i class="fa-regular fa-clock"></i></span>
                      <div>
                        <span class="contact-info-label">Horaires</span>
                        <span class="contact-info-text pre">{{ s.openingHours }}</span>
                      </div>
                    </li>
                  }
                </ul>
              </div>
              @if (site.mapUrl(); as map) {
                <div class="contact-map-card">
                  <h3 class="contact-info-title">Localisation</h3>
                  <p class="contact-info-desc">Retrouvez-nous sur la carte.</p>
                  <div class="contact-map-frame">
                    <iframe [title]="'Localisation ' + s.storeName" [src]="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                  </div>
                </div>
              }
            </aside>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact {
      padding-bottom: 0;
    }

    .contact-hero {
      position: relative;
      padding: 56px 0 64px;
      overflow: hidden;
    }

    .contact-hero-bg {
      position: absolute;
      inset: 0;
      background: url('https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=2400&q=85');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
    }

    .contact-hero-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: linear-gradient(90deg, rgba(255, 250, 247, 0.95) 0%, rgba(255, 250, 247, 0.8) 45%, rgba(255, 250, 247, 0.12) 100%);
      z-index: 0;
    }

    .contact-hero-bg::after {
      content: '';
      position: absolute;
      bottom: -15%;
      left: -5%;
      width: 40%;
      max-width: 320px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 102, 0, 0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .contact-hero .container {
      position: relative;
      z-index: 1;
    }

    .contact-hero-label {
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--primary-color);
      margin-bottom: 10px;
    }

    .contact-hero-title {
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 700;
      color: var(--text-dark);
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .contact-hero-tagline {
      font-size: clamp(1rem, 2vw, 1.1875rem);
      color: var(--text-light);
      max-width: 480px;
      line-height: 1.5;
    }

    .contact-body {
      padding: 48px 0 72px;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 40px;
      align-items: start;
    }

    .contact-form-section {
      position: relative;
      z-index: 0;
    }

    .contact-form-section::before {
      content: '';
      position: absolute;
      inset: -16px;
      border-radius: 28px;
      background: url('https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1800&q=85');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
    }

    .contact-form-card {
      background: rgba(255, 255, 255, 0.84);
      border-radius: 20px;
      padding: 40px 40px 44px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
    }

    .contact-form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .contact-form-intro {
      font-size: 0.9375rem;
      color: var(--text-light);
      margin-bottom: 28px;
      line-height: 1.5;
    }

    .contact-form .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .contact-form .form-group {
      margin-bottom: 20px;
    }

    .contact-form .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .contact-form input,
    .contact-form textarea {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 1rem;
      font-family: inherit;
      color: var(--text-dark);
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .contact-form input::placeholder,
    .contact-form textarea::placeholder {
      color: #aaa;
    }

    .contact-form input:hover,
    .contact-form textarea:hover {
      border-color: #ddd;
    }

    .contact-form input:focus,
    .contact-form textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.12);
    }

    .contact-form textarea {
      resize: vertical;
      min-height: 120px;
    }

    .btn-submit {
      width: 100%;
      margin-top: 8px;
      padding: 14px 24px;
      font-size: 1rem;
      border-radius: 12px;
    }

    .contact-sidebar {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .contact-info-card {
      background: linear-gradient(160deg, var(--secondary-color) 0%, #fff 100%);
      border: 1px solid rgba(255, 102, 0, 0.12);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 4px 20px rgba(255, 102, 0, 0.06);
    }

    .contact-info-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 4px;
    }

    .contact-info-desc {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-bottom: 20px;
    }

    .contact-info-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .contact-info-list li {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 102, 0, 0.1);
    }

    .contact-info-list li:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .contact-info-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 102, 0, 0.12);
      color: var(--primary-color);
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contact-info-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    .contact-info-value {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--primary-color);
      word-break: break-all;
    }

    .contact-info-value:hover {
      text-decoration: underline;
    }

    .contact-info-text {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-dark);
    }

    .contact-info-text.pre {
      white-space: pre-line;
    }

    .contact-map-card {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px 20px 20px;
      box-shadow: var(--shadow);
    }

    .contact-map-frame {
      margin-top: 12px;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      aspect-ratio: 4 / 3;
      background: #f3f4f6;
    }

    .contact-map-frame iframe {
      border: 0;
      width: 100%;
      height: 100%;
    }

    @media (max-width: 900px) {
      .contact-grid {
        grid-template-columns: 1fr;
      }

      .contact-sidebar {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .contact-info-card,
      .contact-extra-card {
        flex: 1;
        min-width: 280px;
      }
    }

    @media (max-width: 600px) {
      .contact-hero {
        padding: 40px 0 48px;
      }

      .contact-body {
        padding: 32px 0 56px;
      }

      .contact-form-card {
        padding: 28px 20px 32px;
      }

      .contact-form .form-row {
        grid-template-columns: 1fr;
      }

      .contact-sidebar {
        flex-direction: column;
      }

      .contact-info-card,
      .contact-extra-card {
        min-width: 0;
      }
    }

    @media (max-width: 480px) {
      .contact-hero {
        padding: 32px 0 40px;
      }
      .contact-hero-title {
        font-size: 1.75rem;
      }
      .contact-form-card {
        padding: 24px 16px 28px;
      }
      .btn-submit {
        min-height: 48px;
      }
    }
  `],
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  submitting = false;

  readonly site = inject(SiteService);

  constructor(private api: ApiService, private toast: ToastService) {}

  submitContact() {
    if (this.submitting) return;
    const { name, email, message } = this.formData;
    if (!name.trim() || !email.trim() || !message.trim()) {
      this.toast.error('Merci de renseigner votre nom, votre e-mail et votre message.');
      return;
    }
    this.submitting = true;
    this.api.post('/contact', this.formData).subscribe({
      next: () => {
        this.toast.success('Message envoyé ! Nous vous répondrons rapidement.');
        this.formData = { name: '', email: '', phone: '', subject: '', message: '' };
        this.submitting = false;
      },
      error: (err) => {
        this.toast.error(err?.message || 'Le message n’a pas pu être envoyé. Réessayez.');
        this.submitting = false;
      }
    });
  }
}
