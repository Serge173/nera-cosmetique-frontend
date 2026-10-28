import { Component, DestroyRef, ElementRef, HostListener, NgZone, OnDestroy, OnInit, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, map, of, switchMap, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminSummary, AdminSummaryService } from '../shared/admin-summary.service';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { formatPrice, statusLabel, statusTone } from '../shared/admin-format';
import { mediaQuery } from '../../../shared/utils/media-query';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  exact?: boolean;
  also?: string[];
  badge?: keyof AdminSummary;
}

interface SearchResults {
  products: { id: number; name: string; price: number; stock: number; image: string | null }[];
  orders: { id: string; orderNumber: string; total: number; status: string; customer: string }[];
  customers: { id: string; email: string; name: string; phone: string | null }[];
}

const EMPTY_RESULTS: SearchResults = { products: [], orders: [], customers: [] };

/** Recopie l'intitulé de colonne dans data-label : sur mobile, les lignes deviennent des cartes étiquetées. */
function labelTableCells(root: HTMLElement): void {
  root.querySelectorAll('table').forEach((table) => {
    const heads = Array.from(table.querySelectorAll('thead th'), (th) => th.textContent?.trim() ?? '');
    if (!heads.length) return;
    table.querySelectorAll('tbody tr').forEach((tr) => {
      let col = 0;
      for (const cell of Array.from(tr.children) as HTMLTableCellElement[]) {
        const label = heads[col] ?? '';
        if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
        col += cell.colSpan || 1;
      }
    });
  });
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule, UserAvatarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private tableObserver?: MutationObserver;
  readonly summaryService = inject(AdminSummaryService);

  readonly narrow = mediaQuery('(max-width: 720px)');

  constructor() {
    afterNextRender(() => this.watchTables());
  }

  readonly mainNav: NavItem[] = [
    { label: 'Tableau de bord', icon: 'fa-house', path: '/admin', exact: true },
    { label: 'Commandes', icon: 'fa-clipboard-list', path: '/admin/orders', badge: 'pendingOrders' },
    { label: 'Produits', icon: 'fa-bag-shopping', path: '/admin/products' },
    { label: 'Clients', icon: 'fa-user', path: '/admin/clients' },
    { label: 'Avis & Notations', icon: 'fa-star', path: '/admin/avis', badge: 'pendingReviews' },
    { label: 'Promotions', icon: 'fa-tag', path: '/admin/promotions' },
    { label: 'Gestion des stocks', icon: 'fa-cube', path: '/admin/stock' },
    { label: 'Catégories', icon: 'fa-folder-open', path: '/admin/categories', also: ['/admin/brands'] },
    { label: 'Rapports & Analyses', icon: 'fa-chart-line', path: '/admin/rapports' },
    { label: 'Marketing', icon: 'fa-bullhorn', path: '/admin/marketing', also: ['/admin/slides'] },
    { label: 'Pages & infos', icon: 'fa-file-lines', path: '/admin/contenu' },
    { label: 'Paramètres', icon: 'fa-gear', path: '/admin/parametres', also: ['/admin/users'] },
  ];

  readonly otherNav: NavItem[] = [
    { label: 'Support', icon: 'fa-headset', path: '/admin/messages', badge: 'unreadMessages' },
    { label: 'Aide', icon: 'fa-circle-question', path: '/admin/aide' },
  ];

  readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly navOpen = signal(false);
  readonly menu = signal<'notif' | 'profile' | 'search' | null>(null);
  readonly year = new Date().getFullYear();

  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly userName = computed(() => {
    const u = this.user();
    const name = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
    return name || 'Admin Nera';
  });
  readonly summary = this.summaryService.summary;
  readonly notifTotal = computed(() => {
    const s = this.summary();
    return s.pendingOrders + s.unreadMessages + s.pendingReviews + s.lowStock;
  });

  searchTerm = '';
  readonly searching = signal(false);
  readonly results = signal<SearchResults>(EMPTY_RESULTS);
  readonly hasResults = computed(() => {
    const r = this.results();
    return r.products.length + r.orders.length + r.customers.length > 0;
  });
  private search$ = new Subject<string>();

  readonly formatPrice = formatPrice;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;

  ngOnInit(): void {
    this.summaryService.start();

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.closeNav();
        this.menu.set(null);
        this.summaryService.refresh();
        window.scrollTo({ top: 0 });
      });

    this.search$
      .pipe(
        map((q) => q.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.searching.set(false);
            return of(EMPTY_RESULTS);
          }
          this.searching.set(true);
          return this.api.get<SearchResults>('/admin/search', { q }).pipe(catchError(() => of(EMPTY_RESULTS)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        this.results.set(r);
        this.searching.set(false);
      });
  }

  ngOnDestroy(): void {
    this.summaryService.stop();
    this.tableObserver?.disconnect();
    document.body.style.overflow = '';
  }

  private watchTables(): void {
    const root = this.host.nativeElement.querySelector<HTMLElement>('.adm-content');
    if (!root) return;
    let queued = false;
    const run = () => {
      queued = false;
      labelTableCells(root);
    };
    this.zone.runOutsideAngular(() => {
      this.tableObserver = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(run);
      });
      this.tableObserver.observe(root, { childList: true, subtree: true });
    });
    run();
  }

  isActive(item: NavItem): boolean {
    const path = this.url().split(/[?#]/)[0];
    if (item.exact) return path === item.path || path === `${item.path}/`;
    return [item.path, ...(item.also ?? [])].some((p) => path === p || path.startsWith(`${p}/`));
  }

  badgeOf(item: NavItem): number {
    return item.badge ? this.summary()[item.badge] : 0;
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

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.menu.set(value.trim().length >= 2 ? 'search' : null);
    this.search$.next(value);
  }

  onSearchFocus(): void {
    if (this.searchTerm.trim().length >= 2) this.menu.set('search');
  }

  submitSearch(): void {
    const r = this.results();
    if (r.orders[0]) this.go('/admin/orders', { q: r.orders[0].orderNumber });
    else if (r.products[0]) this.go('/admin/products', { q: r.products[0].name });
    else if (r.customers[0]) this.go('/admin/clients', { id: r.customers[0].id });
  }

  go(path: string, queryParams?: Record<string, string>): void {
    this.menu.set(null);
    this.searchTerm = '';
    this.results.set(EMPTY_RESULTS);
    this.search$.next('');
    this.router.navigate([path], { queryParams });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/compte/connexion']);
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
