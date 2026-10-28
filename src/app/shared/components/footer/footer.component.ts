import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SiteService } from '../../../core/services/site.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          @let s = site.settings();
          <div class="footer-section footer-about">
            <h3>{{ s.storeName }}</h3>
            @if (s.tagline) { <p>{{ s.tagline }}</p> }
            <ul class="footer-contact">
              @if (s.email) { <li><i class="fa-regular fa-envelope" aria-hidden="true"></i><a [href]="'mailto:' + s.email">{{ s.email }}</a></li> }
              @if (s.phone) { <li><i class="fa-solid fa-phone" aria-hidden="true"></i><a [href]="site.phoneHref()">{{ s.phone }}</a></li> }
              @if (site.fullAddress()) { <li><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>{{ site.fullAddress() }}</span></li> }
            </ul>
          </div>
          <div class="footer-section">
            <h4>Navigation</h4>
            <a routerLink="/boutique">Boutique</a>
            <a routerLink="/a-propos">À propos</a>
            <a routerLink="/contact">Contact</a>
          </div>
          <div class="footer-section">
            <h4>Informations</h4>
            <a routerLink="/cgv">CGV</a>
            <a routerLink="/politique-confidentialite">Confidentialité</a>
            <a routerLink="/retours">Retours</a>
            <a routerLink="/mentions-legales">Mentions légales</a>
          </div>
          @if (site.mapUrl(); as map) {
            <div class="footer-section footer-map">
              <h4>Localisation</h4>
              <div class="footer-map-frame">
                <iframe [title]="'Localisation ' + s.storeName" [src]="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          }
          @if (site.socials().length || site.whatsappUrl()) {
            <div class="footer-section footer-social">
              <h4>Réseaux sociaux</h4>
              <div class="social-links">
                @for (n of site.socials(); track n.key) {
                  <a [href]="n.url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="n.label"><i [class]="n.icon"></i><span>{{ n.label }}</span></a>
                }
                @if (site.whatsappUrl()) {
                  <a [href]="site.whatsappUrl()" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="whatsapp-link"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></a>
                }
              </div>
            </div>
          }
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} {{ s.storeName }}. Tous droits réservés.</p>
          <p class="footer-credit">by kdigit (<a href="tel:+2250708967624">+225 0708967624</a>)</p>
        </div>
      </div>
      @if (site.whatsappUrl()) {
        <a [href]="site.whatsappUrl()" target="_blank" rel="noopener noreferrer" class="whatsapp-float" aria-label="Nous écrire sur WhatsApp">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      }
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--text-dark);
      color: white;
      padding: 40px 0 20px;
      margin-top: 60px;
    }
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
      margin-bottom: 32px;
    }
    .footer-section h3, .footer-section h4 {
      margin-bottom: 16px;
      color: var(--primary-color);
    }
    .footer-section a {
      display: block;
      color: #ccc;
      margin-bottom: 8px;
    }
    .footer-section a:hover {
      color: white;
    }
    .footer-about p { color: #ccc; margin-bottom: 14px; }
    .footer-contact { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .footer-contact li { display: flex; gap: 10px; align-items: baseline; color: #ccc; font-size: .92rem; word-break: break-word; }
    .footer-contact i { color: var(--primary-color); width: 1em; text-align: center; flex-shrink: 0; }
    .footer-contact a { display: inline; margin: 0; }
    .footer-social .social-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
    }
    .footer-social .social-links a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
      padding: 6px 0;
      white-space: nowrap;
    }
    .footer-social .social-links a i {
      font-size: 1.25rem;
      width: 1.25em;
      text-align: center;
    }
    .whatsapp-link {
      color: #25D366;
    }
    .whatsapp-link:hover {
      color: #2eff7a;
    }
    .footer-map-frame {
      border-radius: 12px;
      overflow: hidden;
      background: #222;
      aspect-ratio: 4 / 3;
    }
    .footer-map-frame iframe {
      border: 0;
      width: 100%;
      height: 100%;
    }
    .footer-bottom {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 8px 16px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #444;
      color: #ccc;
    }
    .footer-bottom > p {
      margin: 0;
      grid-column: 2;
    }
    .footer-bottom > .footer-credit {
      grid-column: 3;
      justify-self: end;
      text-align: right;
      font-size: 12px;
      color: #9a9a9a;
      white-space: nowrap;
    }
    .footer-credit a {
      color: inherit;
      text-decoration: none;
    }
    .footer-credit a:hover {
      color: var(--primary-color, #f97316);
    }
    @media (max-width: 1360px) {
      .footer-bottom > .footer-credit {
        margin-right: 72px;
      }
    }
    @media (max-width: 900px) {
      .footer-bottom {
        grid-template-columns: 1fr;
      }
      .footer-bottom > p,
      .footer-bottom > .footer-credit {
        grid-column: 1;
      }
      .footer-bottom > .footer-credit {
        margin-right: 0;
        padding-bottom: 64px;
      }
    }
    .whatsapp-float {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      min-width: 48px;
      min-height: 48px;
      background: #25D366;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    .whatsapp-float i {
      font-size: 1.75rem;
    }
    @media (max-width: 768px) {
      .footer {
        padding: 32px 0 24px;
        margin-top: 40px;
      }
      .footer-content {
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 24px;
      }
      .footer-section h3, .footer-section h4 {
        font-size: 1rem;
        margin-bottom: 12px;
      }
      .footer-section a, .footer-section p {
        font-size: 0.9375rem;
      }
    }
    @media (max-width: 480px) {
      .footer {
        padding: 24px 0 20px;
      }
      .whatsapp-float {
        bottom: 16px;
        right: 16px;
        width: 52px;
        height: 52px;
      }
    }
  `]
})
export class FooterComponent {
  readonly site = inject(SiteService);
  currentYear = new Date().getFullYear();
}
