import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <aside class="admin-sidebar" aria-label="Menu de la console">
      <div class="sidebar-logo">Nera Admin</div>
      <nav class="sidebar-menu">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <i class="fa-solid fa-chart-line"></i><span>Tableau de bord</span>
        </a>
        <a routerLink="/admin/categories" routerLinkActive="active">
          <i class="fa-solid fa-layer-group"></i><span>Catégories</span>
        </a>
        <a routerLink="/admin/brands" routerLinkActive="active">
          <i class="fa-solid fa-tags"></i><span>Marques</span>
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active">
          <i class="fa-solid fa-receipt"></i><span>Commandes</span>
        </a>
        <a routerLink="/admin/products" routerLinkActive="active">
          <i class="fa-solid fa-pump-soap"></i><span>Produits</span>
        </a>
        <a routerLink="/admin/slides" routerLinkActive="active">
          <i class="fa-solid fa-images"></i><span>Slides</span>
        </a>
        <a routerLink="/admin/stock" routerLinkActive="active">
          <i class="fa-solid fa-boxes-stacked"></i><span>Gestion de stock</span>
        </a>
        <a routerLink="/admin/messages" routerLinkActive="active">
          <i class="fa-solid fa-envelope"></i><span>Messagerie</span>
        </a>
        <a routerLink="/admin/users" routerLinkActive="active">
          <i class="fa-solid fa-users"></i><span>Utilisateurs</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      flex: 0 0 240px;
      width: 240px;
      position: sticky;
      top: calc(var(--header-height) + 16px);
      align-self: flex-start;
      z-index: 5;
    }
    .admin-sidebar {
      background: var(--white);
      border-radius: 12px;
      box-shadow: var(--shadow);
      padding: 20px 14px;
    }
    .sidebar-logo {
      font-weight: 700;
      font-size: 18px;
      color: var(--primary-color);
      margin: 0 8px 14px;
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-menu a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      color: var(--text-dark);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s, color 0.2s;
    }
    .sidebar-menu a i {
      width: 18px;
      text-align: center;
      color: var(--primary-color);
      transition: color 0.2s;
    }
    .sidebar-menu a:hover {
      background: var(--secondary-color);
      color: var(--primary-color);
    }
    .sidebar-menu a.active {
      background: var(--primary-color);
      color: var(--white);
    }
    .sidebar-menu a.active i {
      color: var(--white);
    }

    @media (max-width: 992px) {
      :host {
        flex: none;
        width: 100%;
        top: var(--header-height);
        z-index: 50;
      }
      .admin-sidebar {
        border-radius: 12px;
        padding: 8px;
      }
      .sidebar-logo {
        display: none;
      }
      .sidebar-menu {
        flex-direction: row;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .sidebar-menu::-webkit-scrollbar {
        display: none;
      }
      .sidebar-menu a {
        flex: 0 0 auto;
        scroll-snap-align: start;
        padding: 9px 14px;
        font-size: 13px;
      }
    }
  `]
})
export class AdminSidebarComponent implements AfterViewInit {
  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.revealActiveLink());
  }

  private revealActiveLink(): void {
    const menu = this.host.nativeElement.querySelector<HTMLElement>('.sidebar-menu');
    const active = menu?.querySelector<HTMLElement>('a.active');
    if (!menu || !active || menu.scrollWidth <= menu.clientWidth) return;
    const offset = active.getBoundingClientRect().left - menu.getBoundingClientRect().left + menu.scrollLeft;
    menu.scrollLeft = offset - (menu.clientWidth - active.offsetWidth) / 2;
  }
}
