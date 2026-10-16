import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <button
            type="button"
            class="menu-toggle"
            (click)="toggleMenu()"
            [attr.aria-expanded]="menuOpen"
            aria-controls="mobile-drawer"
            [attr.aria-label]="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'">
            <i class="fa-solid" [class.fa-bars]="!menuOpen" [class.fa-xmark]="menuOpen"></i>
          </button>

          <a routerLink="/" class="logo" aria-label="NERA Cosmétique Accueil">
            <img src="assets/logo.png" alt="NERA Cosmétique" />
          </a>

          <div class="header-right">
            <form class="header-search" (submit)="onSearch($event)">
              <input
                type="search"
                [(ngModel)]="searchQuery"
                name="search"
                class="search-input"
                placeholder="Rechercher…"
                aria-label="Rechercher un produit par nom"
              />
              <button type="submit" class="search-btn" aria-label="Lancer la recherche">Rechercher</button>
            </form>
            <nav class="nav">
              <a routerLink="/boutique" routerLinkActive="active">Boutique</a>
              <a routerLink="/a-propos" routerLinkActive="active">À propos</a>
              <a routerLink="/contact" routerLinkActive="active">Contact</a>
              @if (!(authService.currentUser$ | async)) {
                <a routerLink="/compte/connexion" routerLinkActive="active">Connexion</a>
              }
            </nav>
            <div class="header-actions">
              <a routerLink="/panier" class="cart-link" aria-label="Panier">
                <i class="fa-solid fa-bag-shopping cart-icon" aria-hidden="true"></i>
                <span class="cart-text">Panier</span>
                @if (itemCount > 0) {
                  <span class="cart-badge">{{ itemCount }}</span>
                }
              </a>
              @if (authService.currentUser$ | async; as user) {
                <div class="profile-wrap">
                  <button
                    type="button"
                    class="profile-trigger"
                    (click)="toggleProfileMenu()"
                    [attr.aria-expanded]="profileMenuOpen"
                    aria-label="Menu profil"
                    aria-haspopup="true">
                    <i class="fa-solid fa-circle-user"></i>
                    <span class="profile-name">{{ user.email }}</span>
                  </button>
                  @if (profileMenuOpen) {
                    <div class="profile-dropdown" role="menu">
                      <div class="profile-dropdown-header">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ user.email }}</span>
                      </div>
                      <a routerLink="/compte" (click)="closeProfileMenu()" role="menuitem">
                        <i class="fa-solid fa-user-pen"></i> Mon compte
                      </a>
                      <a routerLink="/compte/commandes" (click)="closeProfileMenu()" role="menuitem">
                        <i class="fa-solid fa-box-open"></i> Mes commandes
                      </a>
                      @if (authService.isAdmin()) {
                        <a routerLink="/admin" (click)="closeProfileMenu()" role="menuitem">
                          <i class="fa-solid fa-gear"></i> Administration
                        </a>
                      }
                      <div class="profile-dropdown-divider"></div>
                      <button
                        type="button"
                        (click)="confirmLogout()"
                        role="menuitem"
                        class="profile-logout">
                        <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
                      </button>
                    </div>
                  }
                </div>
                @if (authService.isAdmin()) {
                  <a
                    routerLink="/admin"
                    class="console-btn"
                    aria-label="Accéder à la console d'administration">
                    Console
                  </a>
                }
              }
            </div>
          </div>
        </div>
      </div>

      @if (menuOpen) {
        <div class="drawer-backdrop" (click)="closeMenu()" aria-hidden="true"></div>
      }
      <aside
        id="mobile-drawer"
        class="mobile-drawer"
        [class.open]="menuOpen"
        [attr.aria-hidden]="!menuOpen"
        aria-label="Menu principal">
        <div class="drawer-header">
          <a routerLink="/" class="drawer-logo" (click)="closeMenu()" aria-label="NERA Cosmétique Accueil">
            <img src="assets/logo.png" alt="NERA Cosmétique" />
          </a>
          <button type="button" class="drawer-close" (click)="closeMenu()" aria-label="Fermer le menu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form class="drawer-search" (submit)="onSearch($event)">
          <input
            type="search"
            [(ngModel)]="searchQuery"
            name="drawerSearch"
            placeholder="Rechercher un produit…"
            aria-label="Rechercher un produit par nom"
          />
          <button type="submit" aria-label="Lancer la recherche"><i class="fa-solid fa-magnifying-glass"></i></button>
        </form>

        <nav class="drawer-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
            <i class="fa-solid fa-house"></i> Accueil
          </a>
          <a routerLink="/boutique" routerLinkActive="active" (click)="closeMenu()">
            <i class="fa-solid fa-store"></i> Boutique
          </a>
          <a routerLink="/a-propos" routerLinkActive="active" (click)="closeMenu()">
            <i class="fa-solid fa-circle-info"></i> À propos
          </a>
          <a routerLink="/contact" routerLinkActive="active" (click)="closeMenu()">
            <i class="fa-solid fa-envelope"></i> Contact
          </a>
          <a routerLink="/panier" routerLinkActive="active" (click)="closeMenu()">
            <i class="fa-solid fa-bag-shopping"></i> Panier
            @if (itemCount > 0) {
              <span class="drawer-badge">{{ itemCount }}</span>
            }
          </a>
          <div class="drawer-divider"></div>
          @if (authService.currentUser$ | async) {
            <a routerLink="/compte" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">
              <i class="fa-solid fa-user-pen"></i> Mon compte
            </a>
            <a routerLink="/compte/commandes" routerLinkActive="active" (click)="closeMenu()">
              <i class="fa-solid fa-box-open"></i> Mes commandes
            </a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" class="drawer-console" (click)="closeMenu()">
                <i class="fa-solid fa-gear"></i> Console
              </a>
            }
            <button type="button" class="drawer-logout" (click)="closeMenu(); confirmLogout()">
              <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
            </button>
          } @else {
            <a routerLink="/compte/connexion" routerLinkActive="active" (click)="closeMenu()">
              <i class="fa-solid fa-right-to-bracket"></i> Connexion
            </a>
          }
        </nav>
      </aside>
      @if (logoutConfirmVisible) {
        <div class="logout-toast" role="dialog" aria-modal="true" aria-label="Confirmation de déconnexion">
          <p class="logout-message">Voulez-vous vraiment vous déconnecter&nbsp;?</p>
          <div class="logout-actions">
            <button type="button" class="btn btn-primary" (click)="performLogout()">Oui, me déconnecter</button>
            <button type="button" class="btn btn-secondary" (click)="cancelLogout()">Annuler</button>
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .header {
      background: var(--white);
      box-shadow: var(--shadow);
      position: relative;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
      min-width: 0;
    }
    .logo {
      flex-shrink: 0;
    }
    .logo img {
      height: 44px;
      width: auto;
      display: block;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
      justify-content: flex-end;
    }
    .header-search {
      display: flex;
      align-items: center;
      gap: 6px;
      max-width: 280px;
      min-width: 0;
      flex-shrink: 1;
    }
    .search-input {
      flex: 1;
      min-width: 0;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.2);
    }
    .search-btn {
      padding: 8px 12px;
      background: var(--primary-color);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .search-btn:hover {
      filter: brightness(1.05);
    }
    .nav {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-shrink: 0;
    }
    .nav a,
    .nav .nav-btn {
      color: var(--text-dark);
      font-weight: 500;
      font-size: 0.9375rem;
      white-space: nowrap;
      text-decoration: none;
    }
    .nav .nav-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 0;
      font-family: inherit;
    }
    .nav .nav-btn:hover {
      color: var(--primary-color);
    }
    .nav a.active {
      color: var(--primary-color);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .cart-link,
    .orders-link {
      white-space: nowrap;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      color: var(--text-dark);
    }
    .cart-link {
      position: relative;
      background: var(--secondary-color);
    }
    .orders-link {
      border: 1px solid var(--border-color);
    }
    .orders-link:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .console-btn {
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid var(--primary-color);
      background: #fff;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }
    .console-btn:hover {
      background: var(--primary-color);
      color: #fff;
    }
    .cart-text {
      white-space: nowrap;
    }
    .cart-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
    }
    .profile-wrap {
      position: relative;
    }
    .profile-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: #fff;
      color: var(--text-dark);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      max-width: 200px;
    }
    .profile-trigger:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .profile-trigger i {
      font-size: 1.5rem;
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .profile-name {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 6px;
      min-width: 240px;
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      padding: 8px 0;
      z-index: 200;
    }
    .profile-dropdown-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      font-size: 0.875rem;
      color: var(--text-light);
      border-bottom: 1px solid var(--border-color);
    }
    .profile-dropdown-header i {
      color: var(--primary-color);
      font-size: 1rem;
    }
    .profile-dropdown a,
    .profile-dropdown .profile-logout {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      text-align: left;
      font-size: 0.9375rem;
      color: var(--text-dark);
      text-decoration: none;
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
    }
    .profile-dropdown a:hover,
    .profile-dropdown .profile-logout:hover {
      background: var(--secondary-color);
      color: var(--primary-color);
    }
    .profile-dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 6px 0;
    }
    .profile-logout {
      color: #c62828;
    }
    .profile-logout:hover {
      background: rgba(198, 40, 40, 0.08);
      color: #b71c1c;
    }
    .cart-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .cart-icon {
      font-size: 1.05rem;
      color: var(--primary-color);
    }
    .menu-toggle {
      display: none;
      font-size: 1.4rem;
      background: none;
      border: none;
      border-radius: 10px;
      color: var(--text-dark);
      cursor: pointer;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s, color 0.2s;
    }
    .menu-toggle:hover {
      background: var(--secondary-color);
      color: var(--primary-color);
    }

    .drawer-backdrop,
    .mobile-drawer {
      display: none;
    }

    @media (max-width: 992px) {
      .header-content {
        gap: 10px;
      }
      .menu-toggle {
        display: inline-flex;
      }
      .logo {
        margin-left: auto;
      }
      .header-right {
        flex: 0 0 auto;
        gap: 8px;
      }
      .header-search,
      .nav,
      .console-btn {
        display: none;
      }
      .cart-link {
        position: relative;
        width: 44px;
        height: 44px;
        padding: 0;
        justify-content: center;
        border-radius: 10px;
      }
      .cart-text {
        display: none;
      }
      .cart-icon {
        font-size: 1.2rem;
      }
      .profile-name {
        display: none;
      }
      .profile-trigger {
        width: 44px;
        height: 44px;
        padding: 0;
        justify-content: center;
        border-radius: 10px;
      }

      .drawer-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 15, 25, 0.45);
        z-index: 1001;
        animation: drawerFade 0.2s ease;
      }
      .mobile-drawer {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: min(320px, 86vw);
        background: #fff;
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.18);
        z-index: 1002;
        transform: translateX(-105%);
        transition: transform 0.28s ease;
        overflow-y: auto;
        visibility: hidden;
      }
      .mobile-drawer.open {
        transform: translateX(0);
        visibility: visible;
      }
      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
      }
      .drawer-logo img {
        height: 42px;
        width: auto;
        display: block;
      }
      .drawer-close {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: var(--secondary-color);
        color: var(--text-dark);
        font-size: 1.35rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, transform 0.2s;
      }
      .drawer-close:hover {
        background: var(--primary-color);
        color: #fff;
        transform: rotate(90deg);
      }
      .drawer-search {
        display: flex;
        gap: 8px;
        padding: 16px;
      }
      .drawer-search input {
        flex: 1;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        font-size: 0.9375rem;
      }
      .drawer-search input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.2);
      }
      .drawer-search button {
        width: 44px;
        border: none;
        border-radius: 10px;
        background: var(--primary-color);
        color: #fff;
        cursor: pointer;
      }
      .drawer-nav {
        display: flex;
        flex-direction: column;
        padding: 4px 12px 24px;
      }
      .drawer-nav a,
      .drawer-logout {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 13px 12px;
        border-radius: 10px;
        color: var(--text-dark);
        font-size: 1rem;
        font-weight: 500;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
        cursor: pointer;
      }
      .drawer-nav a i,
      .drawer-logout i {
        width: 20px;
        text-align: center;
        color: var(--primary-color);
      }
      .drawer-nav a:hover,
      .drawer-nav a.active {
        background: var(--secondary-color);
        color: var(--primary-color);
      }
      .drawer-console {
        font-weight: 700 !important;
        color: var(--primary-color) !important;
      }
      .drawer-logout,
      .drawer-logout i {
        color: #c62828;
      }
      .drawer-logout:hover {
        background: rgba(198, 40, 40, 0.08);
      }
      .drawer-badge {
        margin-left: auto;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 11px;
        background: var(--primary-color);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .drawer-divider {
        height: 1px;
        background: var(--border-color);
        margin: 8px 12px;
      }
    }
    @keyframes drawerFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 480px) {
      .header-content {
        padding: 10px 0;
      }
      .logo img {
        height: 38px;
      }
    }
    .logout-toast {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      pointer-events: none;
    }
    .logout-toast::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.25);
      backdrop-filter: blur(2px);
    }
    .logout-toast > div,
    .logout-toast-content {
      position: relative;
      max-width: 360px;
      width: 90%;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.18);
      padding: 16px 18px 14px;
      border: 1px solid rgba(0,0,0,0.06);
      pointer-events: auto;
    }
    .logout-message {
      margin: 0 0 10px;
      font-size: 0.9375rem;
      color: var(--text-dark);
    }
    .logout-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .logout-actions .btn {
      padding: 8px 14px;
      min-height: 0;
      font-size: 0.85rem;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  profileMenuOpen = false;
  itemCount = 0;
  searchQuery = '';
  private querySub?: Subscription;
  private navSub?: Subscription;
  private clickOutsideListener?: (e: Event) => void;
  logoutConfirmVisible = false;

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.cartService.getCart().subscribe(cart => {
      this.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    });
  }

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(q => {
      this.searchQuery = (q['q'] ?? '').trim();
    });
    this.navSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.menuOpen) this.closeMenu();
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
    this.navSub?.unsubscribe();
    document.body.style.overflow = '';
    this.removeClickOutsideListener();
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
    if (this.profileMenuOpen) {
      setTimeout(() => this.addClickOutsideListener(), 0);
    } else {
      this.removeClickOutsideListener();
    }
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
    this.removeClickOutsideListener();
    if (this.menuOpen) this.setMenuOpen(false);
  }

  private addClickOutsideListener(): void {
    this.removeClickOutsideListener();
    this.clickOutsideListener = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.profile-wrap')) return;
      this.profileMenuOpen = false;
      this.removeClickOutsideListener();
    };
    setTimeout(() => document.addEventListener('click', this.clickOutsideListener!), 0);
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener);
      this.clickOutsideListener = undefined;
    }
  }

  confirmLogout(): void {
    this.logoutConfirmVisible = true;
    this.closeProfileMenu();
  }

  cancelLogout(): void {
    this.logoutConfirmVisible = false;
  }

  performLogout(): void {
    this.logoutConfirmVisible = false;
    this.closeProfileMenu();
    this.authService.logout();
    this.toast.info('Vous avez été déconnecté.');
    this.router.navigate(['/']);
  }

  onSearch(e: Event): void {
    e.preventDefault();
    const q = this.searchQuery.trim();
    if (q) {
      this.router.navigate(['/boutique'], { queryParams: { q } });
    } else {
      this.router.navigate(['/boutique']);
    }
  }

  toggleMenu(): void {
    this.setMenuOpen(!this.menuOpen);
  }

  closeMenu(): void {
    this.setMenuOpen(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen) this.closeMenu();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.menuOpen && window.innerWidth > 992) this.closeMenu();
  }

  private setMenuOpen(open: boolean): void {
    this.menuOpen = open;
    if (open) this.profileMenuOpen = false;
    document.body.style.overflow = open ? 'hidden' : '';
  }
}
