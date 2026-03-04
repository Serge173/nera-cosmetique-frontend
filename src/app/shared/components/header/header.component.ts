import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
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
            <nav class="nav" [class.menu-open]="menuOpen">
              <a routerLink="/boutique" routerLinkActive="active">Boutique</a>
              <a routerLink="/a-propos" routerLinkActive="active">À propos</a>
              <a routerLink="/contact" routerLinkActive="active">Contact</a>
              @if (!(authService.currentUser$ | async)) {
                <a routerLink="/compte/connexion" routerLinkActive="active">Connexion</a>
              }
            </nav>
            <div class="header-actions">
              <a routerLink="/panier" class="cart-link">
                <span class="cart-text">Panier</span>
                @if (itemCount > 0) {
                  <span class="cart-badge">{{ itemCount }}</span>
                }
              </a>
              @if (authService.currentUser$ | async; as user) {
                <div class="profile-wrap">
                  <button type="button" class="profile-trigger" (click)="toggleProfileMenu()" [attr.aria-expanded]="profileMenuOpen" aria-label="Menu profil" aria-haspopup="true">
                    <i class="fa-solid fa-circle-user"></i>
                    <span class="profile-name">{{ user.email }}</span>
                  </button>
                  @if (profileMenuOpen) {
                    <div class="profile-dropdown" role="menu">
                      <div class="profile-dropdown-header">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ user.email }}</span>
                      </div>
                      <a routerLink="/compte" (click)="closeProfileMenu()" role="menuitem"><i class="fa-solid fa-user-pen"></i> Mon compte</a>
                      <a routerLink="/compte/commandes" (click)="closeProfileMenu()" role="menuitem"><i class="fa-solid fa-box-open"></i> Mes commandes</a>
                      @if (authService.isAdmin()) {
                        <a routerLink="/admin" (click)="closeProfileMenu()" role="menuitem"><i class="fa-solid fa-gear"></i> Administration</a>
                      }
                      <div class="profile-dropdown-divider"></div>
                      <button type="button" (click)="confirmLogout()" role="menuitem" class="profile-logout"><i class="fa-solid fa-right-from-bracket"></i> Déconnexion</button>
                    </div>
                  }
                </div>
              }
              <button type="button" class="menu-toggle" (click)="toggleMenu()" aria-label="Menu">☰</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: var(--white);
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 100;
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
    .menu-toggle {
      display: none;
      font-size: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      line-height: 1;
      min-width: 44px;
      min-height: 44px;
      align-items: center;
      justify-content: center;
    }
    @media (max-width: 992px) {
      .header-search {
        max-width: 200px;
      }
    }
    @media (max-width: 768px) {
      .header-content {
        flex-wrap: wrap;
      }
      .header-right {
        order: 2;
        flex: 1 1 auto;
        justify-content: flex-end;
        gap: 8px;
      }
      .header-search {
        display: none;
      }
      .nav {
        position: fixed;
        top: 70px;
        left: -100%;
        width: 100%;
        max-width: 280px;
        background: white;
        flex-direction: column;
        align-items: stretch;
        padding: 20px;
        box-shadow: var(--shadow);
        transition: left 0.3s;
        z-index: 101;
      }
      .nav.menu-open {
        left: 0;
      }
      .nav a,
      .nav .nav-btn {
        padding: 10px 0;
      }
      .menu-toggle {
        display: block;
      }
      .profile-name {
        display: none;
      }
      .profile-trigger {
        max-width: none;
        padding: 8px 10px;
        min-height: 44px;
      }
      .cart-link {
        min-height: 44px;
        padding: 8px 12px;
        display: inline-flex;
        align-items: center;
      }
    }
    @media (max-width: 480px) {
      .header-content {
        padding: 10px 0;
      }
      .logo img {
        height: 38px;
      }
      .nav {
        max-width: 100%;
        padding: 16px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  profileMenuOpen = false;
  itemCount = 0;
  searchQuery = '';
  private querySub?: Subscription;
  private clickOutsideListener?: (e: Event) => void;

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.cartService.getCart().subscribe(cart => {
      this.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    });
  }

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(q => {
      this.searchQuery = (q['q'] ?? '').trim();
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
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
    this.menuOpen = false;
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
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      this.closeProfileMenu();
      this.authService.logout();
    }
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
    this.menuOpen = !this.menuOpen;
  }
}
