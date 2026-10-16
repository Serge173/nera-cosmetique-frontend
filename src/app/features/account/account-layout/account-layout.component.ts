import { Component, DestroyRef, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { formatDateTime, initials, statusLabel, statusTone } from '../../admin/shared/admin-format';
import { AccountOverviewService } from '../shared/account-overview.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  exact?: boolean;
  badge?: 'orders' | 'favorites';
}

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './account-layout.component.html',
  styleUrl: './account-layout.component.css',
})
export class AccountLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private overviewService = inject(AccountOverviewService);

  readonly nav: NavItem[] = [
    { label: 'Mon tableau de bord', icon: 'fa-solid fa-house', path: '/compte', exact: true },
    { label: 'Mon profil', icon: 'fa-regular fa-user', path: '/compte/profil' },
    { label: 'Mes commandes', icon: 'fa-solid fa-bag-shopping', path: '/compte/commandes', badge: 'orders' },
    { label: 'Mes favoris', icon: 'fa-regular fa-heart', path: '/compte/favoris' },
    { label: 'Mes avis', icon: 'fa-regular fa-star', path: '/compte/avis' },
    { label: 'Mes adresses', icon: 'fa-solid fa-location-dot', path: '/compte/adresses' },
    { label: 'Mes points fidélité', icon: 'fa-solid fa-gift', path: '/compte/fidelite' },
    { label: 'Service client', icon: 'fa-solid fa-headset', path: '/compte/support' },
  ];

  readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly navOpen = signal(false);
  readonly menu = signal<'notif' | 'profile' | null>(null);
  readonly year = new Date().getFullYear();

  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly userName = computed(() => {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'Mon compte';
  });
  readonly userInitials = computed(() => initials(this.userName()));

  readonly overview = this.overviewService.overview;
  readonly activeOrders = computed(() => this.overview()?.activeOrders ?? []);

  searchTerm = '';

  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.overviewService.refresh();
    let lastPath = this.router.url.split(/[?#]/)[0];
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        this.closeNav();
        this.menu.set(null);
        const path = e.urlAfterRedirects.split(/[?#]/)[0];
        if (path !== lastPath) window.scrollTo({ top: 0 });
        lastPath = path;
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  isActive(item: NavItem): boolean {
    const path = this.url().split(/[?#]/)[0];
    if (item.exact) return path === item.path || path === `${item.path}/`;
    return path === item.path || path.startsWith(`${item.path}/`);
  }

  badgeOf(item: NavItem): number {
    const o = this.overview();
    if (!o || !item.badge) return 0;
    return item.badge === 'orders' ? o.orders.inProgress : o.favorites.count;
  }

  toggleNav(): void {
    this.navOpen.update((v) => !v);
    document.body.style.overflow = this.navOpen() ? 'hidden' : '';
  }

  closeNav(): void {
    if (!this.navOpen()) return;
    this.navOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleMenu(name: 'notif' | 'profile'): void {
    this.menu.update((m) => (m === name ? null : name));
  }

  submitSearch(): void {
    const q = this.searchTerm.trim().substring(0, 80);
    if (!q) return;
    this.searchTerm = '';
    this.router.navigate(['/boutique'], { queryParams: { q } });
  }

  go(path: string | unknown[]): void {
    this.menu.set(null);
    this.router.navigate(Array.isArray(path) ? path : [path]);
  }

  logout(): void {
    this.menu.set(null);
    this.overviewService.clear();
    this.auth.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menu()) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('[data-menu]')) this.menu.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menu.set(null);
    this.closeNav();
  }
}
