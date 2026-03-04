import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>Nera Cosmétique</h3>
            <p>Produits cosmétiques importés de France</p>
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
          <div class="footer-section">
            <h4>Contact</h4>
            <p>contact&#64;neracosmetique.ci</p>
          </div>
          <div class="footer-section footer-social">
            <h4>Réseaux sociaux</h4>
            <div class="social-links">
              <a href="https://www.tiktok.com/@neracosmetique" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i><span>TikTok</span></a>
              <a href="https://www.facebook.com/neracosmetique" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i><span>Facebook</span></a>
              <a href="https://www.instagram.com/neracosmetique" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i><span>Instagram</span></a>
              <a href="https://twitter.com/neracosmetique" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><i class="fa-brands fa-x-twitter"></i><span>Twitter</span></a>
              <a href="https://www.snapchat.com/add/neracosmetique" target="_blank" rel="noopener noreferrer" aria-label="Snapchat"><i class="fa-brands fa-snapchat"></i><span>Snapchat</span></a>
              <a href="https://wa.me/2250700000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="whatsapp-link"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} Nera Cosmétique. Tous droits réservés.</p>
        </div>
      </div>
      <a href="https://wa.me/2250700000000" target="_blank" rel="noopener noreferrer" class="whatsapp-float" aria-label="WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
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
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #444;
      color: #ccc;
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
  currentYear = new Date().getFullYear();
}
