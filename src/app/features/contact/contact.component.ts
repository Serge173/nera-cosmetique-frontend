import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
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

      <div class="contact-body">
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

            <!-- Infos & CTA -->
            <aside class="contact-sidebar">
              <div class="contact-info-card">
                <h3 class="contact-info-title">Coordonnées</h3>
                <p class="contact-info-desc">Réponse sous 24 à 48 h ouvrées.</p>
                <ul class="contact-info-list">
                  <li>
                    <span class="contact-info-icon" aria-hidden="true">✉</span>
                    <div>
                      <span class="contact-info-label">Email</span>
                      <a href="mailto:contact&#64;neracosmetique.ci" class="contact-info-value">contact&#64;neracosmetique.ci</a>
                    </div>
                  </li>
                  <li>
                    <span class="contact-info-icon" aria-hidden="true">📱</span>
                    <div>
                      <span class="contact-info-label">WhatsApp</span>
                      <a href="https://wa.me/2250700000000" target="_blank" rel="noopener noreferrer" class="contact-info-value">+225 07 00 00 00 00</a>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="contact-extra-card">
                <div class="contact-extra-icon" aria-hidden="true">✦</div>
                <p class="contact-extra-text">Vous préférez passer commande directement ? Découvrez notre boutique en ligne.</p>
                <a routerLink="/boutique" class="btn btn-outline btn-block">Voir la boutique</a>
              </div>
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
      background: linear-gradient(155deg, var(--secondary-color) 0%, #fff 50%, rgba(255, 245, 240, 0.5) 100%);
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

    .contact-form-card {
      background: #fff;
      border-radius: 20px;
      padding: 40px 40px 44px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
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

    .contact-extra-card {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 28px 24px;
      text-align: center;
      box-shadow: var(--shadow);
    }

    .contact-extra-icon {
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 12px;
      opacity: 0.9;
    }

    .contact-extra-text {
      font-size: 0.9375rem;
      color: var(--text-light);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .btn-block {
      width: 100%;
      text-align: center;
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

  constructor(private api: ApiService, private toast: ToastService) {}

  submitContact() {
    this.submitting = true;
    this.api.post('/contact', this.formData).subscribe({
      next: () => {
        this.toast.success('Message envoyé avec succès !');
        this.formData = { name: '', email: '', phone: '', subject: '', message: '' };
        this.submitting = false;
      },
      error: () => {
        this.toast.error('Erreur lors de l\'envoi');
        this.submitting = false;
      }
    });
  }
}
